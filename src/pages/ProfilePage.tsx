import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Award, Palette, Settings } from 'lucide-react';
import { AppShell } from '@/src/components/layout/AppShell';
import {
  AchievementMedal,
  CartoonEmptyState,
  CartoonLoadingState,
} from '@/src/components/shared/CartoonArt';
import { GAME_CATALOG } from '@/src/components/shared/GameThumbnail';
import { PlayerAvatar } from '@/src/components/shared/PlayerAvatar';
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { api } from '@/src/services/api';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { MatchHistoryItem, UserProfile } from '@/src/types/platform';
import { cn } from '@/src/utils/cn';
import { computeAchievements, computePlayerProgression } from '@/src/utils/progression';

const BANNER_THEMES = [
  { id: 'peach', label: 'Warm Peach', bg: 'bg-[#FFF0DF]', dot: 'bg-[#FFAB66]' },
  { id: 'lavender', label: 'Soft Plum', bg: 'bg-[#EDE7FF]', dot: 'bg-[#9B7BFF]' },
  { id: 'sky', label: 'Sky Pastel', bg: 'bg-[#E3F5FE]', dot: 'bg-[#70C7F2]' },
  { id: 'mint', label: 'Mint Fresh', bg: 'bg-[#E3F8F0]', dot: 'bg-[#8BDCC0]' },
  { id: 'rose', label: 'Coral Blush', bg: 'bg-[#FFE6EA]', dot: 'bg-[#FF8E9E]' },
] as const;

