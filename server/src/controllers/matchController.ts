import crypto from 'crypto';
import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { Game, GameType } from '../models/Game';
import { Invitation } from '../models/Invitation';
import { InviteLink } from '../models/InviteLink';
import { MatchHistory } from '../models/MatchHistory';
import { User } from '../models/User';
import { getSocketIO, roomManager } from '../services/roomRegistry';

const createInviteLinkSchema = z.object({
  gameType: z.enum(['tic-tac-toe', 'snake', 'rock-paper-scissors']),
});

export async function getMatchHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const gameType = req.query.gameType ? String(req.query.gameType) : undefined;
  const targetUserId = req.query.userId ? String(req.query.userId) : req.userId;
  const limit = Math.min(Number(req.query.limit) || 30, 100);

  const query: Record<string, unknown> = {
    'players.userId': targetUserId,
  };

  if (gameType && ['tic-tac-toe', 'snake', 'rock-paper-scissors'].includes(gameType)) {
    query.gameType = gameType;
  }

  const matches = await MatchHistory.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.json({
    matches: matches.map((m) => ({
      id: m._id.toString(),
      roomId: m.roomId,
      gameType: m.gameType,
      players: m.players.map((p) => ({
        userId: p.userId.toString(),
        username: p.username,
        avatar: p.avatar,
        score: p.score,
        outcome: p.outcome,
      })),
      winnerId: m.winner ? m.winner.toString() : null,
      winnerUsername: m.winnerUsername ?? null,
      isDraw: m.isDraw,
      scores: m.scores,
      result: m.result,
      durationSeconds: m.durationSeconds,
      createdAt: m.createdAt,
    })),
  });
}

