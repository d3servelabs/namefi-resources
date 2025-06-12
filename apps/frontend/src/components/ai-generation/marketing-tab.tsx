import type { Generation } from '@/types/brand';
import { useTRPC } from '@/utils/trpc';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { type GeneratedItem, ImageGrid } from './image-grid';
import { MarketingImageGenerator } from './marketing-image-generator';

interface MarketingTabProps {
  onComplete?: (
    prompt: string,
    result: string,
    domain: string,
    generationCallId: string | undefined,
    metadata?: {
      description?: string;
      basedOnLogoId?: string;
    },
  ) => void;
  existingGenerations?: Generation[];
  brandDomain?: string;
  onGenerationUpdate?: () => void; // Callback to refresh generations
  availableLogos?: Generation[]; // Available logo generations for the brand
}

export function MarketingTab({
  onComplete,
  existingGenerations = [],
  brandDomain,
  onGenerationUpdate,
  availableLogos = [],
}: MarketingTabProps) {
  const [lastMarketingPrompt, setLastMarketingPrompt] = useState<{
    domain: string;
    description?: string;
    selectedLogoId?: string;
  } | null>(null);

  const trpc = useTRPC();

  const generateMarketingImageMutation = useMutation(
    trpc.ai.generateMarketingImage.mutationOptions({
      onSuccess: (data, variables) => {
        if (data.output) {
          // Handle single image response
          const prompt = `Marketing image for ${variables.domain}${variables.description ? `: ${variables.description}` : ''}${lastMarketingPrompt?.selectedLogoId ? ' (based on logo)' : ''}`;

          // Create metadata object with only defined values
          const metadata: {
            description?: string;
            basedOnLogoId?: string;
          } = {};

          if (variables.description)
            metadata.description = variables.description;
          if (lastMarketingPrompt?.selectedLogoId)
            metadata.basedOnLogoId = lastMarketingPrompt.selectedLogoId;

          onComplete?.(
            prompt,
            data.output.url,
            variables.domain,
            data.output.externalId || '',
            metadata,
          );

          // Refresh the generations list
          onGenerationUpdate?.();
        }
      },
    }),
  );

  const handleGenerateMarketingImages = async (
    domain: string,
    description?: string,
    selectedLogoId?: string,
  ) => {
    setLastMarketingPrompt({ domain, description, selectedLogoId });

    const requestBody: {
      domain: string;
      description?: string;
      basedOnLogoCallId?: string;
    } = {
      domain,
      description,
    };

    // If a logo is selected, include the logo generation call ID for multi-turn
    if (selectedLogoId) {
      const selectedLogo = availableLogos.find(
        (logo) => logo.id === selectedLogoId,
      );
      if (selectedLogo?.generationCallId) {
        requestBody.basedOnLogoCallId = selectedLogo.generationCallId;
      }
    }

    generateMarketingImageMutation.mutate(requestBody);
  };

  const handleGenerateAnotherMarketingImage = () => {
    if (lastMarketingPrompt) {
      handleGenerateMarketingImages(
        lastMarketingPrompt.domain,
        lastMarketingPrompt.description,
        lastMarketingPrompt.selectedLogoId,
      );
    }
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
      {generateMarketingImageMutation.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {generateMarketingImageMutation.error.message}
        </div>
      )}
      <MarketingImageGenerator
        onGenerate={handleGenerateMarketingImages}
        isLoading={generateMarketingImageMutation.isPending}
        fixedDomain={brandDomain}
        availableLogos={availableLogos}
      />
      <ImageGrid
        items={allItems}
        title="Generated Marketing Images"
        isLoading={generateMarketingImageMutation.isPending}
        onGenerateAnother={
          lastMarketingPrompt ? handleGenerateAnotherMarketingImage : undefined
        }
        brandDomain={brandDomain}
      />
    </>
  );
}
