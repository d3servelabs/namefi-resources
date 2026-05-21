import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTRPC, type AppRouterOutput } from '@/lib/trpc';
import type { PendingGalleryItem } from '../gallery-pending-context';
import type {
  DomainPreview,
  GalleryFilters,
  GalleryGeneration,
  GalleryItem,
} from './gallery-types';

const toGalleryStatus = (generation: GalleryGeneration) => {
  switch (generation.status) {
    case 'PENDING':
      return 'pending' as const;
    case 'PROCESSING':
      return 'processing' as const;
    case 'FAILED':
      return 'failed' as const;
    default:
      return 'ready' as const;
  }
};

const resolveLogoPreviewUrl = (generation: GalleryGeneration) =>
  generation.type === 'logo'
    ? (generation.thumbnailUrl ?? generation.url)
    : null;

const resolveReferenceLogoPreviewUrl = (
  generation: GalleryGeneration,
  logoPreviewById: ReadonlyMap<string, string | null>,
) => {
  if (generation.type !== 'animation' || !generation.referenceGenerationId) {
    return null;
  }

  return logoPreviewById.get(generation.referenceGenerationId) ?? null;
};

const resolveGenerationPreviewUrl = (
  generation: GalleryGeneration,
  logoPreviewById: ReadonlyMap<string, string | null>,
  pendingPreviewUrl?: string | null,
) => {
  if (generation.type === 'animation') {
    return (
      pendingPreviewUrl ??
      resolveReferenceLogoPreviewUrl(generation, logoPreviewById) ??
      (generation.input?.type === 'animation' &&
      generation.input.mode === 'sheet-guided'
        ? generation.url
        : null) ??
      generation.thumbnailUrl ??
      generation.url
    );
  }

  return generation.thumbnailUrl ?? generation.url;
};

interface UseGenerationsGalleryOptions {
  domains: DomainPreview[];
  filters: GalleryFilters;
  pendingItems: PendingGalleryItem[];
  getPendingProgress: (pendingId: string, startedAt?: number) => number;
  activeTab: 'yours' | 'featured';
  isAuthenticated: boolean;
}

