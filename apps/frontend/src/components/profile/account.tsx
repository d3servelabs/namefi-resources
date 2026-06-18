'use client';

import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import { cn } from '@namefi-astra/ui/lib/cn';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  shouldHighlight?: boolean;
  disabled?: boolean;
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
  shouldHighlight = false,
  disabled = false,
  ...rest
}: AccountProps) => {
  const t = useTranslations('profile');
  return (
    <div className={cn('space-y-2', className)} {...rest}>
      {showLabel && <Label>{title}</Label>}
      <div
        className={cn(
          'flex items-center justify-between rounded-lg p-3 bg-muted/30 min-h-15',
          shouldHighlight ? '' : 'border',
          shouldHighlight &&
            '[--background:#1c1c1c] [--ring-color:var(--brand-primary)]! [--duration:3s]! highlight-effect',
        )}
      >
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
              <div className="text-sm text-muted-foreground">
                {t('account.notConnected')}
              </div>
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
                disabled={disabled}
              >
                {t('account.unlink')}
              </Button>
            )
          : onLink && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onLink}
                disabled={disabled}
              >
                {t('account.link')}
              </Button>
            )}
      </div>
    </div>
  );
};