export function ProfilePage() {
  const { username } = useParams<{ username?: string }>();
  const currentUser = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [matches, setMatches] = useState<MatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bannerTheme, setBannerTheme] = useState<string>('peach');

  const isOwnProfile = !username || username.toLowerCase() === currentUser?.username.toLowerCase();

  useEffect(() => {
    setLoading(true);
    setError('');

    const load = async () => {
      try {
        let target: UserProfile;
        if (isOwnProfile && currentUser) {
          const meRes = await api.auth.me();
          target = meRes.user;
        } else if (username) {
          const profRes = await api.users.getProfile(username);
          target = profRes.user;
        } else {
          return;
        }
        setProfile(target);
        try {
          const saved = window.localStorage.getItem(`tactix_banner_${target.id}`);
          if (saved && BANNER_THEMES.some((b) => b.id === saved)) {
            setBannerTheme(saved);
          }
        } catch {
          // Ignore storage unavailability
        }
        const hist = await api.matches.history({ userId: target.id, limit: 10 });
        setMatches(hist.matches);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load player profile');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [username, isOwnProfile, currentUser?.id]);

  const handleSelectBanner = (id: string) => {
    setBannerTheme(id);
    if (profile) {
      try {
        window.localStorage.setItem(`tactix_banner_${profile.id}`, id);
      } catch {
        // Ignore storage unavailability
      }
    }
  };

  const activeBanner = BANNER_THEMES.find((b) => b.id === bannerTheme) ?? BANNER_THEMES[0];

  return (
    <AppShell>
      {loading ? (
        <Card className="p-10">
          <CartoonLoadingState label="Loading player profile..." />
        </Card>
      ) : error || !profile ? (
        <Card className="p-8 text-center">
          <CartoonEmptyState
            variant="lost"
            title="Player Not Found"
            description={error || 'We could not find that player profile.'}
            action={
              <Link to="/dashboard">
                <Button variant="outline">Return to Dashboard</Button>
              </Link>
            }
          />
        </Card>
      ) : (() => {
        const progression = computePlayerProgression(profile.statistics);
        const achievements = computeAchievements(profile.statistics);
        const unlockedCount = achievements.filter((a) => a.unlocked).length;

        return (
          <div className="space-y-8">
            {/* Customizable Cartoon Profile Banner */}
            <Card className={cn('overflow-hidden border-[#3D3045] shadow-[0_6px_0_#E9DCCF]', activeBanner.bg)}>
              <div className="p-6 sm:p-8">
                <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-4 sm:items-center">
                    <PlayerAvatar
                      avatar={profile.avatar}
                      username={profile.username}
                      status={profile.status}
                      size="xl"
                      showStatusDot
                    />
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="font-display text-2xl font-black text-[#3D3045] sm:text-3xl">
                          {profile.username}
                        </h1>
                        <span className="rounded-full border-2 border-[#3D3045] bg-[#FFD166] px-3 py-0.5 text-xs font-extrabold text-[#3D3045]">
                          Lv.{progression.level} · {progression.title}
                        </span>
                        <span
                          className={cn(
                            'rounded-full border-2 border-[#3D3045] px-2.5 py-0.5 text-xs font-extrabold capitalize',
                            profile.status === 'online'
                              ? 'bg-[#53C99A] text-white'
                              : profile.status === 'in-game'
                                ? 'bg-[#FFD166] text-[#3D3045]'
                                : 'bg-white text-[#817487]'
                          )}
                        >
                          {profile.status}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-[#3D3045]/80">
                        {profile.bio || 'No player bio set yet.'}
                      </p>
                      <p className="text-xs font-bold text-[#817487]">
                        Joined {new Date(profile.createdAt).toLocaleDateString()} · {progression.xp} Total XP
                      </p>
                    </div>
                  </div>

                  {isOwnProfile && (
                    <div className="flex flex-col items-start gap-3 sm:items-end">
                      <Link to="/settings">
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                          Edit Profile
                        </Button>
                      </Link>
                      <div className="flex items-center gap-1.5 rounded-2xl border-2 border-[#3D3045] bg-white px-3 py-1.5">
                        <Palette className="h-3.5 w-3.5 text-[#817487]" />
                        <span className="text-[11px] font-extrabold text-[#817487] mr-1">Banner</span>
                        {BANNER_THEMES.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => handleSelectBanner(b.id)}
                            title={b.label}
                            aria-label={`Select ${b.label} banner`}
                            className={cn(
                              'h-4.5 w-4.5 rounded-full border-2 transition-transform cursor-pointer',
                              b.dot,
                              bannerTheme === b.id
                                ? 'border-[#3D3045] scale-115'
                                : 'border-transparent opacity-70 hover:opacity-100'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Level XP Progress Bar */}
                <div className="mt-6 rounded-2xl border-2 border-[#3D3045] bg-white p-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs font-extrabold">
                    <span className="text-[#3D3045]">
                      Level {progression.level} Progress
                    </span>
                    <span className="font-mono tabular-nums text-[#9B7BFF]">
                      {progression.currentLevelXp} / {progression.nextLevelXp} XP
                    </span>
                  </div>
                  <div className="h-3.5 w-full overflow-hidden rounded-full border-2 border-[#3D3045] bg-[#FFF7ED]">
                    <div
                      className="h-full rounded-full bg-[#9B7BFF] transition-all duration-500"
                      style={{ width: `${progression.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Overall + Per-Game Gaming Statistics */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="p-5 border-[#3D3045]">
                <div className="text-xs font-extrabold text-[#817487]">Overall Record</div>
                <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#3D3045]">
                  {profile.statistics.wins}W – {profile.statistics.losses}L –{' '}
                  {profile.statistics.draws}D
                </div>
                <div className="mt-1 text-xs font-bold text-[#9B7BFF] tabular-nums">
                  {profile.statistics.winRate}% Win Rate · {profile.statistics.totalGames} Games
                </div>
              </Card>

              <Card className="p-5">
                <div className="text-xs font-extrabold text-[#817487]">Tic-Tac-Toe</div>
                <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#3D3045]">
                  {profile.statistics.games.ticTacToe.wins} Wins
                </div>
                <div className="mt-1 text-xs font-bold text-[#817487] tabular-nums">
                  {profile.statistics.games.ticTacToe.played} played ·{' '}
                  {profile.statistics.games.ticTacToe.draws} draws
                </div>
              </Card>

              <Card className="p-5">
                <div className="text-xs font-extrabold text-[#817487]">Snake Arena</div>
                <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#53C99A]">
                  {profile.statistics.games.snake.wins} Wins
                </div>
                <div className="mt-1 text-xs font-bold text-[#817487] tabular-nums">
                  Best Score: {profile.statistics.games.snake.highScore ?? 0} pts ·{' '}
                  {profile.statistics.games.snake.played} played
                </div>
              </Card>

              <Card className="p-5">
                <div className="text-xs font-extrabold text-[#817487]">Rock Paper Scissors</div>
                <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#FF8E9E]">
                  {profile.statistics.games.rockPaperScissors.wins} Wins
                </div>
                <div className="mt-1 text-xs font-bold text-[#817487] tabular-nums">
                  {profile.statistics.games.rockPaperScissors.played} played ·{' '}
                  {profile.statistics.games.rockPaperScissors.losses} losses
                </div>
              </Card>
            </div>

            {/* Colorful Achievement Badges Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-2xl font-black text-[#3D3045]">
                  <Award className="h-6 w-6 text-[#FFD166]" />
                  Achievement Badges
                </h2>
                <span className="rounded-full border-2 border-[#3D3045] bg-[#FFF5D6] px-3 py-1 font-mono text-xs font-bold text-[#3D3045]">
                  {unlockedCount} / {achievements.length} Unlocked
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {achievements.map((badge) => {
                  const pct = Math.min(100, Math.round((badge.current / badge.target) * 100));
                  return (
                    <Card
                      key={badge.id}
                      className={cn(
                        'group flex flex-col justify-between p-4 transition-all',
                        badge.unlocked
                          ? 'border-[#3D3045] bg-white cartoon-card-hover'
                          : 'border-[#E9DCCF] bg-[#FFF7ED]/70 opacity-80'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <AchievementMedal badge={badge} />
                        <div className="min-w-0">
                          <div className="font-display text-base font-black text-[#3D3045]">
                            {badge.title}
                          </div>
                          <p className="mt-0.5 text-xs font-semibold text-[#817487]">
                            {badge.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-extrabold">
                          <span className={badge.unlocked ? 'text-[#53C99A]' : 'text-[#817487]'}>
                            {badge.unlocked ? 'Unlocked!' : 'In Progress'}
                          </span>
                          <span className="font-mono tabular-nums text-[#3D3045]">
                            {badge.current}/{badge.target}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full border border-[#3D3045] bg-[#FFF7ED]">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-300',
                              badge.unlocked ? 'bg-[#53C99A]' : 'bg-[#9B7BFF]'
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Recent Matches */}
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-black text-[#3D3045]">Recent Matches</h2>
              <Card className="overflow-hidden">
                {matches.length === 0 ? (
                  <CartoonEmptyState
                    variant="search"
                    title="No Recorded Matches"
                    description="Completed duels for this player will show up right here."
                  />
                ) : (
                  <div className="divide-y-2 divide-[#E9DCCF]">
                    {matches.map((m) => {
                      const targetPlayer = m.players.find((p) => p.userId === profile.id);
                      const opp = m.players.find((p) => p.userId !== profile.id);
                      const outcome = targetPlayer?.outcome ?? 'draw';

                      return (
                        <div
                          key={m.id}
                          className="flex items-center justify-between gap-4 px-5 py-4 text-sm hover:bg-[#FFF7ED]"
                        >
                          <div>
                            <div className="font-extrabold text-[#3D3045]">
                              {GAME_CATALOG[m.gameType].title}{' '}
                              <span className="font-semibold text-[#817487]">
                                vs {opp?.username ?? 'Opponent'}
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-[#817487]">
                              {m.result} · {new Date(m.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className={cn(
                                'inline-block rounded-full border px-2.5 py-0.5 text-xs font-extrabold capitalize',
                                outcome === 'win'
                                  ? 'border-[#3D3045] bg-[#53C99A] text-white'
                                  : outcome === 'loss'
                                    ? 'border-[#3D3045] bg-[#FFE6EA] text-[#3D3045]'
                                    : 'border-[#3D3045] bg-[#FFF5D6] text-[#3D3045]'
                              )}
                            >
                              {outcome}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          </div>
        );
      })()}
    </AppShell>
  );
}
