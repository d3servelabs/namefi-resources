import { useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { PosterGenerator, type PosterFormData } from './poster-generator';
import {
  BaseGenerationTab,
  convertPosterGenerations,
} from './shared/base-generation-tab';
import {
  usePosterGeneration,
  createPosterGenerationPayload,
} from './shared/generation-hooks';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import type { Generation } from './shared/types';
import type { DerivativeSource } from './derivative-flow-context';
import { useRequirePostAuthIntent } from '@/hooks/use-post-auth-intent';
import { useDerivativeGenerationState } from './shared/use-derivative-generation-state';

interface PosterTabProps {
  existingGenerations?: Generation[];
  logoGenerations?: Generation[];
  brandDomain?: NamefiNormalizedDomain;
  focusedLogo?: DerivativeSource;
  onDismiss?: () => void;
}

export function PosterTab({
  existingGenerations = [],
  logoGenerations = [],
  brandDomain,
  focusedLogo,
  onDismiss,
}: PosterTabProps) {
  const {
    effectiveDomain,
    focusedLogoId,
    lastGenerationParams,
    latestGeneration,
    logosWithFocus,
    setLatestGeneration,
  } = useDerivativeGenerationState<PosterFormData>({
    brandDomain,
    focusedLogo,
    logoGenerations,
  });

  const generatePosterMutation = usePosterGeneration({
    domain: effectiveDomain,
    availableLogos: logosWithFocus,
  });
  const requirePostAuthIntent = useRequirePostAuthIntent();

  const handlePosterSuccess = useCallback(
    (result: Generation) => {
      setLatestGeneration(result);
    },
    [setLatestGeneration],
  );

  const handleGeneratePosters = (data: PosterFormData) => {
    lastGenerationParams.current = data;
    // Clear previous generation when starting a new one
    setLatestGeneration(null);

    const payload = createPosterGenerationPayload(data);
    if (
      !requirePostAuthIntent({
        kind: 'ai.poster.generate',
        returnPath: `/studio?poster=${encodeURIComponent(data.selectedLogoId)}`,
        payload,
      })
    ) {
      return;
    }

    generatePosterMutation.mutate(payload, {
      onSuccess: handlePosterSuccess,
    });
  };

  const handleGenerateMore = () => {
    // Re-use the last generation parameters if available
    if (lastGenerationParams.current) {
      handleGeneratePosters(lastGenerationParams.current);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Poster Generator</h2>
          {focusedLogo?.domain && (
            <p className="text-sm text-muted-foreground">
              Using brand {focusedLogo.domain}
            </p>
          )}
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to logos
          </Button>
        )}
      </div>

      <BaseGenerationTab
        existingGenerations={existingGenerations}
        brandDomain={effectiveDomain}
        generator={
          <PosterGenerator
            onGenerate={handleGeneratePosters}
            isLoading={generatePosterMutation.isPending}
            fixedDomain={effectiveDomain}
            availableLogos={logosWithFocus}
            latestGeneration={latestGeneration || undefined}
            onGenerateMore={handleGenerateMore}
            initialSelectedLogoId={focusedLogoId ?? undefined}
          />
        }
        title="Generated Posters"
        convertToGeneratedItems={convertPosterGenerations}
        availableLogos={logosWithFocus}
      />
    </div>
  );
}
