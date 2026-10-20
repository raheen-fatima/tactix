import mongoose, { Document, Schema } from 'mongoose';

export type GameType = 'tic-tac-toe' | 'snake' | 'rock-paper-scissors';
export type GameStatus = 'waiting' | 'active' | 'finished' | 'abandoned';

export interface IGamePlayer {
  userId: mongoose.Types.ObjectId;
  username: string;
  avatar: string;
  slot: 0 | 1;
}

export interface IGame extends Document {
  roomId: string;
  gameType: GameType;
  mode: 'matchmaking' | 'private';
  players: IGamePlayer[];
  status: GameStatus;
  winner?: mongoose.Types.ObjectId | null;
  winnerUsername?: string | null;
  isDraw: boolean;
  gameState: Record<string, unknown>;
  startedAt?: Date;
  finishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const gamePlayerSchema = new Schema<IGamePlayer>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    avatar: { type: String, required: true },
    slot: { type: Number, enum: [0, 1], required: true },
  },
  { _id: false }
);

const gameSchema = new Schema<IGame>(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    gameType: {
      type: String,
      enum: ['tic-tac-toe', 'snake', 'rock-paper-scissors'],
      required: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ['matchmaking', 'private'],
      default: 'matchmaking',
    },
    players: {
      type: [gamePlayerSchema],
      validate: [(val: IGamePlayer[]) => val.length <= 2, 'Room supports at most 2 players'],
    },
    status: {
      type: String,
      enum: ['waiting', 'active', 'finished', 'abandoned'],
      default: 'waiting',
      index: true,
    },
    winner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    winnerUsername: {
      type: String,
      default: null,
    },
    isDraw: {
      type: Boolean,
      default: false,
    },
    gameState: {
      type: Schema.Types.Mixed,
      default: {},
    },
    startedAt: {
      type: Date,
    },
    finishedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

gameSchema.index({ 'players.userId': 1, createdAt: -1 });

export const Game = mongoose.model<IGame>('Game', gameSchema);
