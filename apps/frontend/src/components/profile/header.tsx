'use client';

import { Copy } from '@/components/copy';
import { CurrentUserAvatar } from '@/components/current-user-avatar';
import {
  getAuthDisplayProfileSafeIdentifier,
  type RuntimeAuthDisplayProfile,
} from '@/components/providers/auth-display-profile';
import { getUserDisplaySafeIdentifierPair } from '@/lib/user';
import { cn } from '@namefi-astra/ui/lib/cn';
import { shortage } from '@/lib/string';
import type { User } from '@privy-io/react-auth';
import { useTranslations } from 'next-intl';
import type { FC, HTMLAttributes } from 'react';

export interface HeaderProps extends HTMLAttributes<HTMLDivElement> {
  user: User | null | undefined;
  unsafeDisplayProfile?: RuntimeAuthDisplayProfile | null;
}

export const Header: FC<HeaderProps> = ({
  user,
  unsafeDisplayProfile,
  className,
  ...rest
}: HeaderProps) => {
  const t = useTranslations('profile');
  const { primary, secondary } = getUserDisplaySafeIdentifierPair(user);
  const primaryDisplay =
    primary ?? getAuthDisplayProfileSafeIdentifier(unsafeDisplayProfile);
  const secondaryDisplay = primary ? secondary : null;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between gap-4 md:flex-row',
        className,
      )}
      {...rest}
    >
      <div className="flex items-center gap-4">
        <CurrentUserAvatar className="h-20 w-20" imageSizes="80px" />
        <div>
          {primaryDisplay ? (
            <Copy
              text={primaryDisplay}
              className="text-2xl font-bold"
              copiedTitle={t('header.accountIdentifierCopied')}
              copiedDescription={t('header.accountIdentifierCopiedDescription')}
            >
              {shortage(primaryDisplay, 11)}
            </Copy>
          ) : (
            ''
          )}
          {secondaryDisplay ? (
            <Copy
              text={secondaryDisplay}
              className="text-sm text-muted-foreground"
              copiedTitle={t('header.accountEmailCopied')}
              copiedDescription={t('header.accountEmailCopiedDescription')}
            >
              {shortage(secondaryDisplay, 11)}
            </Copy>
          ) : null}
        </div>
      </div>
    </div>
  );
};
