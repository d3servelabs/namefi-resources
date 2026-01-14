import { type GeneratedItem, ImageGrid } from '../image-grid';
import { useMemo, type ReactNode } from 'react';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import type { Generation } from './types';

interface BaseGenerationTabProps {
  existingGenerations?: Generation[];
  brandDomain?: NamefiNormalizedDomain;

  // Generator component as children
  generator: ReactNode;

  // Title and conversion logic
  title: string;
  convertToGeneratedItems: (
    generations: Generation[],
    availableLogos?: Generation[],
  ) => GeneratedItem[];

  // Optional additional data for the conversion
  availableLogos?: Generation[];
  onPosterRequest?: (generation: Generation) => void;
}

export function BaseGenerationTab({
  existingGenerations = [],
  brandDomain,
  generator,
  title,
  convertToGeneratedItems,
  availableLogos,
  onPosterRequest,
}: BaseGenerationTabProps) {
  // Convert existing generations to GeneratedItem format
  const existingItems = convertToGeneratedItems(
    existingGenerations,
    availableLogos,
  );

  const generationMap = useMemo(() => {
    const map = new Map<string, Generation>();
    for (const generation of existingGenerations) {
      if (generation?.id) {
        map.set(generation.id, generation);
      }
    }
    return map;
  }, [existingGenerations]);

  const handleCreatePoster =
    onPosterRequest && existingGenerations.length > 0
      ? (item: GeneratedItem) => {
          if (!item.id || item.kind !== 'logo') return;
          const generation = generationMap.get(item.id);
          if (!generation) return;
          if (
            generation.type !== 'logo' &&
            generation.output?.type !== 'logo'
          ) {
            return;
          }
          onPosterRequest(generation);
        }
      : undefined;

  return (
    <>
      {generator}

      <ImageGrid
        items={existingItems}
        title={title}
        brandDomain={brandDomain}
        onCreatePoster={handleCreatePoster}
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
    // Use resolved values from output when available (AI-chosen)
    type: gen.output?.type === 'logo' ? gen.output.logoType : undefined,
    style: gen.output?.type === 'logo' ? gen.output.logoStyle : undefined,
    kind: 'logo',
    domain: gen.domain,
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
    kind: 'marketing',
    domain: gen.domain,
    // Show resolved collateral type when available
    type: (() => {
      const key =
        gen.output?.type === 'marketing'
          ? gen.output.collateralType
          : undefined;
      return key ?? undefined;
    })(),
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
                  logo.output?.type === 'logo'
                    ? {
                        // Prefer output values if present
                        logoType: logo.output.logoType,
                        logoStyle: logo.output.logoStyle,
                      }
                    : undefined,
              }
            : undefined;
        })()
      : undefined,
  }));
};
