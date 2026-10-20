import { create } from 'zustand';
import {
  GameType,
  InvitationItem,
  PlatformNotification,
  UserStatus,
} from '@/src/types/platform';

interface RealtimeState {
  connected: boolean;
  queueGameType: GameType | null;
  queueStartedAt: number | null;
  incomingInvitations: InvitationItem[];
  outgoingInvitations: InvitationItem[];
  notifications: PlatformNotification[];
  presenceMap: Record<string, UserStatus>;
  setConnected: (connected: boolean) => void;
  setQueue: (gameType: GameType | null) => void;
  setInvitations: (incoming: InvitationItem[], outgoing: InvitationItem[]) => void;
  addIncomingInvitation: (inv: InvitationItem) => void;
  addOutgoingInvitation: (inv: InvitationItem) => void;
  updateInvitationStatus: (id: string, status: InvitationItem['status']) => void;
  addNotification: (notif: Omit<PlatformNotification, 'id' | 'createdAt' | 'read'>) => void;
  markAllNotificationsRead: () => void;
  setPresence: (userId: string, status: UserStatus) => void;
  reset: () => void;
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  connected: false,
  queueGameType: null,
  queueStartedAt: null,
  incomingInvitations: [],
  outgoingInvitations: [],
  notifications: [],
  presenceMap: {},

  setConnected: (connected) => set({ connected }),

  setQueue: (gameType) =>
    set({
      queueGameType: gameType,
      queueStartedAt: gameType ? Date.now() : null,
    }),

  setInvitations: (incoming, outgoing) =>
    set({
      incomingInvitations: incoming,
      outgoingInvitations: outgoing,
    }),

  addIncomingInvitation: (inv) =>
    set((state) => ({
      incomingInvitations: [inv, ...state.incomingInvitations.filter((x) => x.id !== inv.id)],
    })),

  addOutgoingInvitation: (inv) =>
    set((state) => ({
      outgoingInvitations: [inv, ...state.outgoingInvitations.filter((x) => x.id !== inv.id)],
    })),

  updateInvitationStatus: (id, status) =>
    set((state) => ({
      incomingInvitations:
        status === 'pending'
          ? state.incomingInvitations
          : state.incomingInvitations.filter((x) => x.id !== id),
      outgoingInvitations: state.outgoingInvitations.map((x) =>
        x.id === id ? { ...x, status } : x
      ),
    })),

  addNotification: (notif) =>
    set((state) => ({
      notifications: [
        {
          ...notif,
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...state.notifications.slice(0, 29),
      ],
    })),

  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  setPresence: (userId, status) =>
    set((state) => ({
      presenceMap: { ...state.presenceMap, [userId]: status },
    })),

  reset: () =>
    set({
      connected: false,
      queueGameType: null,
      queueStartedAt: null,
      incomingInvitations: [],
      outgoingInvitations: [],
      notifications: [],
      presenceMap: {},
    }),
}));
