export type RpsChoice = 'rock' | 'paper' | 'scissors';

export interface RpsRoundRecord {
  round: number;
  choices: Record<string, RpsChoice>;
  winnerUserId: string | null;
  isTie: boolean;
}

export interface RpsState {
  currentRound: number;
  targetWins: number;
  maxRounds: number;
  phase: 'collecting' | 'revealing' | 'finished';
  scores: Record<string, number>;
  submissions: Record<string, RpsChoice | null>;
  history: RpsRoundRecord[];
  lastRoundResult: RpsRoundRecord | null;
  winnerUserId: string | null;
  isDraw: boolean;
}

export interface RedactedRpsState {
  currentRound: number;
  targetWins: number;
  maxRounds: number;
  phase: 'collecting' | 'revealing' | 'finished';
  scores: Record<string, number>;
  submittedBy: Record<string, boolean>;
  myChoice: RpsChoice | null;
  revealedChoices: Record<string, RpsChoice> | null;
  history: RpsRoundRecord[];
  lastRoundResult: RpsRoundRecord | null;
  winnerUserId: string | null;
  isDraw: boolean;
}

const BEATS: Record<RpsChoice, RpsChoice> = {
  rock: 'scissors',
  paper: 'rock',
  scissors: 'paper',
};

export function createInitialRpsState(playerIds: [string, string]): RpsState {
  return {
    currentRound: 1,
    targetWins: 2,
    maxRounds: 7,
    phase: 'collecting',
    scores: {
      [playerIds[0]]: 0,
      [playerIds[1]]: 0,
    },
    submissions: {
      [playerIds[0]]: null,
      [playerIds[1]]: null,
    },
    history: [],
    lastRoundResult: null,
    winnerUserId: null,
    isDraw: false,
  };
}

export function submitRpsChoice(
  state: RpsState,
  userId: string,
  choice: RpsChoice,
  playerIds: [string, string]
):
  | { ok: true; bothSubmitted: boolean; roundResult?: RpsRoundRecord; matchFinished: boolean }
  | { ok: false; error: string } {
  if (state.phase !== 'collecting') {
    return { ok: false, error: 'Round is not accepting choices right now' };
  }

  if (!(userId in state.submissions)) {
    return { ok: false, error: 'Invalid player for this match' };
  }

  if (state.submissions[userId] !== null) {
    return { ok: false, error: 'You have already locked in your choice for this round' };
  }

  state.submissions[userId] = choice;

  const [p1, p2] = playerIds;
  const c1 = state.submissions[p1];
  const c2 = state.submissions[p2];

  if (!c1 || !c2) {
    return { ok: true, bothSubmitted: false, matchFinished: false };
  }

  // Both players submitted -> resolve round authoritatively
  let roundWinner: string | null = null;
  let isTie = false;

  if (c1 === c2) {
    isTie = true;
  } else if (BEATS[c1] === c2) {
    roundWinner = p1;
    state.scores[p1] = (state.scores[p1] ?? 0) + 1;
  } else {
    roundWinner = p2;
    state.scores[p2] = (state.scores[p2] ?? 0) + 1;
  }

  const record: RpsRoundRecord = {
    round: state.currentRound,
    choices: { [p1]: c1, [p2]: c2 },
    winnerUserId: roundWinner,
    isTie,
  };

  state.history.push(record);
  state.lastRoundResult = record;

  const s1 = state.scores[p1] ?? 0;
  const s2 = state.scores[p2] ?? 0;

  if (s1 >= state.targetWins || s2 >= state.targetWins || state.currentRound >= state.maxRounds) {
    state.phase = 'finished';
    if (s1 > s2) {
      state.winnerUserId = p1;
      state.isDraw = false;
    } else if (s2 > s1) {
      state.winnerUserId = p2;
      state.isDraw = false;
    } else {
      state.winnerUserId = null;
      state.isDraw = true;
    }
    return { ok: true, bothSubmitted: true, roundResult: record, matchFinished: true };
  }

  state.phase = 'revealing';
  return { ok: true, bothSubmitted: true, roundResult: record, matchFinished: false };
}

export function advanceRpsRound(state: RpsState, playerIds: [string, string]): void {
  if (state.phase !== 'revealing') return;
  state.currentRound += 1;
  state.phase = 'collecting';
  state.submissions = {
    [playerIds[0]]: null,
    [playerIds[1]]: null,
  };
}

export function redactRpsStateForPlayer(state: RpsState, viewerUserId: string): RedactedRpsState {
  const submittedBy: Record<string, boolean> = {};
  for (const [uid, choice] of Object.entries(state.submissions)) {
    submittedBy[uid] = choice !== null;
  }

  const revealedChoices =
    state.phase === 'collecting'
      ? null
      : (state.lastRoundResult?.choices ?? null);

  return {
    currentRound: state.currentRound,
    targetWins: state.targetWins,
    maxRounds: state.maxRounds,
    phase: state.phase,
    scores: { ...state.scores },
    submittedBy,
    myChoice: state.submissions[viewerUserId] ?? null,
    revealedChoices,
    history: state.history,
    lastRoundResult: state.lastRoundResult,
    winnerUserId: state.winnerUserId,
    isDraw: state.isDraw,
  };
}
