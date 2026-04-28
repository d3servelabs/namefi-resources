'use client';

import type { HTMLAttributes } from 'react';
import { cn } from '@namefi-astra/ui/lib/cn';
import { ApiKeys } from '../api-keys';
import { LoginHistory } from './login-history';

type SecurityProps = HTMLAttributes<HTMLDivElement>;

/**
 * Container for the "Security" tab of /profile. Bundles every account-
 * security-related card so they live in one place: API keys (active
 * controls) on top, login history (audit) below. Future items (2FA,
 * active sessions, password reset) slot in here as siblings.
 */
export const Security = ({ className, ...rest }: SecurityProps) => {
  return (
    <div className={cn('flex flex-col gap-6', className)} {...rest}>
      <ApiKeys />
      <LoginHistory />
    </div>
  );
};
