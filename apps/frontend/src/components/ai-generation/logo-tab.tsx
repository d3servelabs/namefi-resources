import type { Generation } from '@namefi-astra/ai/types';
import { LogoGenerator, type LogoFormData } from './logo-generator';
import {
  BaseGenerationTab,
  convertLogoGenerations,
} from './shared/base-generation-tab';
import {
  useLogoGeneration,
  createLogoGenerationPayload,
} from './shared/generation-hooks';
import { GenerationProvider } from './shared/generation-context';
import { useState, useRef } from 'react';

interface LogoTabProps {
  existingGenerations?: Generation[];
  brandDomain?: string;
}

export function LogoTab({
  existingGenerations = [],
  brandDomain,
}: LogoTabProps) {
  const [currentGenParams, setCurrentGenParams] = useState<LogoFormData | null>(
    null,
  );
  const lastGenerationParams = useRef<LogoFormData | null>(null);

  const generateLogoMutation = useLogoGeneration({
    domain: brandDomain || '',
  });

  const handleGenerateLogos = (data: LogoFormData) => {
    setCurrentGenParams(data);
    lastGenerationParams.current = data;

    const payload = createLogoGenerationPayload(data);
    generateLogoMutation.mutate(payload);
  };

  const handleGenerateMore = () => {
    // Re-use the last generation parameters if available
    if (lastGenerationParams.current) {
      handleGenerateLogos(lastGenerationParams.current);
    }
  };

  return (
    <GenerationProvider
      existingGenerations={existingGenerations}
      brandDomain={brandDomain}
      mutationIsPending={generateLogoMutation.isPending}
    >
      <BaseGenerationTab
        existingGenerations={existingGenerations}
        brandDomain={brandDomain}
        generator={
          <LogoGenerator
            onGenerate={handleGenerateLogos}
            isLoading={generateLogoMutation.isPending}
            fixedDomain={brandDomain}
          />
        }
        isLoading={generateLogoMutation.isPending}
        title="Generated Logos"
        convertToGeneratedItems={convertLogoGenerations}
        previewConfig={{
          type: currentGenParams?.type,
          style: currentGenParams?.style,
          description: currentGenParams?.description,
        }}
        onGenerateMore={handleGenerateMore}
      />
    </GenerationProvider>
  );
}
