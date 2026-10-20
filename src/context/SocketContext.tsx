import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { api, getAuthToken } from '@/src/services/api';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useRealtimeStore } from '@/src/stores/useRealtimeStore';
import { GameType, InvitationItem, UserStatus } from '@/src/types/platform';
import { sfx } from '@/src/utils/sound';

interface SocketContextValue {
  getSocket: () => Socket | null;
  joinMatchmaking: (gameType: GameType) => void;
  cancelMatchmaking: () => void;
  sendInvitation: (
    recipientUsername: string,
    gameType: GameType
  ) => Promise<{ ok: boolean; error?: string; invitation?: InvitationItem }>;
  acceptInvitation: (invitationId: string) => Promise<{ ok: boolean; error?: string }>;
  rejectInvitation: (invitationId: string) => Promise<{ ok: boolean; error?: string }>;
}

const SocketContext = createContext<SocketContextValue | null>(null);

const GAME_LABELS: Record<GameType, string> = {
  'tic-tac-toe': 'Tic-Tac-Toe',
  snake: 'Snake Arena',
  'rock-paper-scissors': 'Rock Paper Scissors',
};

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const socketRef = useRef<Socket | null>(null);
  const navigate = useNavigate();

  const {
    setConnected,
    setQueue,
    setInvitations,
    addIncomingInvitation,
    addOutgoingInvitation,
    updateInvitationStatus,
    addNotification,
    setPresence,
    reset,
  } = useRealtimeStore();

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      reset();
      return;
    }

    // Load pending invitations from DB on connect
    api.matches
      .invitations()
      .then((res) => setInvitations(res.incoming, res.outgoing))
      .catch(() => {});

    const token = getAuthToken();
    const socket = io({
      withCredentials: true,
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('presence:update', (data: { userId: string; status: UserStatus }) => {
      setPresence(data.userId, data.status);
    });

    socket.on('matchmaking:queued', (data: { gameType: GameType }) => {
      setQueue(data.gameType);
    });

    socket.on('matchmaking:cancelled', () => {
      setQueue(null);
    });

    socket.on('matchmaking:error', (data: { error: string }) => {
      setQueue(null);
      toast.error(data.error);
    });

    socket.on(
      'matchmaking:found',
      (data: { roomId: string; gameType: GameType; invitationId?: string }) => {
        setQueue(null);
        if (data.invitationId) {
          updateInvitationStatus(data.invitationId, 'accepted');
        }
        sfx.matchFound();
        toast.success(`Match ready — entering ${GAME_LABELS[data.gameType]}`);
        addNotification({
          type: 'match',
          title: 'Match Found',
          message: `Entering ${GAME_LABELS[data.gameType]} room`,
          gameType: data.gameType,
        });
        navigate(`/play/${data.gameType}/${data.roomId}`);
      }
    );

    socket.on('invitation:received', (inv: InvitationItem) => {
      addIncomingInvitation(inv);
      sfx.matchFound();
      addNotification({
        type: 'invitation',
        title: `Invite from ${inv.senderUsername}`,
        message: `${inv.senderUsername} challenged you to ${GAME_LABELS[inv.gameType]}`,
        invitationId: inv.id,
        gameType: inv.gameType,
      });
      toast(`${inv.senderUsername} invited you to ${GAME_LABELS[inv.gameType]}`, {
        duration: 12000,
        action: {
          label: 'View Invite',
          onClick: () => navigate('/invitations'),
        },
      });
    });

    socket.on(
      'invitation:rejected',
      (data: { id: string; recipientUsername: string; gameType: GameType }) => {
        updateInvitationStatus(data.id, 'rejected');
        toast.info(`${data.recipientUsername} declined your ${GAME_LABELS[data.gameType]} invite`);
        addNotification({
          type: 'invitation',
          title: 'Invitation Declined',
          message: `${data.recipientUsername} declined your ${GAME_LABELS[data.gameType]} challenge`,
        });
      }
    );

    socket.on(
      'invitation:expired',
      (data: { id: string; gameType: GameType; senderUsername: string; recipientUsername: string }) => {
        updateInvitationStatus(data.id, 'expired');
        addNotification({
          type: 'invitation',
          title: 'Invitation Expired',
          message: `${GAME_LABELS[data.gameType]} invitation timed out`,
        });
      }
    );

    socket.on('game:finished', () => {
      // Refresh user stats quietly after any finished match
      fetchMe().catch(() => {});
    });

    socket.on('error', (data: { message?: string }) => {
      if (data?.message) {
        toast.error(data.message);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user?.id]);

  const joinMatchmaking = useCallback((gameType: GameType) => {
    socketRef.current?.emit('matchmaking:join', { gameType });
  }, []);

  const cancelMatchmaking = useCallback(() => {
    socketRef.current?.emit('matchmaking:cancel');
    setQueue(null);
  }, [setQueue]);

  const sendInvitation = useCallback(
    (recipientUsername: string, gameType: GameType) =>
      new Promise<{ ok: boolean; error?: string; invitation?: InvitationItem }>((resolve) => {
        if (!socketRef.current) {
          resolve({ ok: false, error: 'Realtime connection unavailable' });
          return;
        }
        socketRef.current.emit(
          'invitation:send',
          { recipientUsername, gameType },
          (res: { ok: boolean; error?: string; invitation?: InvitationItem }) => {
            if (res?.ok && res.invitation) {
              addOutgoingInvitation(res.invitation);
            }
            resolve(res || { ok: false, error: 'No server response' });
          }
        );
      }),
    [addOutgoingInvitation]
  );

  const acceptInvitation = useCallback(
    (invitationId: string) =>
      new Promise<{ ok: boolean; error?: string }>((resolve) => {
        if (!socketRef.current) {
          resolve({ ok: false, error: 'Realtime connection unavailable' });
          return;
        }
        socketRef.current.emit(
          'invitation:accept',
          { invitationId },
          (res: { ok: boolean; error?: string }) => {
            if (res?.ok) {
              updateInvitationStatus(invitationId, 'accepted');
            }
            resolve(res || { ok: false, error: 'No server response' });
          }
        );
      }),
    [updateInvitationStatus]
  );

  const rejectInvitation = useCallback(
    (invitationId: string) =>
      new Promise<{ ok: boolean; error?: string }>((resolve) => {
        if (!socketRef.current) {
          resolve({ ok: false, error: 'Realtime connection unavailable' });
          return;
        }
        socketRef.current.emit(
          'invitation:reject',
          { invitationId },
          (res: { ok: boolean; error?: string }) => {
            if (res?.ok) {
              updateInvitationStatus(invitationId, 'rejected');
            }
            resolve(res || { ok: false, error: 'No server response' });
          }
        );
      }),
    [updateInvitationStatus]
  );

  const getSocket = useCallback(() => socketRef.current, []);

  return (
    <SocketContext.Provider
      value={{
        getSocket,
        joinMatchmaking,
        cancelMatchmaking,
        sendInvitation,
        acceptInvitation,
        rejectInvitation,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