export const useGenerationsGalleryData = ({
  domains,
  filters,
  pendingItems,
  getPendingProgress,
  activeTab,
  isAuthenticated,
}: UseGenerationsGalleryOptions) => {
  const trpc = useTRPC();

  const typesForQuery: Array<'logo' | 'marketing' | 'animation'> =
    filters.type === 'all'
      ? ['logo', 'marketing', 'animation']
      : [filters.type];

  const filteredQuery = useQuery({
    ...trpc.ai.getUserGenerationsFiltered.queryOptions(
      {
        types: typesForQuery,
        domains: filters.selectedBrands.length
          ? (filters.selectedBrands as [string, ...string[]])
          : undefined,
        limit: 120,
      },
      {
        enabled: isAuthenticated && activeTab === 'yours',
        staleTime: 10_000,
        placeholderData: (previousData) => previousData,
        refetchInterval: (query) => {
          const rows = query.state.data as GalleryGeneration[] | undefined;
          const shouldPoll = rows?.some(
            (generation) =>
              generation.status === 'PENDING' ||
              generation.status === 'PROCESSING',
          );

          return shouldPoll ? 2_500 : false;
        },
      },
    ),
  });

  const featuredQuery = useQuery({
    ...trpc.ai.getFeaturedAndRecentGenerations.queryOptions(),
    enabled: activeTab === 'featured',
    staleTime: 10_000,
  });

  type FeaturedRecent =
    AppRouterOutput['ai']['getFeaturedAndRecentGenerations'];

  const filteredGenerations =
    (filteredQuery.data as GalleryGeneration[] | undefined) ?? [];

  const shouldFetchReferenceLogos =
    activeTab === 'yours' &&
    isAuthenticated &&
    (filters.type === 'animation' ||
      filteredGenerations.some(
        (generation) =>
          generation.type === 'animation' && generation.referenceGenerationId,
      ));

  const referenceLogosQuery = useQuery({
    ...trpc.ai.getUserGenerationsFiltered.queryOptions(
      {
        types: ['logo'],
        domains: filters.selectedBrands.length
          ? (filters.selectedBrands as [string, ...string[]])
          : undefined,
        limit: 240,
      },
      {
        enabled: shouldFetchReferenceLogos,
        staleTime: 10_000,
      },
    ),
  });

  const referenceLogoGenerations =
    (referenceLogosQuery.data as GalleryGeneration[] | undefined) ?? [];

  const logoPreviewById = useMemo(() => {
    const previews = new Map<string, string | null>();
    for (const generation of [
      ...filteredGenerations,
      ...referenceLogoGenerations,
    ]) {
      const previewUrl = resolveLogoPreviewUrl(generation);
      if (previewUrl) {
        previews.set(generation.id, previewUrl);
      }
    }
    return previews;
  }, [filteredGenerations, referenceLogoGenerations]);

  const pendingGalleryItems = useMemo<GalleryItem[]>(() => {
    const items: GalleryItem[] = [];

    for (const pending of pendingItems) {
      const generation = pending.generation as GalleryGeneration | undefined;
      const progressValue = getPendingProgress(pending.id, pending.startedAt);
      const isReady = Boolean(generation && progressValue >= 100);

      items.push({
        id: generation?.id ?? pending.id,
        pendingId: pending.id,
        domain: generation?.domain ?? pending.domain,
        type: generation?.type ?? pending.type,
        url: generation?.url,
        previewUrl: generation
          ? resolveGenerationPreviewUrl(
              generation,
              logoPreviewById,
              pending.previewUrl,
            )
          : (pending.previewUrl ?? null),
        thumbnailUrl: generation?.thumbnailUrl,
        mimeType: generation?.mimeType,
        generation,
        status: isReady ? 'ready' : 'pending',
        errorMessage: generation?.errorMessage,
        startedAt: pending.startedAt,
        source: 'pending',
      });
    }

    return items;
  }, [pendingItems, getPendingProgress, logoPreviewById]);

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: aggregation merges pending, cached, and preview items with deduplication
  const galleryItems = useMemo<GalleryItem[]>(() => {
    const seenGenerationIds = new Set<string>();
    const items: GalleryItem[] = [];

    for (const item of pendingGalleryItems) {
      if (item.generation?.id) {
        seenGenerationIds.add(item.generation.id);
      }
      items.push(item);
    }

    if (filteredGenerations.length > 0) {
      for (const generation of filteredGenerations) {
        if (seenGenerationIds.has(generation.id)) continue;
        items.push({
          id: generation.id,
          domain: generation.domain,
          type: generation.type,
          url: generation.url,
          previewUrl: resolveGenerationPreviewUrl(generation, logoPreviewById),
          thumbnailUrl: generation.thumbnailUrl,
          mimeType: generation.mimeType,
          generation,
          status: toGalleryStatus(generation),
          errorMessage: generation.errorMessage,
          source: 'query',
        });
        seenGenerationIds.add(generation.id);
      }
    } else {
      for (const domain of domains) {
        for (const preview of domain.previewGenerations ?? []) {
          if (seenGenerationIds.has(preview.id)) continue;
          items.push({
            id: preview.id,
            domain: domain.domain,
            type: preview.type,
            url: preview.url,
            previewUrl: preview.thumbnailUrl ?? preview.url,
            thumbnailUrl: preview.thumbnailUrl,
            mimeType: preview.mimeType,
            status: 'preview',
            source: 'preview',
          });
          seenGenerationIds.add(preview.id);
        }
      }
    }

    return items;
  }, [pendingGalleryItems, filteredGenerations, domains, logoPreviewById]);

  const filteredGalleryItems = useMemo(() => {
    if (!filters.selectedBrands.length && filters.type === 'all') {
      return galleryItems;
    }

    const brandSet =
      filters.selectedBrands.length > 0
        ? new Set(filters.selectedBrands)
        : null;

    return galleryItems.filter((item) => {
      const matchesBrand = !brandSet || brandSet.has(item.domain);
      const matchesType =
        filters.type === 'all' || (item.type && item.type === filters.type);
      return matchesBrand && matchesType;
    });
  }, [galleryItems, filters.selectedBrands, filters.type]);

  const combinedFeaturedItems = useMemo(() => {
    if (!featuredQuery.data) {
      return [] as Array<{
        id: string;
        url: string | null;
        previewUrl: string | null;
        mimeType: string | null;
        domain: string;
        type?: 'logo' | 'marketing' | 'animation';
      }>;
    }
    const fr = featuredQuery.data as FeaturedRecent;
    const seen = new Set<string>();
    const ordered: Array<{
      id: string;
      url: string | null;
      previewUrl: string | null;
      mimeType: string | null;
      domain: string;
      type?: 'logo' | 'marketing' | 'animation';
    }> = [];
    for (const generation of fr.featured ?? []) {
      if (seen.has(generation.id)) continue;
      ordered.push({
        id: generation.id,
        url: generation.url,
        previewUrl: generation.thumbnailUrl ?? generation.url,
        mimeType: generation.mimeType,
        domain: generation.domain,
        type: generation.type,
      });
      seen.add(generation.id);
    }
    for (const generation of fr.recent ?? []) {
      if (seen.has(generation.id)) continue;
      ordered.push({
        id: generation.id,
        url: generation.url,
        previewUrl: generation.thumbnailUrl ?? generation.url,
        mimeType: generation.mimeType,
        domain: generation.domain,
        type: generation.type,
      });
      seen.add(generation.id);
    }
    return ordered;
  }, [featuredQuery.data]);

  const hasPendingGenerations = pendingItems.length > 0;
  const hasUserGenerations = filteredGenerations.length > 0;
  const shouldShowYoursTab =
    isAuthenticated &&
    (hasUserGenerations ||
      hasPendingGenerations ||
      filteredQuery.isLoading ||
      filteredQuery.isFetching);

  return {
    filteredQuery,
    featuredQuery,
    filteredGenerations,
    galleryItems,
    filteredGalleryItems,
    combinedFeaturedItems,
    hasUserGenerations,
    hasPendingGenerations,
    shouldShowYoursTab,
  } as const;
};
