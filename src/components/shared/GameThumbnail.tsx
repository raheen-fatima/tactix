import { GameType } from '@/src/types/platform';
import { cn } from '@/src/utils/cn';

export const GAME_CATALOG: Record<
  GameType,
  {
    title: string;
    category: string;
    accentColor: string;
    softBg: string;
    shortDesc: string;
    rulesSummary: string;
  }
> = {
  'tic-tac-toe': {
    title: 'Tic-Tac-Toe',
    category: 'Strategy Grid',
    accentColor: '#9B7BFF',
    softBg: '#EDE7FF',
    shortDesc: 'Turn-based 3x3 tactical duel with automatic X/O assignment and instant rematches.',
    rulesSummary: 'Claim three cells horizontally, vertically, or diagonally before your opponent.',
  },
  snake: {
    title: 'Snake Arena',
    category: 'Arcade Race',
    accentColor: '#8BDCC0',
    softBg: '#E3F8F0',
    shortDesc: 'Simultaneous dual-arena survival race. Outscore your opponent before time runs out.',
    rulesSummary: 'Collect tasty snacks to grow and score +10 pts while dodging walls and your tail.',
  },
  'rock-paper-scissors': {
    title: 'Rock Paper Scissors',
    category: 'Mind Duel',
    accentColor: '#FF8E9E',
    softBg: '#FFE6EA',
    shortDesc: 'Blind simultaneous throws in a Best-of-3 match with synchronized server reveals.',
    rulesSummary: 'Lock your choice each round. Opponent picks stay hidden until both players throw.',
  },
};

