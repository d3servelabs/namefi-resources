import type { Generation } from '@namefi-astra/ai/types';
import { PosterGenerator, type PosterFormData } from './poster-generator';
import {
  BaseGenerationTab,
  convertPosterGenerations,
} from './shared/base-generation-tab';
import {
  usePosterGeneration,
  createPosterGenerationPayload,
} from './shared/generation-hooks';
import { GenerationProvider } from './shared/generation-context';
import { useState, useRef } from 'react';

interface PosterTabProps {
  existingGenerations?: Generation[];
  logoGenerations?: Generation[]; // Available logos for poster generation
  brandDomain?: string;
}

export function PosterTab({
  existingGenerations = [],
  logoGenerations = [],
  brandDomain,
}: PosterTabProps) {
  const [currentGenParams, setCurrentGenParams] =
    useState<PosterFormData | null>(null);
  const lastGenerationParams = useRef<PosterFormData | null>(null);

  const generatePosterMutation = usePosterGeneration({
    domain: brandDomain || '',
  });

  const handleGeneratePosters = (data: PosterFormData) => {
    setCurrentGenParams(data);
    lastGenerationParams.current = data;
    const payload = createPosterGenerationPayload(data);
    generatePosterMutation.mutate(payload);
  };

  const handleGenerateMore = () => {
    // Re-use the last generation parameters if available
    if (lastGenerationParams.current) {
      handleGeneratePosters(lastGenerationParams.current);
    }
  };

  const selectedLogo = logoGenerations.find(
    (logo) => logo.id === currentGenParams?.selectedLogoId,
  );

  return (
    <GenerationProvider
      existingGenerations={existingGenerations}
      brandDomain={brandDomain}
      mutationIsPending={generatePosterMutation.isPending}
    >
      <BaseGenerationTab
        existingGenerations={existingGenerations}
        brandDomain={brandDomain}
        generator={
          <PosterGenerator
            onGenerate={handleGeneratePosters}
            isLoading={generatePosterMutation.isPending}
            fixedDomain={brandDomain}
            availableLogos={logoGenerations}
          />
        }
        isLoading={generatePosterMutation.isPending}
        title="Generated Posters"
        convertToGeneratedItems={convertPosterGenerations}
        availableLogos={logoGenerations}
        previewConfig={{
          description: currentGenParams?.description,
          category: selectedLogo ? 'Logo-Based' : 'Standalone',
          type: 'Marketing Poster',
          style: selectedLogo?.metadata?.logoStyle,
        }}
        onGenerateMore={handleGenerateMore}
      />
    </GenerationProvider>
  );
}
