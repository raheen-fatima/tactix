import crypto from 'crypto';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { Game, GameType } from '../models/Game';
import { MatchHistory } from '../models/MatchHistory';
import { User } from '../models/User';
import {
  createInitialRpsState,
  advanceRpsRound,
  redactRpsStateForPlayer,
  RpsChoice,
  RpsState,
  submitRpsChoice,
} from './rock-paper-scissors/engine';
import {
  createInitialSnakeState,
  queueSnakeInput,
  serializeSnakeState,
  SnakeDirection,
  SnakeMatchState,
  stepSnakeMatch,
} from './snake/engine';
import { applyTttMove, createInitialTttState, TttState } from './tic-tac-toe/engine';

export interface RoomPlayer {
  userId: string;
  username: string;
  avatar: string;
  slot: 0 | 1;
  ready: boolean;
  connected: boolean;
  playAgainRequested: boolean;
}

export interface ActiveRoom {
  roomId: string;
  gameType: GameType;
  mode: 'matchmaking' | 'private';
  players: [RoomPlayer, RoomPlayer];
  status: 'waiting' | 'active' | 'finished';
  createdAt: number;
  startedAt: number | null;
  finishedAt: number | null;
  matchRoundNumber: number;
  winnerUserId: string | null;
  isDraw: boolean;
  resultReason: string | null;
  tttState?: TttState;
  snakeState?: SnakeMatchState;
  snakeInterval?: NodeJS.Timeout;
  rpsState?: RpsState;
  rpsAdvanceTimeout?: NodeJS.Timeout;
  disconnectTimers: Record<string, NodeJS.Timeout>;
  finalized: boolean;
}

export class RoomManager {
  private rooms = new Map<string, ActiveRoom>();
  private userActiveRoom = new Map<string, string>();
  private io: Server | null = null;

  public attachIO(io: Server): void {
    this.io = io;
  }

  public getRoom(roomId: string): ActiveRoom | undefined {
    return this.rooms.get(roomId);
  }

  public getUserActiveRoomId(userId: string): string | undefined {
    return this.userActiveRoom.get(userId);
  }

  public async createRoom(params: {
    gameType: GameType;
    mode: 'matchmaking' | 'private';
    players: [
      { userId: string; username: string; avatar: string },
      { userId: string; username: string; avatar: string }
    ];
  }): Promise<ActiveRoom> {
    const roomId = `room_${crypto.randomBytes(6).toString('hex')}`;
    const p0: RoomPlayer = {
      ...params.players[0],
      slot: 0,
      ready: false,
      connected: false,
      playAgainRequested: false,
    };
    const p1: RoomPlayer = {
      ...params.players[1],
      slot: 1,
      ready: false,
      connected: false,
      playAgainRequested: false,
    };

    const room: ActiveRoom = {
      roomId,
      gameType: params.gameType,
      mode: params.mode,
      players: [p0, p1],
      status: 'waiting',
      createdAt: Date.now(),
      startedAt: null,
      finishedAt: null,
      matchRoundNumber: 1,
      winnerUserId: null,
      isDraw: false,
      resultReason: null,
      disconnectTimers: {},
      finalized: false,
    };

    this.rooms.set(roomId, room);
    this.userActiveRoom.set(p0.userId, roomId);
    this.userActiveRoom.set(p1.userId, roomId);

    await Game.create({
      roomId,
      gameType: params.gameType,
      mode: params.mode,
      players: [
        {
          userId: new mongoose.Types.ObjectId(p0.userId),
          username: p0.username,
          avatar: p0.avatar,
          slot: 0,
        },
        {
          userId: new mongoose.Types.ObjectId(p1.userId),
          username: p1.username,
          avatar: p1.avatar,
          slot: 1,
        },
      ],
      status: 'waiting',
      gameState: {},
    });

    return room;
  }

