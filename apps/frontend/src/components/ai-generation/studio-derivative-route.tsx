'use client';

import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';
import {
  namefiNormalizedDomainSchema,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils/namefi-flavor';
import { useQuery } from '@tanstack/react-query';
import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import {
  useDerivativeFlow,
  type DerivativeSource,
  type RequestedDerivativeMode,
} from './derivative-flow-context';
import type { DomainPreview } from './shared/gallery-types';
import { isReadyLogoGeneration } from './shared/logo-readiness';

function parseNextDerivativeMode(
  value: string | null,
): RequestedDerivativeMode | null {
  return value === 'poster' || value === 'animation' ? value : null;
}

function parseDerivativeDomain(value: string | null) {
  if (!value) return null;
  const parsed = namefiNormalizedDomainSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function requestLogoForMode(
  mode: RequestedDerivativeMode,
  domain: NamefiNormalizedDomain | null,
  requestPosterLogo: (domain?: NamefiNormalizedDomain | null) => void,
  requestAnimationLogo: (domain?: NamefiNormalizedDomain | null) => void,
) {
  if (mode === 'animation') {
    requestAnimationLogo(domain);
  } else {
    requestPosterLogo(domain);
  }
}

function startDerivativeForMode(
  mode: RequestedDerivativeMode,
  domain: NamefiNormalizedDomain | null,
  startPoster: (domain?: NamefiNormalizedDomain | null) => void,
  startAnimation: (domain?: NamefiNormalizedDomain | null) => void,
) {
  if (mode === 'animation') {
    startAnimation(domain);
  } else {
    startPoster(domain);
  }
}

function hasOwnedLogoDomain(domains: readonly DomainPreview[]) {
  return domains.some((domain) => (domain.logoCount ?? 0) > 0);
}

export function removeStudioDerivativeSearchParams(searchParamsString: string) {
  const params = new URLSearchParams(searchParamsString);
  params.delete('poster');
  params.delete('animation');
  params.delete('next');
  params.delete('domain');
  const query = params.toString();
  return query ? `/studio?${query}` : '/studio';
}

export function useClearStudioDerivativeRoute() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  return useCallback(() => {
    const cleanPath = removeStudioDerivativeSearchParams(searchParamsString);
    const currentPath = searchParamsString
      ? `/studio?${searchParamsString}`
      : '/studio';
    if (cleanPath !== currentPath) {
      router.replace(cleanPath as Route, { scroll: false });
    }
  }, [router, searchParamsString]);
}

export function StudioDerivativeRouteInitializer({
  domains = [],
}: {
  domains?: readonly DomainPreview[];
}) {
  const searchParams = useSearchParams();
  const posterId = searchParams.get('poster');
  const animationId = searchParams.get('animation');
  const derivativeParamMode = posterId
    ? 'poster'
    : animationId
      ? 'animation'
      : null;
  const nextMode = parseNextDerivativeMode(searchParams.get('next'));
  const nextDomain = parseDerivativeDomain(searchParams.get('domain'));
  const activeLogoId = posterId ?? animationId;
  const hasDerivativeRoute = Boolean(activeLogoId || nextMode);
  const clearDerivativeRoute = useClearStudioDerivativeRoute();
  const {
    openAnimation,
    openPoster,
    requestAnimationLogo,
    requestPosterLogo,
    startAnimation,
    startPoster,
  } = useDerivativeFlow();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const trpc = useTRPC();
  const handledRef = useRef<string | null>(null);
  const hasOwnedLogos = hasOwnedLogoDomain(domains);

  const { data: sourceGeneration, isError: isSourceGenerationError } = useQuery(
    {
      ...trpc.ai.getGenerationById.queryOptions({ id: activeLogoId || '' }),
      enabled: !!activeLogoId,
    },
  );

  useEffect(() => {
    if (activeLogoId || !nextMode) return;
    if (isAuthLoading) return;

    const nextKey = `${
      isAuthenticated ? `auth:${user?.id ?? 'unknown'}` : 'public'
    }:next:${nextMode}:${nextDomain ?? ''}:${hasOwnedLogos ? 'logos' : 'none'}`;
    if (handledRef.current === nextKey) return;

    if (isAuthenticated && hasOwnedLogos) {
      startDerivativeForMode(nextMode, nextDomain, startPoster, startAnimation);
    } else {
      requestLogoForMode(
        nextMode,
        nextDomain,
        requestPosterLogo,
        requestAnimationLogo,
      );
    }
    handledRef.current = nextKey;
    clearDerivativeRoute();
  }, [
    activeLogoId,
    clearDerivativeRoute,
    hasOwnedLogos,
    isAuthLoading,
    isAuthenticated,
    nextDomain,
    nextMode,
    requestAnimationLogo,
    requestPosterLogo,
    startAnimation,
    startPoster,
    user?.id,
  ]);

  useEffect(() => {
    // URL params are single-use commands; this effect consumes each route state
    // once and hands it to the derivative flow state machine.
    if (!activeLogoId || !derivativeParamMode) return;

    const activeKey = `${
      isAuthenticated ? `auth:${user?.id ?? 'unknown'}` : 'public'
    }:${derivativeParamMode}:${activeLogoId}`;
    if (handledRef.current === activeKey) return;

    if (isSourceGenerationError) {
      handledRef.current = activeKey;
      clearDerivativeRoute();
      return;
    }

    if (!sourceGeneration || isAuthLoading) return;

    if (!isReadyLogoGeneration(sourceGeneration)) {
      handledRef.current = activeKey;
      clearDerivativeRoute();
      return;
    }

    if (!isAuthenticated) {
      requestLogoForMode(
        derivativeParamMode,
        parseDerivativeDomain(sourceGeneration.domain),
        requestPosterLogo,
        requestAnimationLogo,
      );
      handledRef.current = activeKey;
      clearDerivativeRoute();
      return;
    }

    const isOwnedLogo =
      !!user?.id &&
      !!sourceGeneration.userId &&
      user.id === sourceGeneration.userId;

    if (isOwnedLogo) {
      // getGenerationById returns mapped generation records with the logo media
      // fields required by the derivative flow for owned logo generations.
      const derivativeSource = sourceGeneration as DerivativeSource;
      if (derivativeParamMode === 'animation') {
        openAnimation(derivativeSource);
      } else {
        openPoster(derivativeSource);
      }
    } else {
      requestLogoForMode(
        derivativeParamMode,
        parseDerivativeDomain(sourceGeneration.domain),
        requestPosterLogo,
        requestAnimationLogo,
      );
    }

    handledRef.current = activeKey;
    clearDerivativeRoute();
  }, [
    activeLogoId,
    clearDerivativeRoute,
    derivativeParamMode,
    isAuthLoading,
    isAuthenticated,
    isSourceGenerationError,
    openAnimation,
    openPoster,
    requestAnimationLogo,
    requestPosterLogo,
    sourceGeneration,
    user?.id,
  ]);

  useEffect(() => {
    if (!hasDerivativeRoute) {
      handledRef.current = null;
    }
  }, [hasDerivativeRoute]);

  return null;
}
