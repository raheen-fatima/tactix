import { Link } from 'react-router-dom';
import { AppShell } from '@/src/components/layout/AppShell';
import { CartoonEmptyState } from '@/src/components/shared/CartoonArt';
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { useAuthStore } from '@/src/stores/useAuthStore';

export function NotFoundPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <AppShell>
      <div className="mx-auto max-w-md py-12">
        <Card className="p-6">
          <CartoonEmptyState
            variant="lost"
            title="404 · Arena Not Found"
            description="Looks like this game room or page wandered off the map!"
            action={
              <Link to={user ? '/dashboard' : '/'}>
                <Button>{user ? 'Return to Dashboard' : 'Go to Home'}</Button>
              </Link>
            }
          />
        </Card>
      </div>
    </AppShell>
  );
}
