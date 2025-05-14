'use client';

import { Copy } from '@/components/Copy';
import { CurrentUserAvatar } from '@/components/UserAvatar';
import { Button } from '@/components/ui/shadcn/button';
import { cn } from '@/lib/utils';
import { FORCED_THEME } from '@/providers/sessions';
import { shortage } from '@/utils/string';
import { type User, usePrivy } from '@privy-io/react-auth';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { isNil } from 'ramda';
import type { FC, HTMLAttributes } from 'react';
import { toast } from 'sonner';
import { ThemeDropdown } from './dropdowns/theme-dropdown';

export interface HeaderProps extends HTMLAttributes<HTMLDivElement> {
  user: User;
}

export const Header: FC<HeaderProps> = ({
  user,
  className,
  ...rest
}: HeaderProps) => {
  const router = useRouter();

  const { logout } = usePrivy();

  const handleLogout = async () => {
    try {
      await logout();
      toast('Logged out', {
        description: 'You have been successfully logged out.',
      });
      router.push('/');
    } catch {
      toast('Error', {
        description: 'Failed to log out. Please try again.',
      });
    }
  };

  const wallet = user.wallet?.address;
  const email = user.email?.address || user.google?.email;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between gap-4 md:flex-row',
        className,
      )}
      {...rest}
    >
      <div className="flex items-center gap-4">
        <CurrentUserAvatar className="h-20 w-20" />
        <div>
          {wallet ? (
            <Copy
              text={wallet}
              className="text-2xl font-bold"
              copiedTitle="User wallet copied"
              copiedDescription="User wallet has been copied to clipboard"
            >
              {shortage(wallet, 11)}
            </Copy>
          ) : email ? (
            <Copy
              text={email}
              className="text-2xl font-bold"
              copiedTitle="User email copied"
              copiedDescription="User email has been copied to clipboard"
            >
              {shortage(email, 11)}
            </Copy>
          ) : (
            ''
          )}
          <Copy
            text={user.id}
            className="text-sm text-muted-foreground"
            copiedTitle="User ID copied"
            copiedDescription="User ID has been copied to clipboard"
          >
            {shortage(user.id, 11)}
          </Copy>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isNil(FORCED_THEME) && <ThemeDropdown />}
        <Button variant="destructive" onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};
