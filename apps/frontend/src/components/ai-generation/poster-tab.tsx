import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [domainOverride, setDomainOverride] = useState<
    NamefiNormalizedDomain | undefined
  >(brandDomain ?? (focusedLogo?.domain as NamefiNormalizedDomain | undefined));
  const [focusedLogoId, setFocusedLogoId] = useState<string | null>(
    focusedLogo?.id ?? null,
  );
  const lastGenerationParams = useRef<PosterFormData | null>(null);
  const [latestGeneration, setLatestGeneration] = useState<Generation | null>(
    null,
  );

  const effectiveDomain = domainOverride;

  useEffect(() => {
    const nextDomain = brandDomain ?? focusedLogo?.domain;
    if (nextDomain && nextDomain !== domainOverride) {
      setDomainOverride(nextDomain as NamefiNormalizedDomain);
    }
  }, [brandDomain, focusedLogo?.domain, domainOverride]);

  useEffect(() => {
    if (focusedLogo?.id) {
      setFocusedLogoId(focusedLogo.id);
    }
  }, [focusedLogo?.id]);

  const generatePosterMutation = usePosterGeneration({
    domain: effectiveDomain,
  });

  const logosWithFocus = useMemo(() => {
    if (!focusedLogo) return logoGenerations;
    const alreadyIncludes = logoGenerations.some(
      (g) => g.id === focusedLogo.id,
    );
    if (alreadyIncludes) return logoGenerations;
    return [...logoGenerations, focusedLogo as Generation];
  }, [logoGenerations, focusedLogo]);

  const handleGeneratePosters = (data: PosterFormData) => {
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
