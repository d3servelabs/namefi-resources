import type { ReactNode } from 'react';

import { cn } from '@namefi-astra/ui/lib/cn';

type PageShellSize = 'default' | 'wide' | 'narrow' | 'full';
type PageShellPadding =
  | 'none'
  | 'compact'
  | 'default'
  | 'relaxed'
  | 'roomy'
  | 'admin';

export type PageShellProps = {
  children: ReactNode;
  className?: string;
  shellClassName?: string;
  size?: PageShellSize;
  padding?: PageShellPadding;
  gutter?: boolean;
};

const sizeClasses: Record<PageShellSize, string> = {
  default: 'container mx-auto',
  wide: 'container mx-auto max-w-6xl',
  narrow: 'container mx-auto max-w-3xl',
  full: 'w-full',
};

const paddingClasses: Record<PageShellPadding, string> = {
  none: '',
  compact: 'py-8 px-4 sm:px-8',
  default: 'py-8 px-8',
  relaxed: 'py-10 px-4 sm:px-6 lg:px-8',
  roomy: 'py-10 px-6 md:px-8 lg:px-10',
  admin: 'p-6',
};

export function PageShell({
  children,
  className,
  shellClassName,
  size = 'default',
  padding = 'default',
  gutter = true,
}: PageShellProps) {
  return (
    <div
      className={cn(
        'w-full',
        sizeClasses[size],
        paddingClasses[padding],
        shellClassName,
      )}
    >
      <div className="flex">
        {gutter && (
          <div className="hidden md:block w-12 shrink-0" aria-hidden />
        )}
        <div className={cn('min-w-0 flex-1', className)}>{children}</div>
      </div>
    </div>
  );
}

PageShell.displayName = 'PageShell';
