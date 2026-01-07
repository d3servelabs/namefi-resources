'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { Button } from '@/components/ui/shadcn/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/shadcn/alert-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/shadcn/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/shadcn/command';
import {
  Building2,
  ChevronDown,
  Check,
  Image as ImageIcon,
  Loader2,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { TwitterShareDialog } from '@/components/hunt/twitter-share-dialog';
import {
  defaultShareConfig,
  useTwitterShareDialog,
} from '@/hooks/use-twitter-share';
import { usePosterFlow } from './poster-flow-context';
import type { PosterSource } from './poster-flow-context';
import { useGalleryPending } from './gallery-pending-context';
import { getProgressMessage } from './shared/gallery-utils';
import {
  buildDownloadFilename,
  copyGenerationLink,
  downloadGenerationAsset,
  resolveGenerationLink,
} from './shared/generation-actions';
import { usePendingGenerationProgress } from './shared/use-gallery-progress';
import { useGenerationsGalleryData } from './shared/use-gallery-data';
import { GenerationActionButtons } from './shared/generation-action-buttons';
import { useDeleteGeneration } from './shared/generation-hooks';
import type {
  DomainPreview,
  GalleryFilters,
  GalleryGeneration,
  GalleryItem,
} from './shared/gallery-types';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

type TabValue = 'yours' | 'featured';

type ShareState = {
  isOpen: boolean;
  url: string | null;
  domain: NamefiNormalizedDomain | null;
};

type DeleteTarget = {
  id: string;
  domain: string;
  type: 'logo' | 'marketing';
};

interface GenerationsColumnProps {
  domains: DomainPreview[];
  className?: string;
}

export function GenerationsColumn({
  domains,
  className,
}: GenerationsColumnProps) {
  const router = useRouter();
  const { pendingItems, removePendingItem } = useGalleryPending();
  const { openPoster } = usePosterFlow();

  const [filters, setFilters] = useState<GalleryFilters>({
    selectedBrands: [],
    type: 'all',
  });
  const [activeTab, setActiveTab] = useState<TabValue>('yours');
  const previousPendingCountRef = useRef(0);

  const shareDialog = useTwitterShareDialog({
    ...defaultShareConfig,
    enabled: true,
    trackShares: false,
    featureKey: 'ai_generation',
  });
  const [shareState, setShareState] = useState<ShareState>({
    isOpen: false,
    url: null,
    domain: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const deleteMutation = useDeleteGeneration({
    onSuccess: () => setDeleteTarget(null),
  });

  const { progressById, getProgressValue } =
    usePendingGenerationProgress(pendingItems);

  const gallery = useGenerationsGalleryData({
    domains,
    filters,
    pendingItems,
    getPendingProgress: getProgressValue,
    activeTab,
  });

  const {
    filteredQuery,
    featuredQuery,
    filteredGenerations,
    filteredGalleryItems,
    combinedFeaturedItems,
    shouldShowYoursTab,
  } = gallery;

  const isFilteredLoading = filteredQuery.isLoading;
  const isFilteredFetching = filteredQuery.isFetching;
  const isFeaturedLoading = featuredQuery.isLoading;

  const selectedBrands = filters.selectedBrands;
  const typeFilter = filters.type;
  const pendingCount = pendingItems.length;

  useEffect(() => {
    const previousCount = previousPendingCountRef.current;
    if (pendingCount > previousCount) {
      setFilters({ selectedBrands: [], type: 'all' });
      setActiveTab('yours');
    }
    previousPendingCountRef.current = pendingCount;
  }, [pendingCount]);

  useEffect(() => {
    if (
      !shouldShowYoursTab &&
      activeTab === 'yours' &&
      !(isFilteredLoading || isFilteredFetching)
    ) {
      setActiveTab('featured');
    }
  }, [shouldShowYoursTab, activeTab, isFilteredLoading, isFilteredFetching]);

  useEffect(() => {
    if (pendingCount > 0) {
      setActiveTab('yours');
    }
  }, [pendingCount]);

  useEffect(() => {
    if (pendingCount === 0) return;

    for (const pending of pendingItems) {
      const resolvedId = pending.generation?.id;
      if (!resolvedId) continue;
      const progressValue = progressById[pending.id] ?? 0;
      if (progressValue < 100) continue;
      const existsInResults = filteredGenerations.some(
        (generation) => generation.id === resolvedId,
      );
      if (existsInResults) {
        removePendingItem(pending.id);
      }
    }
  }, [
    pendingItems,
    filteredGenerations,
    progressById,
    removePendingItem,
    pendingCount,
  ]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabValue);
  };

  const handleToggleBrand = (domain: string) => {
    setFilters((prev) => {
      const alreadySelected = prev.selectedBrands.includes(domain);
      const updatedBrands = alreadySelected
        ? prev.selectedBrands.filter((value) => value !== domain)
        : [...prev.selectedBrands, domain];
      return { ...prev, selectedBrands: updatedBrands };
    });
  };

  const handleTypeChange = (type: GalleryFilters['type']) => {
    setFilters((prev) => ({ ...prev, type }));
  };

  const handleNavigateToGeneration = (id: string) => {
    router.push(`/ai-brand-generator/${id}`);
  };

  const handleCopyLink = (id: string) => {
    void copyGenerationLink({ id });
  };

  const handleOpenShareDialog = (id: string, domain: string) => {
    const url = resolveGenerationLink({ id });
    if (!url) {
      toast.error('Unable to share', {
        description: 'A shareable link is not available for this generation.',
      });
      return;
    }

    setShareState({
      isOpen: true,
      url,
      domain: domain as NamefiNormalizedDomain,
    });
    shareDialog.openDialog(domain as NamefiNormalizedDomain);
  };

  const handleDeleteRequest = (item: GalleryItem) => {
    const resolvedType =
      item.type ?? item.generation?.type ?? ('logo' as const);
    setDeleteTarget({
      id: item.id,
      domain: item.domain,
      type: resolvedType,
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate({ id: deleteTarget.id });
  };

  const handleDeleteDialogChange = (open: boolean) => {
    if (!open) {
      setDeleteTarget(null);
    }
  };

  const handleDownload = async (
    item: Pick<GalleryItem, 'id' | 'domain' | 'url'>,
  ) => {
    if (!item.url) return;

    await downloadGenerationAsset({
      url: item.url,
      filename: buildDownloadFilename(`${item.domain}-${item.id}`),
    });
  };

  const handlePosterRequest = (generation?: GalleryGeneration) => {
    if (!generation) return;
    openPoster(generation as PosterSource);
  };

  const closeShareDialog = () => {
    setShareState((prev) => ({ ...prev, isOpen: false }));
    shareDialog.onClose();
  };

  const renderYourGenerations = () => {
    if (isFilteredLoading) {
      return <GallerySkeletonGrid className="flex-1" />;
    }

    if (filteredGalleryItems.length === 0) {
      return (
        <div className="flex-1 px-4 py-6 text-sm text-muted-foreground">
          Generate a logo or poster to see it appear here.
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 py-4 px-4">
            {filteredGalleryItems.map((item) => {
              if (item.status === 'pending') {
                const pendingId = item.pendingId ?? item.id;
                const progressValue = getProgressValue(
                  pendingId,
                  item.startedAt,
                );
                return (
                  <PendingGenerationTile
                    key={item.id}
                    item={item}
                    progressValue={progressValue}
                  />
                );
              }

              return (
                <ReadyGenerationTile
                  key={item.id}
                  item={item}
                  onNavigate={handleNavigateToGeneration}
                  onCopy={handleCopyLink}
                  onShare={handleOpenShareDialog}
                  onDownload={handleDownload}
                  onPoster={handlePosterRequest}
                  onDelete={handleDeleteRequest}
                  isDeleting={deleteMutation.isPending}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderFeaturedGenerations = () => {
    if (isFeaturedLoading) {
      return <GallerySkeletonGrid className="flex-1" />;
    }

    return (
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 py-4 px-4">
            {combinedFeaturedItems.map((item) => (
              <FeaturedGenerationTile
                key={item.id}
                item={item}
                onNavigate={handleNavigateToGeneration}
                onCopy={handleCopyLink}
                onShare={handleOpenShareDialog}
                onDownload={handleDownload}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <GalleryHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        showYoursTab={shouldShowYoursTab}
        domains={domains}
        selectedBrands={selectedBrands}
        typeFilter={typeFilter}
        onToggleBrand={handleToggleBrand}
        onTypeChange={handleTypeChange}
        isYoursActive={activeTab === 'yours'}
      />
      <Card className="flex flex-1 flex-col min-h-0 border-border/50 bg-card py-0">
        <CardContent className="flex flex-1 flex-col min-h-0 px-0">
          {activeTab === 'yours'
            ? renderYourGenerations()
            : renderFeaturedGenerations()}
        </CardContent>
      </Card>
      <TwitterShareDialog
        isOpen={shareState.isOpen && !!shareDialog.isOpen}
        onClose={closeShareDialog}
        domainName={shareState.domain}
        shareUrl={shareState.url}
        hasShared={false}
        isCheckingStatus={false}
        isSubmitting={false}
        onSubmit={async () => {
          /* no-op: share confirmation handled server-side */
        }}
        trackShares={false}
        campaignKey={undefined}
        featureKey="ai_generation"
      />
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={handleDeleteDialogChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete generation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the{' '}
              {deleteTarget?.type === 'marketing' ? 'poster' : 'logo'} for{' '}
              <strong>{deleteTarget?.domain}</strong> from your gallery. This
              action can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface GalleryHeaderProps {
  activeTab: TabValue;
  onTabChange: (value: TabValue) => void;
  showYoursTab: boolean;
  domains: DomainPreview[];
  selectedBrands: string[];
  typeFilter: GalleryFilters['type'];
  onToggleBrand: (domain: string) => void;
  onTypeChange: (type: GalleryFilters['type']) => void;
  isYoursActive: boolean;
}

function GalleryHeader({
  activeTab,
  onTabChange,
  showYoursTab,
  domains,
  selectedBrands,
  typeFilter,
  onToggleBrand,
  onTypeChange,
  isYoursActive,
}: GalleryHeaderProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <Tabs
        value={activeTab}
        onValueChange={(value) => onTabChange(value as TabValue)}
      >
        <TabsList>
          {showYoursTab && (
            <TabsTrigger value="yours">Your Generations</TabsTrigger>
          )}
          <TabsTrigger value="featured">Featured</TabsTrigger>
        </TabsList>
      </Tabs>

      {isYoursActive && (
        <div className="flex items-center gap-2.5 overflow-x-auto whitespace-nowrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                role="combobox"
                aria-expanded={false}
                className="h-9 w-56 justify-between rounded-lg bg-muted/30 px-3 text-sm font-medium"
              >
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {selectedBrands.length > 0
                    ? `${selectedBrands.length} selected`
                    : 'Brands'}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="end">
              <Command className="rounded-lg bg-popover text-popover-foreground">
                <CommandInput
                  placeholder="Search brand..."
                  className="px-3 py-2 text-sm focus-visible:ring-transparent border-none"
                />
                <CommandList>
                  <CommandEmpty>No brands found.</CommandEmpty>
                  <CommandGroup>
                    {domains.map((domain) => {
                      const isSelected = selectedBrands.includes(domain.domain);
                      return (
                        <CommandItem
                          key={domain.domain}
                          value={domain.domain}
                          onSelect={(currentValue) =>
                            onToggleBrand(currentValue)
                          }
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              isSelected ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          {domain.domain}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Select
            value={typeFilter}
            onValueChange={(value) =>
              onTypeChange(value as GalleryFilters['type'])
            }
          >
            <SelectTrigger className="h-9 w-48 justify-between rounded-lg bg-muted/30 px-3 text-sm font-medium">
              <div className="flex items-center gap-2">
                <ImageIcon className="size-4 text-muted-foreground" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="logo">Logo</SelectItem>
              <SelectItem value="marketing">Poster</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

interface PendingGenerationTileProps {
  item: GalleryItem;
  progressValue: number;
}

function PendingGenerationTile({
  item,
  progressValue,
}: PendingGenerationTileProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(progressValue)));
  const message = getProgressMessage(clamped);

  return (
    <div className="relative flex aspect-[1/1] items-center justify-center overflow-hidden rounded-xl border border-border/40 bg-muted/30 shadow-xs">
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted/60 via-muted/30 to-muted/60" />
      <div className="relative z-10 flex flex-col items-center gap-3 px-4 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <div className="text-lg font-semibold text-foreground">{clamped}%</div>
        <div className="text-xs leading-relaxed text-muted-foreground">
          {message}
        </div>
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
          {item.type === 'marketing' ? 'Generating Poster' : 'Generating Logo'}{' '}
          · {item.domain}
        </div>
      </div>
    </div>
  );
}

interface ReadyGenerationTileProps {
  item: GalleryItem;
  onNavigate: (id: string) => void;
  onCopy: (id: string) => void;
  onShare: (id: string, domain: string) => void;
  onDownload: (item: Pick<GalleryItem, 'id' | 'domain' | 'url'>) => void;
  onPoster: (generation?: GalleryGeneration) => void;
  onDelete: (item: GalleryItem) => void;
  isDeleting?: boolean;
}

function ReadyGenerationTile({
  item,
  onNavigate,
  onCopy,
  onShare,
  onDownload,
  onPoster,
  onDelete,
  isDeleting,
}: ReadyGenerationTileProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: container wraps nested action buttons within the card
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open generation for ${item.domain}`}
      onClick={() => onNavigate(item.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          onNavigate(item.id);
        }
      }}
      className="group relative block aspect-[1/1] cursor-pointer overflow-hidden rounded-xl border border-border/40 bg-muted/30 shadow-xs transition hover:border-border hover:shadow-md focus:outline-none"
    >
      {item.url ? (
        <GalleryImage
          src={item.url}
          alt={item.domain}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted/30 text-xs text-muted-foreground">
          Preview Unavailable
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="absolute inset-0 flex flex-col justify-between p-3 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex items-start justify-between gap-3 text-white">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-white/90">
              {item.type === 'marketing' ? 'Poster' : 'Logo'}
            </div>
            <div className="text-sm font-semibold drop-shadow-md">
              {item.domain}
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full bg-black/65 text-white shadow-lg transition hover:bg-black"
            onClick={(event) => {
              event.stopPropagation();
              event.preventDefault();
              onNavigate(item.id);
            }}
          >
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
        <GenerationActionButtons
          appearance="overlay"
          posterAction={
            item.type === 'logo' && item.generation
              ? {
                  onClick: (event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    onPoster(item.generation);
                  },
                }
              : undefined
          }
          onCopy={(event) => {
            event.stopPropagation();
            event.preventDefault();
            onCopy(item.id);
          }}
          onShare={(event) => {
            event.stopPropagation();
            event.preventDefault();
            onShare(item.id, item.domain);
          }}
          onDownload={(event) => {
            event.stopPropagation();
            event.preventDefault();
            onDownload(item);
          }}
          deleteAction={{
            onClick: (event) => {
              event.stopPropagation();
              event.preventDefault();
              onDelete(item);
            },
            disabled: isDeleting,
          }}
        />
      </div>
    </div>
  );
}

interface FeaturedGenerationTileProps {
  item: { id: string; url: string; domain: string };
  onNavigate: (id: string) => void;
  onCopy: (id: string) => void;
  onShare: (id: string, domain: string) => void;
  onDownload: (item: Pick<GalleryItem, 'id' | 'domain' | 'url'>) => void;
}

function FeaturedGenerationTile({
  item,
  onNavigate,
  onCopy,
  onShare,
  onDownload,
}: FeaturedGenerationTileProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: container wraps nested action buttons within the card
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open featured generation for ${item.domain}`}
      onClick={() => onNavigate(item.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          onNavigate(item.id);
        }
      }}
      className="group relative block aspect-[1/1] cursor-pointer overflow-hidden rounded-xl border border-border/40 bg-muted/30 shadow-xs transition hover:border-border hover:shadow-md focus:outline-none"
    >
      <GalleryImage
        src={item.url}
        alt={item.domain}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="absolute inset-0 flex flex-col justify-between p-3 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="text-sm font-semibold text-white drop-shadow-sm">
          {item.domain}
        </div>
        <GenerationActionButtons
          appearance="featured"
          onCopy={(event) => {
            event.stopPropagation();
            event.preventDefault();
            onCopy(item.id);
          }}
          onShare={(event) => {
            event.stopPropagation();
            event.preventDefault();
            onShare(item.id, item.domain);
          }}
          onDownload={(event) => {
            event.stopPropagation();
            event.preventDefault();
            onDownload(item);
          }}
        />
      </div>
    </div>
  );
}

interface GalleryImageProps {
  src: string;
  alt: string;
  className?: string;
}

function GalleryImage({ src, alt, className }: GalleryImageProps) {
  // biome-ignore lint/performance/noImgElement: gallery tiles rely on native img for lightweight rendering
  return <img src={src} alt={alt} className={className} loading="lazy" />;
}

const GALLERY_SKELETON_KEYS = ['a', 'b', 'c', 'd', 'e', 'f'] as const;

const GallerySkeletonGrid = ({ className }: { className?: string }) => (
  <div className={cn('px-4 py-4', className)}>
    <div className="grid grid-cols-2 gap-4">
      {GALLERY_SKELETON_KEYS.map((key) => (
        <Skeleton
          key={key}
          className="aspect-[1/1] w-full rounded-xl bg-muted/40"
        />
      ))}
    </div>
  </div>
);

export function GenerationsColumnSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Tabs value="yours" className="pointer-events-none opacity-60">
          <TabsList>
            <TabsTrigger value="yours">Your Generations</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-9 w-56 rounded-lg" />
          <Skeleton className="h-9 w-48 rounded-lg" />
        </div>
      </div>
      <Card className="flex flex-1 flex-col min-h-0 border-border/50 bg-card py-0">
        <CardContent className="flex flex-1 flex-col min-h-0 px-0">
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <GallerySkeletonGrid />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
