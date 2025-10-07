'use client';

import { useTRPC } from '@/lib/trpc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import type { LogoFormData } from '../logo-generator';
import type { PosterFormData } from '../poster-generator';
import type {
  ImageModel as Model,
  LogoStyleInput,
  LogoTypeInput,
  MarketingCollateralTypeInput,
} from '@namefi-astra/ai/client';
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
