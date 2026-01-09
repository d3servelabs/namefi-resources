'use client';

import { useTRPC } from '@/lib/trpc';
import type { AppRouterOutput } from '@/lib/trpc';
import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import type { LogoFormData } from '../logo-generator';
import type { PosterFormData } from '../poster-generator';
import type {
  ImageModel as Model,
  LogoStyleInput,
  LogoTypeInput,
  MarketingCollateralTypeInput,
} from '@namefi-astra/ai/types';
import { useGalleryPending } from '../gallery-pending-context';

interface UseLogoGenerationProps {
  domain?: NamefiNormalizedDomain;
}

export function useLogoGeneration({ domain }: UseLogoGenerationProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { addPendingItem, removePendingItem, resolvePendingItem } =
    useGalleryPending();

  return useMutation(
    trpc.ai.generateLogo.mutationOptions({
      onMutate: async (variables) => {
        const pendingDomain = variables.domain ?? domain;
        if (!pendingDomain) return {};
        const pendingId = addPendingItem({
          domain: pendingDomain,
          type: 'logo',
        });
        return { pendingId } as { pendingId?: string };
      },
      onSuccess: (data, variables, context) => {
        if (context?.pendingId) {
          resolvePendingItem(context.pendingId, data);
        }
        const targetDomain = data?.domain ?? variables?.domain ?? domain;

        // Update the cache with the new generation
        queryClient.setQueryData(
          trpc.ai.getGenerationsByDomain.queryKey({ domain: targetDomain }),
          (old) => {
            if (!old) return [data];
            return [...old, data];
          },
        );

        // Invalidate to ensure we have the latest data
        queryClient.invalidateQueries({
          queryKey: trpc.ai.getGenerationsByDomain.queryKey({
            domain: targetDomain,
          }),
        });

        queryClient.invalidateQueries({
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            query.queryKey[0] === 'ai' &&
            query.queryKey[1] === 'getUserGenerationsFiltered',
          refetchType: 'active',
        });

        // Also invalidate the user domains query to update counts
        queryClient.invalidateQueries({
          queryKey: trpc.ai.getUserDomains.queryKey(),
        });

        // Invalidate the usage query to update the generation count
        queryClient.invalidateQueries({
          queryKey: trpc.ai.getUserGenerationUsage.queryKey(),
        });
      },
      onError: (error, _variables, context) => {
        if (context?.pendingId) {
          removePendingItem(context.pendingId);
        }
        const errorMessage =
          error.message || 'An error occurred generating logos';
        toast.error(errorMessage);
      },
    }),
  );
}

interface UsePosterGenerationProps {
  domain?: NamefiNormalizedDomain;
}

export function usePosterGeneration({ domain }: UsePosterGenerationProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { addPendingItem, removePendingItem, resolvePendingItem } =
    useGalleryPending();

  return useMutation(
    trpc.ai.generatePoster.mutationOptions({
      onMutate: async (variables) => {
        const pendingDomain = variables.domain ?? domain;
        if (!pendingDomain) return {};
        const pendingId = addPendingItem({
          domain: pendingDomain,
          type: 'marketing',
        });
        return { pendingId } as { pendingId?: string };
      },
      onSuccess: (data, variables, context) => {
        if (context?.pendingId) {
          resolvePendingItem(context.pendingId, data);
        }
        const targetDomain =
          data?.domain ??
          (variables as { domain?: NamefiNormalizedDomain })?.domain ??
          domain;
        // Update the cache with the new generation
        queryClient.setQueryData(
          trpc.ai.getGenerationsByDomain.queryKey({ domain: targetDomain }),
          (old) => {
            if (!old) return [data];
            return [...old, data];
          },
        );

        // Invalidate to ensure we have the latest data
        queryClient.invalidateQueries({
          queryKey: trpc.ai.getGenerationsByDomain.queryKey({
            domain: targetDomain,
          }),
        });

        queryClient.invalidateQueries({
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            query.queryKey[0] === 'ai' &&
            query.queryKey[1] === 'getUserGenerationsFiltered',
          refetchType: 'active',
        });

        // Also invalidate the user domains query to update counts
        queryClient.invalidateQueries({
          queryKey: trpc.ai.getUserDomains.queryKey(),
        });

        // Invalidate the usage query to update the generation count
        queryClient.invalidateQueries({
          queryKey: trpc.ai.getUserGenerationUsage.queryKey(),
        });
      },
      onError: (error, _variables, context) => {
        if (context?.pendingId) {
          removePendingItem(context.pendingId);
        }
        const errorMessage =
          error.message || 'An error occurred generating posters';
        toast.error(errorMessage);
      },
    }),
  );
}

// Helper functions for generation payloads
export const createLogoGenerationPayload = (data: LogoFormData) => {
  const payload: {
    domain: NamefiNormalizedDomain;
    type: LogoTypeInput;
    style: LogoStyleInput;
    description?: string;
    model: Model;
  } = {
    domain: data.domain,
    type: data.type,
    style: data.style,
    model: data.model as Model,
  };

  if (data.description) {
    payload.description = data.description;
  }

  return payload;
};

export const createPosterGenerationPayload = (data: PosterFormData) => {
  const requestBody: {
    domain: NamefiNormalizedDomain;
    description?: string;
    referenceLogoGenerationId?: string;
    model: Model;
    collateralType: MarketingCollateralTypeInput;
  } = {
    domain: data.domain,
    description: data.description,
    model: data.model as Model,
    collateralType: data.collateralType,
  };

  // If a logo is selected, include the logo generation ID for reference
  if (data.selectedLogoId) {
    requestBody.referenceLogoGenerationId = data.selectedLogoId;
  }

  return requestBody;
};

