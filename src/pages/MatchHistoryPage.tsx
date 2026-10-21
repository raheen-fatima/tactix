import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/src/components/layout/AppShell';
import { CartoonEmptyState, CartoonLoadingState } from '@/src/components/shared/CartoonArt';
import { GAME_CATALOG } from '@/src/components/shared/GameThumbnail';
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { api } from '@/src/services/api';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { GameType, MatchHistoryItem } from '@/src/types/platform';
import { cn } from '@/src/utils/cn';

type HistoryFilter = 'all' | GameType;

export function MatchHistoryPage() {
  const user = useAuthStore((s) => s.user);
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [matches, setMatches] = useState<MatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.matches
      .history({
        gameType: filter === 'all' ? undefined : filter,
        limit: 50,
      })
      .then((res) => setMatches(res.matches))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-3xl font-black text-[#3D3045]">Match History</h1>
            <p className="mt-1 text-sm font-semibold text-[#817487]">
              Verified results from your completed matchmaking and private duels.
            </p>
          </div>

          <Tabs value={filter} onValueChange={(v) => setFilter(v as HistoryFilter)}>
            <TabsList>
              <TabsTrigger value="all">All Games</TabsTrigger>
              <TabsTrigger value="tic-tac-toe">Tic-Tac-Toe</TabsTrigger>
              <TabsTrigger value="snake">Snake</TabsTrigger>
              <TabsTrigger value="rock-paper-scissors">RPS</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Card className="overflow-hidden">
          {loading ? (
            <CartoonLoadingState label="Loading match history..." />
          ) : matches.length === 0 ? (
            <CartoonEmptyState
              variant="search"
              title="No Matches Found"
              description="No completed duels match this filter yet. Hop into an arena!"
              action={
                <Link to="/matchmaking">
                  <Button size="sm">Enter Matchmaking</Button>
                </Link>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b-2 border-[#E9DCCF] bg-[#FFF0DF] text-xs font-extrabold text-[#3D3045]">
                  <tr>
                    <th className="px-5 py-3.5">Game</th>
                    <th className="px-5 py-3.5">Opponent</th>
                    <th className="px-5 py-3.5">Outcome</th>
                    <th className="px-5 py-3.5">Summary</th>
                    <th className="px-5 py-3.5 text-right">Score</th>
                    <th className="px-5 py-3.5 text-right">Duration</th>
                    <th className="px-5 py-3.5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-[#E9DCCF]">
                  {matches.map((m) => {
                    const me = m.players.find((p) => p.userId === user?.id);
                    const opp = m.players.find((p) => p.userId !== user?.id);
                    const outcome = me?.outcome ?? 'draw';

                    return (
                      <tr key={m.id} className="hover:bg-[#FFF7ED] transition-colors">
                        <td className="px-5 py-3.5 font-extrabold text-[#3D3045] whitespace-nowrap">
                          {GAME_CATALOG[m.gameType].title}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-[#3D3045]">
                          {opp ? (
                            <Link
                              to={`/profile/${opp.username}`}
                              className="hover:text-[#9B7BFF] hover:underline underline-offset-4"
                            >
                              {opp.username}
                            </Link>
                          ) : (
                            'Opponent'
                          )}
                        </td>
                        <td className="px-5 py-3.5 capitalize">
                          <span
                            className={cn(
                              'inline-block rounded-full border px-2.5 py-0.5 text-xs font-extrabold',
                              outcome === 'win'
                                ? 'border-[#3D3045] bg-[#53C99A] text-white'
                                : outcome === 'loss'
                                  ? 'border-[#3D3045] bg-[#FFE6EA] text-[#3D3045]'
                                  : 'border-[#3D3045] bg-[#FFF5D6] text-[#3D3045]'
                            )}
                          >
                            {outcome}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-[#817487]">{m.result}</td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold tabular-nums text-[#3D3045] whitespace-nowrap">
                          {me?.score ?? 0} – {opp?.score ?? 0}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold tabular-nums text-[#817487] whitespace-nowrap">
                          {m.durationSeconds}s
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-xs font-bold tabular-nums text-[#817487] whitespace-nowrap">
                          {new Date(m.createdAt).toLocaleDateString()}
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
