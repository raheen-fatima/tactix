import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Trophy } from 'lucide-react';
import { AppShell } from '@/src/components/layout/AppShell';
import { CartoonEmptyState, CartoonLoadingState } from '@/src/components/shared/CartoonArt';
import { PlayerAvatar } from '@/src/components/shared/PlayerAvatar';
import { Card } from '@/src/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { api } from '@/src/services/api';
import { GameType, LeaderboardEntry } from '@/src/types/platform';
import { cn } from '@/src/utils/cn';

type LeaderboardTab = 'overall' | GameType;

export function LeaderboardPage() {
  const [tab, setTab] = useState<LeaderboardTab>('overall');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.users
      .leaderboard(tab)
      .then((res) => setEntries(res.leaderboard))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab]);

  const topThree = entries.slice(0, 3);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="flex items-center gap-2.5 font-display text-3xl font-black text-[#3D3045]">
              <Trophy className="h-7 w-7 text-[#FFD166]" />
              Leaderboard
            </h1>
            <p className="mt-1 text-sm font-semibold text-[#817487]">
              Global player rankings across overall and individual game ladders.
            </p>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as LeaderboardTab)}>
            <TabsList>
              <TabsTrigger value="overall">Overall</TabsTrigger>
              <TabsTrigger value="tic-tac-toe">Tic-Tac-Toe</TabsTrigger>
              <TabsTrigger value="snake">Snake</TabsTrigger>
              <TabsTrigger value="rock-paper-scissors">RPS</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Top 3 Cartoon Podium */}
        {!loading && topThree.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            {topThree.map((entry) => {
              const podiumStyle =
                entry.rank === 1
                  ? 'bg-[#FFF5D6] border-[#3D3045]'
                  : entry.rank === 2
                    ? 'bg-[#E3F5FE] border-[#3D3045]'
                    : 'bg-[#FFEDE0] border-[#3D3045]';

              const rankBadge =
                entry.rank === 1
                  ? 'bg-[#FFD166]'
                  : entry.rank === 2
                    ? 'bg-[#70C7F2]'
                    : 'bg-[#FFAB66]';

              return (
                <Link key={entry.id} to={`/profile/${entry.username}`}>
                  <Card
                    className={cn(
                      'p-5 flex items-center justify-between gap-4 cartoon-card-hover',
                      podiumStyle
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-2 border-[#3D3045] font-display text-base font-black text-[#3D3045]',
                          rankBadge
                        )}
                      >
                        {entry.rank === 1 ? <Crown className="h-5 w-5" /> : `#${entry.rank}`}
                      </div>
                      <PlayerAvatar
                        avatar={entry.avatar}
                        username={entry.username}
                        status={entry.status}
                        size="md"
                        showStatusDot
                      />
                      <div className="min-w-0">
                        <div className="truncate font-display text-base font-black text-[#3D3045]">
                          {entry.username}
                        </div>
                        <div className="text-xs font-bold text-[#817487]">
                          {entry.statistics.wins} Wins · {entry.statistics.winRate}%
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        <Card className="overflow-hidden">
          {loading ? (
            <CartoonLoadingState label="Loading leaderboard..." />
          ) : entries.length === 0 ? (
            <CartoonEmptyState
              variant="trophy"
              title="No Ranked Players Yet"
              description="Register and complete a match in any arena to claim the #1 spot!"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b-2 border-[#E9DCCF] bg-[#FFF0DF] text-xs font-extrabold text-[#3D3045]">
                  <tr>
                    <th className="px-5 py-3.5">Rank</th>
                    <th className="px-5 py-3.5">Player</th>
                    <th className="px-5 py-3.5 text-right">Played</th>
                    <th className="px-5 py-3.5 text-right">Wins</th>
                    <th className="px-5 py-3.5 text-right">Losses</th>
                    <th className="px-5 py-3.5 text-right">Draws</th>
                    {tab === 'snake' && <th className="px-5 py-3.5 text-right">High Score</th>}
                    <th className="px-5 py-3.5 text-right">Win Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-[#E9DCCF]">
                  {entries.map((row) => {
                    const stats =
                      tab === 'overall'
                        ? {
                            played: row.statistics.totalGames,
                            wins: row.statistics.wins,
                            losses: row.statistics.losses,
                            draws: row.statistics.draws,
                            winRate: row.statistics.winRate,
                          }
                        : (() => {
                            const bucket =
                              tab === 'tic-tac-toe'
                                ? row.statistics.games.ticTacToe
                                : tab === 'snake'
                                  ? row.statistics.games.snake
                                  : row.statistics.games.rockPaperScissors;
                            const rate =
                              bucket.played > 0
                                ? Math.round((bucket.wins / bucket.played) * 1000) / 10
                                : 0;
                            return { ...bucket, winRate: rate };
                          })();

                    return (
                      <tr key={row.id} className="hover:bg-[#FFF7ED] transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs font-bold tabular-nums text-[#817487]">
                          #{row.rank}
                        </td>
                        <td className="px-5 py-3.5">
                          <Link
                            to={`/profile/${row.username}`}
                            className="flex items-center gap-3 hover:underline underline-offset-4"
                          >
                            <PlayerAvatar
                              avatar={row.avatar}
                              username={row.username}
                              status={row.status}
                              size="sm"
                              showStatusDot
                            />
                            <span className="font-extrabold text-[#3D3045]">{row.username}</span>
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold tabular-nums text-[#817487]">
                          {stats.played}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold tabular-nums text-[#53C99A]">
                          {stats.wins}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold tabular-nums text-[#817487]">
                          {stats.losses}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold tabular-nums text-[#817487]">
                          {stats.draws}
                        </td>
                        {tab === 'snake' && (
                          <td className="px-5 py-3.5 text-right font-mono font-bold tabular-nums text-[#9B7BFF]">
                            {row.statistics.games.snake.highScore ?? 0}
                          </td>
                        )}
                        <td className="px-5 py-3.5 text-right font-mono font-bold tabular-nums text-[#3D3045]">
                          {stats.winRate}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
