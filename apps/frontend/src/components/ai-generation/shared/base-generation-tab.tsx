import { type GeneratedItem, ImageGrid } from '../image-grid';
import type { ReactNode } from 'react';
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
}: BaseGenerationTabProps) {
  // Convert existing generations to GeneratedItem format
  const existingItems = convertToGeneratedItems(
    existingGenerations,
    availableLogos,
  );

  // no-op

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
    // Use resolved values from output when available (AI-chosen)
    type:
      (gen.output?.type === 'logo' ? gen.output.logoType : undefined) ||
      (gen.input?.type === 'logo' ? gen.input.logoType : undefined),
    style:
      (gen.output?.type === 'logo' ? gen.output.logoStyle : undefined) ||
      (gen.input?.type === 'logo' ? gen.input.logoStyle : undefined),
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
    // Show resolved collateral type when available
    type: (() => {
      const key =
        (gen.output?.type === 'marketing'
          ? gen.output.collateralType
          : undefined) ||
        (gen.input?.type === 'marketing'
          ? gen.input.collateralType
          : undefined);
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
                  logo.input?.type === 'logo'
                    ? {
                        // Prefer output values if present
                        logoType:
                          (logo.output?.type === 'logo'
                            ? logo.output.logoType
                            : undefined) || logo.input.logoType,
                        logoStyle:
                          (logo.output?.type === 'logo'
                            ? logo.output.logoStyle
                            : undefined) || logo.input.logoStyle,
                      }
                    : (() => {
                        const lt =
                          logo.output?.type === 'logo'
                            ? logo.output.logoType
                            : undefined;
                        const ls =
                          logo.output?.type === 'logo'
                            ? logo.output.logoStyle
                            : undefined;
                        return lt || ls
                          ? { logoType: lt, logoStyle: ls }
                          : undefined;
                      })(),
              }
            : undefined;
        })()
      : undefined,
  }));
};
