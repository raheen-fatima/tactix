export type SnakeDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface GridPoint {
  x: number;
  y: number;
}

export interface SnakePlayerArena {
  userId: string;
  snake: GridPoint[];
  direction: SnakeDirection;
  inputQueue: SnakeDirection[];
  food: GridPoint;
  score: number;
  alive: boolean;
  deathReason: 'wall' | 'self' | 'timeout' | 'disconnect' | null;
  lastInputAt: number;
}

export interface SnakeMatchState {
  gridSize: number;
  tickMs: number;
  durationMs: number;
  remainingMs: number;
  status: 'waiting' | 'playing' | 'finished';
  arenas: Record<string, SnakePlayerArena>;
  winnerUserId: string | null;
  isDraw: boolean;
}

export interface PublicSnakeArena {
  userId: string;
  snake: GridPoint[];
  direction: SnakeDirection;
  food: GridPoint;
  score: number;
  alive: boolean;
  deathReason: 'wall' | 'self' | 'timeout' | 'disconnect' | null;
}

export interface PublicSnakeState {
  gridSize: number;
  tickMs: number;
  durationMs: number;
  remainingMs: number;
  status: 'waiting' | 'playing' | 'finished';
  arenas: Record<string, PublicSnakeArena>;
  winnerUserId: string | null;
  isDraw: boolean;
}

const GRID_SIZE = 20;
const MATCH_DURATION_MS = 90_000;
const DEFAULT_TICK_MS = 135;

const OPPOSITE_DIR: Record<SnakeDirection, SnakeDirection> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

function spawnFood(snake: GridPoint[], gridSize: number): GridPoint {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
  const freeCells: GridPoint[] = [];
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      if (!occupied.has(`${x},${y}`)) {
        freeCells.push({ x, y });
      }
    }
  }
  if (freeCells.length === 0) {
    return { x: 0, y: 0 };
  }
  return freeCells[Math.floor(Math.random() * freeCells.length)];
}

function createPlayerArena(userId: string): SnakePlayerArena {
  const initialSnake: GridPoint[] = [
    { x: 7, y: 10 },
    { x: 6, y: 10 },
    { x: 5, y: 10 },
  ];
  return {
    userId,
    snake: initialSnake,
    direction: 'RIGHT',
    inputQueue: [],
    food: spawnFood(initialSnake, GRID_SIZE),
    score: 0,
    alive: true,
    deathReason: null,
    lastInputAt: 0,
  };
}

export function createInitialSnakeState(
  playerIds: [string, string],
  tickMs = DEFAULT_TICK_MS
): SnakeMatchState {
  return {
    gridSize: GRID_SIZE,
    tickMs,
    durationMs: MATCH_DURATION_MS,
    remainingMs: MATCH_DURATION_MS,
    status: 'playing',
    arenas: {
      [playerIds[0]]: createPlayerArena(playerIds[0]),
      [playerIds[1]]: createPlayerArena(playerIds[1]),
    },
    winnerUserId: null,
    isDraw: false,
  };
}

export function queueSnakeInput(
  state: SnakeMatchState,
  userId: string,
  direction: SnakeDirection
): { ok: true } | { ok: false; error: string } {
  if (state.status !== 'playing') {
    return { ok: false, error: 'Snake match is not active' };
  }

  const arena = state.arenas[userId];
  if (!arena) {
    return { ok: false, error: 'Arena not found for player' };
  }

  if (!arena.alive) {
    return { ok: false, error: 'Your snake has already crashed' };
  }

  const now = Date.now();
  if (now - arena.lastInputAt < 25) {
    return { ok: false, error: 'Input rate limit exceeded' };
  }

  const lastEffectiveDir =
    arena.inputQueue.length > 0
      ? arena.inputQueue[arena.inputQueue.length - 1]
      : arena.direction;

  if (direction === lastEffectiveDir || OPPOSITE_DIR[direction] === lastEffectiveDir) {
    return { ok: true };
  }

  if (arena.inputQueue.length >= 2) {
    return { ok: true };
  }

  arena.inputQueue.push(direction);
  arena.lastInputAt = now;
  return { ok: true };
}

