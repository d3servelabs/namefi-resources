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

export function ContactAccounts({ className = '' }: ContactAccountsProps) {
  const { linkEmail, linkPhone } = usePrivy();
  const { privyUser, isImpersonating } = useAuth();
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

  const handleLinkEmail = useCallback(() => {
    if (isImpersonating) {
      alert(
        'You are impersonating a user, so you cannot link an email address',
      );
      return;
    }
    try {
      linkEmail();
    } catch (error) {
      toast.error('Failed to link email', {
        description: `Please try again. ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }, [linkEmail, isImpersonating]);

  const handleLinkPhone = useCallback(() => {
    if (isImpersonating) {
      alert('You are impersonating a user, so you cannot link a phone number');
      return;
    }
    try {
      linkPhone();
    } catch (error) {
      toast.error('Failed to link phone', {
        description: `Please try again. ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }, [linkPhone, isImpersonating]);

  return (
    <div className={`grid gap-4 md:grid-cols-2 ${className}`}>
      <Account
        title="Email Address"
        icon={<Mail className="h-5 w-5" />}
        isLinked={!!currentEmail}
        linkedValue={currentEmail}
        verified={!!currentEmail}
        onLink={handleLinkEmail}
        showLabel={true}
        shouldHighlight={shouldHighlightEmail}
      />

      <Account
        title="Phone Number"
        icon={<Phone className="h-5 w-5" />}
        isLinked={!!currentPhone}
        linkedValue={currentPhone}
        verified={!!currentPhone}
        onLink={handleLinkPhone}
        showLabel={true}
      />
    </div>
  );
}
