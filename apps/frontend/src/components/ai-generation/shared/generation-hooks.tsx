import { useTRPC } from '@/lib/trpc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import type { LogoFormData } from '../logo-generator';
import type { PosterFormData } from '../poster-generator';
import type { Model, MarketingCollateralType } from '@namefi-astra/ai';

interface UseLogoGenerationProps {
  domain?: NamefiNormalizedDomain;
}

export function useLogoGeneration({ domain }: UseLogoGenerationProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.ai.generateLogo.mutationOptions({
      onSuccess: (data) => {
        // Update the cache with the new generation
        queryClient.setQueryData(
          trpc.ai.getGenerationsByDomain.queryKey({ domain }),
          (old) => {
            if (!old) return [data];
            return [...old, data];
          },
        );

        // Invalidate to ensure we have the latest data
        queryClient.invalidateQueries({
          queryKey: trpc.ai.getGenerationsByDomain.queryKey({ domain }),
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
      onError: (error: any) => {
        const errorMessage =
          error.message || 'An error occurred generating logos';
        toast.error(errorMessage);
        console.error('Error generating logo:', error);
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

  return useMutation(
    trpc.ai.generatePoster.mutationOptions({
      onSuccess: (data) => {
        // Update the cache with the new generation
        queryClient.setQueryData(
          trpc.ai.getGenerationsByDomain.queryKey({ domain }),
          (old) => {
            if (!old) return [data];
            return [...old, data];
          },
        );

        // Invalidate to ensure we have the latest data
        queryClient.invalidateQueries({
          queryKey: trpc.ai.getGenerationsByDomain.queryKey({ domain }),
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
      onError: (error: any) => {
        const errorMessage =
          error.message || 'An error occurred generating posters';
        toast.error(errorMessage);
        console.error('Error generating marketing image:', error);
      },
    }),
  );
}

// Helper functions for generation payloads
export const createLogoGenerationPayload = (data: LogoFormData) => {
  const payload: {
    domain: NamefiNormalizedDomain;
    type: string;
    style: string;
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
    collateralType: MarketingCollateralType | 'let_ai_choose';
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
