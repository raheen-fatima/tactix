import { GameType } from '../models/Game';

export interface QueuedPlayer {
  userId: string;
  username: string;
  avatar: string;
  socketId: string;
  joinedAt: number;
}

export interface MatchPair {
  gameType: GameType;
  players: [QueuedPlayer, QueuedPlayer];
}

export class MatchmakingManager {
  private queues: Record<GameType, QueuedPlayer[]> = {
    'tic-tac-toe': [],
    snake: [],
    'rock-paper-scissors': [],
  };

  private userQueueMap = new Map<string, GameType>();
  private matchingLock = false;

  public joinQueue(
    gameType: GameType,
    player: QueuedPlayer
  ): { ok: true; matched?: MatchPair } | { ok: false; error: string } {
    if (this.matchingLock) {
      return { ok: false, error: 'Matchmaker busy, please retry' };
    }

    const existingGame = this.userQueueMap.get(player.userId);
    if (existingGame) {
      return {
        ok: false,
        error: `Already waiting in the ${existingGame} matchmaking queue`,
      };
    }

    this.matchingLock = true;
    try {
      const queue = this.queues[gameType];

      // Prune any stale duplicate entry for safety
      const opponentIdx = queue.findIndex((p) => p.userId !== player.userId);

      if (opponentIdx !== -1) {
        const [opponent] = queue.splice(opponentIdx, 1);
        this.userQueueMap.delete(opponent.userId);
        return {
          ok: true,
          matched: {
            gameType,
            players: [opponent, player],
          },
        };
      }

      queue.push(player);
      this.userQueueMap.set(player.userId, gameType);
      return { ok: true };
    } finally {
      this.matchingLock = false;
    }
  }

  public leaveQueue(userId: string): GameType | null {
    const gameType = this.userQueueMap.get(userId);
    if (!gameType) return null;

    this.queues[gameType] = this.queues[gameType].filter((p) => p.userId !== userId);
    this.userQueueMap.delete(userId);
    return gameType;
  }

  public getUserQueue(userId: string): GameType | null {
    return this.userQueueMap.get(userId) ?? null;
  }

  public getQueueCounts(): Record<GameType, number> {
    return {
      'tic-tac-toe': this.queues['tic-tac-toe'].length,
      snake: this.queues.snake.length,
      'rock-paper-scissors': this.queues['rock-paper-scissors'].length,
    };
  }
}
