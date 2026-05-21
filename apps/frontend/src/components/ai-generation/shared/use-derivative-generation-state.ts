import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { DerivativeSource } from '../derivative-flow-context';
import type { Generation } from './types';

type UseDerivativeGenerationStateParams = {
  brandDomain?: NamefiNormalizedDomain;
  focusedLogo?: DerivativeSource;
  logoGenerations: readonly Generation[];
};

export function useDerivativeGenerationState<TFormData>({
  brandDomain,
  focusedLogo,
  logoGenerations,
}: UseDerivativeGenerationStateParams) {
  const [domainOverride, setDomainOverride] = useState<
    NamefiNormalizedDomain | undefined
  >(brandDomain ?? (focusedLogo?.domain as NamefiNormalizedDomain | undefined));
  const [focusedLogoId, setFocusedLogoId] = useState<string | null>(
    focusedLogo?.id ?? null,
  );
  const lastGenerationParams = useRef<TFormData | null>(null);
  const [latestGeneration, setLatestGeneration] = useState<Generation | null>(
    null,
  );

  useEffect(() => {
    const nextDomain = brandDomain ?? focusedLogo?.domain;
    if (nextDomain !== domainOverride) {
      setDomainOverride(nextDomain as NamefiNormalizedDomain | undefined);
    }
  }, [brandDomain, focusedLogo?.domain, domainOverride]);

  useEffect(() => {
    setFocusedLogoId(focusedLogo?.id ?? null);
  }, [focusedLogo?.id]);

  const logosWithFocus = useMemo<Generation[]>(() => {
    if (!focusedLogo) return [...logoGenerations];
    const alreadyIncludes = logoGenerations.some(
      (generation) => generation.id === focusedLogo.id,
    );
    if (alreadyIncludes) return [...logoGenerations];
    return [...logoGenerations, focusedLogo as Generation];
  }, [focusedLogo, logoGenerations]);

  return {
    effectiveDomain: domainOverride,
    focusedLogoId,
    lastGenerationParams,
    latestGeneration,
    logosWithFocus,
    setLatestGeneration,
  };
}
