export type TttCell = 'X' | 'O' | null;

export interface TttState {
  board: TttCell[];
  symbols: Record<string, 'X' | 'O'>;
  currentTurnUserId: string;
  winningLine: number[] | null;
  winnerUserId: string | null;
  isDraw: boolean;
  status: 'waiting' | 'playing' | 'finished';
  moveCount: number;
}

const WIN_LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function createInitialTttState(playerIds: [string, string], swapStarter = false): TttState {
  const xPlayer = swapStarter ? playerIds[1] : playerIds[0];
  const oPlayer = swapStarter ? playerIds[0] : playerIds[1];

  return {
    board: Array<TttCell>(9).fill(null),
    symbols: {
      [xPlayer]: 'X',
      [oPlayer]: 'O',
    },
    currentTurnUserId: xPlayer,
    winningLine: null,
    winnerUserId: null,
    isDraw: false,
    status: 'playing',
    moveCount: 0,
  };
}

export function applyTttMove(
  state: TttState,
  userId: string,
  cellIndex: number,
  playerIds: [string, string]
): { ok: true; state: TttState } | { ok: false; error: string } {
  if (state.status !== 'playing') {
    return { ok: false, error: 'Match is not currently active' };
  }

  if (state.currentTurnUserId !== userId) {
    return { ok: false, error: 'It is not your turn' };
  }

  if (!Number.isInteger(cellIndex) || cellIndex < 0 || cellIndex > 8) {
    return { ok: false, error: 'Invalid board cell' };
  }

  if (state.board[cellIndex] !== null) {
    return { ok: false, error: 'Cell is already occupied' };
  }

  const symbol = state.symbols[userId];
  if (!symbol) {
    return { ok: false, error: 'Player symbol not assigned' };
  }

  const nextBoard = [...state.board];
  nextBoard[cellIndex] = symbol;
  const moveCount = state.moveCount + 1;

  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (nextBoard[a] && nextBoard[a] === nextBoard[b] && nextBoard[a] === nextBoard[c]) {
      return {
        ok: true,
        state: {
          ...state,
          board: nextBoard,
          moveCount,
          winningLine: line,
          winnerUserId: userId,
          isDraw: false,
          status: 'finished',
        },
      };
    }
  }

  if (moveCount >= 9) {
    return {
      ok: true,
      state: {
        ...state,
        board: nextBoard,
        moveCount,
        winningLine: null,
        winnerUserId: null,
        isDraw: true,
        status: 'finished',
      },
    };
  }

  const nextTurnUserId = playerIds[0] === userId ? playerIds[1] : playerIds[0];
  return {
    ok: true,
    state: {
      ...state,
      board: nextBoard,
      moveCount,
      currentTurnUserId: nextTurnUserId,
    },
  };
}
