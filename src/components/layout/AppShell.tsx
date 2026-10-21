import React from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  History,
  Home,
  LogOut,
  Mail,
  Settings,
  Swords,
  Trophy,
  User,
} from 'lucide-react';
import { TopBar } from '@/src/components/layout/TopBar';
import { CartoonBrandMark } from '@/src/components/shared/CartoonArt';
import { GAME_CATALOG } from '@/src/components/shared/GameThumbnail';
import { PlayerAvatar } from '@/src/components/shared/PlayerAvatar';
import { Button } from '@/src/components/ui/button';
import { useSocket } from '@/src/context/SocketContext';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useRealtimeStore } from '@/src/stores/useRealtimeStore';
import { cn } from '@/src/utils/cn';
import { computePlayerProgression } from '@/src/utils/progression';

export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const queueGameType = useRealtimeStore((s) => s.queueGameType);
  const incomingCount = useRealtimeStore((s) => s.incomingInvitations.length);
  const connected = useRealtimeStore((s) => s.connected);
  const { cancelMatchmaking } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const isPublicLanding = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register';
  const useSidebarLayout = Boolean(user) && !isPublicLanding;

  const navItems = [
    { to: '/dashboard', label: 'Arcade Home', icon: Home, accent: 'bg-[#9B7BFF] text-white' },
    { to: '/matchmaking', label: 'Matchmaking', icon: Swords, accent: 'bg-[#70C7F2] text-[#3D3045]' },
    {
      to: '/invitations',
      label: 'Invitations',
      badge: incomingCount > 0 ? incomingCount : undefined,
      icon: Mail,
      accent: 'bg-[#FF8E9E] text-[#3D3045]',
    },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy, accent: 'bg-[#FFD166] text-[#3D3045]' },
    { to: '/history', label: 'Match History', icon: History, accent: 'bg-[#8BDCC0] text-[#3D3045]' },
    { to: '/profile', label: 'My Profile', icon: User, accent: 'bg-[#FFAB66] text-[#3D3045]' },
    { to: '/settings', label: 'Settings', icon: Settings, accent: 'bg-[#FFF0DF] text-[#3D3045]' },
  ];

  const progression = user ? computePlayerProgression(user.statistics) : null;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FFF7ED] text-[#3D3045]">
      {useSidebarLayout ? (
        <div className="flex min-h-screen flex-1">
          {/* Desktop Cartoon Sidebar */}
          <aside className="hidden lg:flex lg:w-68 lg:shrink-0 lg:flex-col lg:justify-between border-r-2 border-[#E9DCCF] bg-white px-4 py-5 fixed top-0 h-screen">
            <div className="space-y-6">
              <Link
                to="/dashboard"
                className="flex items-center gap-3 px-2 font-display text-xl font-black tracking-tight text-[#3D3045]"
              >
                <CartoonBrandMark className="h-10 w-10" />
                <span>Tactix Arena</span>
              </Link>

              <nav className="space-y-1.5" aria-label="Main Navigation">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-extrabold transition-all whitespace-nowrap',
                          isActive
                            ? `${item.accent} border-2 border-[#3D3045] shadow-[0_3px_0_#3D3045]`
                            : 'border-2 border-transparent text-[#817487] hover:bg-[#FFF0DF] hover:text-[#3D3045]'
                        )
                      }
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <Icon className="h-4.5 w-4.5 shrink-0 stroke-[2.4]" />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {item.badge !== undefined && (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#3D3045] bg-[#FFD166] px-1.5 text-[11px] font-black text-[#3D3045]">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Sidebar Player Quick Card */}
            {user && progression && (
              <div className="space-y-3 rounded-2xl border-2 border-[#E9DCCF] bg-[#FFF7ED] p-3.5">
                <Link to="/profile" className="flex items-center gap-3 group">
                  <PlayerAvatar
                    avatar={user.avatar}
                    username={user.username}
                    status={connected ? user.status : 'offline'}
                    size="md"
                    showStatusDot
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-extrabold text-[#3D3045] group-hover:text-[#9B7BFF] transition-colors">
                      {user.username}
                    </div>
                    <div className="text-xs font-bold text-[#817487]">
                      Lv.{progression.level} · {progression.title}
                    </div>
                  </div>
                </Link>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-[#817487]">
                    <span>XP Progress</span>
                    <span className="font-mono tabular-nums text-[#3D3045]">
                      {progression.currentLevelXp}/{progression.nextLevelXp}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full border border-[#3D3045] bg-white">
                    <div
                      className="h-full rounded-full bg-[#9B7BFF] transition-all duration-300"
                      style={{ width: `${progression.progressPercent}%` }}
                    />
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </Button>
              </div>
            )}
          </aside>

          {/* Main Column */}
          <div className="flex flex-1 flex-col min-w-0 lg:ml-56 p-5">
            {/* Tablet/Mobile TopBar */}
            <div className="lg:hidden">
              <TopBar showSidebarToggle />
            </div>

            {/* Live Matchmaking Queue Banner */}
            {queueGameType && (
              <div className="border-b-2 border-[#3D3045] bg-[#FFD166] px-4 py-2.5">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5 font-extrabold text-[#3D3045]">
                    <span className="h-2.5 w-2.5 animate-ping rounded-full bg-[#9B7BFF]" />
                    <span>
                      Searching for an opponent in{' '}
                      <span className="underline decoration-2 underline-offset-2">
                        {GAME_CATALOG[queueGameType].title}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate('/matchmaking')}
                      className="h-8 px-3 text-xs"
                    >
                      Open Queue
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={cancelMatchmaking}
                      className="h-8 px-2.5 text-xs text-[#3D3045]"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-6 md:pb-8 lg:px-8 lg:py-8">
              {children}
            </main>

            <footer className="border-t-2 border-[#E9DCCF] bg-white/70 py-5 pb-24 text-center text-xs font-bold text-[#817487] md:pb-5">
              Tactix Arena · Real-Time Cartoon Multiplayer Games
            </footer>

            {/* Mobile Bottom Navigation */}
            <nav
              className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t-2 border-[#3D3045] bg-white px-2 md:hidden"
              aria-label="Mobile Navigation"
            >
              {[
                { to: '/dashboard', label: 'Home', icon: Home },
                { to: '/matchmaking', label: 'Play', icon: Swords },
                {
                  to: '/invitations',
                  label: 'Invites',
                  icon: Mail,
                  badge: incomingCount > 0 ? incomingCount : undefined,
                },
                { to: '/leaderboard', label: 'Ranks', icon: Trophy },
                { to: '/profile', label: 'Profile', icon: User },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'relative flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-extrabold transition-colors',
                        isActive
                          ? 'bg-[#9B7BFF] text-white border-2 border-[#3D3045]'
                          : 'text-[#817487] hover:text-[#3D3045]'
                      )
                    }
                  >
                    <Icon className="h-4 w-4 stroke-[2.4]" />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="absolute -top-1 right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-[#3D3045] bg-[#FFD166] px-1 text-[9px] font-black text-[#3D3045]">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      ) : (
        <>
          <TopBar />

          {queueGameType && (
            <div className="border-b-2 border-[#3D3045] bg-[#FFD166] px-4 py-2.5">
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-2 font-extrabold text-[#3D3045]">
                  <span className="h-2.5 w-2.5 animate-ping rounded-full bg-[#9B7BFF]" />
                  <span>
                    Searching for an opponent in {GAME_CATALOG[queueGameType].title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/matchmaking')}
                    className="h-8 px-3 text-xs"
                  >
                    Open Queue
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={cancelMatchmaking}
                    className="h-8 px-2.5 text-xs text-[#3D3045]"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>

          <footer className="border-t-2 border-[#E9DCCF] bg-white/70 py-6 text-center text-xs font-bold text-[#817487]">
            Tactix Arena · Classic Real-Time Multiplayer Games
          </footer>
        </>
      )}
    </div>
  );
}
