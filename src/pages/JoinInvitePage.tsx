import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, Copy, Link2, Loader2, Play, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/src/components/layout/AppShell';
import { CartoonEmptyState, CartoonLoadingState } from '@/src/components/shared/CartoonArt';
import { GAME_CATALOG, GameThumbnail } from '@/src/components/shared/GameThumbnail';
import { PlayerAvatar } from '@/src/components/shared/PlayerAvatar';
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { api } from '@/src/services/api';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { InviteLinkInfo } from '@/src/types/platform';

export function JoinInvitePage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const loginAsGuest = useAuthStore((s) => s.loginAsGuest);

  const [invite, setInvite] = useState<InviteLinkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nickname, setNickname] = useState('');
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!inviteCode) return;
    setLoading(true);
    api.matches
      .getInviteLink(inviteCode)
      .then((res) => {
        setInvite(res.invite);
        setError('');
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Invite link not found');
      })
      .finally(() => setLoading(false));
  }, [inviteCode]);

  useEffect(() => {
    if (!invite || invite.status !== 'open' || !user || user.id !== invite.hostId) return;
    const id = setInterval(() => {
      api.matches
        .getInviteLink(invite.code)
        .then((res) => {
          setInvite(res.invite);
          if (res.invite.status === 'claimed' && res.invite.roomId) {
            navigate(`/play/${res.invite.gameType}/${res.invite.roomId}`, { replace: true });
          }
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(id);
  }, [invite?.code, invite?.status, invite?.hostId, user?.id, navigate]);

  const shareUrl = `${window.location.origin}/join/${inviteCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Invite link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Please copy the URL manually from the box');
    }
  };

  const handleCancel = async () => {
    if (!inviteCode) return;
    try {
      await api.matches.cancelInviteLink(inviteCode);
      toast.info('Invite link cancelled');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not cancel invite');
    }
  };

  const handleJoinAsGuestOrUser = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inviteCode) return;
    setJoining(true);
    try {
      if (!user) {
        await loginAsGuest(nickname.trim() || undefined);
      }
      const res = await api.matches.joinInviteLink(inviteCode);
      navigate(`/play/${res.gameType}/${res.roomId}`, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to join match');
      setJoining(false);
    }
  };

  const isHost = Boolean(user && invite && user.id === invite.hostId);

  return (
    <AppShell>
      <div className="mx-auto max-w-xl py-4">
        {loading || !initialized ? (
          <Card className="p-8">
            <CartoonLoadingState label="Loading invite lobby..." />
          </Card>
        ) : error || !invite ? (
          <Card className="p-6">
            <CartoonEmptyState
              variant="lost"
              title="Invite Unavailable"
              description={error || 'This invite link is invalid or expired.'}
              action={
                <Link to={user ? '/dashboard' : '/'}>
                  <Button variant="outline">Return Home</Button>
                </Link>
              }
            />
          </Card>
        ) : invite.status !== 'open' ? (
          <Card className="p-6">
            <CartoonEmptyState
              variant="inbox"
              title={`Invite ${invite.status === 'claimed' ? 'Already Started' : 'No Longer Active'}`}
              description={`This ${GAME_CATALOG[invite.gameType].title} link has already been ${invite.status}.`}
              action={
                <Link to={user ? '/dashboard' : '/'}>
                  <Button variant="outline">Return Home</Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <Card className="overflow-hidden border-[#3D3045] shadow-[0_8px_0_#E9DCCF]">
            <div className="aspect-[16/9] max-h-56 w-full overflow-hidden border-b-2 border-[#3D3045]">
              <GameThumbnail gameType={invite.gameType} />
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3.5">
                <PlayerAvatar avatar={invite.hostAvatar} username={invite.hostUsername} size="md" />
                <div>
                  <div className="text-xs font-extrabold text-[#9B7BFF]">
                    {isHost ? 'Your Shareable Match Link' : 'Private Match Invitation'}
                  </div>
                  <h1 className="font-display text-2xl font-black text-[#3D3045]">
                    {GAME_CATALOG[invite.gameType].title}
                  </h1>
                  <p className="text-xs font-bold text-[#817487]">Hosted by {invite.hostUsername}</p>
                </div>
              </div>

              {isHost ? (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-[#817487]">
                    Send this link to a friend! Anyone who opens it can join right away as a guest or signed-in player.
                  </p>

                  <div className="flex gap-2">
                    <Input value={shareUrl} readOnly className="font-mono text-xs" />
                    <Button type="button" onClick={handleCopy}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border-2 border-[#3D3045] bg-[#FFF5D6] px-4 py-3 text-sm">
                    <div className="flex items-center gap-2.5 font-extrabold text-[#3D3045]">
                      <Loader2 className="h-4 w-4 animate-spin text-[#9B7BFF]" />
                      <span>Waiting for friend to join...</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleCancel}>
                      <XCircle className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : user ? (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-[#817487]">
                    Signed in as <strong className="text-[#3D3045]">{user.username}</strong>. Hop in to play against {invite.hostUsername}!
                  </p>
                  <Button
                    size="lg"
                    className="w-full"
                    disabled={joining}
                    onClick={() => handleJoinAsGuestOrUser()}
                  >
                    <Play className="h-4 w-4" />
                    {joining ? 'Joining Match...' : 'Join Match Now'}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleJoinAsGuestOrUser} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="guest-nick" className="text-xs font-extrabold text-[#3D3045]">
                      Guest Nickname (optional)
                    </label>
                    <Input
                      id="guest-nick"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Enter a nickname or leave blank"
                      maxLength={16}
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={joining}>
                    <Link2 className="h-4 w-4" />
                    {joining ? 'Joining Match...' : 'Join Match as Guest'}
                  </Button>

                  <p className="text-center text-xs font-bold text-[#817487]">
                    Have an account?{' '}
                    <Link
                      to="/login"
                      state={{ from: `/join/${inviteCode}` }}
                      className="font-extrabold text-[#9B7BFF] hover:underline underline-offset-4"
                    >
                      Sign in first
                    </Link>
                  </p>
                </form>
              )}
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
