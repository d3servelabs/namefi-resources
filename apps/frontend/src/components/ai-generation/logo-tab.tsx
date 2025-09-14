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

interface LogoTabProps {
  existingGenerations?: Generation[];
  brandDomain?: NamefiNormalizedDomain;
}

export function LogoTab({
  existingGenerations = [],
  brandDomain,
}: LogoTabProps) {
  const [currentGenParams, setCurrentGenParams] = useState<LogoFormData | null>(
    null,
  );
  const lastGenerationParams = useRef<LogoFormData | null>(null);
  const [latestGeneration, setLatestGeneration] = useState<Generation | null>(
    null,
  );

  const generateLogoMutation = useLogoGeneration({
    domain: brandDomain,
  });

  const handleGenerateLogo = (data: LogoFormData) => {
    setCurrentGenParams(data);
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
        />
      }
      isLoading={generateLogoMutation.isPending}
      title="Generated Logos"
      convertToGeneratedItems={convertLogoGenerations}
      previewConfig={{
        type: currentGenParams?.type,
        style: currentGenParams?.style,
        description: currentGenParams?.description,
        model: (currentGenParams as any)?.model,
      }}
      onGenerateMore={handleGenerateMore}
    />
  );
}
