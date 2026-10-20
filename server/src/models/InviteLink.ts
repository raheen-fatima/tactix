import mongoose, { Document, Schema } from 'mongoose';
import { GameType } from './Game';

export type InviteLinkStatus = 'open' | 'claimed' | 'expired' | 'cancelled';

export interface IInviteLink extends Document {
  code: string;
  gameType: GameType;
  host: mongoose.Types.ObjectId;
  hostUsername: string;
  hostAvatar: string;
  guest?: mongoose.Types.ObjectId | null;
  guestUsername?: string | null;
  status: InviteLinkStatus;
  roomId?: string | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const inviteLinkSchema = new Schema<IInviteLink>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    gameType: {
      type: String,
      enum: ['tic-tac-toe', 'snake', 'rock-paper-scissors'],
      required: true,
    },
    host: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    hostUsername: {
      type: String,
      required: true,
    },
    hostAvatar: {
      type: String,
      required: true,
    },
    guest: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    guestUsername: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['open', 'claimed', 'expired', 'cancelled'],
      default: 'open',
      index: true,
    },
    roomId: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const InviteLink = mongoose.model<IInviteLink>('InviteLink', inviteLinkSchema);
