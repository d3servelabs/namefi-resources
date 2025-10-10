import { useState, useCallback, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { useTRPC } from '@/lib/trpc';
import { HUNT_CAMPAIGN_KEYS } from '@/lib/hunt-campaign-keys';
import { InteractionLoggingEventName } from '@/lib/analytics-events';
import { useInteractionLoggers } from '@/components/providers/analytics';
import { useAuth } from '@/hooks/use-auth';

// Helper function to build share URL using current window origin
function buildShareUrl(domainName: string, campaignKey?: string): string {
  const params = new URLSearchParams({
    utm_source: 'twitter',
    utm_medium: 'share',
    ...(campaignKey && { utm_campaign: campaignKey }),
    utm_content: domainName,
  });

  // Use current window origin to build the URL
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://namefi.io';
  return `${origin}?${params.toString()}`;
}

export interface ShareConfig {
  // Enable/disable sharing entirely
  enabled?: boolean;

  // Enable sharing for specific domain extensions (e.g., ['.cv'])
  allowedExtensions?: string[];

  // Enable sharing for specific campaign keys
  allowedCampaignKeys?: string[];

  // Procedural resolver to derive campaign key for a domain
  // Return string or null/undefined when no campaign applies. May be async.
  campaignKeyResolver?: (
    domain: NamefiNormalizedDomain,
  ) => string | null | undefined | Promise<string | null | undefined>;

  // Whether to track shares in database (default: true)
  trackShares?: boolean;
  // Feature key for analytics attribution (e.g., 'hunt', 'ai_generation')
  featureKey?: string;
}

export function useTwitterShareDialog(config: ShareConfig = {}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { logEventWithInteractionLoggers } = useInteractionLoggers();

  const [isOpen, setIsOpen] = useState(false);
  const [currentDomain, setCurrentDomain] =
    useState<NamefiNormalizedDomain | null>(null);
  const [resolvedCampaignKey, setResolvedCampaignKey] = useState<
    string | undefined
  >(undefined);

  // Memoize config with defaults
  const finalConfig = useMemo(
    () => ({
      enabled: config.enabled ?? false,
      allowedExtensions: config.allowedExtensions ?? [],
      allowedCampaignKeys: config.allowedCampaignKeys ?? [],
      campaignKeyResolver: config.campaignKeyResolver,
      trackShares: config.trackShares ?? true,
      featureKey: config.featureKey ?? 'hunt',
    }),
    [config],
  );

  // Resolve campaign key procedurally for current domain when needed
  useEffect(() => {
    let isActive = true;
    const resolve = async () => {
      // If no domain or no resolver, clear resolved state
      if (!currentDomain || !finalConfig.campaignKeyResolver) {
        if (isActive) setResolvedCampaignKey(undefined);
        return;
      }
      try {
        const maybeKey = await finalConfig.campaignKeyResolver(currentDomain);
        if (isActive) setResolvedCampaignKey(maybeKey ?? undefined);
      } catch {
        if (isActive) setResolvedCampaignKey(undefined);
      }
    };
    resolve();
    return () => {
      isActive = false;
    };
  }, [currentDomain, finalConfig.campaignKeyResolver]);

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

  // Get share status for current domain (only if tracking is enabled)
  const { data: shareStatusData, isLoading: isCheckingStatus } = useQuery({
    ...trpc.share.hasUserShared.queryOptions({
      normalizedDomainName: currentDomain ?? '',
    }),
    enabled: !!currentDomain && isAuthenticated && finalConfig.trackShares,
    staleTime: 30000, // Cache for 30s for snappy UI
  });

  const hasShared = shareStatusData?.hasShared ?? false;

  // Generate share URL on frontend for consistency
  const shareUrl = useMemo(() => {
    if (!currentDomain) return null;
    return buildShareUrl(currentDomain, resolvedCampaignKey);
  }, [currentDomain, resolvedCampaignKey]);

  // Submit share mutation (authenticated)
  const submitShareMutation = useMutation({
    ...trpc.share.submitShare.mutationOptions(),
    onSuccess: (data, variables) => {
      // Track completion event
      logEventWithInteractionLoggers({
        name: InteractionLoggingEventName.ShareRecorded,
        properties: {
          domainName: currentDomain ?? '',
          campaignKey: resolvedCampaignKey,
          featureKey: finalConfig.featureKey,
          sharedUrl: data.sharedUrl,
          postUrl: variables.postUrl,
        },
      });

      // Invalidate share status to show updated state (only if tracking)
      if (currentDomain && finalConfig.trackShares) {
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

  // Submit share mutation (anonymous)
  const submitShareAnonymousMutation = useMutation({
    ...trpc.share.submitShareAnonymous.mutationOptions(),
    onSuccess: (data, variables) => {
      // Track completion event
      logEventWithInteractionLoggers({
        name: InteractionLoggingEventName.ShareRecorded,
        properties: {
          domainName: currentDomain ?? '',
          campaignKey: resolvedCampaignKey,
          featureKey: finalConfig.featureKey,
          sharedUrl: data.sharedUrl,
          postUrl: variables.postUrl,
        },
      });

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
          campaignKey: resolvedCampaignKey,
          featureKey: finalConfig.featureKey,
          trigger: 'manual',
        },
      });
    },
    [
      resolvedCampaignKey,
      finalConfig.featureKey,
      logEventWithInteractionLoggers,
    ],
  );

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setCurrentDomain(null);
  }, []);

  // Vote success callback
  const onVoteSuccess = useCallback(
    (domainName: NamefiNormalizedDomain) => {
      // Only show dialog if sharing is eligible and user hasn't shared yet
      if (isEligible(domainName, resolvedCampaignKey)) {
        setCurrentDomain(domainName);
        setIsOpen(true);

        // Track dialog opened from vote
        logEventWithInteractionLoggers({
          name: InteractionLoggingEventName.ShareDialogOpened,
          properties: {
            domainName: domainName,
            campaignKey: resolvedCampaignKey,
            featureKey: finalConfig.featureKey,
            trigger: 'vote_success',
          },
        });
      }
    },
    [
      isEligible,
      resolvedCampaignKey,
      finalConfig.featureKey,
      logEventWithInteractionLoggers,
    ],
  );

  // Submit share (supports both authenticated and anonymous)
  const submitShare = useCallback(
    async (postUrl: string) => {
      if (!currentDomain || !shareUrl) return;

      if (finalConfig.trackShares) {
        if (isAuthenticated) {
          // Use authenticated endpoint
          await submitShareMutation.mutateAsync({
            normalizedDomainName: currentDomain,
            postUrl,
            sharedUrl: shareUrl,
            campaignKey: resolvedCampaignKey,
          });
        } else {
          // Use anonymous endpoint
          await submitShareAnonymousMutation.mutateAsync({
            normalizedDomainName: currentDomain,
            postUrl,
            sharedUrl: shareUrl,
            campaignKey: resolvedCampaignKey,
          });
        }
      } else {
        // Just track the GA event and close dialog
        logEventWithInteractionLoggers({
          name: InteractionLoggingEventName.ShareRecorded,
          properties: {
            domainName: currentDomain,
            campaignKey: resolvedCampaignKey,
            featureKey: finalConfig.featureKey,
            sharedUrl: shareUrl,
            postUrl: postUrl,
          },
        });
        closeDialog();
        toast.success('Thanks for sharing!');
      }
    },
    [
      currentDomain,
      shareUrl,
      resolvedCampaignKey,
      finalConfig.trackShares,
      finalConfig.featureKey,
      isAuthenticated,
      submitShareMutation,
      submitShareAnonymousMutation,
      logEventWithInteractionLoggers,
      closeDialog,
    ],
  );

  return {
    // Dialog state
    isOpen,
    currentDomain,

    // Actions
    openDialog,
    closeDialog,
    onClose: closeDialog,

    // Vote integration
    onVoteSuccess,

    // Eligibility
    isEligible,

    // Share status & submission
    hasShared,
    isCheckingStatus,
    submitShare,
    onSubmit: submitShare,
    isSubmitting:
      submitShareMutation.isPending || submitShareAnonymousMutation.isPending,

    // Share URL
    shareUrl,

    // Campaign key
    campaignKey: resolvedCampaignKey,
  };
}

export const defaultShareConfig: ShareConfig = {
  enabled: true,
  trackShares: true,
  campaignKeyResolver: (domain) => {
    const lower = domain.toLowerCase();
    if (lower.endsWith('.cv')) return HUNT_CAMPAIGN_KEYS.CV;
    if (lower.endsWith('.today')) return HUNT_CAMPAIGN_KEYS.CTA;
    return undefined;
  },
};