export function HeroArenaIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 460"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-full w-full', className)}
      role="img"
      aria-label="2D flat cartoon illustration of Tic-Tac-Toe, Snake, and Rock Paper Scissors mascots"
    >
      {/* Warm pastel backdrop */}
      <rect width="640" height="460" fill="#FFF0DF" />

      {/* Playful geometric background shapes */}
      <circle cx="96" cy="84" r="46" fill="#FFE6EA" />
      <circle cx="548" cy="108" r="58" fill="#E3F5FE" />
      <circle cx="320" cy="390" r="88" fill="#FFF7ED" />

      {/* Floating decorative stars & sparkles */}
      <path
        d="M52 214 L57 224 L67 229 L57 234 L52 244 L47 234 L37 229 L47 224 Z"
        fill="#FFD166"
        stroke="#3D3045"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M578 242 L582 250 L590 254 L582 258 L578 266 L574 258 L566 254 L574 250 Z"
        fill="#9B7BFF"
        stroke="#3D3045"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="298" cy="54" r="9" fill="#8BDCC0" stroke="#3D3045" strokeWidth="2.4" />
      <circle cx="584" cy="378" r="11" fill="#FFAB66" stroke="#3D3045" strokeWidth="2.4" />

      {/* Card 1 (Left): Cartoon Tic-Tac-Toe Board */}
      <g transform="translate(46 58) rotate(-4 115 115)">
        <rect x="4" y="8" width="226" height="226" rx="24" fill="#3D3045" opacity="0.12" />
        <rect width="226" height="226" rx="24" fill="#FFFFFF" stroke="#3D3045" strokeWidth="3.2" />
        <rect x="16" y="16" width="194" height="194" rx="16" fill="#FFF7ED" stroke="#E9DCCF" strokeWidth="2" />
        <line x1="80" y1="26" x2="80" y2="200" stroke="#3D3045" strokeWidth="2.8" strokeLinecap="round" />
        <line x1="146" y1="26" x2="146" y2="200" stroke="#3D3045" strokeWidth="2.8" strokeLinecap="round" />
        <line x1="26" y1="80" x2="200" y2="80" stroke="#3D3045" strokeWidth="2.8" strokeLinecap="round" />
        <line x1="26" y1="146" x2="200" y2="146" stroke="#3D3045" strokeWidth="2.8" strokeLinecap="round" />

        {/* Coral Cartoon X pieces */}
        <path d="M36 36 L64 64 M64 36 L36 64" stroke="#FF8E9E" strokeWidth="7" strokeLinecap="round" />
        <path d="M99 99 L127 127 M127 99 L99 127" stroke="#FF8E9E" strokeWidth="7" strokeLinecap="round" />
        <path d="M162 162 L190 190 M190 162 L162 190" stroke="#FF8E9E" strokeWidth="7" strokeLinecap="round" />

        {/* Sky Blue Cartoon O pieces */}
        <circle cx="176" cy="50" r="15" stroke="#70C7F2" strokeWidth="6.5" fill="#FFFFFF" />
        <circle cx="50" cy="176" r="15" stroke="#70C7F2" strokeWidth="6.5" fill="#FFFFFF" />

        {/* Golden Win Line */}
        <line x1="30" y1="30" x2="196" y2="196" stroke="#FFD166" strokeWidth="4.5" strokeLinecap="round" strokeDasharray="8 8" />
      </g>

      {/* Card 2 (Top-Right): Happy Snake Arena */}
      <g transform="translate(332 42) rotate(3 125 98)">
        <rect x="4" y="8" width="254" height="194" rx="24" fill="#3D3045" opacity="0.12" />
        <rect width="254" height="194" rx="24" fill="#FFFFFF" stroke="#3D3045" strokeWidth="3.2" />
        <rect x="16" y="16" width="222" height="162" rx="16" fill="#FFF7ED" stroke="#E9DCCF" strokeWidth="2" />

        {/* Cute Mint Snake body */}
        <rect x="34" y="122" width="26" height="26" rx="9" fill="#8BDCC0" stroke="#3D3045" strokeWidth="2.5" />
        <rect x="64" y="122" width="26" height="26" rx="9" fill="#8BDCC0" stroke="#3D3045" strokeWidth="2.5" />
        <rect x="94" y="122" width="26" height="26" rx="9" fill="#53C99A" stroke="#3D3045" strokeWidth="2.5" />
        <rect x="94" y="92" width="26" height="26" rx="9" fill="#53C99A" stroke="#3D3045" strokeWidth="2.5" />
        <rect x="94" y="62" width="26" height="26" rx="9" fill="#53C99A" stroke="#3D3045" strokeWidth="2.5" />
        {/* Smiling Snake Head */}
        <rect x="124" y="60" width="32" height="30" rx="11" fill="#53C99A" stroke="#3D3045" strokeWidth="2.8" />
        <circle cx="144" cy="69" r="3" fill="#FFFFFF" stroke="#3D3045" strokeWidth="1.5" />
        <circle cx="144" cy="81" r="3" fill="#FFFFFF" stroke="#3D3045" strokeWidth="1.5" />
        <circle cx="145" cy="69" r="1.2" fill="#3D3045" />
        <circle cx="145" cy="81" r="1.2" fill="#3D3045" />
        {/* Cute red tongue */}
        <path d="M156 75 H164 L167 72 M164 75 L167 78" stroke="#FF8E9E" strokeWidth="2.2" strokeLinecap="round" />

        {/* Yummy Cartoon Apple */}
        <circle cx="198" cy="76" r="14" fill="#FF8E9E" stroke="#3D3045" strokeWidth="2.6" />
        <path d="M198 62 Q203 53 210 56" stroke="#53C99A" strokeWidth="3" strokeLinecap="round" />
        <circle cx="193" cy="72" r="2.5" fill="#FFFFFF" opacity="0.7" />
      </g>

      {/* Card 3 (Bottom-Center/Right): Cartoon RPS Trio */}
      <g transform="translate(216 268)">
        <rect x="4" y="8" width="356" height="148" rx="24" fill="#3D3045" opacity="0.12" />
        <rect width="356" height="148" rx="24" fill="#FFFFFF" stroke="#3D3045" strokeWidth="3.2" />

        {/* Bouncy Rock Character */}
        <g transform="translate(24 24)">
          <rect width="92" height="100" rx="18" fill="#EDE7FF" stroke="#3D3045" strokeWidth="2.4" />
          <path d="M24 58 C22 36 34 22 48 22 C63 22 72 36 69 58 C67 70 59 74 46 74 C33 74 26 69 24 58 Z" fill="#9B7BFF" stroke="#3D3045" strokeWidth="2.6" />
          <circle cx="40" cy="46" r="2.4" fill="#FFFFFF" />
          <circle cx="54" cy="46" r="2.4" fill="#FFFFFF" />
          <path d="M43 53 Q47 57 51 53" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
        </g>

        {/* Cheerful Paper Character */}
        <g transform="translate(132 24)">
          <rect width="92" height="100" rx="18" fill="#E3F5FE" stroke="#3D3045" strokeWidth="2.4" />
          <path d="M26 20 H54 L66 32 V78 H26 V20 Z" fill="#70C7F2" stroke="#3D3045" strokeWidth="2.6" strokeLinejoin="round" />
          <path d="M54 20 V32 H66" fill="#FFFFFF" stroke="#3D3045" strokeWidth="2.4" strokeLinejoin="round" />
          <circle cx="40" cy="48" r="2.3" fill="#3D3045" />
          <circle cx="53" cy="48" r="2.3" fill="#3D3045" />
          <path d="M43 55 Q46.5 59 50 55" stroke="#3D3045" strokeWidth="2.3" strokeLinecap="round" />
        </g>

        {/* Snappy Scissors Character */}
        <g transform="translate(240 24)">
          <rect width="92" height="100" rx="18" fill="#FFE6EA" stroke="#3D3045" strokeWidth="2.4" />
          <circle cx="32" cy="64" r="10" fill="#FFD166" stroke="#3D3045" strokeWidth="2.6" />
          <circle cx="60" cy="64" r="10" fill="#FFD166" stroke="#3D3045" strokeWidth="2.6" />
          <line x1="36" y1="55" x2="62" y2="22" stroke="#FF8E9E" strokeWidth="7" strokeLinecap="round" />
          <line x1="56" y1="55" x2="30" y2="22" stroke="#FF8E9E" strokeWidth="7" strokeLinecap="round" />
          <line x1="36" y1="55" x2="62" y2="22" stroke="#3D3045" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="56" y1="55" x2="30" y2="22" stroke="#3D3045" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="46" cy="42" r="3.5" fill="#3D3045" />
        </g>
      </g>
    </svg>
  );
}

