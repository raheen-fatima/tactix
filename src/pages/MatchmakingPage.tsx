import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Swords, XCircle } from 'lucide-react';
import { AppShell } from '@/src/components/layout/AppShell';
import { CartoonLoadingState } from '@/src/components/shared/CartoonArt';
import { GAME_CATALOG, GameThumbnail } from '@/src/components/shared/GameThumbnail';
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { useSocket } from '@/src/context/SocketContext';
import { useRealtimeStore } from '@/src/stores/useRealtimeStore';
import { GameType } from '@/src/types/platform';
import { cn } from '@/src/utils/cn';

export function MatchmakingPage() {
  const [searchParams] = useSearchParams();
  const initialParam = searchParams.get('game');
  const validInitial: GameType =
    initialParam === 'snake' || initialParam === 'rock-paper-scissors'
      ? initialParam
      : 'tic-tac-toe';

  const [selectedGame, setSelectedGame] = useState<GameType>(validInitial);
  const { joinMatchmaking, cancelMatchmaking } = useSocket();
  const queueGameType = useRealtimeStore((s) => s.queueGameType);
  const queueStartedAt = useRealtimeStore((s) => s.queueStartedAt);
  const connected = useRealtimeStore((s) => s.connected);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!queueGameType || !queueStartedAt) {
      setElapsedSeconds(0);
      return;
    }
    const tick = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - queueStartedAt) / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [queueGameType, queueStartedAt]);

  const games: GameType[] = ['tic-tac-toe', 'snake', 'rock-paper-scissors'];

  const formattedWait = `${Math.floor(elapsedSeconds / 60)}:${String(
    elapsedSeconds % 60
  ).padStart(2, '0')}`;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="font-display text-3xl font-black text-[#3D3045]">
            Online Matchmaking
          </h1>
          <p className="mt-1 text-sm font-semibold text-[#817487]">
            Pick an arena and hop into the live queue. We will match you automatically with the next ready opponent.
          </p>
        </div>

        {/* Game Selection Grid */}
        <div className="grid gap-5 md:grid-cols-3">
          {games.map((g) => {
            const meta = GAME_CATALOG[g];
            const isSelected = (queueGameType ?? selectedGame) === g;
            const lockedByQueue = Boolean(queueGameType && queueGameType !== g);

            return (
              <button
                key={g}
                type="button"
                disabled={Boolean(queueGameType)}
                onClick={() => setSelectedGame(g)}
                className={cn(
                  'group overflow-hidden rounded-3xl border-2 text-left transition-all cursor-pointer disabled:cursor-not-allowed cartoon-card-hover',
                  isSelected
                    ? 'border-[#3D3045] bg-[#FFF5D6] shadow-[0_6px_0_#3D3045]'
                    : 'border-[#E9DCCF] bg-white hover:border-[#3D3045]',
                  lockedByQueue && 'opacity-45'
                )}
              >
                <div className="aspect-[4/3] w-full overflow-hidden border-b-2 border-[#3D3045]">
                  <GameThumbnail gameType={g} />
                </div>
                <div className="p-5">
                  <div className="font-display text-lg font-black text-[#3D3045]">
                    {meta.title}
                  </div>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-[#817487]">
                    {meta.rulesSummary}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Queue Control Panel */}
        <Card className="border-[#3D3045] p-6 shadow-[0_6px_0_#E9DCCF]">
          {queueGameType ? (
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div className="flex items-center gap-4">
                <CartoonLoadingState label="" className="py-0" />
                <div>
                  <div className="font-display text-xl font-black text-[#3D3045]">
                    Searching in {GAME_CATALOG[queueGameType].title}...
                  </div>
                  <div className="mt-0.5 text-sm font-bold text-[#817487]">
                    Elapsed wait:{' '}
                    <span className="font-mono font-bold tabular-nums text-[#9B7BFF]">
                      {formattedWait}
                    </span>
                  </div>
                </div>
              </div>

              <Button variant="destructive" onClick={cancelMatchmaking}>
                <XCircle className="h-4 w-4" />
                Cancel Search
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div>
                <div className="text-xs font-extrabold text-[#817487]">Selected Arena</div>
                <div className="mt-0.5 font-display text-2xl font-black text-[#3D3045]">
                  {GAME_CATALOG[selectedGame].title}
                </div>
              </div>

              <Button
                size="lg"
                disabled={!connected}
                onClick={() => joinMatchmaking(selectedGame)}
              >
                <Swords className="h-4 w-4" />
                {connected ? 'Find Match' : 'Connecting...'}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
