import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ArrowRight, Link2, ShieldCheck, Sparkles, Users, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/src/components/layout/AppShell';
import {
  GAME_CATALOG,
  GameThumbnail,
  HeroArenaIllustration,
} from '@/src/components/shared/GameThumbnail';
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { api } from '@/src/services/api';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { GameType } from '@/src/types/platform';

export function LandingPage() {
  const user = useAuthStore((s) => s.user);
  const loginAsGuest = useAuthStore((s) => s.loginAsGuest);
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [guestLoading, setGuestLoading] = useState(false);
  const [creatingLinkFor, setCreatingLinkFor] = useState<GameType | null>(null);
  const [overview, setOverview] = useState({
    totalPlayers: 0,
    onlinePlayers: 0,
    totalMatches: 0,
  });

  useEffect(() => {
    api.matches
      .overview()
      .then((data) => setOverview(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.hero-stagger', {
        y: 12,
        opacity: 0,
        duration: 0.35,
        stagger: 0.06,
        ease: 'power3.out',
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const handlePlayAsGuest = async () => {
    setGuestLoading(true);
    try {
      await loginAsGuest();
      toast.success('Entered Demo Guest Session');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to start guest session');
    } finally {
      setGuestLoading(false);
    }
  };

  const handleShareGameLink = async (gameType: GameType) => {
    setCreatingLinkFor(gameType);
    try {
      if (!user) {
        await loginAsGuest();
      }
      try {
        const { invite } = await api.matches.createInviteLink(gameType);
        navigate(`/join/${invite.code}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.toLowerCase().includes('authentication') || msg.toLowerCase().includes('session')) {
          await loginAsGuest();
          const { invite } = await api.matches.createInviteLink(gameType);
          navigate(`/join/${invite.code}`);
        } else {
          throw err;
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create invite link');
    } finally {
      setCreatingLinkFor(null);
    }
  };

  const games: GameType[] = ['tic-tac-toe', 'snake', 'rock-paper-scissors'];

  const categoryColor: Record<GameType, string> = {
    'tic-tac-toe': 'bg-[#EDE7FF] text-[#3D3045] border-[#3D3045]',
    snake: 'bg-[#E3F8F0] text-[#3D3045] border-[#3D3045]',
    'rock-paper-scissors': 'bg-[#FFE6EA] text-[#3D3045] border-[#3D3045]',
  };

  return (
    <AppShell>
      <div ref={heroRef} className="space-y-14">
        {/* Hero Split */}
        <section className="grid items-stretch gap-8 rounded-3xl border-2 border-[#3D3045] bg-[#FFF0DF] p-6 shadow-[0_8px_0_#E9DCCF] sm:p-8 lg:grid-cols-12 lg:p-10">
          <div className="flex flex-col justify-between space-y-6 lg:col-span-6">
            <div className="space-y-4">
              <div className="hero-stagger inline-flex items-center gap-2 rounded-full border-2 border-[#3D3045] bg-[#FFD166] px-3.5 py-1 text-xs font-extrabold text-[#3D3045]">
                <Sparkles className="h-3.5 w-3.5" />
                Real-Time Cartoon Arcade
              </div>
              <h1
                className="hero-stagger font-display text-4xl font-black tracking-tight text-[#3D3045] sm:text-5xl"
                style={{ textWrap: 'balance' }}
              >
                Playful multiplayer duels built for instant fun.
              </h1>
              <p className="hero-stagger max-w-xl text-base font-semibold leading-relaxed text-[#817487]">
                Jump into Tic-Tac-Toe, dual-arena Snake, and Rock Paper Scissors with live
                matchmaking, friend challenges, or instant guest invite links.
              </p>
            </div>

            <div className="hero-stagger flex flex-wrap items-center gap-3">
              {user ? (
                <Button size="lg" onClick={() => navigate('/dashboard')}>
                  Open Arcade Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <>
                  <Button size="lg" onClick={() => navigate('/register')}>
                    Create Free Account
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="secondary"
                    disabled={guestLoading}
                    onClick={handlePlayAsGuest}
                  >
                    {guestLoading ? 'Starting Demo...' : 'Play as Guest'}
                  </Button>
                </>
              )}
            </div>

            {/* Live Platform Stats Strip */}
            <div className="hero-stagger grid grid-cols-3 gap-3">
              <div className="rounded-2xl border-2 border-[#3D3045] bg-white p-3.5 shadow-[0_3px_0_#E9DCCF]">
                <div className="text-xs font-extrabold text-[#817487]">Players</div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#9B7BFF]">
                  {overview.totalPlayers}
                </div>
              </div>
              <div className="rounded-2xl border-2 border-[#3D3045] bg-white p-3.5 shadow-[0_3px_0_#E9DCCF]">
                <div className="text-xs font-extrabold text-[#817487]">Online Now</div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#53C99A]">
                  {overview.onlinePlayers}
                </div>
              </div>
              <div className="rounded-2xl border-2 border-[#3D3045] bg-white p-3.5 shadow-[0_3px_0_#E9DCCF]">
                <div className="text-xs font-extrabold text-[#817487]">Matches</div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#FF8E9E]">
                  {overview.totalMatches}
                </div>
              </div>
            </div>
          </div>

          <div className="hero-stagger lg:col-span-6">
            <div className="h-full min-h-[280px] overflow-hidden rounded-3xl border-2 border-[#3D3045] bg-[#FFF0DF] shadow-[0_6px_0_#3D3045]">
              <HeroArenaIllustration />
            </div>
          </div>
        </section>

        {/* Featured Games */}
        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-black text-[#3D3045]">
                Three Classic Arenas
              </h2>
              <p className="mt-1 text-sm font-bold text-[#817487]">
                Every move, snack pickup, and round reveal is verified live by the server.
              </p>
            </div>
            <Link
              to="/leaderboard"
              className="rounded-xl border-2 border-[#E9DCCF] bg-white px-4 py-2 text-sm font-extrabold text-[#3D3045] transition-colors hover:border-[#3D3045] hover:bg-[#FFF0DF]"
            >
              View Global Leaderboard
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {games.map((gameType) => {
              const meta = GAME_CATALOG[gameType];
              return (
                <Card key={gameType} className="overflow-hidden flex flex-col cartoon-card-hover border-[#3D3045]">
                  <div className="aspect-[4/3] w-full overflow-hidden border-b-2 border-[#3D3045]">
                    <GameThumbnail gameType={gameType} />
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-6 space-y-5">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-block rounded-full border-2 px-3 py-0.5 text-xs font-extrabold ${categoryColor[gameType]}`}
                        >
                          {meta.category}
                        </span>
                        <span className="text-xs font-bold text-[#817487]">2 Players · Live</span>
                      </div>
                      <h3 className="font-display text-2xl font-black text-[#3D3045]">
                        {meta.title}
                      </h3>
                      <p className="text-sm font-semibold leading-relaxed text-[#817487]">
                        {meta.shortDesc}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2.5 sm:flex-row">
                      <Button
                        className="flex-1"
                        disabled={creatingLinkFor === gameType}
                        onClick={() => handleShareGameLink(gameType)}
                      >
                        <Link2 className="h-4 w-4" />
                        {creatingLinkFor === gameType ? 'Creating...' : 'Invite Link'}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate(user ? `/matchmaking?game=${gameType}` : '/register')}
                      >
                        {user ? 'Find Match' : 'Sign Up'}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Core Platform Capabilities */}
        <section className="grid gap-6 md:grid-cols-3">
          <Card className="p-6 space-y-3 bg-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#3D3045] bg-[#EDE7FF] text-[#3D3045]">
              <Zap className="h-6 w-6 stroke-[2.5]" />
            </div>
            <h3 className="font-display text-lg font-black text-[#3D3045]">
              Instant Matchmaking
            </h3>
            <p className="text-sm font-semibold text-[#817487]">
              Queue up for any arena and pair automatically with live ready checks.
            </p>
          </Card>

          <Card className="p-6 space-y-3 bg-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#3D3045] bg-[#E3F5FE] text-[#3D3045]">
              <Users className="h-6 w-6 stroke-[2.5]" />
            </div>
            <h3 className="font-display text-lg font-black text-[#3D3045]">
              Private Friend Duels
            </h3>
            <p className="text-sm font-semibold text-[#817487]">
              Challenge friends by username or drop a shareable link for instant guest play.
            </p>
          </Card>

          <Card className="p-6 space-y-3 bg-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#3D3045] bg-[#E3F8F0] text-[#3D3045]">
              <ShieldCheck className="h-6 w-6 stroke-[2.5]" />
            </div>
            <h3 className="font-display text-lg font-black text-[#3D3045]">
              Fair Server Rules
            </h3>
            <p className="text-sm font-semibold text-[#817487]">
              Scores, turns, and secret RPS choices stay server-controlled for fair play.
            </p>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