export function GameThumbnail({
  gameType,
  className,
}: {
  gameType: GameType;
  className?: string;
}) {
  if (gameType === 'tic-tac-toe') {
    return (
      <svg
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('h-full w-full', className)}
        role="img"
        aria-label="Tic-Tac-Toe 2D flat cartoon illustration"
      >
        <rect width="400" height="300" fill="#EDE7FF" />
        <circle cx="66" cy="64" r="34" fill="#FFD166" opacity="0.45" />
        <circle cx="342" cy="242" r="42" fill="#70C7F2" opacity="0.35" />

        {/* Board */}
        <rect x="92" y="42" width="216" height="216" rx="24" fill="#FFFFFF" stroke="#3D3045" strokeWidth="3.2" />
        <line x1="164" y1="58" x2="164" y2="242" stroke="#3D3045" strokeWidth="3" strokeLinecap="round" />
        <line x1="236" y1="58" x2="236" y2="242" stroke="#3D3045" strokeWidth="3" strokeLinecap="round" />
        <line x1="108" y1="114" x2="292" y2="114" stroke="#3D3045" strokeWidth="3" strokeLinecap="round" />
        <line x1="108" y1="186" x2="292" y2="186" stroke="#3D3045" strokeWidth="3" strokeLinecap="round" />

        {/* Coral X diagonal */}
        <path d="M116 66 L144 94 M144 66 L116 94" stroke="#FF8E9E" strokeWidth="7" strokeLinecap="round" />
        <path d="M186 136 L214 164 M214 136 L186 164" stroke="#FF8E9E" strokeWidth="7" strokeLinecap="round" />
        <path d="M256 206 L284 234 M284 206 L256 234" stroke="#FF8E9E" strokeWidth="7" strokeLinecap="round" />

        {/* Sky Blue O */}
        <circle cx="270" cy="80" r="16" stroke="#70C7F2" strokeWidth="6.5" fill="#FFF7ED" />
        <circle cx="130" cy="220" r="16" stroke="#70C7F2" strokeWidth="6.5" fill="#FFF7ED" />

        {/* Sparkle */}
        <path d="M52 178 L56 186 L64 190 L56 194 L52 202 L48 194 L40 190 L48 186 Z" fill="#FFD166" stroke="#3D3045" strokeWidth="2" />
      </svg>
    );
  }

  if (gameType === 'snake') {
    return (
      <svg
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('h-full w-full', className)}
        role="img"
        aria-label="Snake Arena 2D flat cartoon illustration"
      >
        <rect width="400" height="300" fill="#E3F8F0" />
        <circle cx="332" cy="58" r="36" fill="#FFD166" opacity="0.45" />
        <rect x="58" y="38" width="284" height="224" rx="24" fill="#FFFFFF" stroke="#3D3045" strokeWidth="3.2" />
        <rect x="74" y="54" width="252" height="192" rx="16" fill="#FFF7ED" stroke="#E9DCCF" strokeWidth="2" />

        {/* Snake body */}
        <rect x="92" y="180" width="28" height="28" rx="9" fill="#8BDCC0" stroke="#3D3045" strokeWidth="2.5" />
        <rect x="124" y="180" width="28" height="28" rx="9" fill="#8BDCC0" stroke="#3D3045" strokeWidth="2.5" />
        <rect x="156" y="180" width="28" height="28" rx="9" fill="#53C99A" stroke="#3D3045" strokeWidth="2.5" />
        <rect x="156" y="148" width="28" height="28" rx="9" fill="#53C99A" stroke="#3D3045" strokeWidth="2.5" />
        <rect x="156" y="116" width="28" height="28" rx="9" fill="#53C99A" stroke="#3D3045" strokeWidth="2.5" />
        <rect x="188" y="116" width="28" height="28" rx="9" fill="#53C99A" stroke="#3D3045" strokeWidth="2.5" />
        {/* Head */}
        <rect x="220" y="114" width="34" height="32" rx="12" fill="#53C99A" stroke="#3D3045" strokeWidth="2.8" />
        <circle cx="241" cy="124" r="3" fill="#FFFFFF" stroke="#3D3045" strokeWidth="1.5" />
        <circle cx="241" cy="136" r="3" fill="#FFFFFF" stroke="#3D3045" strokeWidth="1.5" />
        <circle cx="242" cy="124" r="1.3" fill="#3D3045" />
        <circle cx="242" cy="136" r="1.3" fill="#3D3045" />
        <path d="M254 130 H263 L266 127 M263 130 L266 133" stroke="#FF8E9E" strokeWidth="2.2" strokeLinecap="round" />

        {/* Apple */}
        <circle cx="294" cy="130" r="15" fill="#FF8E9E" stroke="#3D3045" strokeWidth="2.6" />
        <path d="M294 115 Q299 105 307 109" stroke="#53C99A" strokeWidth="3" strokeLinecap="round" />
        <circle cx="289" cy="125" r="2.8" fill="#FFFFFF" opacity="0.75" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-full w-full', className)}
      role="img"
      aria-label="Rock Paper Scissors 2D flat cartoon illustration"
    >
      <rect width="400" height="300" fill="#FFE6EA" />
      <circle cx="64" cy="236" r="36" fill="#FFD166" opacity="0.45" />
      <circle cx="340" cy="64" r="34" fill="#9B7BFF" opacity="0.25" />

      {/* Rock card */}
      <g transform="translate(36 92) rotate(-5 48 56)">
        <rect width="96" height="114" rx="20" fill="#FFFFFF" stroke="#3D3045" strokeWidth="3" />
        <path d="M25 68 C22 44 35 28 50 28 C66 28 75 44 71 68 C69 80 60 85 48 85 C35 85 27 79 25 68 Z" fill="#9B7BFF" stroke="#3D3045" strokeWidth="2.6" />
        <circle cx="41" cy="54" r="2.5" fill="#FFFFFF" />
        <circle cx="56" cy="54" r="2.5" fill="#FFFFFF" />
        <path d="M44 62 Q48 66 52 62" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
      </g>

      {/* Paper card */}
      <g transform="translate(152 68)">
        <rect width="96" height="114" rx="20" fill="#FFFFFF" stroke="#3D3045" strokeWidth="3" />
        <path d="M26 24 H56 L70 38 V90 H26 V24 Z" fill="#70C7F2" stroke="#3D3045" strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M56 24 V38 H70" fill="#FFF7ED" stroke="#3D3045" strokeWidth="2.4" strokeLinejoin="round" />
        <circle cx="42" cy="57" r="2.5" fill="#3D3045" />
        <circle cx="56" cy="57" r="2.5" fill="#3D3045" />
        <path d="M45 65 Q49 69 53 65" stroke="#3D3045" strokeWidth="2.4" strokeLinecap="round" />
      </g>

      {/* Scissors card */}
      <g transform="translate(268 92) rotate(5 48 56)">
        <rect width="96" height="114" rx="20" fill="#FFFFFF" stroke="#3D3045" strokeWidth="3" />
        <circle cx="33" cy="76" r="11" fill="#FFD166" stroke="#3D3045" strokeWidth="2.6" />
        <circle cx="63" cy="76" r="11" fill="#FFD166" stroke="#3D3045" strokeWidth="2.6" />
        <line x1="37" y1="67" x2="65" y2="28" stroke="#FF8E9E" strokeWidth="7" strokeLinecap="round" />
        <line x1="59" y1="67" x2="31" y2="28" stroke="#FF8E9E" strokeWidth="7" strokeLinecap="round" />
        <line x1="37" y1="67" x2="65" y2="28" stroke="#3D3045" strokeWidth="2.4" strokeLinecap="round" />
        <line x1="59" y1="67" x2="31" y2="28" stroke="#3D3045" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="48" cy="50" r="3.5" fill="#3D3045" />
      </g>
    </svg>
  );
}
