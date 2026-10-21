import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { CartoonLoadingState } from '@/src/components/shared/CartoonArt';
import { useAuthStore } from '@/src/stores/useAuthStore';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const location = useLocation();

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFF7ED]">
        <CartoonLoadingState label="Checking your player pass..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
