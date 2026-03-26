import type { AppRouterOutput } from '@/lib/trpc';
import type { PendingGalleryItem } from '../gallery-pending-context';

export type GalleryGeneration =
  AppRouterOutput['ai']['getUserGenerationsFiltered'][number];

export type GalleryItemSource = 'pending' | 'query' | 'preview';
export type GalleryItemStatus =
  | 'pending'
  | 'processing'
  | 'ready'
  | 'failed'
  | 'preview';

export interface PreviewGeneration {
  id: string;
  url?: string | null;
  thumbnailUrl?: string | null;
  mimeType?: string | null;
  type?: 'logo' | 'marketing' | 'animation';
}

export interface DomainPreview {
  domain: string;
  latestGeneration?: Date | string | null;
  logoCount?: number;
  marketingCount?: number;
  animationCount?: number;
  previewGenerations?: PreviewGeneration[];
}

export interface GalleryItem {
  id: string;
  pendingId?: string;
  url?: string | null;
  previewUrl?: string | null;
  thumbnailUrl?: string | null;
  mimeType?: string | null;
  domain: string;
  type?: 'logo' | 'marketing' | 'animation';
  generation?: GalleryGeneration;
  status: GalleryItemStatus;
  errorMessage?: string | null;
  startedAt?: number;
  source: GalleryItemSource;
}

export type GalleryFilters = {
  selectedBrands: string[];
  type: 'all' | 'logo' | 'marketing' | 'animation';
};

export type PendingGalleryWithGeneration = PendingGalleryItem & {
  generation?: GalleryGeneration;
};
