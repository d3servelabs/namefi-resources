import { useRef, useState } from 'react';
import { useFeedback } from '@/components/providers/feedback';
import { feedbackTriggerSchema } from '@/lib/feedback-triggers';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { LogoGenerator, type LogoFormData } from './logo-generator';
import {
  BaseGenerationTab,
  convertLogoGenerations,
} from './shared/base-generation-tab';
import {
  useLogoGeneration,
  createLogoGenerationPayload,
} from './shared/generation-hooks';
import type { Generation } from './shared/types';
import { useDerivativeFlow } from './derivative-flow-context';

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
  const { openAnimation, openPoster } = useDerivativeFlow();
  const { requestFeedback } = useFeedback();

  const handleGenerateLogo = (data: LogoFormData) => {
    lastGenerationParams.current = data;
    setLatestGeneration(null);

    const payload = createLogoGenerationPayload(data);
    generateLogoMutation.mutate(payload, {
      onSuccess: (result) => {
        setLatestGeneration(result);
        // Trigger feedback for logo generation milestone
        requestFeedback(feedbackTriggerSchema.enum.MILESTONE_LOGO_GENERATED);
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
      logoActions={[
        {
          label: 'Create Poster',
          onRequest: openPoster,
        },
        {
          label: 'Animate Logo',
          onRequest: openAnimation,
        },
      ]}
    />
  );
}
