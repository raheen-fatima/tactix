import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/src/components/layout/ProtectedRoute';
import { Toaster } from '@/src/components/ui/sonner';
import { SocketProvider } from '@/src/context/SocketContext';
import { DashboardPage } from '@/src/pages/DashboardPage';
import { GameRoomPage } from '@/src/pages/GameRoomPage';
import { InvitationsPage } from '@/src/pages/InvitationsPage';
import { JoinInvitePage } from '@/src/pages/JoinInvitePage';
import { LandingPage } from '@/src/pages/LandingPage';
import { LeaderboardPage } from '@/src/pages/LeaderboardPage';
import { LoginPage } from '@/src/pages/LoginPage';
import { MatchHistoryPage } from '@/src/pages/MatchHistoryPage';
import { MatchmakingPage } from '@/src/pages/MatchmakingPage';
import { NotFoundPage } from '@/src/pages/NotFoundPage';
import { ProfilePage } from '@/src/pages/ProfilePage';
import { RegisterPage } from '@/src/pages/RegisterPage';
import { SettingsPage } from '@/src/pages/SettingsPage';
import { useAuthStore } from '@/src/stores/useAuthStore';

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <BrowserRouter>
      <SocketProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/join/:inviteCode" element={<JoinInvitePage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:username"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/matchmaking"
            element={
              <ProtectedRoute>
                <MatchmakingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invitations"
            element={
              <ProtectedRoute>
                <InvitationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <MatchHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/play/tic-tac-toe/:roomId"
            element={
              <ProtectedRoute>
                <GameRoomPage expectedGame="tic-tac-toe" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/play/snake/:roomId"
            element={
              <ProtectedRoute>
                <GameRoomPage expectedGame="snake" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/play/rock-paper-scissors/:roomId"
            element={
              <ProtectedRoute>
                <GameRoomPage expectedGame="rock-paper-scissors" />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Toaster />
      </SocketProvider>
    </BrowserRouter>
  );
}
