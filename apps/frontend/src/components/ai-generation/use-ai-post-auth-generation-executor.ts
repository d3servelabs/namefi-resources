import { useMemo } from 'react';
import {
  usePostAuthIntentExecutor,
  type PostAuthIntentFor,
} from '@/hooks/use-post-auth-intent';
import type { AppRouterInput } from '@/lib/trpc';
import {
  useAnimationGeneration,
  usePosterGeneration,
} from './shared/generation-hooks';

export function useAIPostAuthGenerationExecutor() {
  const generatePosterMutation = usePosterGeneration({});
  const generateAnimationMutation = useAnimationGeneration({});

  const postAuthHandlers = useMemo(
    () => ({
      'ai.poster.generate': async (
        intent: PostAuthIntentFor<'ai.poster.generate'>,
      ) => {
        await generatePosterMutation.mutateAsync(intent.payload);
      },
      'ai.animation.generate': async (
        intent: PostAuthIntentFor<'ai.animation.generate'>,
      ) => {
        await generateAnimationMutation.mutateAsync(
          // The stored intent payload is runtime-validated from the same option
          // constants as ai.generateAnimation; keep these schemas in sync.
          intent.payload as AppRouterInput['ai']['generateAnimation'],
        );
      },
    }),
    [generateAnimationMutation, generatePosterMutation],
  );

  usePostAuthIntentExecutor(postAuthHandlers);
}
