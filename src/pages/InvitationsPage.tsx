import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Link2, Search, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/src/components/layout/AppShell';
import { CartoonEmptyState } from '@/src/components/shared/CartoonArt';
import { GAME_CATALOG } from '@/src/components/shared/GameThumbnail';
import { PlayerAvatar } from '@/src/components/shared/PlayerAvatar';
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { useSocket } from '@/src/context/SocketContext';
import { api } from '@/src/services/api';
import { useRealtimeStore } from '@/src/stores/useRealtimeStore';
import { GameType, PlayerSummary } from '@/src/types/platform';
import { cn } from '@/src/utils/cn';

export function InvitationsPage() {
  const navigate = useNavigate();
  const { sendInvitation, acceptInvitation, rejectInvitation } = useSocket();
  const incomingInvitations = useRealtimeStore((s) => s.incomingInvitations);
  const outgoingInvitations = useRealtimeStore((s) => s.outgoingInvitations);
  const presenceMap = useRealtimeStore((s) => s.presenceMap);

  const [recipientUsername, setRecipientUsername] = useState('');
  const [selectedGame, setSelectedGame] = useState<GameType>('tic-tac-toe');
  const [sending, setSending] = useState(false);
  const [creatingLink, setCreatingLink] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      api.users
        .search(searchQuery)
        .then((res) => setPlayers(res.users))
        .catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientUsername.trim()) return;
    setSending(true);
    const res = await sendInvitation(recipientUsername.trim(), selectedGame);
    setSending(false);
    if (res.ok) {
      toast.success(`Invitation sent to ${recipientUsername.trim()}`);
      setRecipientUsername('');
    } else {
      toast.error(res.error || 'Could not send invitation');
    }
  };

  const handleCreateShareLink = async () => {
    setCreatingLink(true);
    try {
      const { invite } = await api.matches.createInviteLink(selectedGame);
      navigate(`/join/${invite.code}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create invite link');
      setCreatingLink(false);
    }
  };

  const games: GameType[] = ['tic-tac-toe', 'snake', 'rock-paper-scissors'];

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-3xl font-black text-[#3D3045]">
              Game Invitations
            </h1>
            <p className="mt-1 text-sm font-semibold text-[#817487]">
              Challenge any player by username, or generate a shareable link for instant friend play.
            </p>
          </div>
          <Button variant="secondary" disabled={creatingLink} onClick={handleCreateShareLink}>
            <Link2 className="h-4 w-4" />
            {creatingLink
              ? 'Generating Link...'
              : `Create ${GAME_CATALOG[selectedGame].title} Link`}
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left: Send Private Invitation + Player Directory */}
          <div className="space-y-6 lg:col-span-5">
            <Card className="p-6 space-y-5">
              <h2 className="font-display text-xl font-black text-[#3D3045]">
                Send a Challenge
              </h2>

              <form onSubmit={handleSend} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="invite-user" className="text-xs font-extrabold text-[#3D3045]">
                    Recipient Username
                  </label>
                  <Input
                    id="invite-user"
                    value={recipientUsername}
                    onChange={(e) => setRecipientUsername(e.target.value)}
                    placeholder="Enter exact username"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-extrabold text-[#3D3045]">Select Game</span>
                  <div className="grid grid-cols-1 gap-2">
                    {games.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setSelectedGame(g)}
                        className={cn(
                          'flex items-center justify-between rounded-2xl border-2 px-4 py-3 text-sm font-extrabold transition-all cursor-pointer',
                          selectedGame === g
                            ? 'border-[#3D3045] bg-[#9B7BFF] text-white shadow-[0_3px_0_#3D3045]'
                            : 'border-[#E9DCCF] bg-[#FFF7ED] text-[#3D3045] hover:border-[#3D3045]'
                        )}
                      >
                        <span>{GAME_CATALOG[g].title}</span>
                        {selectedGame === g && <Check className="h-4 w-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={sending}>
                  <Send className="h-4 w-4" />
                  {sending ? 'Sending Challenge...' : 'Send Invitation'}
                </Button>
              </form>
            </Card>

            {/* Quick Online Player Picker */}
            <Card className="p-6 space-y-4">
              <h2 className="font-display text-lg font-black text-[#3D3045]">
                Find Players
              </h2>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[#817487]" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by username..."
                  className="pl-10"
                />
              </div>

              {players.length === 0 ? (
                <p className="py-4 text-center text-xs font-bold text-[#817487]">
                  No matching players found.
                </p>
              ) : (
                <div className="divide-y-2 divide-[#E9DCCF]">
                  {players.map((p) => {
                    const liveStatus = presenceMap[p.id] ?? p.status;
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-3 py-3 text-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <PlayerAvatar
                            avatar={p.avatar}
                            username={p.username}
                            status={liveStatus}
                            size="sm"
                            showStatusDot
                          />
                          <div className="min-w-0">
                            <div className="truncate font-extrabold text-[#3D3045]">
                              {p.username}
                            </div>
                            <div className="text-xs font-bold text-[#817487] capitalize">
                              {liveStatus} · {p.wins} wins
                            </div>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          disabled={liveStatus === 'offline'}
                          onClick={() => setRecipientUsername(p.username)}
                        >
                          Select
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Right: Incoming & Outgoing Invitations */}
          <div className="space-y-6 lg:col-span-7">
            <Card className="p-6 space-y-4">
              <h2 className="font-display text-xl font-black text-[#3D3045]">
                Incoming Invitations
              </h2>

              {incomingInvitations.length === 0 ? (
                <CartoonEmptyState
                  variant="inbox"
                  title="Inbox All Clear"
                  description="When a friend challenges you to a live match, their invite will pop up here."
                />
              ) : (
                <div className="space-y-3">
                  {incomingInvitations.map((inv) => {
                    const secsLeft = Math.max(
                      0,
                      Math.ceil((new Date(inv.expiresAt).getTime() - nowMs) / 1000)
                    );
                    return (
                      <div
                        key={inv.id}
                        className="flex flex-col justify-between gap-4 rounded-2xl border-2 border-[#3D3045] bg-[#FFF5D6] p-4 shadow-[0_3px_0_#3D3045] sm:flex-row sm:items-center"
                      >
                        <div className="flex items-center gap-3">
                          <PlayerAvatar
                            avatar={inv.senderAvatar}
                            username={inv.senderUsername}
                            size="md"
                          />
                          <div>
                            <div className="font-extrabold text-[#3D3045]">
                              {inv.senderUsername}
                            </div>
                            <div className="text-xs font-bold text-[#817487]">
                              {GAME_CATALOG[inv.gameType].title} · Expires in{' '}
                              <span className="font-mono tabular-nums text-[#3D3045]">{secsLeft}s</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="mint"
                            onClick={async () => {
                              const r = await acceptInvitation(inv.id);
                              if (!r.ok) toast.error(r.error || 'Could not accept invitation');
                            }}
                          >
                            <Check className="h-4 w-4" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectInvitation(inv.id)}
                          >
                            <X className="h-4 w-4" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card className="p-6 space-y-4">
              <h2 className="font-display text-xl font-black text-[#3D3045]">
                Sent Invitations
              </h2>

              {outgoingInvitations.length === 0 ? (
                <p className="py-6 text-center text-sm font-bold text-[#817487]">
                  You have not sent any invitations yet.
                </p>
              ) : (
                <div className="divide-y-2 divide-[#E9DCCF]">
                  {outgoingInvitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between gap-4 py-3 text-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <PlayerAvatar
                          avatar={inv.recipientAvatar}
                          username={inv.recipientUsername}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="truncate font-extrabold text-[#3D3045]">
                            {inv.recipientUsername}
                          </div>
                          <div className="text-xs font-bold text-[#817487]">
                            {GAME_CATALOG[inv.gameType].title}
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-xs font-extrabold capitalize">
                        <span
                          className={cn(
                            'rounded-full border px-2.5 py-0.5',
                            inv.status === 'accepted'
                              ? 'border-[#3D3045] bg-[#53C99A] text-white'
                              : inv.status === 'pending'
                                ? 'border-[#3D3045] bg-[#FFD166] text-[#3D3045]'
                                : 'border-[#E9DCCF] bg-[#FFF7ED] text-[#817487]'
                          )}
                        >
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
