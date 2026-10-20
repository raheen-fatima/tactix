import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { z } from 'zod';
import { ensureDatabaseConnected } from '../config/db';
import { env } from '../config/env';
import { MatchmakingManager } from '../matchmaking/MatchmakingManager';
import { GameType } from '../models/Game';
import { Invitation } from '../models/Invitation';
import { User } from '../models/User';
import { roomManager, setSocketIO } from '../services/roomRegistry';
import { parseCookieHeader, verifyAuthToken } from '../utils/jwt';

interface AuthedSocket extends Socket {
  userId?: string;
  username?: string;
  avatar?: string;
}

const gameTypeSchema = z.enum(['tic-tac-toe', 'snake', 'rock-paper-scissors']);
const tttMoveSchema = z.object({
  roomId: z.string().min(1),
  cellIndex: z.number().int().min(0).max(8),
});
const snakeInputSchema = z.object({
  roomId: z.string().min(1),
  direction: z.enum(['UP', 'DOWN', 'LEFT', 'RIGHT']),
});
const rpsSubmitSchema = z.object({
  roomId: z.string().min(1),
  choice: z.enum(['rock', 'paper', 'scissors']),
});
const inviteSendSchema = z.object({
  recipientUsername: z.string().trim().min(3).max(20),
  gameType: gameTypeSchema,
});

