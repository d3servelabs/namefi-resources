import { useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
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
import { useRequirePostAuthIntent } from '@/hooks/use-post-auth-intent';
import { useDerivativeGenerationState } from './shared/use-derivative-generation-state';

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
  const {
    effectiveDomain,
    focusedLogoId,
    lastGenerationParams,
    latestGeneration,
    logosWithFocus,
    setLatestGeneration,
  } = useDerivativeGenerationState<AnimationFormData>({
    brandDomain,
    focusedLogo,
    logoGenerations,
  });

  const generateAnimationMutation = useAnimationGeneration({
    domain: effectiveDomain,
    availableLogos: logosWithFocus,
  });
  const requirePostAuthIntent = useRequirePostAuthIntent();

  const handleAnimationSuccess = useCallback(
    (result: Generation) => {
      setLatestGeneration(result);
    },
    [setLatestGeneration],
  );

  const handleGenerateAnimation = (data: AnimationFormData) => {
    lastGenerationParams.current = data;
    setLatestGeneration(null);

    const payload = createAnimationGenerationPayload(data);
    if (
      !requirePostAuthIntent({
        kind: 'ai.animation.generate',
        returnPath: `/studio?animation=${encodeURIComponent(
          data.selectedLogoId,
        )}`,
        payload,
      })
    ) {
      return;
    }

    generateAnimationMutation.mutate(payload, {
      onSuccess: handleAnimationSuccess,
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
            <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
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
