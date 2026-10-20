import mongoose, { Document, Schema } from 'mongoose';

export type UserStatus = 'online' | 'offline' | 'in-game';

export interface IGameStatBucket {
  played: number;
  wins: number;
  losses: number;
  draws: number;
  highScore?: number;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  usernameLower: string;
  email?: string;
  passwordHash: string;
  isGuest: boolean;
  avatar: string;
  bio: string;
  status: UserStatus;
  lastSeen: Date;
  preferences: {
    soundEnabled: boolean;
    snakeSpeed: 'normal' | 'fast';
  };
  statistics: {
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    games: {
      ticTacToe: IGameStatBucket;
      snake: IGameStatBucket;
      rockPaperScissors: IGameStatBucket;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  toPublicProfile(): PublicUserProfile;
}

export interface PublicUserProfile {
  id: string;
  username: string;
  email?: string;
  isGuest: boolean;
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
      ticTacToe: IGameStatBucket;
      snake: IGameStatBucket;
      rockPaperScissors: IGameStatBucket;
    };
  };
  createdAt: string;
}

const gameBucketSchema = new Schema<IGameStatBucket>(
  {
    played: { type: Number, default: 0, min: 0 },
    wins: { type: Number, default: 0, min: 0 },
    losses: { type: Number, default: 0, min: 0 },
    draws: { type: Number, default: 0, min: 0 },
    highScore: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-zA-Z0-9_]+$/,
    },
    usernameLower: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    isGuest: {
      type: Boolean,
      default: false,
      index: true,
    },
    avatar: {
      type: String,
      default: 'shield-emerald',
    },
    bio: {
      type: String,
      default: '',
      maxlength: 160,
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'in-game'],
      default: 'offline',
      index: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    preferences: {
      soundEnabled: { type: Boolean, default: true },
      snakeSpeed: { type: String, enum: ['normal', 'fast'], default: 'normal' },
    },
    statistics: {
      totalGames: { type: Number, default: 0, min: 0 },
      wins: { type: Number, default: 0, min: 0 },
      losses: { type: Number, default: 0, min: 0 },
      draws: { type: Number, default: 0, min: 0 },
      games: {
        ticTacToe: { type: gameBucketSchema, default: () => ({}) },
        snake: { type: gameBucketSchema, default: () => ({}) },
        rockPaperScissors: { type: gameBucketSchema, default: () => ({}) },
      },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ 'statistics.wins': -1, 'statistics.totalGames': -1 });

userSchema.methods.toPublicProfile = function toPublicProfile(this: IUser): PublicUserProfile {
  const total = this.statistics.totalGames || 0;
  const winRate = total > 0 ? Math.round((this.statistics.wins / total) * 1000) / 10 : 0;

  return {
    id: this._id.toString(),
    username: this.username,
    email: this.email,
    isGuest: Boolean(this.isGuest),
    avatar: this.avatar,
    bio: this.bio,
    status: this.status,
    lastSeen: this.lastSeen.toISOString(),
    preferences: {
      soundEnabled: this.preferences?.soundEnabled ?? true,
      snakeSpeed: this.preferences?.snakeSpeed ?? 'normal',
    },
    statistics: {
      totalGames: this.statistics.totalGames,
      wins: this.statistics.wins,
      losses: this.statistics.losses,
      draws: this.statistics.draws,
      winRate,
      games: {
        ticTacToe: {
          played: this.statistics.games.ticTacToe.played,
          wins: this.statistics.games.ticTacToe.wins,
          losses: this.statistics.games.ticTacToe.losses,
          draws: this.statistics.games.ticTacToe.draws,
        },
        snake: {
          played: this.statistics.games.snake.played,
          wins: this.statistics.games.snake.wins,
          losses: this.statistics.games.snake.losses,
          draws: this.statistics.games.snake.draws,
          highScore: this.statistics.games.snake.highScore ?? 0,
        },
        rockPaperScissors: {
          played: this.statistics.games.rockPaperScissors.played,
          wins: this.statistics.games.rockPaperScissors.wins,
          losses: this.statistics.games.rockPaperScissors.losses,
          draws: this.statistics.games.rockPaperScissors.draws,
        },
      },
    },
    createdAt: this.createdAt.toISOString(),
  };
};

export const User = mongoose.model<IUser>('User', userSchema);
