'use client';

import { Mail, Phone } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { usePrivy } from '@privy-io/react-auth';
import { useAuth } from '@/hooks/use-auth';
import { useQueryState, parseAsStringLiteral } from 'nuqs';
import { useTranslations } from 'next-intl';
import { Account } from './account';

interface ContactAccountsProps {
  className?: string;
}
const ALLOW_UNLINK_EMAIL = true;
const ALLOW_UNLINK_PHONE = true;
export function ContactAccounts({ className = '' }: ContactAccountsProps) {
  const t = useTranslations('profile');
  const { linkEmail, linkPhone, unlinkEmail, unlinkPhone } = usePrivy();
  const {
    privyUser,
    isImpersonating,
    privyRuntimeReady,
    privyRuntimeAuthenticated,
  } = useAuth();
  const canUsePrivyActions =
    privyRuntimeReady && privyRuntimeAuthenticated && Boolean(privyUser);
  const [highlightParam, setHighlightParam] = useQueryState(
    'highlight',
    parseAsStringLiteral(['email'] as const).withOptions({
      clearOnDefault: true,
      shallow: true,
    }),
  );
  const [shouldHighlightEmail, setShouldHighlightEmail] = useState(false);

  // Get email and phone from Privy linked accounts
  const currentEmail = privyUser?.email?.address || '';
  const currentPhone = privyUser?.phone?.number || '';

  // Check for highlight query param and trigger effect
  useEffect(() => {
    if (highlightParam === 'email') {
      setShouldHighlightEmail(true);
      // Remove highlight after 2 seconds
      const timer = setTimeout(() => {
        setShouldHighlightEmail(false);
        // Clear the query param after effect completes
        setHighlightParam(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightParam, setHighlightParam]);

  const handleLinkEmail = useCallback(async () => {
    if (!canUsePrivyActions) return;
    if (isImpersonating) {
      alert(t('contactAccounts.impersonateLinkEmailAlert'));
      return;
    }
    try {
      await linkEmail();
    } catch (error) {
      toast.error(t('contactAccounts.linkEmailFailure'), {
        description: t('contactAccounts.tryAgain', {
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      });
    }
  }, [canUsePrivyActions, linkEmail, isImpersonating, t]);

  const handleUnlinkEmail = useCallback(async () => {
    if (!canUsePrivyActions) return;
    if (isImpersonating) {
      alert(t('contactAccounts.impersonateUnlinkEmailAlert'));
      return;
    }
    try {
      await unlinkEmail(currentEmail);
    } catch (error) {
      toast.error(t('contactAccounts.unlinkEmailFailure'), {
        description: t('contactAccounts.tryAgain', {
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      });
    }
  }, [canUsePrivyActions, unlinkEmail, isImpersonating, currentEmail, t]);

  const handleUnlinkPhone = useCallback(async () => {
    if (!canUsePrivyActions) return;
    if (isImpersonating) {
      alert(t('contactAccounts.impersonateUnlinkPhoneAlert'));
      return;
    }
    try {
      await unlinkPhone(currentPhone);
      toast.success(t('contactAccounts.unlinkPhoneSuccess'), {
        description: t('contactAccounts.unlinkPhoneSuccessDescription'),
      });
    } catch (error) {
      toast.error(t('contactAccounts.unlinkPhoneFailure'), {
        description: t('contactAccounts.tryAgain', {
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      });
    }
  }, [canUsePrivyActions, unlinkPhone, isImpersonating, currentPhone, t]);

  const handleLinkPhone = useCallback(async () => {
    if (!canUsePrivyActions) return;
    if (isImpersonating) {
      alert(t('contactAccounts.impersonateLinkPhoneAlert'));
      return;
    }
    try {
      await linkPhone();
      toast.success(t('contactAccounts.linkPhoneSuccess'), {
        description: t('contactAccounts.linkPhoneSuccessDescription'),
      });
    } catch (error) {
      toast.error(t('contactAccounts.linkPhoneFailure'), {
        description: t('contactAccounts.tryAgain', {
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      });
    }
  }, [canUsePrivyActions, linkPhone, isImpersonating, t]);

  return (
    <div className={`grid gap-4 md:grid-cols-2 ${className}`}>
      <Account
        title={t('contactAccounts.emailTitle')}
        icon={<Mail className="h-5 w-5" />}
        isLinked={!!currentEmail}
        linkedValue={currentEmail}
        verified={!!currentEmail}
        onLink={handleLinkEmail}
        onUnlink={ALLOW_UNLINK_EMAIL ? handleUnlinkEmail : undefined}
        showLabel={true}
        shouldHighlight={shouldHighlightEmail}
        disabled={!canUsePrivyActions}
      />

      <Account
        title={t('contactAccounts.phoneTitle')}
        icon={<Phone className="h-5 w-5" />}
        isLinked={!!currentPhone}
        linkedValue={currentPhone}
        verified={!!currentPhone}
        onLink={handleLinkPhone}
        onUnlink={ALLOW_UNLINK_PHONE ? handleUnlinkPhone : undefined}
        showLabel={true}
        disabled={!canUsePrivyActions}
      />
    </div>
  );
}
