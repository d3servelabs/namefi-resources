import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { Button } from '@/components/ui/shadcn/button';
import {
  AnimationGenerator,
  type AnimationFormData,
} from './animation-generator';
import {
  BaseGenerationTab,
  convertAnimationGenerations,
} from './shared/base-generation-tab';
import {
  createAnimationGenerationPayload,
  useAnimationGeneration,
} from './shared/generation-hooks';
import type { DerivativeSource } from './derivative-flow-context';
import type { Generation } from './shared/types';

interface AnimationTabProps {
  existingGenerations?: Generation[];
  logoGenerations?: Generation[];
  brandDomain?: NamefiNormalizedDomain;
  focusedLogo?: DerivativeSource;
  onDismiss?: () => void;
}

export function AnimationTab({
  existingGenerations = [],
  logoGenerations = [],
  brandDomain,
  focusedLogo,
  onDismiss,
}: AnimationTabProps) {
  const [domainOverride, setDomainOverride] = useState<
    NamefiNormalizedDomain | undefined
  >(brandDomain ?? (focusedLogo?.domain as NamefiNormalizedDomain | undefined));
  const [focusedLogoId, setFocusedLogoId] = useState<string | null>(
    focusedLogo?.id ?? null,
  );
  const lastGenerationParams = useRef<AnimationFormData | null>(null);
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

  const generateAnimationMutation = useAnimationGeneration({
    domain: effectiveDomain,
  });

  const logosWithFocus = useMemo(() => {
    if (!focusedLogo) return logoGenerations;
    const alreadyIncludes = logoGenerations.some(
      (generation) => generation.id === focusedLogo.id,
    );
    if (alreadyIncludes) return logoGenerations;
    return [...logoGenerations, focusedLogo as Generation];
  }, [focusedLogo, logoGenerations]);

  const handleGenerateAnimation = (data: AnimationFormData) => {
    lastGenerationParams.current = data;
    setLatestGeneration(null);

    const payload = createAnimationGenerationPayload(data);
    generateAnimationMutation.mutate(payload, {
      onSuccess: (result) => {
        setLatestGeneration(result);
      },
    });
  };

  const handleGenerateMore = () => {
    if (lastGenerationParams.current) {
      handleGenerateAnimation(lastGenerationParams.current);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Logo Animation</h2>
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
          <AnimationGenerator
            onGenerate={handleGenerateAnimation}
            isLoading={generateAnimationMutation.isPending}
            fixedDomain={effectiveDomain}
            availableLogos={logosWithFocus}
            latestGeneration={latestGeneration || undefined}
            onGenerateMore={handleGenerateMore}
            initialSelectedLogoId={focusedLogoId ?? undefined}
          />
        }
        title="Generated Animations"
        convertToGeneratedItems={convertAnimationGenerations}
        availableLogos={logosWithFocus}
      />
    </div>
  );
}
