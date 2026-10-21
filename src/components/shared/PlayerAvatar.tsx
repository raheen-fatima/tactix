import { UserStatus } from '@/src/types/platform';
import { cn } from '@/src/utils/cn';

export const AVATAR_OPTIONS = [
  {
    id: 'shield-emerald',
    label: 'Minty',
    bg: 'bg-[#8BDCC0]',
    ring: 'border-[#3D3045]',
    accentHex: '#8BDCC0',
    bannerBg: 'bg-[#E3F8F0]',
  },
  {
    id: 'knight-amber',
    label: 'Sunny',
    bg: 'bg-[#FFD166]',
    ring: 'border-[#3D3045]',
    accentHex: '#FFD166',
    bannerBg: 'bg-[#FFF5D6]',
  },
  {
    id: 'viper-cyan',
    label: 'Sky',
    bg: 'bg-[#70C7F2]',
    ring: 'border-[#3D3045]',
    accentHex: '#70C7F2',
    bannerBg: 'bg-[#E3F5FE]',
  },
  {
    id: 'rook-slate',
    label: 'Plum',
    bg: 'bg-[#9B7BFF]',
    ring: 'border-[#3D3045]',
    accentHex: '#9B7BFF',
    bannerBg: 'bg-[#EDE7FF]',
  },
  {
    id: 'blade-crimson',
    label: 'Coral',
    bg: 'bg-[#FF8E9E]',
    ring: 'border-[#3D3045]',
    accentHex: '#FF8E9E',
    bannerBg: 'bg-[#FFE6EA]',
  },
  {
    id: 'orbit-gold',
    label: 'Tangerine',
    bg: 'bg-[#FFAB66]',
    ring: 'border-[#3D3045]',
    accentHex: '#FFAB66',
    bannerBg: 'bg-[#FFEDE0]',
  },
] as const;

