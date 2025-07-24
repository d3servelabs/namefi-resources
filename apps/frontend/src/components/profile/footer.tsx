'use client';

import { cn } from '@/lib/cn';
import type { User } from '@privy-io/react-auth';
import type { FC, HTMLAttributes } from 'react';

export interface FooterProps extends HTMLAttributes<HTMLDivElement> {
  user: User;
}

export const Footer: FC<FooterProps> = ({
  user,
  className,
  ...rest
}: FooterProps) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between gap-4 md:flex-row',
        className,
      )}
      {...rest}
    />
  );
};
