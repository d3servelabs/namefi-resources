'use client';

import { useCallback, useState } from 'react';
import {
  DNS_MANAGEMENT_EMAIL_REQUIRED,
  EmailRequiredModal,
} from '@/components/dialogs/email-required-dialog';
import { useEmailPrompt } from '@/hooks/use-email-prompt';

/**
 * Gate DNS-mutation entry points behind an email on the user's profile.
 *
 * Wrap any handler that opens a DNS-mutation dialog (batch dialog, per-row
 * DNS dialogs) with `gate(action)`. When the user has no email, the action is
 * skipped and the email-required modal is shown instead; once they add an
 * email the flow continues normally on the next attempt.
 *
 * The hook returns the modal as a ready-to-render element so the caller only
 * has to drop `{modal}` into its JSX.
 */
export function useDnsEmailGate() {
  const { hasEmail } = useEmailPrompt();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const gate = useCallback(
    (action: () => void) => {
      if (!hasEmail) {
        setIsModalOpen(true);
        return;
      }
      action();
    },
    [hasEmail],
  );

  const modal = (
    <EmailRequiredModal
      isOpen={isModalOpen}
      onOpenChange={setIsModalOpen}
      title={DNS_MANAGEMENT_EMAIL_REQUIRED.title}
      description={DNS_MANAGEMENT_EMAIL_REQUIRED.description}
      actionText={DNS_MANAGEMENT_EMAIL_REQUIRED.actionText}
    />
  );

  return { gate, modal, hasEmail };
}
