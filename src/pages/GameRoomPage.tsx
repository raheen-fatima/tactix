import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/src/components/layout/AppShell';
import { CartoonLoadingState } from '@/src/components/shared/CartoonArt';
import { GAME_CATALOG } from '@/src/components/shared/GameThumbnail';
import { MatchResultOverlay } from '@/src/components/shared/MatchResultOverlay';
import { PlayerAvatar } from '@/src/components/shared/PlayerAvatar';
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { useSocket } from '@/src/context/SocketContext';
import { RpsArena } from '@/src/games/rock-paper-scissors/RpsArena';
import { SnakeArena } from '@/src/games/snake/SnakeArena';
import { TicTacToeBoard } from '@/src/games/tic-tac-toe/TicTacToeBoard';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useRealtimeStore } from '@/src/stores/useRealtimeStore';
import {
  GameType,
  RoomStatePayload,
  RpsChoice,
  SnakeDirection,
  SnakeMatchView,
  TttState,
} from '@/src/types/platform';
import { sfx } from '@/src/utils/sound';

export function GameRoomPage({ expectedGame }: { expectedGame?: GameType }) {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const connected = useRealtimeStore((s) => s.connected);
  const { getSocket } = useSocket();

  const [roomState, setRoomState] = useState<RoomStatePayload | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [disconnectWarning, setDisconnectWarning] = useState<string | null>(null);
  const resultSfxPlayedRef = useRef<string | null>(null);
  const prevScoresRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !roomId || !connected) return;

    socket.emit(
      'room:join',
      { roomId },
      (res: { ok: boolean; error?: string; state?: RoomStatePayload }) => {
        if (!res?.ok || !res.state) {
          setJoinError(res?.error || 'Unable to join game room');
          return;
        }
        setJoinError(null);
        setRoomState(res.state);
      }
    );

    const onRoomState = (nextState: RoomStatePayload) => {
      if (nextState.roomId !== roomId) return;
      setRoomState(nextState);
      if (nextState.players.every((p) => p.connected)) {
        setDisconnectWarning(null);
      }
    };

    const onTttUpdate = (tttState: TttState) => {
      sfx.move();
      setRoomState((prev) => (prev ? { ...prev, tttState } : prev));
    };

    const onSnakeState = (snakeState: SnakeMatchView) => {
      setRoomState((prev) => {
        if (!prev) return prev;
        if (user && snakeState.arenas[user.id]) {
          const newScore = snakeState.arenas[user.id].score;
          const prevScore = prevScoresRef.current[user.id] ?? 0;
          if (newScore > prevScore) {
            sfx.eat();
          }
          prevScoresRef.current[user.id] = newScore;
        }
        return { ...prev, snakeState };
      });
    };

    const onOpponentDisconnected = (payload: {
      username?: string;
      forfeited?: boolean;
      graceSeconds?: number;
      reason?: string;
    }) => {
      if (payload.forfeited) {
        setDisconnectWarning(null);
        if (payload.reason) toast.info(payload.reason);
      } else {
        setDisconnectWarning(
          `${payload.username || 'Opponent'} disconnected. Waiting ${payload.graceSeconds ?? 12}s for reconnection...`
        );
      }
    };

    socket.on('room:state', onRoomState);
    socket.on('tictactoe:update', onTttUpdate);
    socket.on('snake:state', onSnakeState);
    socket.on('room:opponent-disconnected', onOpponentDisconnected);

    return () => {
      socket.off('room:state', onRoomState);
      socket.off('tictactoe:update', onTttUpdate);
      socket.off('snake:state', onSnakeState);
      socket.off('room:opponent-disconnected', onOpponentDisconnected);
    };
  }, [roomId, connected, getSocket, user?.id]);

  useEffect(() => {
    if (!roomState || roomState.status !== 'finished' || !user) return;
    const key = `${roomState.roomId}_${roomState.finishedAt}`;
    if (resultSfxPlayedRef.current === key) return;
    resultSfxPlayedRef.current = key;

    if (roomState.isDraw) sfx.draw();
    else if (roomState.winnerUserId === user.id) sfx.win();
    else sfx.lose();
  }, [roomState?.status, roomState?.finishedAt, roomState?.isDraw, roomState?.winnerUserId, user?.id]);

  const handleReady = () => {
    if (!roomId) return;
    getSocket()?.emit('room:ready', { roomId });
  };

  const handleLeave = () => {
    if (roomId) {
      getSocket()?.emit('room:leave', { roomId });
    }
    navigate('/dashboard');
  };

  const handlePlayAgain = () => {
    if (!roomId) return;
    getSocket()?.emit('game:play-again', { roomId });
  };

  const handleTttMove = useCallback(
    (cellIndex: number) => {
      if (!roomId) return;
      getSocket()?.emit('tictactoe:move', { roomId, cellIndex });
    },
    [roomId, getSocket]
  );

  const handleSnakeInput = useCallback(
    (direction: SnakeDirection) => {
      if (!roomId) return;
      getSocket()?.emit('snake:input', { roomId, direction });
    },
    [roomId, getSocket]
  );

  const handleRpsSubmit = useCallback(
    (choice: RpsChoice) => {
      if (!roomId) return;
      sfx.move();
      getSocket()?.emit('rps:submit', { roomId, choice });
    },
    [roomId, getSocket]
  );

  if (!user) return null;

  const activeGameType = roomState?.gameType ?? expectedGame ?? 'tic-tac-toe';
  const gameTitle = GAME_CATALOG[activeGameType].title;

  const finalScores: Record<string, number> | undefined = (() => {
    if (!roomState) return undefined;
    if (roomState.gameType === 'snake' && roomState.snakeState) {
      const s: Record<string, number> = {};
      for (const p of roomState.players) {
        s[p.userId] = roomState.snakeState.arenas[p.userId]?.score ?? 0;
      }
      return s;
    }
    if (roomState.gameType === 'rock-paper-scissors' && roomState.rpsState) {
      return roomState.rpsState.scores;
    }
    return undefined;
  })();

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Room Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border-2 border-[#E9DCCF] bg-white px-5 py-4">
          <div>
            <div className="text-xs font-extrabold text-[#817487]">
              {roomState?.mode === 'private' ? 'Private Duel' : 'Ranked Matchmaking'} · Room{' '}
              <span className="font-mono text-[#9B7BFF]">{roomId}</span>
            </div>
            <h1 className="font-display text-2xl font-black text-[#3D3045]">{gameTitle}</h1>
          </div>

          <Button variant="outline" size="sm" onClick={handleLeave}>
            <ArrowLeft className="h-4 w-4" />
            Leave Match
          </Button>
        </div>

        {disconnectWarning && (
          <div className="rounded-2xl border-2 border-[#3D3045] bg-[#FFF5D6] px-4 py-3 text-sm font-bold text-[#3D3045]">
            {disconnectWarning}
          </div>
        )}

        {joinError ? (
          <Card className="p-8 text-center space-y-4">
            <p className="text-sm font-bold text-[#F27676]">{joinError}</p>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          </Card>
        ) : !roomState ? (
          <Card className="p-8">
            <CartoonLoadingState label="Connecting to game room..." />
          </Card>
        ) : roomState.status === 'waiting' ? (
          <Card className="mx-auto max-w-lg border-[#3D3045] p-6 space-y-6 shadow-[0_6px_0_#E9DCCF]">
            <div className="text-center">
              <h2 className="font-display text-2xl font-black text-[#3D3045]">Ready Check!</h2>
              <p className="mt-1 text-sm font-semibold text-[#817487]">
                Both players must tap ready to launch the match.
              </p>
            </div>

            <div className="space-y-3">
              {roomState.players.map((p) => (
                <div
                  key={p.userId}
                  className="flex items-center justify-between rounded-2xl border-2 border-[#E9DCCF] bg-[#FFF7ED] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <PlayerAvatar
                      avatar={p.avatar}
                      username={p.username}
                      status={p.connected ? 'online' : 'offline'}
                      size="md"
                      showStatusDot
                    />
                    <div>
                      <div className="text-sm font-extrabold text-[#3D3045]">
                        {p.username} {p.userId === user.id ? '(You)' : ''}
                      </div>
                      <div className="text-xs font-bold text-[#817487]">
                        {p.connected ? 'Connected' : 'Joining room...'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-extrabold">
                    {p.ready ? (
                      <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#3D3045] bg-[#53C99A] px-3 py-1 text-white">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#E9DCCF] bg-white px-3 py-1 text-[#817487]">
                        <Clock className="h-3.5 w-3.5" />
                        Waiting
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {(() => {
              const me = roomState.players.find((p) => p.userId === user.id);
              return (
                <Button
                  size="lg"
                  variant={me?.ready ? 'outline' : 'secondary'}
                  className="w-full"
                  disabled={Boolean(me?.ready)}
                  onClick={handleReady}
                >
                  {me?.ready ? 'Waiting for Opponent...' : 'I Am Ready!'}
                </Button>
              );
            })()}
          </Card>
        ) : (
          <>
            {roomState.gameType === 'tic-tac-toe' && roomState.tttState && (
              <TicTacToeBoard
                state={roomState.tttState}
                players={roomState.players}
                currentUserId={user.id}
                onMove={handleTttMove}
              />
            )}

            {roomState.gameType === 'snake' && roomState.snakeState && (
              <SnakeArena
                state={roomState.snakeState}
                players={roomState.players}
                currentUserId={user.id}
                onDirectionInput={handleSnakeInput}
              />
            )}

            {roomState.gameType === 'rock-paper-scissors' && roomState.rpsState && (
              <RpsArena
                state={roomState.rpsState}
                players={roomState.players}
                currentUserId={user.id}
                onSubmitChoice={handleRpsSubmit}
              />
            )}
          </>
        )}
      </div>

      {roomState && (
        <MatchResultOverlay
          visible={roomState.status === 'finished'}
          currentUserId={user.id}
          winnerUserId={roomState.winnerUserId}
          isDraw={roomState.isDraw}
          resultReason={roomState.resultReason}
          players={roomState.players}
          scores={finalScores}
          onPlayAgain={handlePlayAgain}
          onReturnDashboard={() => navigate('/dashboard')}
        />
      )}
    </AppShell>
  );
}
