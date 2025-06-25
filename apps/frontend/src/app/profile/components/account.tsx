'use client';

import { Button } from '@/components/ui/shadcn/button';
import { Label } from '@/components/ui/shadcn/label';
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
  showLabel?: boolean;
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
  showLabel = false,
  ...rest
}: AccountProps) => {
  return (
    <div className={cn('space-y-2', className)} {...rest}>
      {showLabel && <Label>{title}</Label>}
      <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 text-muted-foreground">{icon}</div>
          <div>
            {isLinked && linkedValue ? (
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium">{linkedValue}</div>
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

        {isLinked
          ? onUnlink && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onUnlink}
              >
                Unlink
              </Button>
            )
          : onLink && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onLink}
              >
                Link
              </Button>
            )}
      </div>
    </div>
  );
};