export function stepSnakeMatch(
  state: SnakeMatchState,
  playerIds: [string, string]
): { finished: boolean; scoreChangedFor: string[] } {
  if (state.status !== 'playing') {
    return { finished: false, scoreChangedFor: [] };
  }

  state.remainingMs = Math.max(0, state.remainingMs - state.tickMs);
  const scoreChangedFor: string[] = [];

  for (const pid of playerIds) {
    const arena = state.arenas[pid];
    if (!arena || !arena.alive) continue;

    if (arena.inputQueue.length > 0) {
      const nextDir = arena.inputQueue.shift()!;
      if (OPPOSITE_DIR[nextDir] !== arena.direction) {
        arena.direction = nextDir;
      }
    }

    const head = arena.snake[0];
    const nextHead: GridPoint = { x: head.x, y: head.y };
    if (arena.direction === 'UP') nextHead.y -= 1;
    else if (arena.direction === 'DOWN') nextHead.y += 1;
    else if (arena.direction === 'LEFT') nextHead.x -= 1;
    else if (arena.direction === 'RIGHT') nextHead.x += 1;

    // Wall collision
    if (
      nextHead.x < 0 ||
      nextHead.x >= state.gridSize ||
      nextHead.y < 0 ||
      nextHead.y >= state.gridSize
    ) {
      arena.alive = false;
      arena.deathReason = 'wall';
      continue;
    }

    const willEat = nextHead.x === arena.food.x && nextHead.y === arena.food.y;
    const bodyToCheck = willEat ? arena.snake : arena.snake.slice(0, -1);
    const hitSelf = bodyToCheck.some((seg) => seg.x === nextHead.x && seg.y === nextHead.y);

    if (hitSelf) {
      arena.alive = false;
      arena.deathReason = 'self';
      continue;
    }

    arena.snake.unshift(nextHead);
    if (willEat) {
      arena.score += 10;
      arena.food = spawnFood(arena.snake, state.gridSize);
      scoreChangedFor.push(pid);
    } else {
      arena.snake.pop();
    }
  }

  const p1 = state.arenas[playerIds[0]];
  const p2 = state.arenas[playerIds[1]];

  const bothEnded = !p1.alive && !p2.alive;
  const timedOut = state.remainingMs <= 0;

  if (timedOut) {
    if (p1.alive) {
      p1.alive = false;
      p1.deathReason = 'timeout';
    }
    if (p2.alive) {
      p2.alive = false;
      p2.deathReason = 'timeout';
    }
  }

  if (bothEnded || timedOut) {
    state.status = 'finished';
    if (p1.score > p2.score) {
      state.winnerUserId = p1.userId;
      state.isDraw = false;
    } else if (p2.score > p1.score) {
      state.winnerUserId = p2.userId;
      state.isDraw = false;
    } else {
      state.winnerUserId = null;
      state.isDraw = true;
    }
    return { finished: true, scoreChangedFor };
  }

  return { finished: false, scoreChangedFor };
}

export function serializeSnakeState(state: SnakeMatchState): PublicSnakeState {
  const arenas: Record<string, PublicSnakeArena> = {};
  for (const [id, arena] of Object.entries(state.arenas)) {
    arenas[id] = {
      userId: arena.userId,
      snake: arena.snake,
      direction: arena.direction,
      food: arena.food,
      score: arena.score,
      alive: arena.alive,
      deathReason: arena.deathReason,
    };
  }
  return {
    gridSize: state.gridSize,
    tickMs: state.tickMs,
    durationMs: state.durationMs,
    remainingMs: state.remainingMs,
    status: state.status,
    arenas,
    winnerUserId: state.winnerUserId,
    isDraw: state.isDraw,
  };
}
