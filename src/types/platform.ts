export type GameType = 'tic-tac-toe' | 'snake' | 'rock-paper-scissors';
export type UserStatus = 'online' | 'offline' | 'in-game';

export interface GameStatBucket {
  played: number;
  wins: number;
  losses: number;
  draws: number;
  highScore?: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  isGuest?: boolean;
  avatar: string;
  bio: string;
  status: UserStatus;
  lastSeen: string;
  preferences: {
    soundEnabled: boolean;
    snakeSpeed: 'normal' | 'fast';
  };
  statistics: {
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    games: {
      ticTacToe: GameStatBucket;
      snake: GameStatBucket;
      rockPaperScissors: GameStatBucket;
    };
  };
  createdAt: string;
}

export interface PlayerSummary {
  id: string;
  username: string;
  avatar: string;
  status: UserStatus;
  totalGames: number;
  wins: number;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  avatar: string;
  status: UserStatus;
  statistics: UserProfile['statistics'];
}

export interface InvitationItem {
  id: string;
  senderId: string;
  senderUsername: string;
  senderAvatar: string;
  recipientId: string;
  recipientUsername: string;
  recipientAvatar: string;
  gameType: GameType;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  roomId?: string;
  expiresAt: string;
  createdAt: string;
}

export interface MatchHistoryItem {
  id: string;
  roomId: string;
  gameType: GameType;
  players: Array<{
    userId: string;
    username: string;
    avatar: string;
    score: number;
    outcome: 'win' | 'loss' | 'draw';
  }>;
  winnerId: string | null;
  winnerUsername: string | null;
  isDraw: boolean;
  scores: Record<string, number>;
  result: string;
  durationSeconds: number;
  createdAt: string;
}

export interface RoomPlayerState {
  userId: string;
  username: string;
  avatar: string;
  slot: 0 | 1;
  ready: boolean;
  connected: boolean;
  playAgainRequested: boolean;
}

export interface TttState {
  board: ('X' | 'O' | null)[];
  symbols: Record<string, 'X' | 'O'>;
  currentTurnUserId: string;
  winningLine: number[] | null;
  winnerUserId: string | null;
  isDraw: boolean;
  status: 'waiting' | 'playing' | 'finished';
  moveCount: number;
}

export type SnakeDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface SnakeArenaView {
  userId: string;
  snake: Array<{ x: number; y: number }>;
  direction: SnakeDirection;
  food: { x: number; y: number };
  score: number;
  alive: boolean;
  deathReason: 'wall' | 'self' | 'timeout' | 'disconnect' | null;
}

export interface SnakeMatchView {
  gridSize: number;
  tickMs: number;
  durationMs: number;
  remainingMs: number;
  status: 'waiting' | 'playing' | 'finished';
  arenas: Record<string, SnakeArenaView>;
  winnerUserId: string | null;
  isDraw: boolean;
}

export type RpsChoice = 'rock' | 'paper' | 'scissors';

export interface RpsRoundRecord {
  round: number;
  choices: Record<string, RpsChoice>;
  winnerUserId: string | null;
  isTie: boolean;
}

export interface RpsMatchView {
  currentRound: number;
  targetWins: number;
  maxRounds: number;
  phase: 'collecting' | 'revealing' | 'finished';
  scores: Record<string, number>;
  submittedBy: Record<string, boolean>;
  myChoice: RpsChoice | null;
  revealedChoices: Record<string, RpsChoice> | null;
  history: RpsRoundRecord[];
  lastRoundResult: RpsRoundRecord | null;
  winnerUserId: string | null;
  isDraw: boolean;
}

export interface RoomStatePayload {
  roomId: string;
  gameType: GameType;
  mode: 'matchmaking' | 'private';
  status: 'waiting' | 'active' | 'finished';
  players: RoomPlayerState[];
  winnerUserId: string | null;
  isDraw: boolean;
  resultReason: string | null;
  startedAt: number | null;
  finishedAt: number | null;
  tttState: TttState | null;
  snakeState: SnakeMatchView | null;
  rpsState: RpsMatchView | null;
}

export interface GameFinishedPayload {
  roomId: string;
  gameType: GameType;
  winnerUserId: string | null;
  winnerUsername: string | null;
  isDraw: boolean;
  scores: Record<string, number>;
  result: string;
  durationSeconds: number;
}

export interface PlatformNotification {
  id: string;
  type: 'invitation' | 'match' | 'system';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  invitationId?: string;
  gameType?: GameType;
}

export interface InviteLinkInfo {
  code: string;
  gameType: GameType;
  hostId: string;
  hostUsername: string;
  hostAvatar: string;
  status: 'open' | 'claimed' | 'expired' | 'cancelled';
  roomId?: string | null;
  expiresAt: string;
}