export async function getInvitations(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  await Invitation.updateMany(
    {
      status: 'pending',
      expiresAt: { $lte: new Date() },
    },
    { $set: { status: 'expired' } }
  );

  const [incoming, outgoing] = await Promise.all([
    Invitation.find({
      recipient: req.userId,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    Invitation.find({
      sender: req.userId,
      status: { $in: ['pending', 'accepted', 'rejected', 'expired'] },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
  ]);

  const serialize = (inv: (typeof incoming)[number]) => ({
    id: inv._id.toString(),
    senderId: inv.sender.toString(),
    senderUsername: inv.senderUsername,
    senderAvatar: inv.senderAvatar,
    recipientId: inv.recipient.toString(),
    recipientUsername: inv.recipientUsername,
    recipientAvatar: inv.recipientAvatar,
    gameType: inv.gameType,
    status: inv.status,
    roomId: inv.roomId,
    expiresAt: inv.expiresAt,
    createdAt: inv.createdAt,
  });

  res.json({
    incoming: incoming.map(serialize),
    outgoing: outgoing.map(serialize),
  });
}

export async function getRoomDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const roomId = String(req.params.roomId || '').trim();
  const game = await Game.findOne({ roomId }).lean();
  if (!game) {
    res.status(404).json({ error: 'Game room not found' });
    return;
  }

  const isMember = game.players.some((p) => p.userId.toString() === req.userId);
  if (!isMember) {
    res.status(403).json({ error: 'You are not a participant in this match' });
    return;
  }

  res.json({
    room: {
      roomId: game.roomId,
      gameType: game.gameType,
      mode: game.mode,
      status: game.status,
      players: game.players.map((p) => ({
        userId: p.userId.toString(),
        username: p.username,
        avatar: p.avatar,
        slot: p.slot,
      })),
      winnerId: game.winner ? game.winner.toString() : null,
      winnerUsername: game.winnerUsername ?? null,
      isDraw: game.isDraw,
      startedAt: game.startedAt,
      finishedAt: game.finishedAt,
    },
  });
}

export async function getPlatformOverview(_req: Request, res: Response): Promise<void> {
  const [totalPlayers, onlinePlayers, totalMatches] = await Promise.all([
    User.countDocuments({ isGuest: { $ne: true } }),
    User.countDocuments({ status: { $in: ['online', 'in-game'] } }),
    MatchHistory.countDocuments({}),
  ]);

  res.json({
    totalPlayers,
    onlinePlayers,
    totalMatches,
  });
}

export async function createInviteLink(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const parsed = createInviteLinkSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid game type' });
    return;
  }

  const code = crypto.randomBytes(5).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  const link = await InviteLink.create({
    code,
    gameType: parsed.data.gameType,
    host: req.user._id,
    hostUsername: req.user.username,
    hostAvatar: req.user.avatar,
    status: 'open',
    expiresAt,
  });

  res.status(201).json({
    invite: {
      code: link.code,
      gameType: link.gameType,
      hostId: link.host.toString(),
      hostUsername: link.hostUsername,
      hostAvatar: link.hostAvatar,
      status: link.status,
      expiresAt: link.expiresAt,
    },
  });
}

export async function getInviteLink(req: Request, res: Response): Promise<void> {
  const code = String(req.params.code || '').trim();
  if (!code) {
    res.status(400).json({ error: 'Invite code is required' });
    return;
  }

  const link = await InviteLink.findOne({ code });
  if (!link) {
    res.status(404).json({ error: 'Invite link not found' });
    return;
  }

  if (link.status === 'open' && link.expiresAt.getTime() <= Date.now()) {
    link.status = 'expired';
    await link.save();
  }

  res.json({
    invite: {
      code: link.code,
      gameType: link.gameType,
      hostId: link.host.toString(),
      hostUsername: link.hostUsername,
      hostAvatar: link.hostAvatar,
      status: link.status,
      roomId: link.roomId ?? null,
      expiresAt: link.expiresAt,
    },
  });
}

export async function joinInviteLink(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const code = String(req.params.code || '').trim();
  const link = await InviteLink.findOne({ code });

  if (!link) {
    res.status(404).json({ error: 'Invite link not found' });
    return;
  }

  if (link.host.toString() === req.user._id.toString()) {
    res.status(400).json({ error: 'You cannot join your own invite link as the opponent' });
    return;
  }

  if (link.status !== 'open') {
    res.status(409).json({ error: `This invite link is already ${link.status}` });
    return;
  }

  if (link.expiresAt.getTime() <= Date.now()) {
    link.status = 'expired';
    await link.save();
    res.status(410).json({ error: 'This invite link has expired' });
    return;
  }

  // Atomically claim the invite link to prevent duplicate room creation races
  const claimed = await InviteLink.findOneAndUpdate(
    { _id: link._id, status: 'open' },
    {
      $set: {
        status: 'claimed',
        guest: req.user._id,
        guestUsername: req.user.username,
      },
    },
    { new: true }
  );

  if (!claimed) {
    res.status(409).json({ error: 'This invite link was just claimed by another player' });
    return;
  }

  const room = await roomManager.createRoom({
    gameType: claimed.gameType as GameType,
    mode: 'private',
    players: [
      {
        userId: claimed.host.toString(),
        username: claimed.hostUsername,
        avatar: claimed.hostAvatar,
      },
      {
        userId: req.user._id.toString(),
        username: req.user.username,
        avatar: req.user.avatar,
      },
    ],
  });

  claimed.roomId = room.roomId;
  await claimed.save();

  const matchPayload = {
    roomId: room.roomId,
    gameType: room.gameType,
    players: room.players.map((p) => ({
      userId: p.userId,
      username: p.username,
      avatar: p.avatar,
      slot: p.slot,
    })),
  };

  const io = getSocketIO();
  io?.to(`user:${claimed.host.toString()}`).emit('matchmaking:found', matchPayload);
  io?.to(`user:${req.user._id.toString()}`).emit('matchmaking:found', matchPayload);

  res.json({
    roomId: room.roomId,
    gameType: room.gameType,
  });
}

export async function cancelInviteLink(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const code = String(req.params.code || '').trim();
  const link = await InviteLink.findOne({ code });

  if (!link) {
    res.status(404).json({ error: 'Invite link not found' });
    return;
  }

  if (link.host.toString() !== req.user._id.toString()) {
    res.status(403).json({ error: 'Only the host can cancel this invite link' });
    return;
  }

  if (link.status === 'open') {
    link.status = 'cancelled';
    await link.save();
  }

  res.json({ success: true });
}
