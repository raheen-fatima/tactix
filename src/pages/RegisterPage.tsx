import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AppShell } from '@/src/components/layout/AppShell';
import { CartoonAuthMascot } from '@/src/components/shared/CartoonArt';
import { AVATAR_OPTIONS, PlayerAvatar } from '@/src/components/shared/PlayerAvatar';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { cn } from '@/src/utils/cn';

export function RegisterPage() {
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState<string>('shield-emerald');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register({
        username,
        email: email.trim() || undefined,
        password,
        avatar,
      });
      toast.success('Account created — welcome to Tactix Arena');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to register');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-md py-4">
        <Card className="border-[#3D3045] shadow-[0_8px_0_#E9DCCF]">
          <CardHeader className="text-center pb-2">
            <CartoonAuthMascot mode="register" />
            <CardTitle className="text-2xl font-black mt-2">Create Account</CardTitle>
            <CardDescription>
              Pick your cartoon buddy, claim a username, and start collecting badges.
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
                <label htmlFor="username" className="text-xs font-extrabold text-[#3D3045]">
                  Unique Username
                </label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="tactical_ace"
                  pattern="[a-zA-Z0-9_]{3,20}"
                  title="3-20 characters: letters, numbers, and underscores only"
                  autoComplete="username"
                  required
                />
                <p className="text-xs font-semibold text-[#817487]">
                  3–20 characters · letters, numbers, underscores
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-extrabold text-[#3D3045]">
                  Email (optional)
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reg-password" className="text-xs font-extrabold text-[#3D3045]">
                  Password
                </label>
                <Input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-extrabold text-[#3D3045]">Choose Cartoon Avatar</span>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {AVATAR_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAvatar(opt.id)}
                      className={cn(
                        'flex flex-col items-center justify-center gap-1 rounded-2xl border-2 p-2 transition-all cursor-pointer',
                        avatar === opt.id
                          ? 'border-[#3D3045] bg-[#FFF5D6] shadow-[0_3px_0_#3D3045]'
                          : 'border-[#E9DCCF] bg-white hover:border-[#3D3045]'
                      )}
                      title={opt.label}
                    >
                      <PlayerAvatar avatar={opt.id} size="sm" />
                      <span className="text-[10px] font-extrabold text-[#3D3045]">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm font-bold text-[#817487]">
              Already registered?{' '}
              <Link to="/login" className="font-extrabold text-[#9B7BFF] hover:underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
