'use client';

import { NamefiButton } from '@/components/namefi-button';
import { Button } from '@/components/ui/shadcn/button';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';

export interface AccountProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  icon: ReactNode;
  isLinked?: boolean;
  linkedValue?: string | null;
  verified?: boolean;
  onLink?: () => void;
  onUnlink?: () => void;
}

export const Account = ({
  className,
  title,
  icon,
  isLinked,
  linkedValue,
  verified,
  onLink,
  onUnlink,
  ...rest
}: AccountProps) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between w-full rounded-lg border p-4',
        className,
      )}
      {...rest}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          {icon}
        </div>
        <div>
          <div className="font-medium">{title}</div>
          {isLinked ? (
            <div className="flex items-center gap-1">
              <div className="text-sm text-muted-foreground">{linkedValue}</div>
              {verified && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Not connected</div>
          )}
        </div>
      </div>

      {isLinked ? (
        <Button variant="outline" size="sm" onClick={onUnlink}>
          Unlink
        </Button>
      ) : (
        <NamefiButton size="sm" onClick={onLink}>
          Link
        </NamefiButton>
      )}
    </div>
  );
};
