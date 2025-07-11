import { useTRPC } from '@/utils/trpc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { LogoFormData } from '../logo-generator';
import type { PosterFormData } from '../poster-generator';

interface UseLogoGenerationProps {
  domain: string;
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
  domain: string;
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
    brandName: string;
    type: string;
    style: string;
    description?: string;
  } = {
    brandName: data.domain,
    type: data.type,
    style: data.style,
  };

  if (data.description) {
    payload.description = data.description;
  }

  return payload;
};

export const createPosterGenerationPayload = (data: PosterFormData) => {
  const requestBody: {
    domain: string;
    description?: string;
    referenceLogoGenerationId?: string;
  } = {
    domain: data.domain,
    description: data.description,
  };

  // If a logo is selected, include the logo generation ID for reference
  if (data.selectedLogoId) {
    requestBody.referenceLogoGenerationId = data.selectedLogoId;
  }

  return requestBody;
};
