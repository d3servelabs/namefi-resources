import { PosterGenerator, type PosterFormData } from './poster-generator';
import {
  BaseGenerationTab,
  convertPosterGenerations,
} from './shared/base-generation-tab';
import {
  usePosterGeneration,
  createPosterGenerationPayload,
} from './shared/generation-hooks';
import { useState, useRef } from 'react';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import type { Generation } from './shared/types';

interface PosterTabProps {
  existingGenerations?: Generation[];
  logoGenerations?: Generation[];
  brandDomain?: NamefiNormalizedDomain;
}

export function PosterTab({
  existingGenerations = [],
  logoGenerations = [],
  brandDomain,
}: PosterTabProps) {
  const [currentGenParams, setCurrentGenParams] =
    useState<PosterFormData | null>(null);
  const lastGenerationParams = useRef<PosterFormData | null>(null);
  const [latestGeneration, setLatestGeneration] = useState<Generation | null>(
    null,
  );

  const generatePosterMutation = usePosterGeneration({
    domain: brandDomain,
  });

  const handleGeneratePosters = (data: PosterFormData) => {
    setCurrentGenParams(data);
    lastGenerationParams.current = data;
    // Clear previous generation when starting a new one
    setLatestGeneration(null);

    const payload = createPosterGenerationPayload(data);
    generatePosterMutation.mutate(payload, {
      onSuccess: (result) => {
        setLatestGeneration(result);
      },
    });
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
    <BaseGenerationTab
      existingGenerations={existingGenerations}
      brandDomain={brandDomain}
      generator={
        <PosterGenerator
          onGenerate={handleGeneratePosters}
          isLoading={generatePosterMutation.isPending}
          fixedDomain={brandDomain}
          availableLogos={logoGenerations}
          latestGeneration={latestGeneration || undefined}
          onGenerateMore={handleGenerateMore}
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
        style:
          selectedLogo?.input.type === 'logo'
            ? selectedLogo.input.logoStyle
            : undefined,
      }}
      onGenerateMore={handleGenerateMore}
    />
  );
}
