import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Check, HelpCircle } from 'lucide-react';
import { PlayerAvatar } from '@/src/components/shared/PlayerAvatar';
import { RoomPlayerState, RpsChoice, RpsMatchView } from '@/src/types/platform';
import { cn } from '@/src/utils/cn';

interface RpsArenaProps {
  state: RpsMatchView;
  players: RoomPlayerState[];
  currentUserId: string;
  onSubmitChoice: (choice: RpsChoice) => void;
}

function ChoiceIllustration({ choice }: { choice: RpsChoice }) {
  if (choice === 'rock') {
    return (
      <svg viewBox="0 0 64 64" fill="none" className="h-14 w-14" aria-hidden="true">
        <path
          d="M14 40 C12 24 22 14 33 14 C44 14 52 24 49 40 C47 48 41 51 32 51 C22 51 16 47 14 40 Z"
          fill="#9B7BFF"
          stroke="#3D3045"
          strokeWidth="2.8"
        />
        <circle cx="26" cy="31" r="2.5" fill="#FFFFFF" />
        <circle cx="38" cy="31" r="2.5" fill="#FFFFFF" />
        <path d="M29 37 Q32 40 35 37" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (choice === 'paper') {
    return (
      <svg viewBox="0 0 64 64" fill="none" className="h-14 w-14" aria-hidden="true">
        <path
          d="M16 12 H40 L50 22 V52 H16 V12 Z"
          fill="#70C7F2"
          stroke="#3D3045"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
        <path d="M40 12 V22 H50" fill="#FFF7ED" stroke="#3D3045" strokeWidth="2.4" strokeLinejoin="round" />
        <circle cx="28" cy="34" r="2.3" fill="#3D3045" />
        <circle cx="38" cy="34" r="2.3" fill="#3D3045" />
        <path d="M30 40 Q33 43 36 40" stroke="#3D3045" strokeWidth="2.3" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" fill="none" className="h-14 w-14" aria-hidden="true">
      <circle cx="21" cy="46" r="8" fill="#FFD166" stroke="#3D3045" strokeWidth="2.6" />
      <circle cx="43" cy="46" r="8" fill="#FFD166" stroke="#3D3045" strokeWidth="2.6" />
      <line x1="25" y1="39" x2="46" y2="12" stroke="#FF8E9E" strokeWidth="7" strokeLinecap="round" />
      <line x1="39" y1="39" x2="18" y2="12" stroke="#FF8E9E" strokeWidth="7" strokeLinecap="round" />
      <line x1="25" y1="39" x2="46" y2="12" stroke="#3D3045" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="39" y1="39" x2="18" y2="12" stroke="#3D3045" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="32" cy="28" r="3.2" fill="#3D3045" />
    </svg>
  );
}

const CHOICE_META: Record<RpsChoice, { label: string; beats: string; bg: string }> = {
  rock: { label: 'Rock', beats: 'Beats Scissors', bg: 'bg-[#EDE7FF]' },
  paper: { label: 'Paper', beats: 'Beats Rock', bg: 'bg-[#E3F5FE]' },
  scissors: { label: 'Scissors', beats: 'Beats Paper', bg: 'bg-[#FFE6EA]' },
};

export function RpsArena({
  state,
  players,
  currentUserId,
  onSubmitChoice,
}: RpsArenaProps) {
  const revealRef = useRef<HTMLDivElement | null>(null);

  const me = players.find((p) => p.userId === currentUserId) ?? players[0];
  const opponent = players.find((p) => p.userId !== me.userId) ?? players[1];

  const mySubmitted = state.submittedBy[me.userId] ?? false;
  const oppSubmitted = state.submittedBy[opponent.userId] ?? false;

  useEffect(() => {
    if (state.phase === 'revealing' && revealRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          revealRef.current,
          { opacity: 0, y: 12, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: 'back.out(1.6)' }
        );
      });
      return () => ctx.revert();
    }
  }, [state.phase, state.lastRoundResult?.round]);

  const revealedMyChoice = state.revealedChoices?.[me.userId];
  const revealedOppChoice = state.revealedChoices?.[opponent.userId];

  const roundOutcomeLabel = (() => {
    if (!state.lastRoundResult) return '';
    if (state.lastRoundResult.isTie) return 'Round Tied — No points awarded!';
    if (state.lastRoundResult.winnerUserId === me.userId) return 'You won this round!';
    return `${opponent.username} won this round!`;
  })();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Match Header & Scoreboard */}
      <div className="grid grid-cols-3 items-center rounded-3xl border-2 border-[#3D3045] bg-white p-4 shadow-[0_5px_0_#E9DCCF]">
        <div className="flex items-center gap-3">
          <PlayerAvatar
            avatar={me.avatar}
            username={me.username}
            status={me.connected ? 'online' : 'offline'}
            size="md"
            showStatusDot
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-extrabold text-[#3D3045]">{me.username}</div>
            <div className="text-xs font-bold text-[#817487]">
              {mySubmitted ? 'Locked in' : 'Selecting'}
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-xs font-extrabold text-[#817487]">
            Round {state.currentRound} · First to {state.targetWins}
          </div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#3D3045]">
            <span className="text-[#9B7BFF]">{state.scores[me.userId] ?? 0}</span>
            <span className="mx-2 text-[#E9DCCF]">:</span>
            <span className="text-[#FF8E9E]">{state.scores[opponent.userId] ?? 0}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 text-right">
          <div className="min-w-0">
            <div className="truncate text-sm font-extrabold text-[#3D3045]">
              {opponent.username}
            </div>
            <div className="text-xs font-bold text-[#817487]">
              {oppSubmitted ? 'Locked in' : 'Selecting'}
            </div>
          </div>
          <PlayerAvatar
            avatar={opponent.avatar}
            username={opponent.username}
            status={opponent.connected ? 'online' : 'offline'}
            size="md"
            showStatusDot
          />
        </div>
      </div>

      {/* Arena Center Stage */}
      {state.phase === 'collecting' ? (
        <div className="space-y-6 rounded-3xl border-2 border-[#3D3045] bg-white p-6 shadow-[0_6px_0_#E9DCCF]">
          <div className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
            <div>
              <h3 className="font-display text-xl font-black text-[#3D3045]">
                Pick Your Throw!
              </h3>
              <p className="text-xs font-bold text-[#817487]">
                Choices stay secret until both players lock in.
              </p>
            </div>
            <div className="text-xs font-extrabold">
              {oppSubmitted ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#3D3045] bg-[#8BDCC0] px-3 py-1 text-[#3D3045]">
                  <Check className="h-3.5 w-3.5" />
                  {opponent.username} is ready
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#E9DCCF] bg-[#FFF7ED] px-3 py-1 text-[#817487]">
                  <HelpCircle className="h-3.5 w-3.5" />
                  Waiting for {opponent.username}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(['rock', 'paper', 'scissors'] as RpsChoice[]).map((choice) => {
              const meta = CHOICE_META[choice];
              const isSelected = state.myChoice === choice;
              const disabled = mySubmitted;

              return (
                <button
                  key={choice}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSubmitChoice(choice)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-3 rounded-3xl border-2 p-6 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B7BFF]',
                    isSelected
                      ? 'border-[#3D3045] bg-[#FFD166] shadow-[0_4px_0_#3D3045] -translate-y-0.5'
                      : disabled
                        ? 'border-[#E9DCCF] bg-[#FFF7ED] opacity-50 cursor-not-allowed'
                        : 'border-[#3D3045] border-b-4 bg-white hover:bg-[#FFF0DF] hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2 cursor-pointer'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-[#3D3045]',
                      meta.bg
                    )}
                  >
                    <ChoiceIllustration choice={choice} />
                  </div>
                  <div className="text-center">
                    <div className="font-display text-lg font-black text-[#3D3045]">
                      {meta.label}
                    </div>
                    <div className="mt-0.5 text-xs font-bold text-[#817487]">
                      {meta.beats}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          ref={revealRef}
          className="rounded-3xl border-2 border-[#3D3045] bg-white p-6 text-center shadow-[0_6px_0_#3D3045]"
        >
          <div className="text-xs font-extrabold text-[#817487]">
            Round {state.lastRoundResult?.round} Reveal
          </div>
          <h3 className="mt-1 font-display text-2xl font-black text-[#3D3045]">
            {roundOutcomeLabel}
          </h3>

          <div className="mt-6 grid grid-cols-2 gap-4">
            {[
              {
                player: me,
                choice: revealedMyChoice,
                isWinner: state.lastRoundResult?.winnerUserId === me.userId,
              },
              {
                player: opponent,
                choice: revealedOppChoice,
                isWinner: state.lastRoundResult?.winnerUserId === opponent.userId,
              },
            ].map(({ player, choice, isWinner }) => (
              <div
                key={player.userId}
                className={cn(
                  'flex flex-col items-center gap-3 rounded-2xl border-2 p-5',
                  isWinner
                    ? 'border-[#3D3045] bg-[#FFF5D6] shadow-[0_4px_0_#3D3045]'
                    : 'border-[#E9DCCF] bg-[#FFF7ED]'
                )}
              >
                <span className="text-xs font-extrabold text-[#817487]">{player.username}</span>
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-[#3D3045] bg-white">
                  {choice ? <ChoiceIllustration choice={choice} /> : <HelpCircle className="h-7 w-7 text-[#817487]" />}
                </div>
                <span className="font-display text-lg font-black text-[#3D3045]">
                  {choice ? CHOICE_META[choice].label : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Round History Strip */}
      {state.history.length > 0 && (
        <div className="rounded-2xl border-2 border-[#E9DCCF] bg-white p-4">
          <div className="mb-2.5 text-xs font-extrabold text-[#817487]">Round Log</div>
          <div className="flex flex-wrap gap-2.5">
            {state.history.map((r) => (
              <div
                key={r.round}
                className="flex items-center gap-2 rounded-xl border-2 border-[#E9DCCF] bg-[#FFF7ED] px-3 py-1.5 text-xs font-bold text-[#3D3045]"
              >
                <span className="font-mono text-[#817487]">R{r.round}</span>
                <span>{CHOICE_META[r.choices[me.userId]]?.label}</span>
                <span className="text-[#817487]">vs</span>
                <span>{CHOICE_META[r.choices[opponent.userId]]?.label}</span>
                <span className="text-[#E9DCCF]">·</span>
                <span
                  className={
                    r.isTie
                      ? 'text-[#F4BC54] font-extrabold'
                      : r.winnerUserId === me.userId
                        ? 'text-[#53C99A] font-extrabold'
                        : 'text-[#F27676] font-extrabold'
                  }
                >
                  {r.isTie ? 'Tie' : r.winnerUserId === me.userId ? 'Win' : 'Loss'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
