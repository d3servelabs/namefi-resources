'use client';

import { Button } from '@/components/ui/shadcn/button';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';

interface AccountProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  icon: ReactNode;
  isLinked: boolean;
  linkedValue?: string | null;
  verified?: boolean;
  onLink: () => void;
  onUnlink: () => void;
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
        'flex items-center justify-between rounded-lg border p-4',
        className,
      )}
      {...rest}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          {icon}
        </div>
        <div>
          <p className="font-medium">{title}</p>
          {isLinked ? (
            <div className="flex items-center gap-1">
              <p className="text-sm text-muted-foreground">{linkedValue}</p>
              {verified && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Not connected</p>
          )}
        </div>
      </div>

      {isLinked ? (
        <Button variant="outline" size="sm" onClick={onUnlink}>
          Unlink
        </Button>
      ) : (
        <Button size="sm" onClick={onLink}>
          Link
        </Button>
      )}
    </div>
  );
};
