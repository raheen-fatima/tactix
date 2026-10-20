import {
  GameType,
  InvitationItem,
  InviteLinkInfo,
  LeaderboardEntry,
  MatchHistoryItem,
  PlayerSummary,
  UserProfile,
} from '@/src/types/platform';

const TOKEN_STORAGE_KEY = 'tactix_session_token';

export function getAuthToken(): string | null {
  try {
    return window.sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage unavailability
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  auth: {
    register: async (payload: {
      username: string;
      email?: string;
      password: string;
      avatar?: string;
    }) => {
      const res = await request<{ user: UserProfile; token?: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.token) setAuthToken(res.token);
      return res;
    },
    login: async (payload: { identifier: string; password: string }) => {
      const res = await request<{ user: UserProfile; token?: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.token) setAuthToken(res.token);
      return res;
    },
    guest: async (nickname?: string) => {
      const res = await request<{ user: UserProfile; token?: string }>('/api/auth/guest', {
        method: 'POST',
        body: JSON.stringify({ nickname }),
      });
      if (res.token) setAuthToken(res.token);
      return res;
    },
    logout: async () => {
      try {
        return await request<{ success: boolean }>('/api/auth/logout', {
          method: 'POST',
        });
      } finally {
        setAuthToken(null);
      }
    },
    me: async () => {
      try {
        return await request<{ user: UserProfile }>('/api/auth/me');
      } catch (err) {
        setAuthToken(null);
        throw err;
      }
    },
  },

  users: {
    getProfile: (username: string) =>
      request<{ user: UserProfile }>(`/api/users/${encodeURIComponent(username)}`),
    updateProfile: (payload: {
      avatar?: string;
      bio?: string;
      preferences?: { soundEnabled?: boolean; snakeSpeed?: 'normal' | 'fast' };
    }) =>
      request<{ user: UserProfile }>('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    updatePassword: (payload: { currentPassword: string; newPassword: string }) =>
      request<{ success: boolean }>('/api/users/password', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    search: (q: string) =>
      request<{ users: PlayerSummary[] }>(`/api/users/search?q=${encodeURIComponent(q)}`),
    leaderboard: (game: 'overall' | GameType = 'overall') =>
      request<{ leaderboard: LeaderboardEntry[] }>(`/api/users/leaderboard?game=${game}`),
  },

  matches: {
    overview: () =>
      request<{ totalPlayers: number; onlinePlayers: number; totalMatches: number }>(
        '/api/matches/overview'
      ),
    history: (params?: { gameType?: GameType; userId?: string; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.gameType) qs.set('gameType', params.gameType);
      if (params?.userId) qs.set('userId', params.userId);
      if (params?.limit) qs.set('limit', String(params.limit));
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return request<{ matches: MatchHistoryItem[] }>(`/api/matches/history${suffix}`);
    },
    invitations: () =>
      request<{ incoming: InvitationItem[]; outgoing: InvitationItem[] }>(
        '/api/matches/invitations'
      ),
    room: (roomId: string) =>
      request<{
        room: {
          roomId: string;
          gameType: GameType;
          status: string;
        };
      }>(`/api/matches/rooms/${encodeURIComponent(roomId)}`),
    createInviteLink: (gameType: GameType) =>
      request<{ invite: InviteLinkInfo }>('/api/matches/invite-links', {
        method: 'POST',
        body: JSON.stringify({ gameType }),
      }),
    getInviteLink: (code: string) =>
      request<{ invite: InviteLinkInfo }>(`/api/matches/invite-links/${encodeURIComponent(code)}`),
    joinInviteLink: (code: string) =>
      request<{ roomId: string; gameType: GameType }>(
        `/api/matches/invite-links/${encodeURIComponent(code)}/join`,
        { method: 'POST' }
      ),
    cancelInviteLink: (code: string) =>
      request<{ success: boolean }>(
        `/api/matches/invite-links/${encodeURIComponent(code)}/cancel`,
        { method: 'POST' }
      ),
  },
};
