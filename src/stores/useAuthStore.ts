import { create } from 'zustand';
import { api } from '@/src/services/api';
import { UserProfile } from '@/src/types/platform';
import { sfx } from '@/src/utils/sound';

interface AuthState {
  user: UserProfile | null;
  initialized: boolean;
  isLoading: boolean;
  fetchMe: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<UserProfile>;
  loginAsGuest: (nickname?: string) => Promise<UserProfile>;
  register: (payload: {
    username: string;
    email?: string;
    password: string;
    avatar?: string;
  }) => Promise<UserProfile>;
  logout: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,
  isLoading: false,

  fetchMe: async () => {
    set({ isLoading: true });
    try {
      const { user } = await api.auth.me();
      sfx.enabled = user.preferences?.soundEnabled ?? true;
      set({ user, initialized: true, isLoading: false });
    } catch {
      set({ user: null, initialized: true, isLoading: false });
    }
  },

  login: async (identifier, password) => {
    set({ isLoading: true });
    try {
      const { user } = await api.auth.login({ identifier, password });
      sfx.enabled = user.preferences?.soundEnabled ?? true;
      set({ user, initialized: true, isLoading: false });
      return user;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  loginAsGuest: async (nickname) => {
    set({ isLoading: true });
    try {
      const { user } = await api.auth.guest(nickname);
      sfx.enabled = user.preferences?.soundEnabled ?? true;
      set({ user, initialized: true, isLoading: false });
      return user;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (payload) => {
    set({ isLoading: true });
    try {
      const { user } = await api.auth.register(payload);
      sfx.enabled = user.preferences?.soundEnabled ?? true;
      set({ user, initialized: true, isLoading: false });
      return user;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.auth.logout();
    } catch {
      // Ignore network or expired-session errors so local session always clears
    } finally {
      set({ user: null });
    }
  },

  setUser: (user) => {
    if (user) {
      sfx.enabled = user.preferences?.soundEnabled ?? true;
    }
    set({ user });
  },
}));
