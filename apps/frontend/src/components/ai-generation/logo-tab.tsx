import { LogoGenerator, type LogoFormData } from './logo-generator';
import {
  BaseGenerationTab,
  convertLogoGenerations,
} from './shared/base-generation-tab';
import {
  useLogoGeneration,
  createLogoGenerationPayload,
} from './shared/generation-hooks';
import { useState, useRef } from 'react';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import type { Generation } from './shared/types';
import { usePosterFlow } from './poster-flow-context';

interface LogoTabProps {
  existingGenerations?: Generation[];
  brandDomain?: NamefiNormalizedDomain;
}

export function LogoTab({
  existingGenerations = [],
  brandDomain,
}: LogoTabProps) {
  const lastGenerationParams = useRef<LogoFormData | null>(null);
  const [latestGeneration, setLatestGeneration] = useState<Generation | null>(
    null,
  );

  const generateLogoMutation = useLogoGeneration({
    domain: brandDomain,
  });
  const { openPoster } = usePosterFlow();

  const handleGenerateLogo = (data: LogoFormData) => {
    lastGenerationParams.current = data;
    setLatestGeneration(null);

    const payload = createLogoGenerationPayload(data);
    generateLogoMutation.mutate(payload, {
      onSuccess: (result) => {
        setLatestGeneration(result);
      },
    });
  };

  const handleGenerateMore = () => {
    // Re-use the last generation parameters if available
    if (lastGenerationParams.current) {
      handleGenerateLogo(lastGenerationParams.current);
    }
  };

  return (
    <BaseGenerationTab
      existingGenerations={existingGenerations}
      brandDomain={brandDomain}
      generator={
        <LogoGenerator
          onGenerate={handleGenerateLogo}
          isLoading={generateLogoMutation.isPending}
          fixedDomain={brandDomain}
          latestGeneration={latestGeneration || undefined}
          onGenerateMore={handleGenerateMore}
          onPosterRequest={(generation) => {
            if (generation && generation.type === 'logo') {
              openPoster(generation);
            }
          }}
        />
      }
      title="Generated Logos"
      convertToGeneratedItems={convertLogoGenerations}
      onPosterRequest={openPoster}
    />
  );
}
