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

interface UseGenerationsGalleryOptions {
  domains: DomainPreview[];
  filters: GalleryFilters;
  pendingItems: PendingGalleryItem[];
  getPendingProgress: (pendingId: string, startedAt?: number) => number;
  activeTab: 'yours' | 'featured';
}

export const useGenerationsGalleryData = ({
  domains,
  filters,
  pendingItems,
  getPendingProgress,
  activeTab,
}: UseGenerationsGalleryOptions) => {
  const trpc = useTRPC();

  const typesForQuery: Array<'logo' | 'marketing'> =
    filters.type === 'all' ? ['logo', 'marketing'] : [filters.type];

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
        enabled: activeTab === 'yours',
        staleTime: 10_000,
        placeholderData: (previousData) => previousData,
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
        generation,
        status: isReady ? 'ready' : 'pending',
        startedAt: pending.startedAt,
        source: 'pending',
      });
    }

    return items;
  }, [pendingItems, getPendingProgress]);

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
          generation,
          status: 'ready',
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
            status: 'preview',
            source: 'preview',
          });
          seenGenerationIds.add(preview.id);
        }
      }
    }

    return items;
  }, [pendingGalleryItems, filteredGenerations, domains]);

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
    if (!featuredQuery.data)
      return [] as Array<{ id: string; url: string; domain: string }>;
    const fr = featuredQuery.data as FeaturedRecent;
    const seen = new Set<string>();
    const ordered: Array<{ id: string; url: string; domain: string }> = [];
    for (const generation of fr.featured ?? []) {
      if (seen.has(generation.id)) continue;
      ordered.push({
        id: generation.id,
        url: generation.url,
        domain: generation.domain,
      });
      seen.add(generation.id);
    }
    for (const generation of fr.recent ?? []) {
      if (seen.has(generation.id)) continue;
      ordered.push({
        id: generation.id,
        url: generation.url,
        domain: generation.domain,
      });
      seen.add(generation.id);
    }
    return ordered;
  }, [featuredQuery.data]);

  const hasPendingGenerations = pendingItems.length > 0;
  const hasUserGenerations = filteredGenerations.length > 0;
  const shouldShowYoursTab =
    hasUserGenerations ||
    hasPendingGenerations ||
    filteredQuery.isLoading ||
    filteredQuery.isFetching;

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
