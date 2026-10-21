import { cn } from '@/src/utils/cn';
import { AchievementBadge } from '@/src/utils/progression';

export function CartoonBrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-10 w-10 shrink-0', className)}
      aria-hidden="true"
    >
      <rect x="3" y="5" width="38" height="36" rx="12" fill="#9B7BFF" stroke="#3D3045" strokeWidth="2.5" />
      <rect x="3" y="3" width="38" height="34" rx="12" fill="#FFD166" stroke="#3D3045" strokeWidth="2.5" />
      {/* Crown / Star Mascot Face */}
      <path
        d="M12 18 L15 11 L22 15 L29 11 L32 18 Z"
        fill="#FF8E9E"
        stroke="#3D3045"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="17" cy="24" r="2.2" fill="#3D3045" />
      <circle cx="27" cy="24" r="2.2" fill="#3D3045" />
      <path
        d="M19 28 Q22 31 25 28"
        stroke="#3D3045"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="13.5" cy="26.5" r="2" fill="#FF8E9E" opacity="0.7" />
      <circle cx="30.5" cy="26.5" r="2" fill="#FF8E9E" opacity="0.7" />
    </svg>
  );
}

export function CartoonLoadingState({
  label = 'Loading arena...',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-10 text-center', className)}>
      <div className="relative flex items-center justify-center">
        <svg
          viewBox="0 0 88 88"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-20 w-20 animate-cartoon-float"
          aria-hidden="true"
        >
          <circle cx="44" cy="44" r="36" fill="#FFF0DF" stroke="#E9DCCF" strokeWidth="2.5" />
          <path
            d="M44 16 L51 31 L67 33 L55 44 L58 60 L44 52 L30 60 L33 44 L21 33 L37 31 Z"
            fill="#FFD166"
            stroke="#3D3045"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="39" cy="40" r="2.2" fill="#3D3045" />
          <circle cx="49" cy="40" r="2.2" fill="#3D3045" />
          <path d="M40.5 45.5 Q44 48.5 47.5 45.5" stroke="#3D3045" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full bg-[#9B7BFF] border border-[#3D3045]"
          style={{ animation: 'cartoon-bounce-dot 1.1s infinite ease-in-out 0s' }}
        />
        <span
          className="h-2.5 w-2.5 rounded-full bg-[#70C7F2] border border-[#3D3045]"
          style={{ animation: 'cartoon-bounce-dot 1.1s infinite ease-in-out 0.18s' }}
        />
        <span
          className="h-2.5 w-2.5 rounded-full bg-[#FF8E9E] border border-[#3D3045]"
          style={{ animation: 'cartoon-bounce-dot 1.1s infinite ease-in-out 0.36s' }}
        />
      </div>
      <p className="text-sm font-bold text-[#817487]">{label}</p>
    </div>
  );
}

export function CartoonEmptyState({
  title,
  description,
  variant = 'search',
  action,
}: {
  title: string;
  description: string;
  variant?: 'search' | 'inbox' | 'trophy' | 'lost';
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <svg
        viewBox="0 0 140 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mb-4 h-28 w-36"
        aria-hidden="true"
      >
        {/* Soft cloud backdrop */}
        <path
          d="M28 84 H112 C121 84 127 77 127 69 C127 62 121 56 114 55 C112 41 100 31 85 31 C76 31 68 35 63 42 C58 38 52 36 45 37 C34 39 27 48 27 59 C20 61 15 67 15 74 C15 80 20 84 28 84 Z"
          fill="#FFF0DF"
          stroke="#E9DCCF"
          strokeWidth="2.5"
        />
        {/* Cute Mascot */}
        <rect
          x="48"
          y="34"
          width="44"
          height="42"
          rx="16"
          fill={
            variant === 'trophy'
              ? '#FFD166'
              : variant === 'inbox'
                ? '#8BDCC0'
                : variant === 'lost'
                  ? '#FF8E9E'
                  : '#70C7F2'
          }
          stroke="#3D3045"
          strokeWidth="2.5"
        />
        {/* Little ears/antennae */}
        <circle cx="54" cy="32" r="5" fill="#FFD166" stroke="#3D3045" strokeWidth="2.2" />
        <circle cx="86" cy="32" r="5" fill="#FFD166" stroke="#3D3045" strokeWidth="2.2" />
        {/* Eyes & expression */}
        <circle cx="62" cy="52" r="2.6" fill="#3D3045" />
        <circle cx="78" cy="52" r="2.6" fill="#3D3045" />
        <circle cx="57" cy="57" r="2.5" fill="#FF8E9E" opacity="0.7" />
        <circle cx="83" cy="57" r="2.5" fill="#FF8E9E" opacity="0.7" />
        {variant === 'lost' ? (
          <circle cx="70" cy="60" r="3.2" fill="#3D3045" />
        ) : (
          <path d="M65 59 Q70 63 75 59" stroke="#3D3045" strokeWidth="2.2" strokeLinecap="round" />
        )}
        {/* Little stars */}
        <path
          d="M25 28 L27 33 L32 35 L27 37 L25 42 L23 37 L18 35 L23 33 Z"
          fill="#FFD166"
          stroke="#3D3045"
          strokeWidth="1.5"
        />
        <circle cx="115" cy="28" r="4" fill="#9B7BFF" stroke="#3D3045" strokeWidth="1.8" />
      </svg>

      <h3 className="font-display text-lg font-extrabold text-[#3D3045]">{title}</h3>
      <p className="mt-1 max-w-sm text-sm font-medium text-[#817487]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function CartoonAuthMascot({ mode }: { mode: 'login' | 'register' }) {
  return (
    <svg
      viewBox="0 0 220 170"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-40 w-52 mx-auto"
      aria-hidden="true"
    >
      <circle cx="110" cy="90" r="68" fill="#FFF0DF" stroke="#E9DCCF" strokeWidth="2.5" />
      {/* Floating game shapes */}
      <rect x="24" y="42" width="20" height="20" rx="6" transform="rotate(-12 24 42)" fill="#70C7F2" stroke="#3D3045" strokeWidth="2.2" />
      <circle cx="188" cy="52" r="10" fill="#FFD166" stroke="#3D3045" strokeWidth="2.2" />
      <path d="M174 128 L184 114 L194 128 Z" fill="#8BDCC0" stroke="#3D3045" strokeWidth="2.2" strokeLinejoin="round" />

      {/* Main Cartoon Buddy */}
      <rect
        x="68"
        y="46"
        width="84"
        height="80"
        rx="28"
        fill={mode === 'login' ? '#9B7BFF' : '#FF8E9E'}
        stroke="#3D3045"
        strokeWidth="3"
      />
      {/* Belly patch */}
      <rect x="84" y="92" width="52" height="26" rx="13" fill="#FFF7ED" stroke="#3D3045" strokeWidth="2.2" />
      {/* Crown / Cap */}
      <path
        d="M84 48 L92 30 L110 40 L128 30 L136 48 Z"
        fill="#FFD166"
        stroke="#3D3045"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Eyes */}
      <circle cx="95" cy="70" r="4.5" fill="#FFFFFF" stroke="#3D3045" strokeWidth="2" />
      <circle cx="125" cy="70" r="4.5" fill="#FFFFFF" stroke="#3D3045" strokeWidth="2" />
      <circle cx="96" cy="70" r="2" fill="#3D3045" />
      <circle cx="126" cy="70" r="2" fill="#3D3045" />
      {/* Smile & cheeks */}
      <circle cx="83" cy="77" r="4" fill="#FFD166" opacity="0.85" />
      <circle cx="137" cy="77" r="4" fill="#FFD166" opacity="0.85" />
      <path d="M102 79 Q110 86 118 79" stroke="#3D3045" strokeWidth="2.6" strokeLinecap="round" />
      {/* Waving arms */}
      <path d="M68 88 Q48 76 46 60" stroke="#3D3045" strokeWidth="3" strokeLinecap="round" />
      <circle cx="45" cy="58" r="7" fill="#FFD166" stroke="#3D3045" strokeWidth="2.5" />
      <path d="M152 88 Q170 96 174 108" stroke="#3D3045" strokeWidth="3" strokeLinecap="round" />
      <circle cx="174" cy="110" r="7" fill="#FFD166" stroke="#3D3045" strokeWidth="2.5" />
    </svg>
  );
}

const ACCENT_HEX: Record<AchievementBadge['accent'], { bg: string; soft: string }> = {
  purple: { bg: '#9B7BFF', soft: '#EDE7FF' },
  sky: { bg: '#70C7F2', soft: '#E3F5FE' },
  mint: { bg: '#8BDCC0', soft: '#E3F8F0' },
  coral: { bg: '#FF8E9E', soft: '#FFE6EA' },
  yellow: { bg: '#FFD166', soft: '#FFF5D6' },
  orange: { bg: '#FFAB66', soft: '#FFEDE0' },
};

export function AchievementMedal({
  badge,
  size = 'md',
}: {
  badge: AchievementBadge;
  size?: 'sm' | 'md';
}) {
  const palette = ACCENT_HEX[badge.accent];
  const fill = badge.unlocked ? palette.bg : '#E9DCCF';
  const inner = badge.unlocked ? '#FFFFFF' : '#FFF7ED';
  const stroke = badge.unlocked ? '#3D3045' : '#817487';

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        'shrink-0 transition-transform duration-200',
        badge.unlocked && 'group-hover:scale-105',
        size === 'sm' ? 'h-12 w-12' : 'h-14 w-14'
      )}
      aria-hidden="true"
    >
      {/* Ribbon tails */}
      <path
        d="M20 42 L15 58 L26 53 L30 59 L32 45"
        fill={badge.unlocked ? '#FF8E9E' : '#E9DCCF'}
        stroke={stroke}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M44 42 L49 58 L38 53 L34 59 L32 45"
        fill={badge.unlocked ? '#70C7F2' : '#E9DCCF'}
        stroke={stroke}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Scalloped Medal Circle */}
      <circle cx="32" cy="27" r="21" fill={fill} stroke={stroke} strokeWidth="2.6" />
      <circle cx="32" cy="27" r="15" fill={inner} stroke={stroke} strokeWidth="2" />

      {/* Icon inside */}
      {badge.iconType === 'trophy' && (
        <path
          d="M25 20 H39 V26 C39 30 36 33 32 33 C28 33 25 30 25 26 V20 Z M32 33 V37 M27 37 H37"
          stroke={stroke}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={badge.unlocked ? '#FFD166' : 'none'}
        />
      )}
      {badge.iconType === 'crown' && (
        <path
          d="M22 33 L24 22 L29 27 L32 20 L35 27 L40 22 L42 33 Z"
          fill={badge.unlocked ? '#FFD166' : 'none'}
          stroke={stroke}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      )}
      {badge.iconType === 'star' && (
        <path
          d="M32 18 L35 24 L41 25 L36.5 29.5 L37.5 36 L32 33 L26.5 36 L27.5 29.5 L23 25 L29 24 Z"
          fill={badge.unlocked ? '#FFD166' : 'none'}
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}
      {badge.iconType === 'spark' && (
        <path
          d="M32 17 L34.5 24.5 L42 27 L34.5 29.5 L32 37 L29.5 29.5 L22 27 L29.5 24.5 Z"
          fill={badge.unlocked ? '#70C7F2' : 'none'}
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}
      {badge.iconType === 'target' && (
        <>
          <circle cx="32" cy="27" r="8" stroke={stroke} strokeWidth="2.2" />
          <circle cx="32" cy="27" r="3" fill={badge.unlocked ? '#9B7BFF' : stroke} />
        </>
      )}
      {badge.iconType === 'snake' && (
        <path
          d="M23 32 C23 26 29 26 29 29 C29 32 35 32 35 26 C35 21 40 21 41 23"
          stroke={stroke}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      )}
      {badge.iconType === 'scissors' && (
        <>
          <circle cx="26" cy="32" r="3.5" stroke={stroke} strokeWidth="2" />
          <circle cx="38" cy="32" r="3.5" stroke={stroke} strokeWidth="2" />
          <path d="M28 29 L37 19 M36 29 L27 19" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />
        </>
      )}
      {badge.iconType === 'flame' && (
        <path
          d="M32 17 C36 22 39 25 39 30 C39 34 36 37 32 37 C28 37 25 34 25 30 C25 26 28 24 29 21 C30 23 31 23 32 17 Z"
          fill={badge.unlocked ? '#FFAB66' : 'none'}
          stroke={stroke}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