  public serializeRoomForViewer(room: ActiveRoom, viewerUserId: string) {
    return {
      roomId: room.roomId,
      gameType: room.gameType,
      mode: room.mode,
      status: room.status,
      players: room.players.map((p) => ({
        userId: p.userId,
        username: p.username,
        avatar: p.avatar,
        slot: p.slot,
        ready: p.ready,
        connected: p.connected,
        playAgainRequested: p.playAgainRequested,
      })),
      winnerUserId: room.winnerUserId,
      isDraw: room.isDraw,
      resultReason: room.resultReason,
      startedAt: room.startedAt,
      finishedAt: room.finishedAt,
      tttState: room.tttState ?? null,
      snakeState: room.snakeState ? serializeSnakeState(room.snakeState) : null,
      rpsState: room.rpsState ? redactRpsStateForPlayer(room.rpsState, viewerUserId) : null,
    };
  }

  public emitRoomStateToMembers(room: ActiveRoom): void {
    if (!this.io) return;
    for (const player of room.players) {
      this.io.to(`user:${player.userId}`).emit('room:state', this.serializeRoomForViewer(room, player.userId));
    }
  }

  public handlePlayerJoinRoom(roomId: string, userId: string): { ok: true; room: ActiveRoom } | { ok: false; error: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { ok: false, error: 'Room not found or has already expired' };
    }

    const player = room.players.find((p) => p.userId === userId);
    if (!player) {
      return { ok: false, error: 'You are not authorized to join this room' };
    }

    player.connected = true;
    if (room.disconnectTimers[userId]) {
      clearTimeout(room.disconnectTimers[userId]);
      delete room.disconnectTimers[userId];
    }

