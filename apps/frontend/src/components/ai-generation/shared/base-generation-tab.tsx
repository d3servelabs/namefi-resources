import { type GeneratedItem, ImageGrid } from '../image-grid';
import { type ReactNode, useState } from 'react';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import type { Generation } from './types';

interface BaseGenerationTabProps {
  existingGenerations?: Generation[];
  brandDomain?: NamefiNormalizedDomain;

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
    model?: string;
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

  // Convert existing generations to GeneratedItem format
  const existingItems = convertToGeneratedItems(
    existingGenerations,
    availableLogos,
  );

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
    url: gen.url,
    timestamp: new Date(gen.createdAt).toISOString(),
    type: gen.type,
    style: gen.input?.type === 'logo' ? gen.input.logoStyle : undefined,
  }));
};

export const convertPosterGenerations = (
  generations: Generation[],
  availableLogos: Generation[] = [],
): GeneratedItem[] => {
  return generations.map((gen) => ({
    id: gen.id,
    url: gen.url,
    timestamp: new Date(gen.createdAt).toISOString(),
    basedOnLogo: gen.referenceGenerationId
      ? (() => {
          const logo = availableLogos.find(
            (logo) => logo.id === gen.referenceGenerationId,
          );
          return logo
            ? {
                id: logo.id,
                result: logo.url,
                metadata:
                  logo.input?.type === 'logo'
                    ? {
                        logoType: logo.input.logoType,
                        logoStyle: logo.input.logoStyle,
                      }
                    : undefined,
              }
            : undefined;
        })()
      : undefined,
  }));
};
