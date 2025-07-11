'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Generation } from '@namefi-astra/ai/types';
import {
  useGenerationState,
  type GenerationLoadingState,
} from './use-generation-state';

interface GenerationContextValue {
  isGenerating: boolean;
  latestGeneration: Generation | null;
  existingGenerations: Generation[];
  brandDomain?: string;
  loadingState: GenerationLoadingState;
}

const GenerationContext = createContext<GenerationContextValue | null>(null);

interface GenerationProviderProps {
  children: ReactNode;
  existingGenerations: Generation[];
  brandDomain?: string;
  mutationIsPending: boolean;
}

/**
 * Provider component that manages generation state at the tab level.
 * This eliminates prop drilling and centralizes state management.
 */
export function GenerationProvider({
  children,
  existingGenerations,
  brandDomain,
  mutationIsPending,
}: GenerationProviderProps) {
  const { isGenerating, latestGeneration, loadingState } = useGenerationState({
    existingGenerations,
    mutationIsPending,
  });

  return (
    <GenerationContext.Provider
      value={{
        isGenerating,
        latestGeneration,
        existingGenerations,
        brandDomain,
        loadingState,
      }}
    >
      {children}
    </GenerationContext.Provider>
  );
}

/**
 * Hook to access generation context.
 * Must be used within a GenerationProvider.
 */
export function useGenerationContext() {
  const context = useContext(GenerationContext);
  if (!context) {
    throw new Error(
      'useGenerationContext must be used within a GenerationProvider',
    );
  }
  return context;
}