    this.emitRoomStateToMembers(room);
    return { ok: true, room };
  }

  public async handlePlayerReady(roomId: string, userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
    const room = this.rooms.get(roomId);
    if (!room) return { ok: false, error: 'Room not found' };

    const player = room.players.find((p) => p.userId === userId);
    if (!player) return { ok: false, error: 'Unauthorized' };

    if (room.status !== 'waiting') {
      return { ok: true };
    }

    player.ready = true;
    this.emitRoomStateToMembers(room);

    if (room.players[0].ready && room.players[1].ready) {
      await this.startMatch(room);
    }

    return { ok: true };
  }

  private async startMatch(room: ActiveRoom): Promise<void> {
    if (room.status === 'active') return;
    room.status = 'active';
    room.startedAt = Date.now();
    room.finishedAt = null;
    room.winnerUserId = null;
    room.isDraw = false;
    room.resultReason = null;
    room.finalized = false;

    const pIds: [string, string] = [room.players[0].userId, room.players[1].userId];

    await User.updateMany(
      { _id: { $in: pIds } },
      { $set: { status: 'in-game' } }
    );
    this.io?.emit('presence:update', { userId: pIds[0], status: 'in-game' });
    this.io?.emit('presence:update', { userId: pIds[1], status: 'in-game' });

    if (room.gameType === 'tic-tac-toe') {
      room.tttState = createInitialTttState(pIds, room.matchRoundNumber % 2 === 0);
      this.emitRoomStateToMembers(room);
      this.io?.to(room.roomId).emit('tictactoe:update', room.tttState);
    } else if (room.gameType === 'snake') {
      room.snakeState = createInitialSnakeState(pIds);
      this.emitRoomStateToMembers(room);
      this.startSnakeLoop(room);
    } else if (room.gameType === 'rock-paper-scissors') {
      room.rpsState = createInitialRpsState(pIds);
      this.emitRoomStateToMembers(room);
    }

    await Game.updateOne(
      { roomId: room.roomId },
      { $set: { status: 'active', startedAt: new Date() } }
    );
  }

  private startSnakeLoop(room: ActiveRoom): void {
    if (room.snakeInterval) {
      clearInterval(room.snakeInterval);
    }
    const tickMs = room.snakeState?.tickMs ?? 135;
    const pIds: [string, string] = [room.players[0].userId, room.players[1].userId];
    const deadEmitted = new Set<string>();

    room.snakeInterval = setInterval(async () => {
      if (!room.snakeState || room.status !== 'active') {
        if (room.snakeInterval) clearInterval(room.snakeInterval);
        return;
      }

      const { finished, scoreChangedFor } = stepSnakeMatch(room.snakeState, pIds);
      const serialized = serializeSnakeState(room.snakeState);

      this.io?.to(room.roomId).emit('snake:state', serialized);

      if (scoreChangedFor.length > 0) {
        const scores: Record<string, number> = {};
        for (const pid of pIds) {
          scores[pid] = room.snakeState.arenas[pid]?.score ?? 0;
        }
        this.io?.to(room.roomId).emit('snake:score', { scores });
      }

      for (const pid of pIds) {
        const arena = room.snakeState.arenas[pid];
        if (arena && !arena.alive && !deadEmitted.has(pid)) {
          deadEmitted.add(pid);
          this.io?.to(room.roomId).emit('snake:game-over', {
            userId: pid,
            deathReason: arena.deathReason,
            score: arena.score,
          });
        }
      }

      if (finished) {
        if (room.snakeInterval) {
          clearInterval(room.snakeInterval);
          room.snakeInterval = undefined;
        }
        const s0 = room.snakeState.arenas[pIds[0]].score;
        const s1 = room.snakeState.arenas[pIds[1]].score;
        const resultText = room.snakeState.isDraw
          ? `Draw (${s0} - ${s1})`
          : `${
              room.players.find((p) => p.userId === room.snakeState!.winnerUserId)?.username
            } won (${Math.max(s0, s1)} vs ${Math.min(s0, s1)})`;

        await this.finalizeMatch(room, {
          winnerUserId: room.snakeState.winnerUserId,
          isDraw: room.snakeState.isDraw,
          scores: { [pIds[0]]: s0, [pIds[1]]: s1 },
          resultReason: resultText,
        });

        this.io?.to(room.roomId).emit('snake:result', {
          winnerUserId: room.snakeState.winnerUserId,
          isDraw: room.snakeState.isDraw,
          scores: { [pIds[0]]: s0, [pIds[1]]: s1 },
          result: resultText,
        });
      }
    }, tickMs);
  }

  public async handleTttMove(
    roomId: string,
    userId: string,
    cellIndex: number
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    const room = this.rooms.get(roomId);
    if (!room || room.gameType !== 'tic-tac-toe' || !room.tttState) {
      return { ok: false, error: 'Active Tic-Tac-Toe room not found' };
    }

    const pIds: [string, string] = [room.players[0].userId, room.players[1].userId];
    if (!pIds.includes(userId)) {
      return { ok: false, error: 'Unauthorized player' };
    }

    const res = applyTttMove(room.tttState, userId, cellIndex, pIds);
    if (!res.ok) return res;

    room.tttState = res.state;
    this.io?.to(room.roomId).emit('tictactoe:update', room.tttState);

    if (room.tttState.status === 'finished') {
      const winnerId = room.tttState.winnerUserId;
      const isDraw = room.tttState.isDraw;
      const scores = {
        [pIds[0]]: winnerId === pIds[0] ? 1 : 0,
        [pIds[1]]: winnerId === pIds[1] ? 1 : 0,
      };
      const winnerName = room.players.find((p) => p.userId === winnerId)?.username;
      const resultText = isDraw ? 'Board Draw (9/9 cells)' : `${winnerName} completed 3-in-a-row`;

      await this.finalizeMatch(room, {
        winnerUserId: winnerId,
        isDraw,
        scores,
        resultReason: resultText,
      });

      this.io?.to(room.roomId).emit('tictactoe:result', {
        winnerUserId: winnerId,
        isDraw,
        winningLine: room.tttState.winningLine,
        result: resultText,
      });
    }

    return { ok: true };
  }

  public handleSnakeInput(
    roomId: string,
    userId: string,
    direction: SnakeDirection
  ): { ok: true } | { ok: false; error: string } {
    const room = this.rooms.get(roomId);
    if (!room || room.gameType !== 'snake' || !room.snakeState) {
      return { ok: false, error: 'Active Snake room not found' };
    }
    return queueSnakeInput(room.snakeState, userId, direction);
  }

  public async handleRpsSubmit(
    roomId: string,
    userId: string,
    choice: RpsChoice
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    const room = this.rooms.get(roomId);
    if (!room || room.gameType !== 'rock-paper-scissors' || !room.rpsState) {
      return { ok: false, error: 'Active Rock Paper Scissors room not found' };
    }

    const pIds: [string, string] = [room.players[0].userId, room.players[1].userId];
    const result = submitRpsChoice(room.rpsState, userId, choice, pIds);
    if (!result.ok) return result;

    // Broadcast redacted state so opponent's choice remains hidden until both submit
    this.emitRoomStateToMembers(room);

    if (result.bothSubmitted && result.roundResult) {
      this.io?.to(room.roomId).emit('rps:reveal', {
        round: result.roundResult.round,
        choices: result.roundResult.choices,
      });
      this.io?.to(room.roomId).emit('rps:round-result', {
        ...result.roundResult,
        scores: room.rpsState.scores,
      });

      if (result.matchFinished) {
        const s0 = room.rpsState.scores[pIds[0]] ?? 0;
        const s1 = room.rpsState.scores[pIds[1]] ?? 0;
        const winnerName = room.players.find((p) => p.userId === room.rpsState!.winnerUserId)?.username;
        const resultText = room.rpsState.isDraw
          ? `Match Draw (${s0} - ${s1})`
          : `${winnerName} won ${Math.max(s0, s1)}–${Math.min(s0, s1)}`;

        await this.finalizeMatch(room, {
          winnerUserId: room.rpsState.winnerUserId,
          isDraw: room.rpsState.isDraw,
          scores: { ...room.rpsState.scores },
          resultReason: resultText,
        });

        this.io?.to(room.roomId).emit('rps:match-result', {
          winnerUserId: room.rpsState.winnerUserId,
          isDraw: room.rpsState.isDraw,
          scores: room.rpsState.scores,
          result: resultText,
        });
      } else {
        room.rpsAdvanceTimeout = setTimeout(() => {
          if (!room.rpsState || room.status !== 'active') return;
          advanceRpsRound(room.rpsState, pIds);
          this.emitRoomStateToMembers(room);
        }, 2300);
      }
    }

    return { ok: true };
  }

  public async handlePlayAgain(roomId: string, userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
    const room = this.rooms.get(roomId);
    if (!room) return { ok: false, error: 'Room not found' };

    const player = room.players.find((p) => p.userId === userId);
    if (!player) return { ok: false, error: 'Unauthorized' };
    if (room.status !== 'finished') return { ok: false, error: 'Match is not finished yet' };

    player.playAgainRequested = true;
    this.emitRoomStateToMembers(room);

    if (room.players[0].playAgainRequested && room.players[1].playAgainRequested) {
      // Create a fresh match ID suffix in DB while keeping players in the same live room
      room.matchRoundNumber += 1;
      room.players[0].playAgainRequested = false;
      room.players[1].playAgainRequested = false;
      room.players[0].ready = true;
      room.players[1].ready = true;
      await this.startMatch(room);
    }

    return { ok: true };
  }

  public async handleLeaveRoom(roomId: string, userId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find((p) => p.userId === userId);
    if (!player) return;

    player.connected = false;
    if (room.disconnectTimers[userId]) {
      clearTimeout(room.disconnectTimers[userId]);
      delete room.disconnectTimers[userId];
    }

    if (room.status === 'active' && !room.finalized) {
      const opponent = room.players.find((p) => p.userId !== userId)!;
      await this.forfeitMatch(room, opponent.userId, `${player.username} left the match`);
    } else if (room.status === 'waiting') {
      room.status = 'finished';
      room.resultReason = `${player.username} cancelled the match`;
      this.io?.to(room.roomId).emit('room:opponent-disconnected', {
        userId,
        username: player.username,
        forfeited: true,
        reason: room.resultReason,
      });
      this.cleanupUserRoomMappings(room);
    } else {
      this.emitRoomStateToMembers(room);
    }
  }

  public handleSocketDisconnect(userId: string): void {
    const roomId = this.userActiveRoom.get(userId);
    if (!roomId) return;
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find((p) => p.userId === userId);
    if (!player) return;

    player.connected = false;
    this.emitRoomStateToMembers(room);

    if (room.status === 'active' && !room.finalized) {
      this.io?.to(room.roomId).emit('room:opponent-disconnected', {
        userId,
        username: player.username,
        forfeited: false,
        graceSeconds: 12,
      });

      if (room.disconnectTimers[userId]) {
        clearTimeout(room.disconnectTimers[userId]);
      }

      room.disconnectTimers[userId] = setTimeout(async () => {
        const currentRoom = this.rooms.get(roomId);
        if (!currentRoom || currentRoom.finalized || currentRoom.status !== 'active') return;
        const p = currentRoom.players.find((x) => x.userId === userId);
        if (p && !p.connected) {
          const opponent = currentRoom.players.find((x) => x.userId !== userId)!;
          await this.forfeitMatch(
            currentRoom,
            opponent.userId,
            `${p.username} disconnected`
          );
        }
      }, 12_000);
    }
  }

  private async forfeitMatch(room: ActiveRoom, winnerUserId: string, reason: string): Promise<void> {
    if (room.snakeInterval) {
      clearInterval(room.snakeInterval);
      room.snakeInterval = undefined;
    }
    if (room.rpsAdvanceTimeout) {
      clearTimeout(room.rpsAdvanceTimeout);
      room.rpsAdvanceTimeout = undefined;
    }

    const p0 = room.players[0];
    const p1 = room.players[1];
    const scores: Record<string, number> = {
      [p0.userId]:
        room.gameType === 'snake'
          ? (room.snakeState?.arenas[p0.userId]?.score ?? 0)
          : room.gameType === 'rock-paper-scissors'
            ? (room.rpsState?.scores[p0.userId] ?? 0)
            : winnerUserId === p0.userId
              ? 1
              : 0,
      [p1.userId]:
        room.gameType === 'snake'
          ? (room.snakeState?.arenas[p1.userId]?.score ?? 0)
          : room.gameType === 'rock-paper-scissors'
            ? (room.rpsState?.scores[p1.userId] ?? 0)
            : winnerUserId === p1.userId
              ? 1
              : 0,
    };

    await this.finalizeMatch(room, {
      winnerUserId,
      isDraw: false,
      scores,
      resultReason: `${reason} (Forfeit win)`,
      abandoned: true,
    });

    this.io?.to(room.roomId).emit('room:opponent-disconnected', {
      forfeited: true,
      winnerUserId,
      reason: `${reason} (Forfeit win)`,
    });
  }

  private async finalizeMatch(
    room: ActiveRoom,
    outcome: {
      winnerUserId: string | null;
      isDraw: boolean;
      scores: Record<string, number>;
      resultReason: string;
      abandoned?: boolean;
    }
  ): Promise<void> {
    if (room.finalized) return;
    room.finalized = true;
    room.status = 'finished';
    room.finishedAt = Date.now();
    room.winnerUserId = outcome.winnerUserId;
    room.isDraw = outcome.isDraw;
    room.resultReason = outcome.resultReason;

    if (room.snakeInterval) {
      clearInterval(room.snakeInterval);
      room.snakeInterval = undefined;
    }
    if (room.rpsAdvanceTimeout) {
      clearTimeout(room.rpsAdvanceTimeout);
      room.rpsAdvanceTimeout = undefined;
    }

    const durationSeconds = room.startedAt
      ? Math.max(1, Math.round((room.finishedAt - room.startedAt) / 1000))
      : 0;

    const winnerPlayer = room.players.find((p) => p.userId === outcome.winnerUserId);
    const historyRoomKey =
      room.matchRoundNumber === 1 ? room.roomId : `${room.roomId}_r${room.matchRoundNumber}`;

    try {
      await Game.updateOne(
        { roomId: room.roomId },
        {
          $set: {
            status: outcome.abandoned ? 'abandoned' : 'finished',
            winner: outcome.winnerUserId ? new mongoose.Types.ObjectId(outcome.winnerUserId) : null,
            winnerUsername: winnerPlayer?.username ?? null,
            isDraw: outcome.isDraw,
            finishedAt: new Date(room.finishedAt),
            gameState: {
              scores: outcome.scores,
              result: outcome.resultReason,
            },
          },
        }
      );

      await MatchHistory.create({
        roomId: historyRoomKey,
        gameType: room.gameType,
        players: room.players.map((p) => ({
          userId: new mongoose.Types.ObjectId(p.userId),
          username: p.username,
          avatar: p.avatar,
          score: outcome.scores[p.userId] ?? 0,
          outcome: outcome.isDraw
            ? 'draw'
            : outcome.winnerUserId === p.userId
              ? 'win'
              : 'loss',
        })),
        winner: outcome.winnerUserId ? new mongoose.Types.ObjectId(outcome.winnerUserId) : null,
        winnerUsername: winnerPlayer?.username ?? null,
        isDraw: outcome.isDraw,
        scores: outcome.scores,
        result: outcome.resultReason,
        durationSeconds,
      });

      const gameStatKey =
        room.gameType === 'tic-tac-toe'
          ? 'ticTacToe'
          : room.gameType === 'snake'
            ? 'snake'
            : 'rockPaperScissors';

      for (const p of room.players) {
        const isWin = !outcome.isDraw && outcome.winnerUserId === p.userId;
        const isLoss = !outcome.isDraw && outcome.winnerUserId !== p.userId;
        const playerScore = outcome.scores[p.userId] ?? 0;

        const incUpdate: Record<string, number> = {
          'statistics.totalGames': 1,
          [`statistics.games.${gameStatKey}.played`]: 1,
        };
        if (isWin) {
          incUpdate['statistics.wins'] = 1;
          incUpdate[`statistics.games.${gameStatKey}.wins`] = 1;
        } else if (isLoss) {
          incUpdate['statistics.losses'] = 1;
          incUpdate[`statistics.games.${gameStatKey}.losses`] = 1;
        } else {
          incUpdate['statistics.draws'] = 1;
          incUpdate[`statistics.games.${gameStatKey}.draws`] = 1;
        }

        const updateOps: Record<string, unknown> = {
          $inc: incUpdate,
          $set: { status: p.connected ? 'online' : 'offline' },
        };

        if (room.gameType === 'snake') {
          updateOps.$max = {
            'statistics.games.snake.highScore': playerScore,
          };
        }

        await User.updateOne({ _id: p.userId }, updateOps);
        this.io?.emit('presence:update', {
          userId: p.userId,
          status: p.connected ? 'online' : 'offline',
        });
      }
    } catch (err) {
      console.error('[RoomManager] Failed to persist match result:', err);
    }

    this.emitRoomStateToMembers(room);
    this.io?.to(room.roomId).emit('game:finished', {
      roomId: room.roomId,
      gameType: room.gameType,
      winnerUserId: outcome.winnerUserId,
      winnerUsername: winnerPlayer?.username ?? null,
      isDraw: outcome.isDraw,
      scores: outcome.scores,
      result: outcome.resultReason,
      durationSeconds,
    });
  }

  private cleanupUserRoomMappings(room: ActiveRoom): void {
    for (const p of room.players) {
      if (this.userActiveRoom.get(p.userId) === room.roomId) {
        this.userActiveRoom.delete(p.userId);
      }
    }
  }
}
