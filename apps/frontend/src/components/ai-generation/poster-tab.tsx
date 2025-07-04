import type { Generation } from '@namefi-astra/ai/types';
import { useTRPC } from '@/utils/trpc';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { type GeneratedItem, ImageGrid } from './image-grid';
import { PosterGenerator } from './poster-generator';

interface PosterTabProps {
  existingGenerations?: Generation[];
  brandDomain?: string;
  onGenerationUpdate?: () => void; // Callback to refresh generations
  availableLogos?: Generation[]; // Available logo generations for the brand
}

export function PosterTab({
  existingGenerations = [],
  brandDomain,
  onGenerationUpdate,
  availableLogos = [],
}: PosterTabProps) {
  const trpc = useTRPC();

  const generatePosterMutation = useMutation(
    trpc.ai.generatePoster.mutationOptions({
      onSuccess: (data) => {
        if (data.output) {
          onGenerationUpdate?.();
        }
      },
      onError: (error) => {
        toast.error(error.message || 'An error occurred generating posters');
        console.error('Error generating marketing image:', error);
      },
    }),
  );

  const handleGeneratePoster = (
    domain: string,
    description?: string,
    selectedLogoId?: string,
  ) => {
    const requestBody: {
      domain: string;
      description?: string;
      referenceLogoGenerationId?: string;
    } = {
      domain,
      description,
    };

    // If a logo is selected, include the logo generation ID for reference
    if (selectedLogoId) {
      requestBody.referenceLogoGenerationId = selectedLogoId;
    }

    generatePosterMutation.mutate(requestBody);
  };

  // Convert existing generations to GeneratedItem format
  const existingItems: GeneratedItem[] = existingGenerations.map((gen) => ({
    id: gen.id,
    url: gen.result,
    prompt: gen.prompt,
    timestamp: new Date(gen.createdAt).toISOString(),
    basedOnLogo: gen.metadata?.basedOnLogoId
      ? (() => {
          const logo = availableLogos.find(
            (logo) => logo.id === gen.metadata?.basedOnLogoId,
          );
          return logo
            ? {
                id: logo.id,
                result: logo.result,
                metadata: logo.metadata
                  ? {
                      logoType: logo.metadata.logoType,
                      logoStyle: logo.metadata.logoStyle,
                    }
                  : undefined,
              }
            : undefined;
        })()
      : undefined,
  }));

  // Combine existing and newly generated items
  const allItems = [...existingItems];

  return (
    <>
      <PosterGenerator
        onGenerate={handleGeneratePoster}
        isLoading={generatePosterMutation.isPending}
        fixedDomain={brandDomain}
        availableLogos={availableLogos}
      />
      <ImageGrid
        items={allItems}
        title="Generated Posters"
        isLoading={generatePosterMutation.isPending}
        brandDomain={brandDomain}
      />
    </>
  );
}
