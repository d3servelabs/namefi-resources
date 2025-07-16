'use client';

import { Mail, Phone } from 'lucide-react';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { usePrivy } from '@privy-io/react-auth';
import { useAuth } from '@/hooks/use-auth';
import { Account } from './account';

interface ContactAccountsProps {
  className?: string;
}

export function ContactAccounts({ className = '' }: ContactAccountsProps) {
  const { linkEmail, linkPhone } = usePrivy();
  const { privyUser } = useAuth();

  // Get email and phone from Privy linked accounts
  const currentEmail = privyUser?.email?.address || '';
  const currentPhone = privyUser?.phone?.number || '';

  const handleLinkEmail = useCallback(() => {
    try {
      linkEmail();
    } catch (error) {
      toast.error('Failed to link email', {
        description: `Please try again. ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }, [linkEmail]);

  const handleLinkPhone = useCallback(() => {
    try {
      linkPhone();
    } catch (error) {
      toast.error('Failed to link phone', {
        description: `Please try again. ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }, [linkPhone]);

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
