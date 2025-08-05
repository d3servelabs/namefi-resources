import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { useTRPC } from '@/lib/trpc';
import { InteractionLoggingEventName } from '@/lib/analytics-events';
import { useInteractionLoggers } from '@/components/providers/analytics';
import { useAuth } from '@/hooks/use-auth';

// Helper function to build share URL using current window origin
function buildShareUrl(domainName: string, campaignKey?: string): string {
  const params = new URLSearchParams({
    utm_source: 'twitter',
    utm_medium: 'share',
    utm_campaign: campaignKey || 'cv_hunt',
    utm_content: domainName,
  });

  // Use current window origin to build the URL
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://namefi.io';
  return `${origin}/cv/${domainName}?${params.toString()}`;
}

interface ShareConfig {
  // Enable/disable sharing entirely
  enabled?: boolean;

  // Enable sharing for specific domain extensions (e.g., ['.cv'])
  allowedExtensions?: string[];

  // Enable sharing for specific campaign keys
  allowedCampaignKeys?: string[];

  // Current campaign key for context
  campaignKey?: string;
}

interface UseHuntShareDialogReturn {
  // Dialog state
  isOpen: boolean;
  currentDomain: NamefiNormalizedDomain | null;

  // Actions (snappy UI focused)
  openDialog: (domainName: NamefiNormalizedDomain) => void;
  closeDialog: () => void;

  // Vote integration
  onVoteSuccess: (domainName: NamefiNormalizedDomain) => void;

  // Share eligibility
  isEligible: (
    domainName: NamefiNormalizedDomain,
    campaignKey?: string,
  ) => boolean;

  // Share status & submission
  hasShared: boolean;
  isCheckingStatus: boolean;
  submitShare: (postUrl: string) => Promise<void>;
  isSubmitting: boolean;

  // Generated share URL (for UI display)
  shareUrl: string | null;
}

export function useHuntShareDialog(
  config: ShareConfig = {},
): UseHuntShareDialogReturn {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { logEventWithInteractionLoggers } = useInteractionLoggers();

  const [isOpen, setIsOpen] = useState(false);
  const [currentDomain, setCurrentDomain] =
    useState<NamefiNormalizedDomain | null>(null);

  // Memoize config with defaults
  const finalConfig = useMemo(
    () => ({
      enabled: config.enabled ?? false,
      allowedExtensions: config.allowedExtensions ?? [],
      allowedCampaignKeys: config.allowedCampaignKeys ?? [],
      campaignKey: config.campaignKey,
    }),
    [config],
  );

  // Check share eligibility
  const isEligible = useCallback(
    (domainName: NamefiNormalizedDomain, campaignKey?: string) => {
      if (!finalConfig.enabled) return false;

      const { allowedExtensions, allowedCampaignKeys } = finalConfig;

      // If no restrictions, allow all
      if (!allowedExtensions.length && !allowedCampaignKeys.length) {
        return true;
      }

      // Check extension match
      const extensionMatch = allowedExtensions.some((ext) =>
        domainName.endsWith(ext),
      );

      // Check campaign match
      const campaignMatch =
        campaignKey && allowedCampaignKeys.includes(campaignKey);

      // OR logic: match either extension OR campaign
      return !!(extensionMatch || campaignMatch);
    },
    [finalConfig],
  );

  // Get share status for current domain
  const { data: shareStatusData, isLoading: isCheckingStatus } = useQuery({
    ...trpc.share.hasUserShared.queryOptions({
      normalizedDomainName: currentDomain ?? '',
    }),
    enabled: !!currentDomain && isAuthenticated,
    staleTime: 30000, // Cache for 30s for snappy UI
  });

  const hasShared = shareStatusData?.hasShared ?? false;

  // Generate share URL on frontend for consistency
  const shareUrl = useMemo(() => {
    if (!currentDomain) return null;
    return buildShareUrl(currentDomain, finalConfig.campaignKey);
  }, [currentDomain, finalConfig.campaignKey]);

  // Submit share mutation
  const submitShareMutation = useMutation({
    ...trpc.share.submitShare.mutationOptions(),
    onSuccess: (data, variables) => {
      // Track completion event
      logEventWithInteractionLoggers({
        name: InteractionLoggingEventName.ShareCompleted,
        properties: {
          domainName: currentDomain ?? '',
          campaignKey: finalConfig.campaignKey,
          sharedUrl: data.sharedUrl,
          postUrl: variables.postUrl,
        },
      });

      // Invalidate share status to show updated state
      if (currentDomain) {
        queryClient.invalidateQueries({
          queryKey: trpc.share.hasUserShared.queryKey({
            normalizedDomainName: currentDomain,
          }),
        });
      }

      // Close dialog and show success
      closeDialog();
      toast.success('Share recorded successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to record share: ${error.message}`);
    },
  });

  // Dialog actions
  const openDialog = useCallback(
    (domainName: NamefiNormalizedDomain) => {
      setCurrentDomain(domainName);
      setIsOpen(true);

      // Track dialog opened
      logEventWithInteractionLoggers({
        name: InteractionLoggingEventName.ShareDialogOpened,
        properties: {
          domainName: domainName,
          campaignKey: finalConfig.campaignKey,
          trigger: 'manual',
        },
      });
    },
    [finalConfig.campaignKey, logEventWithInteractionLoggers],
  );

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setCurrentDomain(null);
  }, []);

  // Vote success callback
  const onVoteSuccess = useCallback(
    (domainName: NamefiNormalizedDomain) => {
      // Only show dialog if sharing is eligible and user hasn't shared yet
      if (isEligible(domainName, finalConfig.campaignKey)) {
        setCurrentDomain(domainName);
        setIsOpen(true);

        // Track dialog opened from vote
        logEventWithInteractionLoggers({
          name: InteractionLoggingEventName.ShareDialogOpened,
          properties: {
            domainName: domainName,
            campaignKey: finalConfig.campaignKey,
            trigger: 'vote_success',
          },
        });
      }
    },
    [isEligible, finalConfig.campaignKey, logEventWithInteractionLoggers],
  );

  // Submit share
  const submitShare = useCallback(
    async (postUrl: string) => {
      if (!currentDomain || !shareUrl) return;

      await submitShareMutation.mutateAsync({
        normalizedDomainName: currentDomain,
        postUrl,
        sharedUrl: shareUrl,
        campaignKey: finalConfig.campaignKey,
      });
    },
    [currentDomain, shareUrl, finalConfig.campaignKey, submitShareMutation],
  );

  return {
    // Dialog state
    isOpen,
    currentDomain,

    // Actions
    openDialog,
    closeDialog,

    // Vote integration
    onVoteSuccess,

    // Eligibility
    isEligible,

    // Share status & submission
    hasShared,
    isCheckingStatus,
    submitShare,
    isSubmitting: submitShareMutation.isPending,

    // Share URL
    shareUrl,
  };
}

export type UseHuntShareDialog = ReturnType<typeof useHuntShareDialog>;
