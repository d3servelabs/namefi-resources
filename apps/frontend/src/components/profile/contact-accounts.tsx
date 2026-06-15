'use client';

import { Mail, Phone } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { usePrivy } from '@privy-io/react-auth';
import { useAuth } from '@/hooks/use-auth';
import { useQueryState, parseAsStringLiteral } from 'nuqs';
import { Account } from './account';

interface ContactAccountsProps {
  className?: string;
}
const ALLOW_UNLINK_EMAIL = true;
const ALLOW_UNLINK_PHONE = true;
export function ContactAccounts({ className = '' }: ContactAccountsProps) {
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
      alert(
        'You are impersonating a user, so you cannot link an email address',
      );
      return;
    }
    try {
      await linkEmail();
    } catch (error) {
      toast.error('Failed to link email', {
        description: `Please try again. ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }, [canUsePrivyActions, linkEmail, isImpersonating]);

  const handleUnlinkEmail = useCallback(async () => {
    if (!canUsePrivyActions) return;
    if (isImpersonating) {
      alert(
        'You are impersonating a user, so you cannot unlink an email address',
      );
      return;
    }
    try {
      await unlinkEmail(currentEmail);
    } catch (error) {
      toast.error('Failed to unlink email', {
        description: `Please try again. ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }, [canUsePrivyActions, unlinkEmail, isImpersonating, currentEmail]);

  const handleUnlinkPhone = useCallback(async () => {
    if (!canUsePrivyActions) return;
    if (isImpersonating) {
      alert(
        'You are impersonating a user, so you cannot unlink a phone number',
      );
      return;
    }
    try {
      await unlinkPhone(currentPhone);
      toast.success('Phone number unlinked', {
        description: 'Your phone number has been successfully unlinked.',
      });
    } catch (error) {
      toast.error('Failed to unlink phone', {
        description: `Please try again. ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }, [canUsePrivyActions, unlinkPhone, isImpersonating, currentPhone]);

  const handleLinkPhone = useCallback(async () => {
    if (!canUsePrivyActions) return;
    if (isImpersonating) {
      alert('You are impersonating a user, so you cannot link a phone number');
      return;
    }
    try {
      await linkPhone();
      toast.success('Phone number linked', {
        description: 'Your phone number has been successfully linked.',
      });
    } catch (error) {
      toast.error('Failed to link phone', {
        description: `Please try again. ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }, [canUsePrivyActions, linkPhone, isImpersonating]);

  return (
    <div className={`grid gap-4 md:grid-cols-2 ${className}`}>
      <Account
        title="Email Address"
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
        title="Phone Number"
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
