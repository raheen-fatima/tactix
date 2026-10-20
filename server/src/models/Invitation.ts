import mongoose, { Document, Schema } from 'mongoose';
import { GameType } from './Game';

export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';

export interface IInvitation extends Document {
  _id: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  senderUsername: string;
  senderAvatar: string;
  recipient: mongoose.Types.ObjectId;
  recipientUsername: string;
  recipientAvatar: string;
  gameType: GameType;
  status: InvitationStatus;
  roomId?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new Schema<IInvitation>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    senderUsername: {
      type: String,
      required: true,
    },
    senderAvatar: {
      type: String,
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipientUsername: {
      type: String,
      required: true,
    },
    recipientAvatar: {
      type: String,
      required: true,
    },
    gameType: {
      type: String,
      enum: ['tic-tac-toe', 'snake', 'rock-paper-scissors'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired', 'cancelled'],
      default: 'pending',
      index: true,
    },
    roomId: {
      type: String,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

invitationSchema.index({ sender: 1, recipient: 1, gameType: 1, status: 1 });

export const Invitation = mongoose.model<IInvitation>('Invitation', invitationSchema);
