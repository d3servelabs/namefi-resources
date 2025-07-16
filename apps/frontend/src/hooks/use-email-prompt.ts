import { LocalStorageKeys } from '@/utils/localStorageKeys';
import { addDays, isAfter } from 'date-fns';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useLocalStorage } from 'usehooks-ts';
import { useAuth } from './use-auth';

export interface EmailPromptConfig {
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
  toastId?: string;
  suppressDaysAfterDismissal?: number;
}

export function useEmailPrompt(config: EmailPromptConfig = {}) {
  const { privyUser, isAuthenticated } = useAuth();

  // Memoize the final config to avoid dependency issues
  const finalConfig = useMemo(
    () => ({
      title: config.title || 'Consider Adding Your Email',
      description:
        config.description ||
        'We send important notifications via email (including order status updates)',
      actionText: config.actionText || 'Visit Profile',
      actionHref: config.actionHref || '/profile?tab=contact-details',
      toastId: config.toastId || 'missing-email-warning',
      suppressDaysAfterDismissal: config.suppressDaysAfterDismissal || 3,
    }),
    [config],
  );

  const [
    missingEmailToastLastDismissedDate,
    setMissingEmailToastLastDismissedDate,
  ] = useLocalStorage<string | null>(
    LocalStorageKeys.MISSING_EMAIL_TOAST_LAST_SHOWN_DATE,
    null,
  );

  const missingEmailToastDismissalExpired = useCallback(
    (currentDate: Date) => {
      if (!missingEmailToastLastDismissedDate) {
        return true;
      }

      const lastShownDate = new Date(missingEmailToastLastDismissedDate);
      return isAfter(
        currentDate,
        addDays(lastShownDate, finalConfig.suppressDaysAfterDismissal),
      );
    },
    [
      missingEmailToastLastDismissedDate,
      finalConfig.suppressDaysAfterDismissal,
    ],
  );

  const hasVerifiedEmail = useCallback(() => {
    // Use address as the primary indicator since Privy handles verification internally
    return !!privyUser?.email?.address;
  }, [privyUser]);

  const hasEmail = useCallback(() => {
    return !!privyUser?.email?.address;
  }, [privyUser]);

  const showEmailPrompt = useCallback(
    (force = false) => {
      if (!isAuthenticated || hasEmail()) {
        return false;
      }

      const now = new Date();
      if (!force && !missingEmailToastDismissalExpired(now)) {
        return false;
      }

      toast.info(finalConfig.title, {
        id: finalConfig.toastId,
        description: finalConfig.description,
        action: {
          label: finalConfig.actionText,
          onClick: () => {
            window.location.href = finalConfig.actionHref;
          },
        },
        onDismiss: () => {
          setMissingEmailToastLastDismissedDate(now.toString());
        },
      });

      return true;
    },
    [
      isAuthenticated,
      hasEmail,
      missingEmailToastDismissalExpired,
      finalConfig,
      setMissingEmailToastLastDismissedDate,
    ],
  );

  const showEmailPromptForced = useCallback(() => {
    return showEmailPrompt(true);
  }, [showEmailPrompt]);

  return {
    hasEmail: hasEmail(),
    hasVerifiedEmail: hasVerifiedEmail(),
    showEmailPrompt,
    showEmailPromptForced,
    canShowPrompt: isAuthenticated && !hasEmail(),
  };
}