type FeaturedRecentGenerations =
  AppRouterOutput['ai']['getFeaturedAndRecentGenerations'];

interface UseDeleteGenerationOptions {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

type DeleteGenerationContext = {
  removedId: string;
  previousUserGenerations: Array<[QueryKey, unknown]>;
  previousGenerationsByDomain: Array<[QueryKey, unknown]>;
  previousGenerationsByType: Array<[QueryKey, unknown]>;
  previousFeaturedAndRecent: FeaturedRecentGenerations | undefined;
};

export function useDeleteGeneration(options: UseDeleteGenerationOptions = {}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.ai.deleteGeneration.mutationOptions({
      onMutate: async (
        variables,
      ): Promise<DeleteGenerationContext | undefined> => {
        const removedId = variables?.id;
        if (!removedId) return undefined;

        await queryClient.cancelQueries({
          predicate: (query) =>
            Array.isArray(query.queryKey) && query.queryKey[0] === 'ai',
        });

        const previousUserGenerations = queryClient.getQueriesData({
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            query.queryKey[0] === 'ai' &&
            query.queryKey[1] === 'getUserGenerationsFiltered',
        });
        const previousGenerationsByDomain = queryClient.getQueriesData({
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            query.queryKey[0] === 'ai' &&
            query.queryKey[1] === 'getGenerationsByDomain',
        });
        const previousGenerationsByType = queryClient.getQueriesData({
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            query.queryKey[0] === 'ai' &&
            query.queryKey[1] === 'getGenerationsByType',
        });
        const previousFeaturedAndRecent =
          queryClient.getQueryData<FeaturedRecentGenerations>(
            trpc.ai.getFeaturedAndRecentGenerations.queryKey(),
          );

        queryClient.setQueriesData(
          {
            predicate: (query) =>
              Array.isArray(query.queryKey) &&
              query.queryKey[0] === 'ai' &&
              query.queryKey[1] === 'getUserGenerationsFiltered',
          },
          (old) => {
            if (!Array.isArray(old)) return old;
            return old.filter((item) => item.id !== removedId);
          },
        );

        queryClient.setQueriesData(
          {
            predicate: (query) =>
              Array.isArray(query.queryKey) &&
              query.queryKey[0] === 'ai' &&
              query.queryKey[1] === 'getGenerationsByDomain',
          },
          (old) => {
            if (!Array.isArray(old)) return old;
            return old.filter((item) => item.id !== removedId);
          },
        );

        queryClient.setQueriesData(
          {
            predicate: (query) =>
              Array.isArray(query.queryKey) &&
              query.queryKey[0] === 'ai' &&
              query.queryKey[1] === 'getGenerationsByType',
          },
          (old) => {
            if (!Array.isArray(old)) return old;
            return old.filter((item) => item.id !== removedId);
          },
        );

        queryClient.setQueryData(
          trpc.ai.getFeaturedAndRecentGenerations.queryKey(),
          (old) => {
            if (!old) return old;
            return {
              ...old,
              featured: (old.featured ?? []).filter(
                (item) => item.id !== removedId,
              ),
              recent: (old.recent ?? []).filter(
                (item) => item.id !== removedId,
              ),
            };
          },
        );

        return {
          removedId,
          previousUserGenerations,
          previousGenerationsByDomain,
          previousGenerationsByType,
          previousFeaturedAndRecent,
        };
      },
      onSuccess: (_data, variables) => {
        if (variables?.id) {
          queryClient.setQueryData(
            trpc.ai.getFeaturedAndRecentGenerations.queryKey(),
            (old) => {
              if (!old) return old;
              return {
                ...old,
                featured: (old.featured ?? []).filter(
                  (item) => item.id !== variables.id,
                ),
                recent: (old.recent ?? []).filter(
                  (item) => item.id !== variables.id,
                ),
              };
            },
          );
        }

        queryClient.invalidateQueries({
          predicate: (query) => {
            if (!Array.isArray(query.queryKey)) return false;
            if (query.queryKey[0] !== 'ai') return false;
            const key = query.queryKey[1];
            return (
              key === 'getUserGenerationsFiltered' ||
              key === 'getGenerationsByDomain' ||
              key === 'getGenerationsByType' ||
              key === 'getGenerationById' ||
              key === 'getFeaturedAndRecentGenerations'
            );
          },
        });

        queryClient.invalidateQueries({
          queryKey: trpc.ai.getUserDomains.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.ai.getUserGenerationUsage.queryKey(),
        });

        toast.success('Generation deleted');
        options.onSuccess?.();
      },
      onError: (error, _variables, context) => {
        if (context?.previousUserGenerations) {
          for (const [queryKey, data] of context.previousUserGenerations) {
            queryClient.setQueryData(queryKey, data);
          }
        }
        if (context?.previousGenerationsByDomain) {
          for (const [queryKey, data] of context.previousGenerationsByDomain) {
            queryClient.setQueryData(queryKey, data);
          }
        }
        if (context?.previousGenerationsByType) {
          for (const [queryKey, data] of context.previousGenerationsByType) {
            queryClient.setQueryData(queryKey, data);
          }
        }
        if (context?.previousFeaturedAndRecent !== undefined) {
          queryClient.setQueryData<FeaturedRecentGenerations | undefined>(
            trpc.ai.getFeaturedAndRecentGenerations.queryKey(),
            context.previousFeaturedAndRecent,
          );
        }
        const message =
          error instanceof Error
            ? error.message
            : typeof error === 'object' && error && 'message' in error
              ? String((error as { message?: unknown }).message)
              : 'Failed to delete generation';
        toast.error(message);
        options.onError?.(error);
      },
    }),
  );
}
