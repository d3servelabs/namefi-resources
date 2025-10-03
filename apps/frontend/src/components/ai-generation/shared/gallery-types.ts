import type { AppRouterOutput } from '@/lib/trpc';
import type { PendingGalleryItem } from '../gallery-pending-context';

export type GalleryGeneration =
  AppRouterOutput['ai']['getUserGenerationsFiltered'][number];

export type GalleryItemSource = 'pending' | 'query' | 'preview';
export type GalleryItemStatus = 'pending' | 'ready' | 'preview';

export interface PreviewGeneration {
  id: string;
  url: string;
  type?: 'logo' | 'marketing';
}

export interface DomainPreview {
  domain: string;
  latestGeneration?: Date | string | null;
  logoCount?: number;
  marketingCount?: number;
  previewGenerations?: PreviewGeneration[];
}

export interface GalleryItem {
  id: string;
  pendingId?: string;
  url?: string;
  domain: string;
  type?: 'logo' | 'marketing';
  generation?: GalleryGeneration;
  status: GalleryItemStatus;
  startedAt?: number;
  source: GalleryItemSource;
}

export type GalleryFilters = {
  selectedBrands: string[];
  type: 'all' | 'logo' | 'marketing';
};

export type PendingGalleryWithGeneration = PendingGalleryItem & {
  generation?: GalleryGeneration;
};
