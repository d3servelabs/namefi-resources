'use client';

import { useState, useCallback, useMemo } from 'react';
import { useLogin } from '@/hooks/use-login';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { toast } from 'sonner';

export interface HuntChoiceDialogOptions {
  onShare?: (domainName: NamefiNormalizedDomain) => void;
  onLoginSuccess?: (domainName: NamefiNormalizedDomain) => Promise<void>;
}

export function useHuntVoteChoice(options: HuntChoiceDialogOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDomain, setCurrentDomain] =
    useState<NamefiNormalizedDomain | null>(null);

  const showChoiceDialog = useCallback((domainName: NamefiNormalizedDomain) => {
    setCurrentDomain(domainName);
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
  }, []);

  const loginCallbacks = useMemo(
    () => ({
      onComplete: async () => {
        if (currentDomain && options.onLoginSuccess) {
          await options.onLoginSuccess(currentDomain);
          setCurrentDomain(null);
        }
      },
    }),
    [currentDomain, options.onLoginSuccess],
  );

  // Use login with callback for auto-vote
  const { login } = useLogin(loginCallbacks);

  const onChooseLogin = useCallback(() => {
    // Close dialog and trigger login
    closeDialog();
    void login().catch((error) => {
      toast.error('Could not start sign in', {
        description:
          error instanceof Error ? error.message : 'Please try again.',
      });
    });
  }, [closeDialog, login]);

  const onChooseShare = useCallback(() => {
    // Close our dialog and trigger share flow
    if (currentDomain && options.onShare) {
      options.onShare(currentDomain);
    }
    closeDialog();
    setCurrentDomain(null);
  }, [currentDomain, options.onShare, closeDialog]);

  return {
    // State (for components to render)
    isOpen,
    currentDomain,

    // Component rendering callbacks
    onClose: closeDialog,
    onChooseLogin,
    onChooseShare,

    // Hook management functions
    showChoiceDialog,
    closeDialog,
  };
}
