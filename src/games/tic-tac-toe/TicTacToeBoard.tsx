import { PlayerAvatar } from '@/src/components/shared/PlayerAvatar';
import { RoomPlayerState, TttState } from '@/src/types/platform';
import { cn } from '@/src/utils/cn';

interface TicTacToeBoardProps {
  state: TttState;
  players: RoomPlayerState[];
  currentUserId: string;
  onMove: (cellIndex: number) => void;
}

function CartoonXMark({ winning }: { winning: boolean }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="h-12 w-12 sm:h-14 sm:w-14" aria-hidden="true">
      <path
        d="M16 16 L48 48 M48 16 L16 48"
        stroke="#3D3045"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M16 16 L48 48 M48 16 L16 48"
        stroke={winning ? '#FFFFFF' : '#FF8E9E'}
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CartoonOMark({ winning }: { winning: boolean }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="h-12 w-12 sm:h-14 sm:w-14" aria-hidden="true">
      <circle cx="32" cy="32" r="18" stroke="#3D3045" strokeWidth="12" />
      <circle cx="32" cy="32" r="18" stroke={winning ? '#FFFFFF' : '#70C7F2'} strokeWidth="7" />
    </svg>
  );
}

export function TicTacToeBoard({
  state,
  players,
  currentUserId,
  onMove,
}: TicTacToeBoardProps) {
  const isMyTurn = state.status === 'playing' && state.currentTurnUserId === currentUserId;
  const mySymbol = state.symbols[currentUserId] ?? 'X';
  const currentTurnPlayer = players.find((p) => p.userId === state.currentTurnUserId);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Player Roster & Turn Status */}
      <div className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
        {players.map((player) => {
          const symbol = state.symbols[player.userId];
          const isTurn = state.status === 'playing' && state.currentTurnUserId === player.userId;
          const isMe = player.userId === currentUserId;

          return (
            <div
              key={player.userId}
              className={cn(
                'flex items-center justify-between rounded-2xl border-2 p-3.5 transition-all',
                isTurn
                  ? 'border-[#3D3045] bg-[#FFF5D6] shadow-[0_4px_0_#3D3045]'
                  : 'border-[#E9DCCF] bg-white'
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <PlayerAvatar
                  avatar={player.avatar}
                  username={player.username}
                  status={player.connected ? 'online' : 'offline'}
                  size="md"
                  showStatusDot
                />
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold text-[#3D3045]">
                    {player.username} {isMe ? '(You)' : ''}
                  </div>
                  <div className="text-xs font-bold text-[#817487]">
                    {isTurn ? (isMe ? 'Your turn!' : 'Thinking...') : 'Waiting'}
                  </div>
                </div>
              </div>
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#3D3045] font-display text-lg font-black shadow-[0_2px_0_#3D3045]',
                  symbol === 'X'
                    ? 'bg-[#FF8E9E] text-white'
                    : 'bg-[#70C7F2] text-white'
                )}
              >
                {symbol}
              </div>
            </div>
          );
        })}
      </div>

      {/* Turn Banner */}
      <div
        className={cn(
          'rounded-2xl border-2 px-5 py-2.5 text-center text-sm font-extrabold',
          isMyTurn
            ? 'border-[#3D3045] bg-[#9B7BFF] text-white shadow-[0_3px_0_#3D3045]'
            : 'border-[#E9DCCF] bg-white text-[#3D3045]'
        )}
      >
        {state.status === 'playing' ? (
          isMyTurn ? (
            <span>Your turn — place {mySymbol} on an empty square!</span>
          ) : (
            <span>Waiting for {currentTurnPlayer?.username} to move...</span>
          )
        ) : state.isDraw ? (
          <span>Board complete — match ended in a draw!</span>
        ) : (
          <span>
            {players.find((p) => p.userId === state.winnerUserId)?.username} wins the board!
          </span>
        )}
      </div>

      {/* 3x3 Interactive Cartoon Board */}
      <div
        className="grid w-full max-w-[376px] grid-cols-3 gap-3 rounded-3xl border-2 border-[#3D3045] bg-[#FFF0DF] p-4 shadow-[0_8px_0_#3D3045]"
        role="grid"
        aria-label="Tic-Tac-Toe 3 by 3 board"
      >
        {state.board.map((cell, idx) => {
          const isWinningCell = state.winningLine?.includes(idx) ?? false;
          const canPlay = isMyTurn && cell === null;

          return (
            <button
              key={idx}
              type="button"
              disabled={!canPlay}
              onClick={() => onMove(idx)}
              aria-label={`Cell ${idx + 1}${cell ? `, ${cell}` : ', empty'}`}
              className={cn(
                'flex aspect-square items-center justify-center rounded-2xl border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B7BFF]',
                isWinningCell
                  ? 'border-[#3D3045] bg-[#FFD166] shadow-[0_4px_0_#3D3045] scale-[1.02]'
                  : cell !== null
                    ? 'border-[#E9DCCF] bg-white shadow-[0_3px_0_#E9DCCF]'
                    : canPlay
                      ? 'border-[#3D3045] bg-white shadow-[0_4px_0_#E9DCCF] hover:bg-[#FFF5D6] hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer'
                      : 'border-[#E9DCCF] bg-white/80 opacity-80 cursor-not-allowed'
              )}
            >
              {cell === 'X' && <CartoonXMark winning={isWinningCell} />}
              {cell === 'O' && <CartoonOMark winning={isWinningCell} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
