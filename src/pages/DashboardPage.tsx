import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award,
  Bell,
  CheckCircle2,
  Flame,
  Link2,
  Settings,
  Swords,
  Trophy,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/src/components/layout/AppShell';
import {
  AchievementMedal,
  CartoonEmptyState,
  CartoonLoadingState,
} from '@/src/components/shared/CartoonArt';
import { GAME_CATALOG, GameThumbnail } from '@/src/components/shared/GameThumbnail';
import { PlayerAvatar } from '@/src/components/shared/PlayerAvatar';
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import { useSocket } from '@/src/context/SocketContext';
import { api } from '@/src/services/api';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useRealtimeStore } from '@/src/stores/useRealtimeStore';
import { GameType, LeaderboardEntry, MatchHistoryItem } from '@/src/types/platform';
import { cn } from '@/src/utils/cn';
import {
  computeAchievements,
  computeDailyChallenges,
  computePlayerProgression,
} from '@/src/utils/progression';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { joinMatchmaking, sendInvitation, acceptInvitation, rejectInvitation } = useSocket();
  const {
    connected,
    incomingInvitations,
    notifications,
    markAllNotificationsRead,
  } = useRealtimeStore();

  const [recentMatches, setRecentMatches] = useState<MatchHistoryItem[]>([]);
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [inviteModalGame, setInviteModalGame] = useState<GameType | null>(null);
  const [inviteUsername, setInviteUsername] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [creatingLinkFor, setCreatingLinkFor] = useState<GameType | null>(null);

  useEffect(() => {
    Promise.all([
      api.matches.history({ limit: 8 }).then((r) => setRecentMatches(r.matches)),
      api.users.leaderboard('overall').then((r) => setTopPlayers(r.leaderboard.slice(0, 5))),
    ])
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, []);

  if (!user) return null;

  const progression = computePlayerProgression(user.statistics);
  const achievements = computeAchievements(user.statistics);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const dailyChallenges = computeDailyChallenges(user.id, user.statistics, recentMatches);

  const handlePlayOnline = (gameType: GameType) => {
    joinMatchmaking(gameType);
    navigate(`/matchmaking?game=${gameType}`);
  };

  const handleShareLink = async (gameType: GameType) => {
    setCreatingLinkFor(gameType);
    try {
      const { invite } = await api.matches.createInviteLink(gameType);
      navigate(`/join/${invite.code}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create shareable link');
    } finally {
      setCreatingLinkFor(null);
    }
  };

  const handleSendQuickInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteModalGame || !inviteUsername.trim()) return;
    setSendingInvite(true);
    const res = await sendInvitation(inviteUsername.trim(), inviteModalGame);
    setSendingInvite(false);
    if (res.ok) {
      toast.success(`Invitation sent to ${inviteUsername.trim()}`);
      setInviteModalGame(null);
      setInviteUsername('');
    } else {
      toast.error(res.error || 'Could not send invitation');
    }
  };

  const games: GameType[] = ['tic-tac-toe', 'snake', 'rock-paper-scissors'];

  const categoryStyles: Record<GameType, string> = {
    'tic-tac-toe': 'bg-[#EDE7FF] text-[#3D3045]',
    snake: 'bg-[#E3F8F0] text-[#3D3045]',
    'rock-paper-scissors': 'bg-[#FFE6EA] text-[#3D3045]',
  };

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Illustrated Welcome Banner & Player Level / Stats */}
        <section className="rounded-3xl border-2 border-[#3D3045] bg-[#FFF0DF] p-6 shadow-[0_6px_0_#E9DCCF]">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex items-start gap-4 sm:items-center">
              <PlayerAvatar
                avatar={user.avatar}
                username={user.username}
                status={connected ? user.status : 'offline'}
                size="xl"
                showStatusDot
              />
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-display text-2xl font-black text-[#3D3045] sm:text-3xl truncate">
                    Hey, {user.username}!
                  </h1>
                  <span className="rounded-full border-2 border-[#3D3045] bg-[#FFD166] px-3 py-0.5 text-xs font-extrabold text-[#3D3045]">
                    Lv.{progression.level} · {progression.title}
                  </span>
                  {user.isGuest && (
                    <span className="rounded-full border-2 border-[#3D3045] bg-[#70C7F2] px-2.5 py-0.5 text-xs font-extrabold text-[#3D3045]">
                      Guest Pass
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold text-[#817487]">
                  {user.bio || 'Ready for live matchmaking, daily challenges, and friend duels!'}
                </p>

                {/* XP Progress Bar */}
                <div className="max-w-sm pt-1">
                  <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#817487]">
                    <span>
                      {connected ? (user.status === 'in-game' ? 'In Match' : 'Online Now') : 'Connecting...'}
                    </span>
                    <span className="font-mono tabular-nums text-[#3D3045]">
                      {progression.currentLevelXp} / {progression.nextLevelXp} XP
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full border-2 border-[#3D3045] bg-white">
                    <div
                      className="h-full rounded-full bg-[#9B7BFF] transition-all duration-300"
                      style={{ width: `${progression.progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-extrabold">
                  <Link to="/profile" className="text-[#9B7BFF] hover:underline underline-offset-4">
                    View Full Profile
                  </Link>
                  <span className="text-[#E9DCCF]" aria-hidden="true">·</span>
                  <Link
                    to="/settings"
                    className="inline-flex items-center gap-1 text-[#3D3045] hover:underline underline-offset-4"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Customize Avatar
                  </Link>
                </div>
              </div>
            </div>

            {/* 4 Cartoon Stat Tiles */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-auto">
              <div className="rounded-2xl border-2 border-[#3D3045] bg-white px-4 py-3 text-center shadow-[0_3px_0_#E9DCCF]">
                <div className="text-xs font-bold text-[#817487]">Matches</div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#3D3045]">
                  {user.statistics.totalGames}
                </div>
              </div>
              <div className="rounded-2xl border-2 border-[#3D3045] bg-white px-4 py-3 text-center shadow-[0_3px_0_#E9DCCF]">
                <div className="text-xs font-bold text-[#817487]">Wins</div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#53C99A]">
                  {user.statistics.wins}
                </div>
              </div>
              <div className="rounded-2xl border-2 border-[#3D3045] bg-white px-4 py-3 text-center shadow-[0_3px_0_#E9DCCF]">
                <div className="text-xs font-bold text-[#817487]">Losses / Ties</div>
                <div className="mt-1 font-mono text-xl font-bold tabular-nums text-[#817487]">
                  {user.statistics.losses} / {user.statistics.draws}
                </div>
              </div>
              <div className="rounded-2xl border-2 border-[#3D3045] bg-white px-4 py-3 text-center shadow-[0_3px_0_#E9DCCF]">
                <div className="text-xs font-bold text-[#817487]">Win Rate</div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#9B7BFF]">
                  {user.statistics.winRate}%
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Games: Select an Arena */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-2xl font-black text-[#3D3045]">
                Featured Arenas
              </h2>
              <p className="text-sm font-semibold text-[#817487]">
                Jump into quick matchmaking or challenge a friend directly.
              </p>
            </div>
            <Link
              to="/invitations"
              className="text-xs font-extrabold text-[#9B7BFF] hover:underline underline-offset-4"
            >
              Manage All Invitations →
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {games.map((gameType) => {
              const meta = GAME_CATALOG[gameType];
              return (
                <Card
                  key={gameType}
                  className="overflow-hidden flex flex-col cartoon-card-hover border-[#3D3045]"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden border-b-2 border-[#3D3045]">
                    <GameThumbnail gameType={gameType} />
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-5 space-y-5">
                    <div className="space-y-2">
                      <span
                        className={cn(
                          'inline-block rounded-full border-2 border-[#3D3045] px-3 py-0.5 text-xs font-extrabold',
                          categoryStyles[gameType]
                        )}
                      >
                        {meta.category}
                      </span>
                      <h3 className="font-display text-xl font-black text-[#3D3045]">
                        {meta.title}
                      </h3>
                      <p className="text-sm font-semibold leading-relaxed text-[#817487]">
                        {meta.shortDesc}
                      </p>
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button className="flex-1" onClick={() => handlePlayOnline(gameType)}>
                          <Swords className="h-4 w-4" />
                          Play Online
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setInviteModalGame(gameType)}
                        >
                          <UserPlus className="h-4 w-4" />
                          Invite
                        </Button>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        disabled={creatingLinkFor === gameType}
                        onClick={() => handleShareLink(gameType)}
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        {creatingLinkFor === gameType ? 'Creating Link...' : 'Share Invite Link'}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Daily Challenges + Achievement Highlights */}
        <section className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-black text-[#3D3045]">
              <Flame className="h-5 w-5 text-[#FFAB66]" />
              Daily Challenges
            </h2>
            <div className="space-y-3">
              {dailyChallenges.map((ch) => {
                const pct = Math.min(100, Math.round((ch.current / ch.target) * 100));
                const barColor =
                  ch.accent === 'mint'
                    ? 'bg-[#8BDCC0]'
                    : ch.accent === 'yellow'
                      ? 'bg-[#FFD166]'
                      : 'bg-[#9B7BFF]';

                return (
                  <Card key={ch.id} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-base font-extrabold text-[#3D3045]">
                            {ch.title}
                          </span>
                          {ch.completed && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#3D3045] bg-[#53C99A] px-2 py-0.5 text-[11px] font-extrabold text-white">
                              <CheckCircle2 className="h-3 w-3" />
                              Done
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-[#817487]">{ch.description}</p>
                      </div>
                      <span className="shrink-0 rounded-xl border-2 border-[#E9DCCF] bg-[#FFF7ED] px-2.5 py-1 font-mono text-xs font-bold text-[#3D3045]">
                        +{ch.rewardXp} XP
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full border border-[#3D3045] bg-[#FFF7ED]">
                        <div
                          className={cn('h-full rounded-full transition-all duration-300', barColor)}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-bold tabular-nums text-[#817487]">
                        {ch.current}/{ch.target}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 lg:col-span-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-xl font-black text-[#3D3045]">
                <Award className="h-5 w-5 text-[#9B7BFF]" />
                Achievements ({unlockedCount}/{achievements.length})
              </h2>
              <Link
                to="/profile"
                className="text-xs font-extrabold text-[#9B7BFF] hover:underline underline-offset-4"
              >
                All Badges →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {achievements.slice(0, 4).map((badge) => (
                <Card
                  key={badge.id}
                  className={cn(
                    'group flex flex-col items-center p-4 text-center transition-all',
                    badge.unlocked
                      ? 'border-[#3D3045] bg-white'
                      : 'border-[#E9DCCF] bg-[#FFF7ED]/70 opacity-75'
                  )}
                >
                  <AchievementMedal badge={badge} size="sm" />
                  <div className="mt-2 font-display text-xs font-extrabold text-[#3D3045]">
                    {badge.title}
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] font-bold text-[#817487]">
                    {badge.unlocked ? 'Unlocked' : `${badge.current}/${badge.target}`}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Lower Split: Recent Match History + Notifications & Leaderboard */}
        <section className="grid gap-8 lg:grid-cols-12">
          {/* Recent Match History */}
          <div className="space-y-4 lg:col-span-7">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-black text-[#3D3045]">Recent Matches</h2>
              <Link
                to="/history"
                className="text-xs font-extrabold text-[#9B7BFF] hover:underline underline-offset-4"
              >
                Full History →
              </Link>
            </div>

            <Card className="overflow-hidden">
              {loadingData ? (
                <CartoonLoadingState label="Loading recent matches..." />
              ) : recentMatches.length === 0 ? (
                <CartoonEmptyState
                  variant="search"
                  title="No Matches Yet"
                  description="Jump into any arena to play your first duel and record your stats."
                  action={
                    <Button size="sm" onClick={() => navigate('/matchmaking')}>
                      Find First Match
                    </Button>
                  }
                />
              ) : (
                <div className="divide-y-2 divide-[#E9DCCF]">
                  {recentMatches.slice(0, 5).map((m) => {
                    const me = m.players.find((p) => p.userId === user.id);
                    const opp = m.players.find((p) => p.userId !== user.id);
                    const outcome = me?.outcome ?? 'draw';

                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between gap-4 px-5 py-4 text-sm hover:bg-[#FFF7ED] transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="font-extrabold text-[#3D3045]">
                            {GAME_CATALOG[m.gameType].title}{' '}
                            <span className="font-semibold text-[#817487]">
                              vs {opp?.username ?? 'Opponent'}
                            </span>
                          </div>
                          <div className="mt-0.5 text-xs font-semibold text-[#817487]">
                            {m.result} · {new Date(m.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
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
                          <div className="mt-1 font-mono text-xs font-bold tabular-nums text-[#817487]">
                            {me?.score ?? 0} – {opp?.score ?? 0}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Notifications + Top Players */}
          <div className="space-y-6 lg:col-span-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-xl font-black text-[#3D3045]">
                  <Bell className="h-5 w-5 text-[#FF8E9E]" />
                  Notifications
                </h2>
                {notifications.some((n) => !n.read) && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="text-xs font-extrabold text-[#9B7BFF] hover:underline cursor-pointer"
                  >
                    Mark read
                  </button>
                )}
              </div>

              <Card className="p-4 space-y-3">
                {incomingInvitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border-2 border-[#3D3045] bg-[#FFF5D6] p-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold text-[#3D3045]">
                        {inv.senderUsername}
                      </div>
                      <div className="text-xs font-bold text-[#817487]">
                        Invited you to {GAME_CATALOG[inv.gameType].title}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="mint"
                        onClick={async () => {
                          const r = await acceptInvitation(inv.id);
                          if (!r.ok) toast.error(r.error || 'Failed to accept');
                        }}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => rejectInvitation(inv.id)}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}

                {incomingInvitations.length === 0 && notifications.length === 0 ? (
                  <p className="py-4 text-center text-xs font-bold text-[#817487]">
                    No active notifications or pending invitations right now.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {notifications.slice(0, 4).map((n) => (
                      <div
                        key={n.id}
                        className="flex items-start justify-between gap-3 border-b-2 border-[#FFF0DF] pb-2.5 last:border-0 last:pb-0 text-xs"
                      >
                        <div>
                          <div className="font-extrabold text-[#3D3045]">{n.title}</div>
                          <div className="font-semibold text-[#817487]">{n.message}</div>
                        </div>
                        <span className="shrink-0 font-mono text-[11px] font-bold text-[#817487]">
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-xl font-black text-[#3D3045]">
                  <Trophy className="h-5 w-5 text-[#FFD166]" />
                  Top Players
                </h2>
                <Link
                  to="/leaderboard"
                  className="text-xs font-extrabold text-[#9B7BFF] hover:underline underline-offset-4"
                >
                  View All →
                </Link>
              </div>

              <Card className="overflow-hidden">
                {topPlayers.length === 0 ? (
                  <p className="p-6 text-center text-xs font-bold text-[#817487]">
                    Leaderboard populates as players complete matches.
                  </p>
                ) : (
                  <div className="divide-y-2 divide-[#E9DCCF]">
                    {topPlayers.map((entry) => (
                      <Link
                        key={entry.id}
                        to={`/profile/${entry.username}`}
                        className="flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-[#FFF7ED]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={cn(
                              'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-[#3D3045] font-mono text-xs font-bold',
                              entry.rank === 1
                                ? 'bg-[#FFD166] text-[#3D3045]'
                                : entry.rank === 2
                                  ? 'bg-[#70C7F2] text-[#3D3045]'
                                  : entry.rank === 3
                                    ? 'bg-[#FFAB66] text-[#3D3045]'
                                    : 'bg-[#FFF0DF] text-[#817487]'
                            )}
                          >
                            {entry.rank}
                          </span>
                          <PlayerAvatar
                            avatar={entry.avatar}
                            username={entry.username}
                            status={entry.status}
                            size="sm"
                            showStatusDot
                          />
                          <span className="truncate font-extrabold text-[#3D3045]">
                            {entry.username}
                          </span>
                        </div>
                        <div className="font-mono text-xs font-bold tabular-nums text-[#817487] shrink-0">
                          {entry.statistics.wins}W · {entry.statistics.winRate}%
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </section>
      </div>

      {/* Quick Friend Invite Modal */}
      <Dialog open={Boolean(inviteModalGame)} onOpenChange={(o) => !o && setInviteModalGame(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Invite a Friend to {inviteModalGame ? GAME_CATALOG[inviteModalGame].title : ''}
            </DialogTitle>
            <DialogDescription>
              Enter your friend's exact username. They must be online to accept the live duel.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendQuickInvite} className="mt-4 space-y-4">
            <Input
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value)}
              placeholder="Opponent username..."
              required
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setInviteModalGame(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={sendingInvite}>
                {sendingInvite ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
