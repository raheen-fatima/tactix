import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown, History, LogOut, Menu, Settings, User, X } from 'lucide-react';
import { CartoonBrandMark } from '@/src/components/shared/CartoonArt';
import { PlayerAvatar } from '@/src/components/shared/PlayerAvatar';
import { Button } from '@/src/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useRealtimeStore } from '@/src/stores/useRealtimeStore';

export function TopBar({ showSidebarToggle = false }: { showSidebarToggle?: boolean }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const incomingCount = useRealtimeStore((s) => s.incomingInvitations.length);
  const connected = useRealtimeStore((s) => s.connected);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-xl px-3.5 py-2 text-sm font-extrabold transition-all whitespace-nowrap shrink-0 ${
      isActive
        ? 'bg-[#9B7BFF] text-white border-2 border-[#3D3045] shadow-[0_2px_0_#3D3045]'
        : 'text-[#817487] hover:text-[#3D3045] hover:bg-[#FFF0DF]'
    }`;

  return (
    <header className="sticky top-0 z-30 border-b-2 border-[#E9DCCF] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand Zone */}
        <Link
          to={user ? '/dashboard' : '/'}
          className="flex items-center gap-2.5 font-display text-xl font-black tracking-tight text-[#3D3045] whitespace-nowrap shrink-0"
        >
          <CartoonBrandMark className="h-9 w-9" />
          <span>Tactix Arena</span>
        </Link>

        {/* Public Nav Links (when not using desktop sidebar) */}
        {!showSidebarToggle && (
          <nav className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <NavLink to="/dashboard" className={navLinkClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/matchmaking" className={navLinkClass}>
                  Matchmaking
                </NavLink>
                <NavLink to="/invitations" className={navLinkClass}>
                  Invitations{incomingCount > 0 ? ` (${incomingCount})` : ''}
                </NavLink>
                <NavLink to="/leaderboard" className={navLinkClass}>
                  Leaderboard
                </NavLink>
                <NavLink to="/history" className={navLinkClass}>
                  History
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/" className={navLinkClass} end>
                  Home
                </NavLink>
                <NavLink to="/leaderboard" className={navLinkClass}>
                  Leaderboard
                </NavLink>
                <NavLink to="/login" className={navLinkClass}>
                  Sign In
                </NavLink>
              </>
            )}
          </nav>
        )}

        {/* Primary Action / Profile Dropdown */}
        <div className="flex items-center gap-2.5 shrink-0">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2.5 rounded-2xl border-2 border-[#E9DCCF] bg-[#FFF7ED] px-2.5 py-1.5 text-sm font-extrabold text-[#3D3045] transition-colors hover:border-[#3D3045] hover:bg-[#FFF0DF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B7BFF] cursor-pointer whitespace-nowrap shrink-0"
                >
                  <PlayerAvatar
                    avatar={user.avatar}
                    username={user.username}
                    status={connected ? user.status : 'offline'}
                    size="sm"
                    showStatusDot
                  />
                  <span className="max-w-[120px] truncate">
                    {user.username}
                    {user.isGuest ? ' (Guest)' : ''}
                  </span>
                  <ChevronDown className="h-4 w-4 text-[#817487]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => navigate('/profile')}>
                  <User className="h-4 w-4 text-[#9B7BFF]" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate('/history')}>
                  <History className="h-4 w-4 text-[#70C7F2]" />
                  Match History
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate('/settings')}>
                  <Settings className="h-4 w-4 text-[#FFAB66]" />
                  Settings
                </DropdownMenuItem>
                {user.isGuest && (
                  <DropdownMenuItem onSelect={() => navigate('/register')}>
                    <User className="h-4 w-4 text-[#53C99A]" />
                    Register Account
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={handleLogout}
                  className="text-[#F27676] focus:text-[#F27676]"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={() => navigate('/register')}>
              Create Account
            </Button>
          )}

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-[#E9DCCF] bg-[#FFF7ED] text-[#3D3045] hover:border-[#3D3045] md:hidden cursor-pointer"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="border-t-2 border-[#E9DCCF] bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1.5">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#3D3045] hover:bg-[#FFF0DF]"
                >
                  Dashboard
                </Link>
                <Link
                  to="/matchmaking"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#3D3045] hover:bg-[#FFF0DF]"
                >
                  Matchmaking
                </Link>
                <Link
                  to="/invitations"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#3D3045] hover:bg-[#FFF0DF]"
                >
                  Invitations{incomingCount > 0 ? ` (${incomingCount})` : ''}
                </Link>
                <Link
                  to="/leaderboard"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#3D3045] hover:bg-[#FFF0DF]"
                >
                  Leaderboard
                </Link>
                <Link
                  to="/history"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#3D3045] hover:bg-[#FFF0DF]"
                >
                  History
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#3D3045] hover:bg-[#FFF0DF]"
                >
                  Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#3D3045] hover:bg-[#FFF0DF]"
                >
                  Settings
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#3D3045] hover:bg-[#FFF0DF]"
                >
                  Home
                </Link>
                <Link
                  to="/leaderboard"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#3D3045] hover:bg-[#FFF0DF]"
                >
                  Leaderboard
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#3D3045] hover:bg-[#FFF0DF]"
                >
                  Sign In
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
