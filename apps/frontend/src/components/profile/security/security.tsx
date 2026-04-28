'use client';

import type { HTMLAttributes } from 'react';
import { cn } from '@namefi-astra/ui/lib/cn';
import { LoginHistory } from './login-history';

type SecurityProps = HTMLAttributes<HTMLDivElement>;

/**
 * Container for the "Security" tab of /profile. Currently wraps the login
 * history card; future security items (2FA, active sessions, password) can be
 * added here as sibling sections.
 */
export const Security = ({ className, ...rest }: SecurityProps) => {
  return (
    <div className={cn('flex flex-col gap-6', className)} {...rest}>
      <LoginHistory />
    </div>
  );
};
