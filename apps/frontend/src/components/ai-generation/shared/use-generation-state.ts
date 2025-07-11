import { useState, useEffect, useRef } from 'react';
import type { Generation } from '@namefi-astra/ai/types';

interface UseGenerationStateProps {
  existingGenerations: Generation[];
  mutationIsPending: boolean;
}

export type GenerationLoadingState = 'idle' | 'generating' | 'syncing';

interface UseGenerationStateReturn {
  isGenerating: boolean;
  latestGeneration: Generation | null;
  generationStartTime: Date | null;
  loadingState: GenerationLoadingState;
}

/**
 * Custom hook to manage generation state, handling the gap between
 * mutation completion and data refresh.
 *
 * This solves the race condition where:
 * 1. Mutation completes (isPending becomes false)
 * 2. onSuccess is called, triggering refetch
 * 3. refetch takes time to update existingGenerations
 *
 * We track the generation lifecycle to ensure loading state
 * remains true until the new generation appears in existingGenerations.
 */
export function useGenerationState({
  existingGenerations,
  mutationIsPending,
}: UseGenerationStateProps): UseGenerationStateReturn {
  const [generationStartTime, setGenerationStartTime] = useState<Date | null>(
    null,
  );
  const [latestGeneration, setLatestGeneration] = useState<Generation | null>(
    null,
  );
  const previousGenerationsRef = useRef<Generation[]>([]);

  // Track when generation starts
  useEffect(() => {
    if (mutationIsPending && !generationStartTime) {
      setGenerationStartTime(new Date());
    }
  }, [mutationIsPending, generationStartTime]);

  // Update latest generation and check for new generations
  useEffect(() => {
    // Find the newest generation
    if (existingGenerations.length > 0) {
      const newest = existingGenerations.reduce((latest, current) =>
        new Date(current.createdAt) > new Date(latest.createdAt)
          ? current
          : latest,
      );
      setLatestGeneration(newest);
    }

    // Check if we have a new generation since we started
    if (generationStartTime && existingGenerations.length > 0) {
      const hasNewGeneration = existingGenerations.some(
        (gen) => new Date(gen.createdAt) >= generationStartTime,
      );

      if (hasNewGeneration) {
        // New generation found, clear the start time
        setGenerationStartTime(null);
      }
    }

    // Store current generations for next comparison
    previousGenerationsRef.current = existingGenerations;
  }, [existingGenerations, generationStartTime]);

  // We're generating if either:
  // 1. The mutation is pending, OR
  // 2. We're waiting for the new generation to appear
  const isGenerating = mutationIsPending || !!generationStartTime;

  // Determine the specific loading state
  const loadingState: GenerationLoadingState = mutationIsPending
    ? 'generating'
    : generationStartTime
      ? 'syncing'
      : 'idle';

  return {
    isGenerating,
    latestGeneration,
    generationStartTime,
    loadingState,
  };
}
