import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AppShell } from '@/src/components/layout/AppShell';
import { CartoonAuthMascot } from '@/src/components/shared/CartoonArt';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { useAuthStore } from '@/src/stores/useAuthStore';

export function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const loginAsGuest = useAuthStore((s) => s.loginAsGuest);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/dashboard';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(identifier, password);
      toast.success('Signed in to Tactix Arena');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuest = async () => {
    setError('');
    setGuestLoading(true);
    try {
      await loginAsGuest();
      toast.success('Entered Demo Guest Session');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start guest session');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-md py-4">
        <Card className="border-[#3D3045] shadow-[0_8px_0_#E9DCCF]">
          <CardHeader className="text-center pb-2">
            <CartoonAuthMascot mode="login" />
            <CardTitle className="text-2xl font-black mt-2">Welcome Back!</CardTitle>
            <CardDescription>
              Sign in with your username or email to jump back into the arena.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-2xl border-2 border-[#3D3045] bg-[#FFE6EA] px-4 py-2.5 text-sm font-bold text-[#3D3045]">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="identifier" className="text-xs font-extrabold text-[#3D3045]">
                  Username or Email
                </label>
                <Input
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="player_one"
                  autoComplete="username"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-extrabold text-[#3D3045]">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="my-4 flex items-center gap-3 text-xs font-extrabold text-[#817487]">
              <div className="h-0.5 flex-1 bg-[#E9DCCF]" />
              <span>or</span>
              <div className="h-0.5 flex-1 bg-[#E9DCCF]" />
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={guestLoading}
              onClick={handleGuest}
            >
              {guestLoading ? 'Starting Demo...' : 'Continue as Guest (Demo Mode)'}
            </Button>

            <p className="mt-5 text-center text-sm font-bold text-[#817487]">
              New to Tactix Arena?{' '}
              <Link to="/register" className="font-extrabold text-[#9B7BFF] hover:underline underline-offset-4">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