export function setupSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 8000,
  });

  const matchmaking = new MatchmakingManager();
  setSocketIO(io);

  // Track active socket count per userId to handle multi-tab connections accurately
  const userSockets = new Map<string, Set<string>>();
  const invitationTimers = new Map<string, NodeJS.Timeout>();

  io.use(async (socket: AuthedSocket, next) => {
    try {
      const cookies = parseCookieHeader(socket.handshake.headers.cookie);
      const token =
        cookies[env.COOKIE_NAME] ||
        (typeof socket.handshake.auth?.token === 'string' ? socket.handshake.auth.token : undefined);

      if (!token) {
        next(new Error('Authentication required'));
        return;
      }

      await ensureDatabaseConnected();
      const payload = verifyAuthToken(token);
      const user = await User.findById(payload.userId);
      if (!user) {
        next(new Error('User not found'));
        return;
      }

      socket.userId = user._id.toString();
      socket.username = user.username;
      socket.avatar = user.avatar;
      next();
    } catch {
      next(new Error('Invalid or expired authentication token'));
    }
  });

  io.on('connection', async (socket: AuthedSocket) => {
    const userId = socket.userId!;
    const username = socket.username!;
    const avatar = socket.avatar!;

    socket.join(`user:${userId}`);

    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);

    await User.updateOne(
      { _id: userId },
      { $set: { status: 'online', lastSeen: new Date() } }
    );
    io.emit('user:online', { userId, username });
    io.emit('presence:update', { userId, status: 'online' });

    // -------------------------------------------------------------------------
    // Matchmaking Events
    // -------------------------------------------------------------------------
    socket.on('matchmaking:join', async (rawPayload: unknown) => {
      const parsed = z.object({ gameType: gameTypeSchema }).safeParse(rawPayload);
      if (!parsed.success) {
        socket.emit('matchmaking:error', { error: 'Invalid game type' });
        return;
      }

      const freshUser = await User.findById(userId);
      const result = matchmaking.joinQueue(parsed.data.gameType, {
        userId,
        username: freshUser?.username ?? username,
        avatar: freshUser?.avatar ?? avatar,
        socketId: socket.id,
        joinedAt: Date.now(),
      });

      if (!result.ok) {
        socket.emit('matchmaking:error', { error: result.error });
        return;
      }

      socket.emit('matchmaking:queued', {
        gameType: parsed.data.gameType,
        queueCounts: matchmaking.getQueueCounts(),
      });

      if (result.matched) {
        const [p0, p1] = result.matched.players;
        const room = await roomManager.createRoom({
          gameType: result.matched.gameType,
          mode: 'matchmaking',
          players: [
            { userId: p0.userId, username: p0.username, avatar: p0.avatar },
            { userId: p1.userId, username: p1.username, avatar: p1.avatar },
          ],
        });

        const payload = {
          roomId: room.roomId,
          gameType: room.gameType,
          players: room.players.map((p) => ({
            userId: p.userId,
            username: p.username,
            avatar: p.avatar,
            slot: p.slot,
          })),
        };

        io.to(`user:${p0.userId}`).emit('matchmaking:found', payload);
        io.to(`user:${p1.userId}`).emit('matchmaking:found', payload);
      }
    });

    socket.on('matchmaking:cancel', () => {
      const removedFrom = matchmaking.leaveQueue(userId);
      socket.emit('matchmaking:cancelled', { gameType: removedFrom });
    });

    // -------------------------------------------------------------------------
    // Private Invitation Events
    // -------------------------------------------------------------------------
    socket.on('invitation:send', async (rawPayload: unknown, ack?: (res: unknown) => void) => {
      const parsed = inviteSendSchema.safeParse(rawPayload);
      if (!parsed.success) {
        const err = { ok: false, error: parsed.error.issues[0]?.message || 'Invalid invitation payload' };
        ack?.(err);
        socket.emit('error', { message: err.error });
        return;
      }

      const { recipientUsername, gameType } = parsed.data;
      const recipient = await User.findOne({ usernameLower: recipientUsername.toLowerCase() });

      if (!recipient) {
        const err = { ok: false, error: `Player "${recipientUsername}" was not found` };
        ack?.(err);
        return;
      }

      if (recipient._id.toString() === userId) {
        const err = { ok: false, error: 'You cannot invite yourself' };
        ack?.(err);
        return;
      }

      const recipientSockets = userSockets.get(recipient._id.toString());
      if (!recipientSockets || recipientSockets.size === 0) {
        const err = {
          ok: false,
          error: `${recipient.username} is currently offline and cannot receive live invitations`,
        };
        ack?.(err);
        return;
      }

      // Expire stale pending invites first
      await Invitation.updateMany(
        { status: 'pending', expiresAt: { $lte: new Date() } },
        { $set: { status: 'expired' } }
      );

      const duplicate = await Invitation.findOne({
        sender: userId,
        recipient: recipient._id,
        gameType,
        status: 'pending',
        expiresAt: { $gt: new Date() },
      });

      if (duplicate) {
        const err = {
          ok: false,
          error: `You already have an active ${gameType} invitation pending for ${recipient.username}`,
        };
        ack?.(err);
        return;
      }

      const senderDoc = await User.findById(userId);
      const expiresAt = new Date(Date.now() + 60_000);

      const invitation = await Invitation.create({
        sender: userId,
        senderUsername: senderDoc?.username ?? username,
        senderAvatar: senderDoc?.avatar ?? avatar,
        recipient: recipient._id,
        recipientUsername: recipient.username,
        recipientAvatar: recipient.avatar,
        gameType,
        status: 'pending',
        expiresAt,
      });

      const invPayload = {
        id: invitation._id.toString(),
        senderId: userId,
        senderUsername: invitation.senderUsername,
        senderAvatar: invitation.senderAvatar,
        recipientId: recipient._id.toString(),
        recipientUsername: recipient.username,
        recipientAvatar: recipient.avatar,
        gameType,
        status: 'pending',
        expiresAt: expiresAt.toISOString(),
        createdAt: invitation.createdAt.toISOString(),
      };

      io.to(`user:${recipient._id.toString()}`).emit('invitation:received', invPayload);
      ack?.({ ok: true, invitation: invPayload });

      // Schedule automatic expiration
      const timer = setTimeout(async () => {
        invitationTimers.delete(invitation._id.toString());
        const updated = await Invitation.findOneAndUpdate(
          { _id: invitation._id, status: 'pending' },
          { $set: { status: 'expired' } },
          { new: true }
        );
        if (updated) {
          const expPayload = {
            id: updated._id.toString(),
            gameType: updated.gameType,
            senderUsername: updated.senderUsername,
            recipientUsername: updated.recipientUsername,
          };
          io.to(`user:${updated.sender.toString()}`).emit('invitation:expired', expPayload);
          io.to(`user:${updated.recipient.toString()}`).emit('invitation:expired', expPayload);
        }
      }, 60_500);

      invitationTimers.set(invitation._id.toString(), timer);
    });

    socket.on('invitation:accept', async (rawPayload: unknown, ack?: (res: unknown) => void) => {
      const parsed = z.object({ invitationId: z.string().min(1) }).safeParse(rawPayload);
      if (!parsed.success) {
        ack?.({ ok: false, error: 'Invalid invitation ID' });
        return;
      }

      const invitation = await Invitation.findById(parsed.data.invitationId);
      if (!invitation) {
        ack?.({ ok: false, error: 'Invitation not found' });
        return;
      }

      if (invitation.recipient.toString() !== userId) {
        ack?.({ ok: false, error: 'Only the intended recipient can accept this invitation' });
        return;
      }

      if (invitation.status !== 'pending') {
        ack?.({ ok: false, error: `Invitation is already ${invitation.status}` });
        return;
      }

      if (invitation.expiresAt.getTime() <= Date.now()) {
        invitation.status = 'expired';
        await invitation.save();
        ack?.({ ok: false, error: 'Invitation has expired' });
        return;
      }

      const timer = invitationTimers.get(invitation._id.toString());
      if (timer) {
        clearTimeout(timer);
        invitationTimers.delete(invitation._id.toString());
      }

      // Cancel matchmaking if either player happened to be queued
      matchmaking.leaveQueue(invitation.sender.toString());
      matchmaking.leaveQueue(invitation.recipient.toString());

      const room = await roomManager.createRoom({
        gameType: invitation.gameType as GameType,
        mode: 'private',
        players: [
          {
            userId: invitation.sender.toString(),
            username: invitation.senderUsername,
            avatar: invitation.senderAvatar,
          },
          {
            userId: invitation.recipient.toString(),
            username: invitation.recipientUsername,
            avatar: invitation.recipientAvatar,
          },
        ],
      });

      invitation.status = 'accepted';
      invitation.roomId = room.roomId;
      await invitation.save();

      const matchPayload = {
        roomId: room.roomId,
        gameType: room.gameType,
        invitationId: invitation._id.toString(),
        players: room.players.map((p) => ({
          userId: p.userId,
          username: p.username,
          avatar: p.avatar,
          slot: p.slot,
        })),
      };

      io.to(`user:${invitation.sender.toString()}`).emit('matchmaking:found', matchPayload);
      io.to(`user:${invitation.recipient.toString()}`).emit('matchmaking:found', matchPayload);
      ack?.({ ok: true, ...matchPayload });
    });

    socket.on('invitation:reject', async (rawPayload: unknown, ack?: (res: unknown) => void) => {
      const parsed = z.object({ invitationId: z.string().min(1) }).safeParse(rawPayload);
      if (!parsed.success) {
        ack?.({ ok: false, error: 'Invalid invitation ID' });
        return;
      }

      const invitation = await Invitation.findById(parsed.data.invitationId);
      if (!invitation) {
        ack?.({ ok: false, error: 'Invitation not found' });
        return;
      }

      if (invitation.recipient.toString() !== userId) {
        ack?.({ ok: false, error: 'Only the intended recipient can reject this invitation' });
        return;
      }

      if (invitation.status !== 'pending') {
        ack?.({ ok: false, error: `Invitation is already ${invitation.status}` });
        return;
      }

      const timer = invitationTimers.get(invitation._id.toString());
      if (timer) {
        clearTimeout(timer);
        invitationTimers.delete(invitation._id.toString());
      }

      invitation.status = 'rejected';
      await invitation.save();

      io.to(`user:${invitation.sender.toString()}`).emit('invitation:rejected', {
        id: invitation._id.toString(),
        recipientUsername: invitation.recipientUsername,
        gameType: invitation.gameType,
      });

      ack?.({ ok: true });
    });

    // -------------------------------------------------------------------------
    // Room Lifecycle Events
    // -------------------------------------------------------------------------
    socket.on('room:join', (rawPayload: unknown, ack?: (res: unknown) => void) => {
      const parsed = z.object({ roomId: z.string().min(1) }).safeParse(rawPayload);
      if (!parsed.success) {
        ack?.({ ok: false, error: 'Invalid room ID' });
        return;
      }

      const result = roomManager.handlePlayerJoinRoom(parsed.data.roomId, userId);
      if (!result.ok) {
        ack?.({ ok: false, error: result.error });
        socket.emit('error', { message: result.error });
        return;
      }

      socket.join(parsed.data.roomId);
      ack?.({
        ok: true,
        state: roomManager.serializeRoomForViewer(result.room, userId),
      });
    });

    socket.on('room:ready', async (rawPayload: unknown, ack?: (res: unknown) => void) => {
      const parsed = z.object({ roomId: z.string().min(1) }).safeParse(rawPayload);
      if (!parsed.success) {
        ack?.({ ok: false, error: 'Invalid room ID' });
        return;
      }

      const result = await roomManager.handlePlayerReady(parsed.data.roomId, userId);
      ack?.(result);
    });

    socket.on('room:leave', async (rawPayload: unknown) => {
      const parsed = z.object({ roomId: z.string().min(1) }).safeParse(rawPayload);
      if (!parsed.success) return;
      socket.leave(parsed.data.roomId);
      await roomManager.handleLeaveRoom(parsed.data.roomId, userId);
    });

    socket.on('game:play-again', async (rawPayload: unknown, ack?: (res: unknown) => void) => {
      const parsed = z.object({ roomId: z.string().min(1) }).safeParse(rawPayload);
      if (!parsed.success) {
        ack?.({ ok: false, error: 'Invalid room ID' });
        return;
      }
      const result = await roomManager.handlePlayAgain(parsed.data.roomId, userId);
      ack?.(result);
    });

    // -------------------------------------------------------------------------
    // Game 1: Tic-Tac-Toe
    // -------------------------------------------------------------------------
    socket.on('tictactoe:move', async (rawPayload: unknown, ack?: (res: unknown) => void) => {
      const parsed = tttMoveSchema.safeParse(rawPayload);
      if (!parsed.success) {
        ack?.({ ok: false, error: 'Invalid move payload' });
        return;
      }
      const result = await roomManager.handleTttMove(
        parsed.data.roomId,
        userId,
        parsed.data.cellIndex
      );
      if (!result.ok) {
        socket.emit('error', { message: result.error });
      }
      ack?.(result);
    });

    // -------------------------------------------------------------------------
    // Game 2: Snake
    // -------------------------------------------------------------------------
    socket.on('snake:input', (rawPayload: unknown) => {
      const parsed = snakeInputSchema.safeParse(rawPayload);
      if (!parsed.success) return;
      roomManager.handleSnakeInput(parsed.data.roomId, userId, parsed.data.direction);
    });

    // -------------------------------------------------------------------------
    // Game 3: Rock Paper Scissors
    // -------------------------------------------------------------------------
    socket.on('rps:submit', async (rawPayload: unknown, ack?: (res: unknown) => void) => {
      const parsed = rpsSubmitSchema.safeParse(rawPayload);
      if (!parsed.success) {
        ack?.({ ok: false, error: 'Invalid RPS choice' });
        return;
      }
      const result = await roomManager.handleRpsSubmit(
        parsed.data.roomId,
        userId,
        parsed.data.choice
      );
      if (!result.ok) {
        socket.emit('error', { message: result.error });
      }
      ack?.(result);
    });

    // -------------------------------------------------------------------------
    // Disconnection
    // -------------------------------------------------------------------------
    socket.on('disconnect', async () => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
          matchmaking.leaveQueue(userId);
          roomManager.handleSocketDisconnect(userId);

          await User.updateOne(
            { _id: userId },
            { $set: { status: 'offline', lastSeen: new Date() } }
          );
          io.emit('user:offline', { userId, username });
          io.emit('presence:update', { userId, status: 'offline' });
        }
      }
    });
  });

  return io;
}
