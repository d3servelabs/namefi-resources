import { useCallback } from 'react';
import { useTRPCClient } from '@/utils/trpc';
import { useCart } from '@/hooks/landing/use-cart';
import { toast } from 'sonner';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

interface RenewalResult {
  domain: string;
  success: boolean;
  reason?: string;
}

interface DomainWithExpiration {
  normalizedDomainName: NamefiNormalizedDomain;
  expirationDate?: Date | null;
}

export function useDomainRenewal() {
  const trpcClient = useTRPCClient();
  const { handleDomainAction, cartData } = useCart();

  const renewDomains = useCallback(
    async (
      domainsWithExpiration: DomainWithExpiration[],
    ): Promise<RenewalResult[]> => {
      const results: RenewalResult[] = [];

      try {
        // Extract just the domain names for the API call
        const domainNames = domainsWithExpiration.map(
          (d) => d.normalizedDomainName,
        );

        // Fetch domain availability info for all domains
        const domainListInfo =
          await trpcClient.registry.getDomainListInfo.query({
            domains: domainNames,
          });

        const itemsToAdd = [];
        const currentDate = new Date();

        // Process each domain and collect valid items
        for (let i = 0; i < domainsWithExpiration.length; i++) {
          const domainData = domainsWithExpiration[i];
          const domain = domainData.normalizedDomainName;
          const domainAvailabilityInfo = domainListInfo[i];

          // Check if domain is already in cart as a renewal
          const existingCartItem = cartData?.find(
            (item) =>
              item.normalizedDomainName === domain && item.type === 'RENEW',
          );

          if (existingCartItem) {
            results.push({
              domain,
              success: true,
              reason: 'Already in cart',
            });
            continue;
          }

          if (!domainAvailabilityInfo) {
            results.push({
              domain,
              success: false,
              reason: 'Domain info not available',
            });
            continue;
          }

          // Check if domain is expired using existing expiration date
          if (domainData.expirationDate) {
            const expirationDate = new Date(domainData.expirationDate);

            if (expirationDate <= currentDate) {
              results.push({
                domain,
                success: false,
                reason: 'Domain has already expired',
              });
              continue;
            }
          }

          // Check for duration validation from domainAvailabilityInfo
          if (!domainAvailabilityInfo?.durationValidationInYears?.min) {
            results.push({
              domain,
              success: false,
              reason: 'Duration validation data missing',
            });
            continue;
          }

          const minDurationYears =
            domainAvailabilityInfo.durationValidationInYears.min;

          // Collect valid items for batch addition
          itemsToAdd.push({
            domainAvailabilityInfo,
            durationInYears: minDurationYears,
            operationType: 'RENEW' as const,
            toggle: false,
            domain, // Keep for results tracking
          });
        }

        // Batch add all valid items to cart
        if (itemsToAdd.length > 0) {
          try {
            await handleDomainAction(
              itemsToAdd.map(({ domain, ...item }) => item),
            );

            // Mark all as successful
            itemsToAdd.forEach(({ domain }) => {
              results.push({
                domain,
                success: true,
              });
            });
          } catch (error) {
            // Mark all as failed
            itemsToAdd.forEach(({ domain }) => {
              results.push({
                domain,
                success: false,
                reason:
                  error instanceof Error
                    ? error.message
                    : 'Failed to add to cart',
              });
            });
          }
        }

        // Show results toasts
        const successResults = results.filter((r) => r.success);
        const failureResults = results.filter((r) => !r.success);

        // Separate successful results by type
        const newlyAddedResults = successResults.filter(
          (r) => r.reason !== 'Already in cart',
        );
        const alreadyInCartResults = successResults.filter(
          (r) => r.reason === 'Already in cart',
        );

        if (newlyAddedResults.length > 0) {
          toast.success(
            newlyAddedResults.length === 1
              ? 'Domain added to cart for renewal'
              : `${newlyAddedResults.length} domains added to cart for renewal`,
          );
        }

        if (alreadyInCartResults.length > 0) {
          toast.success(
            alreadyInCartResults.length === 1
              ? 'Domain already in cart for renewal'
              : `${alreadyInCartResults.length} domains already in cart for renewal`,
          );
        }

        if (failureResults.length > 0) {
          const groupedByReason = failureResults.reduce(
            (acc, result) => {
              const reason = result.reason || 'Unknown error';
              if (!acc[reason]) {
                acc[reason] = [];
              }
              acc[reason].push(result.domain);
              return acc;
            },
            {} as Record<string, string[]>,
          );

          const reasonMessages = Object.entries(groupedByReason)
            .map(([reason, domains]) => `${reason}: ${domains.join(', ')}`)
            .join('\n');

          toast.warning(
            `Failed to add domains for renewal:\n${reasonMessages}`,
          );
        }

        return results;
      } catch (error) {
        toast.error(
          error instanceof Error
            ? `Failed to process renewals: ${error.message}`
            : 'Failed to process renewals',
        );
        return domainsWithExpiration.map((domainData) => ({
          domain: domainData.normalizedDomainName,
          success: false,
          reason:
            error instanceof Error
              ? error.message
              : 'Unexpected error occurred',
        }));
      }
    },
    [trpcClient, cartData, handleDomainAction],
  );

  return {
    renewDomains,
  };
}
