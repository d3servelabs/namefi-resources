'use client';

import { Copy } from '@/components/copy';
import { CurrentUserAvatar } from '@/components/user-avatar';
import { cn } from '@namefi-astra/ui/lib/cn';
import { shortage } from '@/lib/string';
import type { User } from '@privy-io/react-auth';
import type { FC, HTMLAttributes } from 'react';

export interface HeaderProps extends HTMLAttributes<HTMLDivElement> {
  user: User;
}

export const Header: FC<HeaderProps> = ({
  user,
  className,
  ...rest
}: HeaderProps) => {
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
    </div>
  );
};
