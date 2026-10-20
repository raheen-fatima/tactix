import mongoose, { Document, Schema } from 'mongoose';
import { GameType } from './Game';

export interface IMatchPlayerSummary {
  userId: mongoose.Types.ObjectId;
  username: string;
  avatar: string;
  score: number;
  outcome: 'win' | 'loss' | 'draw';
}

export interface IMatchHistory extends Document {
  roomId: string;
  gameType: GameType;
  players: IMatchPlayerSummary[];
  winner?: mongoose.Types.ObjectId | null;
  winnerUsername?: string | null;
  isDraw: boolean;
  scores: Record<string, number>;
  result: string;
  durationSeconds: number;
  createdAt: Date;
}

const matchPlayerSummarySchema = new Schema<IMatchPlayerSummary>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    avatar: { type: String, required: true },
    score: { type: Number, default: 0 },
    outcome: { type: String, enum: ['win', 'loss', 'draw'], required: true },
  },
  { _id: false }
);

const matchHistorySchema = new Schema<IMatchHistory>(
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
    players: {
      type: [matchPlayerSummarySchema],
      required: true,
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
    scores: {
      type: Schema.Types.Mixed,
      default: {},
    },
    result: {
      type: String,
      required: true,
    },
    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

matchHistorySchema.index({ 'players.userId': 1, createdAt: -1 });
matchHistorySchema.index({ createdAt: -1 });

export const MatchHistory = mongoose.model<IMatchHistory>('MatchHistory', matchHistorySchema);
