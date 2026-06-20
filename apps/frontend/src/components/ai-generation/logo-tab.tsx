import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
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
import { isReadyLogoGeneration } from './shared/logo-readiness';
import {
  type RequestedDerivativeMode,
  useDerivativeFlow,
} from './derivative-flow-context';
import {
  getCurrentReturnPath,
  usePostAuthIntentExecutor,
  useRequirePostAuthIntent,
  type PostAuthIntentFor,
} from '@/hooks/use-post-auth-intent';

interface LogoTabProps {
  existingGenerations?: Generation[];
  brandDomain?: NamefiNormalizedDomain;
}

export function LogoTab({
  existingGenerations = [],
  brandDomain,
}: LogoTabProps) {
  const t = useTranslations('aiGeneration');
  const lastGenerationParams = useRef<LogoFormData | null>(null);
  const [latestGeneration, setLatestGeneration] = useState<Generation | null>(
    null,
  );

  const generateLogoMutation = useLogoGeneration({
    domain: brandDomain,
  });
  const { openAnimation, openPoster, requestedMode } = useDerivativeFlow();
  const { requestFeedback } = useFeedback();
  const requirePostAuthIntent = useRequirePostAuthIntent();

  const handleLogoSuccess = useCallback(
    (
      result: Generation,
      nextMode: RequestedDerivativeMode | null = requestedMode,
    ) => {
      if (!isReadyLogoGeneration(result)) {
        return;
      }

      setLatestGeneration(result);
      requestFeedback(feedbackTriggerSchema.enum.MILESTONE_LOGO_GENERATED);

      if (nextMode === 'poster') {
        openPoster(result);
      } else if (nextMode === 'animation') {
        openAnimation(result);
      }
    },
    [openAnimation, openPoster, requestFeedback, requestedMode],
  );

  const postAuthHandlers = useMemo(
    () => ({
      'ai.logo.generate': async (
        intent: PostAuthIntentFor<'ai.logo.generate'>,
      ) => {
        const { requestedMode: intentRequestedMode, ...payload } =
          intent.payload;
        const result = await generateLogoMutation.mutateAsync(payload);
        handleLogoSuccess(result, intentRequestedMode ?? null);
      },
    }),
    [generateLogoMutation, handleLogoSuccess],
  );

  usePostAuthIntentExecutor(postAuthHandlers);

  const handleGenerateLogo = (data: LogoFormData) => {
    lastGenerationParams.current = data;
    setLatestGeneration(null);

    const payload = createLogoGenerationPayload(data);
    if (
      !requirePostAuthIntent({
        kind: 'ai.logo.generate',
        returnPath: getCurrentReturnPath(),
        payload: {
          ...payload,
          requestedMode: requestedMode ?? undefined,
        },
      })
    ) {
      return;
    }

    generateLogoMutation.mutate(payload, {
      onSuccess: (result) => handleLogoSuccess(result),
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
            if (isReadyLogoGeneration(generation)) {
              openPoster(generation);
            }
          }}
        />
      }
      title={t('logo.gridTitle')}
      convertToGeneratedItems={convertLogoGenerations}
      logoActions={[
        {
          label: t('logo.actions.createPoster'),
          onRequest: openPoster,
        },
        {
          label: t('logo.actions.animateLogo'),
          onRequest: openAnimation,
        },
      ]}
    />
  );
}
