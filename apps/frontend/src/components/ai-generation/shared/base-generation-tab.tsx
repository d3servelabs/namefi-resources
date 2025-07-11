import type { Generation } from '@namefi-astra/ai/types';
import { type GeneratedItem, ImageGrid } from '../image-grid';
import { GenerationPreview } from './generation-preview';
import { type ReactNode, useState, useEffect } from 'react';
import { useGenerationContext } from './generation-context';

interface BaseGenerationTabProps {
  existingGenerations?: Generation[];
  brandDomain?: string;

  // Generator component as children
  generator: ReactNode;

  // Mutation state
  isLoading: boolean;

  // Title and conversion logic
  title: string;
  convertToGeneratedItems: (
    generations: Generation[],
    availableLogos?: Generation[],
  ) => GeneratedItem[];

  // Optional additional data for the conversion
  availableLogos?: Generation[];

  // Preview configuration
  previewConfig?: {
    type?: string;
    style?: string;
    category?: string;
    description?: string;
  };

  // Callback to trigger new generation
  onGenerateMore?: () => void;
}

export function BaseGenerationTab({
  existingGenerations = [],
  brandDomain,
  generator,
  title,
  convertToGeneratedItems,
  availableLogos,
  previewConfig,
  onGenerateMore,
}: BaseGenerationTabProps) {
  const [showPreview, setShowPreview] = useState(false);

  // Get generation state from context
  const { isGenerating, latestGeneration, loadingState } =
    useGenerationContext();

  // Convert existing generations to GeneratedItem format
  const existingItems = convertToGeneratedItems(
    existingGenerations,
    availableLogos,
  );

  // Show preview when generation starts
  useEffect(() => {
    if (isGenerating) {
      setShowPreview(true);
    }
  }, [isGenerating]);

  const handleGenerateMore = () => {
    // Trigger a new generation using the callback
    if (onGenerateMore) {
      onGenerateMore();
      setShowPreview(true);
    }
  };

  // TODO: (sid) Implement navigate to poster tab
  // const handleGeneratePoster = () => {
  //   // This would switch to poster tab or trigger poster generation
  // };

  return (
    <>
      {generator}

      {/* Generation Preview */}
      <GenerationPreview
        isLoading={isGenerating}
        loadingState={loadingState}
        isVisible={showPreview}
        generatedImage={
          !isGenerating && latestGeneration
            ? {
                id: latestGeneration.id,
                url: latestGeneration.result,
                domain: brandDomain || 'example.com',
                description:
                  previewConfig?.description || latestGeneration.prompt,
                type:
                  previewConfig?.type || latestGeneration.metadata?.logoType,
                style:
                  previewConfig?.style || latestGeneration.metadata?.logoStyle,
                category: previewConfig?.category,
              }
            : undefined
        }
        onGenerateMore={handleGenerateMore}
        onGeneratePoster={undefined} // Hide for now
      />

      <ImageGrid
        items={existingItems}
        title={title}
        brandDomain={brandDomain}
      />
    </>
  );
}

// Helper functions for common conversion patterns
export const convertLogoGenerations = (
  generations: Generation[],
): GeneratedItem[] => {
  return generations.map((gen) => ({
    id: gen.id,
    url: gen.result,
    prompt: gen.prompt,
    timestamp: new Date(gen.createdAt).toISOString(),
    type: gen.metadata?.logoType,
    style: gen.metadata?.logoStyle,
  }));
};

export const convertPosterGenerations = (
  generations: Generation[],
  availableLogos: Generation[] = [],
): GeneratedItem[] => {
  return generations.map((gen) => ({
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
};
