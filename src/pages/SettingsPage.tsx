import React, { useState } from 'react';
import { toast } from 'sonner';
import { AppShell } from '@/src/components/layout/AppShell';
import { AVATAR_OPTIONS, PlayerAvatar } from '@/src/components/shared/PlayerAvatar';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Switch } from '@/src/components/ui/switch';
import { api } from '@/src/services/api';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { cn } from '@/src/utils/cn';

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [avatar, setAvatar] = useState(user?.avatar ?? 'shield-emerald');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [soundEnabled, setSoundEnabled] = useState(user?.preferences?.soundEnabled ?? true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  if (!user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.users.updateProfile({
        avatar,
        bio,
        preferences: { soundEnabled },
      });
      setUser(res.user);
      toast.success('Profile settings updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      await api.users.updatePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      toast.success('Password updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="font-display text-3xl font-black text-[#3D3045]">Settings</h1>
          <p className="mt-1 text-sm font-semibold text-[#817487]">
            Customize your cartoon character, player bio, audio effects, and password.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile & Preferences</CardTitle>
            <CardDescription>
              Username <span className="font-mono font-bold text-[#9B7BFF]">{user.username}</span> is permanent and unique.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="space-y-2.5">
                <span className="text-xs font-extrabold text-[#3D3045]">Cartoon Avatar</span>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                  {AVATAR_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAvatar(opt.id)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 transition-all cursor-pointer',
                        avatar === opt.id
                          ? 'border-[#3D3045] bg-[#FFF5D6] shadow-[0_3px_0_#3D3045]'
                          : 'border-[#E9DCCF] bg-white hover:border-[#3D3045]'
                      )}
                    >
                      <PlayerAvatar avatar={opt.id} size="sm" />
                      <span className="text-[11px] font-extrabold text-[#3D3045]">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="bio" className="text-xs font-extrabold text-[#3D3045]">
                  Player Bio
                </label>
                <Input
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={160}
                  placeholder="Classic tactician..."
                />
                <p className="text-xs font-bold text-[#817487]">{bio.length}/160 characters</p>
              </div>

              <div className="flex items-center justify-between rounded-2xl border-2 border-[#E9DCCF] bg-[#FFF7ED] px-4 py-3.5">
                <div>
                  <div className="text-sm font-extrabold text-[#3D3045]">Sound Effects</div>
                  <div className="text-xs font-semibold text-[#817487]">
                    Play cheerful audio cues on moves, snack pickups, and match results.
                  </div>
                </div>
                <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
              </div>

              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your account password using your current credentials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="cur-pw" className="text-xs font-extrabold text-[#3D3045]">
                  Current Password
                </label>
                <Input
                  id="cur-pw"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="new-pw" className="text-xs font-extrabold text-[#3D3045]">
                  New Password
                </label>
                <Input
                  id="new-pw"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              <Button type="submit" variant="outline" disabled={savingPassword}>
                {savingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