function CartoonCharacterSvg({ avatar, className }: { avatar: string; className?: string }) {
  switch (avatar) {
    case 'knight-amber':
      // Sunny Star-Helmet Buddy
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <path d="M12 24 C12 14 36 14 36 24 V35 C36 38 33 40 24 40 C15 40 12 38 12 35 Z" fill="#FFF7ED" stroke="#3D3045" strokeWidth="2.4" />
          <path d="M11 22 C11 12 37 12 37 22 Z" fill="#FFAB66" stroke="#3D3045" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M21 12 L24 6 L27 12" fill="#FF8E9E" stroke="#3D3045" strokeWidth="2.2" strokeLinejoin="round" />
          <circle cx="19" cy="28" r="2.2" fill="#3D3045" />
          <circle cx="29" cy="28" r="2.2" fill="#3D3045" />
          <circle cx="15.5" cy="31" r="2" fill="#FF8E9E" opacity="0.8" />
          <circle cx="32.5" cy="31" r="2" fill="#FF8E9E" opacity="0.8" />
          <path d="M21 32.5 Q24 35.5 27 32.5" stroke="#3D3045" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'viper-cyan':
      // Playful Sky Dino/Gecko Buddy
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <circle cx="16" cy="14" r="4" fill="#FFD166" stroke="#3D3045" strokeWidth="2.2" />
          <circle cx="32" cy="14" r="4" fill="#FFD166" stroke="#3D3045" strokeWidth="2.2" />
          <rect x="11" y="14" width="26" height="25" rx="12" fill="#FFF7ED" stroke="#3D3045" strokeWidth="2.4" />
          <circle cx="19" cy="25" r="2.4" fill="#3D3045" />
          <circle cx="29" cy="25" r="2.4" fill="#3D3045" />
          <circle cx="15" cy="29" r="2.2" fill="#FF8E9E" opacity="0.75" />
          <circle cx="33" cy="29" r="2.2" fill="#FF8E9E" opacity="0.75" />
          <path d="M20 31 Q24 35 28 31" stroke="#3D3045" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'rook-slate':
      // Friendly Plum Crowned Bot/Rook
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <path d="M14 17 L14 10 H19 V13 H22 V10 H26 V13 H29 V10 H34 V17 Z" fill="#FFD166" stroke="#3D3045" strokeWidth="2.2" strokeLinejoin="round" />
          <rect x="12" y="17" width="24" height="22" rx="9" fill="#FFF7ED" stroke="#3D3045" strokeWidth="2.4" />
          <rect x="16" y="22" width="16" height="9" rx="4.5" fill="#3D3045" />
          <circle cx="20.5" cy="26.5" r="2" fill="#70C7F2" />
          <circle cx="27.5" cy="26.5" r="2" fill="#70C7F2" />
          <path d="M21 34.5 Q24 36.5 27 34.5" stroke="#3D3045" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'blade-crimson':
      // Energetic Coral Fox Character
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <path d="M12 22 L14 9 L22 17 Z" fill="#FFAB66" stroke="#3D3045" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M36 22 L34 9 L26 17 Z" fill="#FFAB66" stroke="#3D3045" strokeWidth="2.2" strokeLinejoin="round" />
          <ellipse cx="24" cy="27" rx="13" ry="12" fill="#FFF7ED" stroke="#3D3045" strokeWidth="2.4" />
          <circle cx="19" cy="25" r="2.2" fill="#3D3045" />
          <circle cx="29" cy="25" r="2.2" fill="#3D3045" />
          <ellipse cx="24" cy="29.5" rx="2.5" ry="1.8" fill="#3D3045" />
          <path d="M21 33 Q24 35.5 27 33" stroke="#3D3045" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'orbit-gold':
      // Cheerful Tangerine Star Mascot
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <path
            d="M24 7 L28.5 16.5 L39 18 L31.2 25.5 L33 36 L24 31 L15 36 L16.8 25.5 L9 18 L19.5 16.5 Z"
            fill="#FFD166"
            stroke="#3D3045"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="23" r="2" fill="#3D3045" />
          <circle cx="28" cy="23" r="2" fill="#3D3045" />
          <path d="M21.5 27 Q24 29.5 26.5 27" stroke="#3D3045" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'shield-emerald':
    default:
      // Cute Minty Shield Buddy
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <path
            d="M12 14 C12 12 14 11 24 11 C34 11 36 12 36 14 V25 C36 33 24 39 24 39 C24 39 12 33 12 25 Z"
            fill="#FFF7ED"
            stroke="#3D3045"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <circle cx="19" cy="22" r="2.2" fill="#3D3045" />
          <circle cx="29" cy="22" r="2.2" fill="#3D3045" />
          <circle cx="16" cy="26" r="2" fill="#FF8E9E" opacity="0.8" />
          <circle cx="32" cy="26" r="2" fill="#FF8E9E" opacity="0.8" />
          <path d="M20.5 27.5 Q24 30.5 27.5 27.5" stroke="#3D3045" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
  }
}

interface PlayerAvatarProps {
  avatar: string;
  username?: string;
  status?: UserStatus;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatusDot?: boolean;
  className?: string;
}

export function PlayerAvatar({
  avatar,
  username,
  status,
  size = 'md',
  showStatusDot = false,
  className,
}: PlayerAvatarProps) {
  const preset = AVATAR_OPTIONS.find((a) => a.id === avatar) ?? AVATAR_OPTIONS[0];

  const sizeMap = {
    sm: 'h-9 w-9 rounded-xl',
    md: 'h-11 w-11 rounded-2xl',
    lg: 'h-14 w-14 rounded-2xl',
    xl: 'h-18 w-18 rounded-3xl',
  };

  const svgSizeMap = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
    xl: 'h-14 w-14',
  };

  const statusStyle =
    status === 'online'
      ? 'bg-[#53C99A]'
      : status === 'in-game'
        ? 'bg-[#FFD166]'
        : 'bg-[#E9DCCF]';

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center border-2 border-[#3D3045] shadow-[0_2px_0_#3D3045]',
        preset.bg,
        sizeMap[size],
        className
      )}
      aria-label={username ? `${username} cartoon avatar` : 'Player cartoon avatar'}
    >
      <CartoonCharacterSvg avatar={avatar} className={svgSizeMap[size]} />
      {showStatusDot && status && (
        <span
          title={status === 'in-game' ? 'In Match' : status === 'online' ? 'Online' : 'Offline'}
          className={cn(
            'absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-[#3D3045]',
            statusStyle
          )}
        />
      )}
    </div>
  );
}
