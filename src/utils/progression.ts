import { MatchHistoryItem, UserProfile } from '@/src/types/platform';

export interface PlayerProgression {
  xp: number;
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
  title: string;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  accent: 'purple' | 'sky' | 'mint' | 'coral' | 'yellow' | 'orange';
  iconType: 'trophy' | 'star' | 'target' | 'snake' | 'scissors' | 'flame' | 'crown' | 'spark';
  unlocked: boolean;
  current: number;
  target: number;
}

export interface DailyChallengeItem {
  id: string;
  title: string;
  description: string;
  accent: 'purple' | 'mint' | 'yellow';
  current: number;
  target: number;
  completed: boolean;
  rewardXp: number;
}

const LEVEL_TITLES = [
  'Rookie Spark',
  'Arena Challenger',
  'Clever Tactician',
  'Nimble Contender',
  'Star Strategist',
  'Grand Cartoonist',
  'Arena Legend',
];

export function computePlayerProgression(stats: UserProfile['statistics']): PlayerProgression {
  const xp =
    stats.wins * 100 +
    stats.draws * 45 +
    stats.losses * 20 +
    Math.floor((stats.games.snake.highScore ?? 0) / 2);

  const xpPerLevel = 250;
  const level = Math.floor(xp / xpPerLevel) + 1;
  const currentLevelXp = xp % xpPerLevel;
  const progressPercent = Math.min(100, Math.round((currentLevelXp / xpPerLevel) * 100));
  const title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];

  return {
    xp,
    level,
    currentLevelXp,
    nextLevelXp: xpPerLevel,
    progressPercent,
    title,
  };
}

export function computeAchievements(stats: UserProfile['statistics']): AchievementBadge[] {
  const snakeBest = stats.games.snake.highScore ?? 0;
  const uniqueGamesPlayed = [
    stats.games.ticTacToe.played > 0,
    stats.games.snake.played > 0,
    stats.games.rockPaperScissors.played > 0,
  ].filter(Boolean).length;

  return [
    {
      id: 'first-duel',
      title: 'First Kickoff',
      description: 'Complete your very first multiplayer match.',
      accent: 'sky',
      iconType: 'spark',
      unlocked: stats.totalGames >= 1,
      current: Math.min(stats.totalGames, 1),
      target: 1,
    },
    {
      id: 'first-win',
      title: 'Sweet Victory',
      description: 'Win 1 match in any arena.',
      accent: 'yellow',
      iconType: 'trophy',
      unlocked: stats.wins >= 1,
      current: Math.min(stats.wins, 1),
      target: 1,
    },
    {
      id: 'hat-trick',
      title: 'Triple Crown',
      description: 'Reach 3 total wins across all games.',
      accent: 'purple',
      iconType: 'crown',
      unlocked: stats.wins >= 3,
      current: Math.min(stats.wins, 3),
      target: 3,
    },
    {
      id: 'all-rounder',
      title: 'Arena Explorer',
      description: 'Play all 3 classic games at least once.',
      accent: 'orange',
      iconType: 'star',
      unlocked: uniqueGamesPlayed >= 3,
      current: uniqueGamesPlayed,
      target: 3,
    },
    {
      id: 'ttt-ace',
      title: 'Grid Master',
      description: 'Win 2 Tic-Tac-Toe duels.',
      accent: 'purple',
      iconType: 'target',
      unlocked: stats.games.ticTacToe.wins >= 2,
      current: Math.min(stats.games.ticTacToe.wins, 2),
      target: 2,
    },
    {
      id: 'snake-feast',
      title: 'Apple Collector',
      description: 'Score 30+ points in a Snake Arena run.',
      accent: 'mint',
      iconType: 'snake',
      unlocked: snakeBest >= 30,
      current: Math.min(snakeBest, 30),
      target: 30,
    },
    {
      id: 'rps-mind',
      title: 'Mind Reader',
      description: 'Win 2 Rock Paper Scissors matches.',
      accent: 'coral',
      iconType: 'scissors',
      unlocked: stats.games.rockPaperScissors.wins >= 2,
      current: Math.min(stats.games.rockPaperScissors.wins, 2),
      target: 2,
    },
    {
      id: 'veteran',
      title: 'Arena Regular',
      description: 'Complete 10 total multiplayer matches.',
      accent: 'yellow',
      iconType: 'flame',
      unlocked: stats.totalGames >= 10,
      current: Math.min(stats.totalGames, 10),
      target: 10,
    },
  ];
}

export function computeDailyChallenges(
  userId: string,
  stats: UserProfile['statistics'],
  recentMatches: MatchHistoryItem[]
): DailyChallengeItem[] {
  const todayStr = new Date().toDateString();
  const todaysMatches = recentMatches.filter(
    (m) => new Date(m.createdAt).toDateString() === todayStr
  );
  const todaysWins = todaysMatches.filter((m) =>
    m.players.some((p) => p.userId === userId && p.outcome === 'win')
  ).length;
  const snakeBest = stats.games.snake.highScore ?? 0;

  return [
    {
      id: 'daily-play',
      title: 'Warm Up Match',
      description: 'Play 1 duel today in any arena.',
      accent: 'purple',
      current: Math.min(todaysMatches.length, 1),
      target: 1,
      completed: todaysMatches.length >= 1,
      rewardXp: 50,
    },
    {
      id: 'daily-win',
      title: 'Daily Winner',
      description: 'Claim 1 victory today.',
      accent: 'yellow',
      current: Math.min(todaysWins, 1),
      target: 1,
      completed: todaysWins >= 1,
      rewardXp: 100,
    },
    {
      id: 'snake-goal',
      title: 'Snake Snack Run',
      description: 'Reach a 20+ Snake high score.',
      accent: 'mint',
      current: Math.min(snakeBest, 20),
      target: 20,
      completed: snakeBest >= 20,
      rewardXp: 80,
    },
  ];
}
