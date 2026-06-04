import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { DerivativeSource } from '../derivative-flow-context';
import type { Generation } from './types';
import {
  filterReadyLogoGenerations,
  isReadyLogoGeneration,
  type ReadyLogoSource,
} from './logo-readiness';

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

  const logosWithFocus = useMemo<ReadyLogoSource[]>(() => {
    const readyLogoGenerations = filterReadyLogoGenerations(logoGenerations);

    if (!isReadyLogoGeneration(focusedLogo)) {
      return readyLogoGenerations;
    }

    const alreadyIncludes = logoGenerations.some(
      (generation) => generation.id === focusedLogo.id,
    );
    if (alreadyIncludes) return readyLogoGenerations;
    return [...readyLogoGenerations, focusedLogo];
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
