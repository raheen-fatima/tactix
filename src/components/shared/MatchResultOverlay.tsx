import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { RoomPlayerState } from '@/src/types/platform';
import { cn } from '@/src/utils/cn';

interface MatchResultOverlayProps {
  visible: boolean;
  currentUserId: string;
  winnerUserId: string | null;
  isDraw: boolean;
  resultReason: string | null;
  players: RoomPlayerState[];
  scores?: Record<string, number>;
  onPlayAgain: () => void;
  onReturnDashboard: () => void;
}

function OutcomeCartoonIllustration({ outcome }: { outcome: 'win' | 'loss' | 'draw' }) {
  if (outcome === 'win') {
    return (
      <svg viewBox="0 0 110 96" fill="none" className="h-24 w-28" aria-hidden="true">
        <circle cx="55" cy="48" r="42" fill="#FFF5D6" stroke="#FFD166" strokeWidth="2.5" />
        {/* Sparkles */}
        <path d="M18 22 L21 28 L27 31 L21 34 L18 40 L15 34 L9 31 L15 28 Z" fill="#9B7BFF" stroke="#3D3045" strokeWidth="1.6" />
        <path d="M92 20 L94 25 L99 27 L94 29 L92 34 L90 29 L85 27 L90 25 Z" fill="#FF8E9E" stroke="#3D3045" strokeWidth="1.6" />
        {/* Happy Cartoon Trophy */}
        <path d="M36 28 H74 V46 C74 58 66 66 55 66 C44 66 36 58 36 46 V28 Z" fill="#FFD166" stroke="#3D3045" strokeWidth="3" strokeLinejoin="round" />
        <path d="M36 34 H26 C24 34 23 44 30 47 L36 48" stroke="#3D3045" strokeWidth="2.8" strokeLinecap="round" fill="none" />
        <path d="M74 34 H84 C86 34 87 44 80 47 L74 48" stroke="#3D3045" strokeWidth="2.8" strokeLinecap="round" fill="none" />
        <rect x="50" y="65" width="10" height="10" fill="#FFAB66" stroke="#3D3045" strokeWidth="2.6" />
        <rect x="39" y="75" width="32" height="8" rx="4" fill="#9B7BFF" stroke="#3D3045" strokeWidth="2.6" />
        {/* Smiling Face */}
        <circle cx="48" cy="44" r="2.4" fill="#3D3045" />
        <circle cx="62" cy="44" r="2.4" fill="#3D3045" />
        <path d="M50 51 Q55 55 60 51" stroke="#3D3045" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }

  if (outcome === 'draw') {
    return (
      <svg viewBox="0 0 110 96" fill="none" className="h-24 w-28" aria-hidden="true">
        <circle cx="55" cy="48" r="42" fill="#E3F5FE" stroke="#70C7F2" strokeWidth="2.5" />
        <rect x="26" y="28" width="26" height="40" rx="11" fill="#70C7F2" stroke="#3D3045" strokeWidth="2.6" />
        <rect x="58" y="28" width="26" height="40" rx="11" fill="#8BDCC0" stroke="#3D3045" strokeWidth="2.6" />
        <circle cx="36" cy="46" r="2.2" fill="#3D3045" />
        <circle cx="44" cy="46" r="2.2" fill="#3D3045" />
        <circle cx="66" cy="46" r="2.2" fill="#3D3045" />
        <circle cx="74" cy="46" r="2.2" fill="#3D3045" />
        <path d="M36 53 H44" stroke="#3D3045" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M66 53 H74" stroke="#3D3045" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 110 96" fill="none" className="h-24 w-28" aria-hidden="true">
      <circle cx="55" cy="48" r="42" fill="#FFE6EA" stroke="#FF8E9E" strokeWidth="2.5" />
      <rect x="31" y="24" width="48" height="48" rx="18" fill="#FF8E9E" stroke="#3D3045" strokeWidth="2.8" />
      <circle cx="46" cy="44" r="2.6" fill="#3D3045" />
      <circle cx="64" cy="44" r="2.6" fill="#3D3045" />
      <path d="M48 56 Q55 51 62 56" stroke="#3D3045" strokeWidth="2.4" strokeLinecap="round" />
      {/* Encouraging bandage/star */}
      <rect x="64" y="26" width="16" height="8" rx="4" transform="rotate(20 64 26)" fill="#FFD166" stroke="#3D3045" strokeWidth="2" />
    </svg>
  );
}

export function MatchResultOverlay({
  visible,
  currentUserId,
  winnerUserId,
  isDraw,
  resultReason,
  players,
  scores,
  onPlayAgain,
  onReturnDashboard,
}: MatchResultOverlayProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!visible || !cardRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, scale: 0.92, y: 12 },
        { opacity: 1, scale: 1, y: 0, duration: 0.28, ease: 'back.out(1.6)' }
      );
    });
    return () => ctx.revert();
  }, [visible]);

  if (!visible) return null;

  const isWinner = !isDraw && winnerUserId === currentUserId;
  const outcome: 'win' | 'loss' | 'draw' = isDraw ? 'draw' : isWinner ? 'win' : 'loss';
  const me = players.find((p) => p.userId === currentUserId);
  const opponent = players.find((p) => p.userId !== currentUserId);

  const headline = isDraw ? 'Match Draw!' : isWinner ? 'Victory!' : 'Good Effort!';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#3D3045]/50 p-4">
      <div
        ref={cardRef}
        className="w-full max-w-md rounded-3xl border-2 border-[#3D3045] bg-white p-6 shadow-[0_10px_0_rgba(61,48,69,0.2)]"
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-3">
            <OutcomeCartoonIllustration outcome={outcome} />
          </div>

          <span
            className={cn(
              'rounded-full border-2 border-[#3D3045] px-3 py-0.5 text-xs font-extrabold',
              outcome === 'win'
                ? 'bg-[#53C99A] text-white'
                : outcome === 'draw'
                  ? 'bg-[#70C7F2] text-[#3D3045]'
                  : 'bg-[#FF8E9E] text-[#3D3045]'
            )}
          >
            {outcome === 'win' ? 'Winner' : outcome === 'draw' ? 'Tie Game' : 'Match Complete'}
          </span>

          <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-[#3D3045]">
            {headline}
          </h2>
          {resultReason && (
            <p className="mt-1 text-sm font-semibold text-[#817487]">{resultReason}</p>
          )}
        </div>

        {scores && (
          <div className="mt-6 grid grid-cols-2 divide-x-2 divide-[#E9DCCF] rounded-2xl border-2 border-[#E9DCCF] bg-[#FFF7ED]">
            {players.map((p) => (
              <div key={p.userId} className="p-4 text-center">
                <div className="truncate text-xs font-bold text-[#817487]">
                  {p.username} {p.userId === currentUserId ? '(You)' : ''}
                </div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#3D3045]">
                  {scores[p.userId] ?? 0}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            className="flex-1"
            variant={outcome === 'win' ? 'secondary' : 'default'}
            onClick={onPlayAgain}
            disabled={Boolean(me?.playAgainRequested)}
          >
            <RotateCcw className="h-4 w-4" />
            {me?.playAgainRequested
              ? opponent?.playAgainRequested
                ? 'Starting Rematch...'
                : 'Waiting for Opponent'
              : opponent?.playAgainRequested
                ? 'Accept Rematch'
                : 'Play Again'}
          </Button>
          <Button variant="outline" className="flex-1" onClick={onReturnDashboard}>
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
