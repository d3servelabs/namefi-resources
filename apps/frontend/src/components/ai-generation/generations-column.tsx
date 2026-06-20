'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { toast } from 'sonner';
import { Card, CardContent } from '@namefi-astra/ui/components/shadcn/card';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@namefi-astra/ui/components/shadcn/alert-dialog';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@namefi-astra/ui/components/shadcn/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@namefi-astra/ui/components/shadcn/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@namefi-astra/ui/components/shadcn/command';
import {
  Clapperboard,
  Building2,
  ChevronDown,
  Check,
  Image as ImageIcon,
  Loader2,
  ArrowUpRight,
  Sparkles,
  Play,
} from 'lucide-react';
import { cn } from '@namefi-astra/ui/lib/cn';
import {
  TwitterShareDialog,
  type TwitterShareSubject,
} from '@/components/hunt/twitter-share-dialog';
import { useTwitterShareDialog } from '@/hooks/use-twitter-share';
import {
  useDerivativeFlow,
  type DerivativeSource,
} from './derivative-flow-context';
import { useGalleryPending } from './gallery-pending-context';
import { getProgressMessageKey } from './shared/gallery-utils';
import {
  buildDownloadFilename,
  copyGenerationLink,
  downloadGenerationAsset,
  getGenerationFileExtension,
  resolveGenerationLink,
} from './shared/generation-actions';
import { usePendingGenerationProgress } from './shared/use-gallery-progress';
import { useGenerationsGalleryData } from './shared/use-gallery-data';
import { GenerationActionButtons } from './shared/generation-action-buttons';
import { useDeleteGeneration } from './shared/generation-hooks';
import { isReadyLogoGeneration } from './shared/logo-readiness';
import { useAuth } from '@/hooks/use-auth';
import type {
  DomainPreview,
  GalleryFilters,
  GalleryGeneration,
  GalleryItem,
} from './shared/gallery-types';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';

type TabValue = 'yours' | 'featured';

type ShareState = {
  isOpen: boolean;
  url: string | null;
  domain: NamefiNormalizedDomain | null;
  subject?: TwitterShareSubject;
};

type ShareableGenerationItem = Pick<GalleryItem, 'id' | 'domain' | 'type'>;

type DeleteTarget = {
  id: string;
  domain: string;
  type: 'logo' | 'marketing' | 'animation';
};

const getGenerationShareSubject = (
  type?: GalleryItem['type'],
): TwitterShareSubject => {
  if (type === 'marketing') return 'poster';
  return type ?? 'generation';
};

interface GenerationsColumnProps {
  domains: DomainPreview[];
  className?: string;
}

export function GenerationsColumn({
  domains,
  className,
}: GenerationsColumnProps) {
  const t = useTranslations('aiGeneration');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { pendingItems, removePendingItem } = useGalleryPending();
  const { openAnimation, openPoster } = useDerivativeFlow();

  const [filters, setFilters] = useState<GalleryFilters>({
    selectedBrands: [],
    type: 'all',
  });
  const [activeTab, setActiveTab] = useState<TabValue>(
    isAuthenticated ? 'yours' : 'featured',
  );
  const previousPendingCountRef = useRef(0);

  const shareDialog = useTwitterShareDialog({
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
    isAuthenticated,
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
    if (!isAuthenticated && activeTab !== 'featured') {
      setActiveTab('featured');
    }
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    const previousCount = previousPendingCountRef.current;
    if (isAuthenticated && pendingCount > previousCount) {
      setFilters({ selectedBrands: [], type: 'all' });
      setActiveTab('yours');
    }
    previousPendingCountRef.current = pendingCount;
  }, [isAuthenticated, pendingCount]);

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
    if (isAuthenticated && pendingCount > 0) {
      setActiveTab('yours');
    }
  }, [isAuthenticated, pendingCount]);

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
    router.push(`/studio/${id}`);
  };

  const handleCopyLink = (id: string) => {
    void copyGenerationLink({ id });
  };

  const handleOpenShareDialog = (item: ShareableGenerationItem) => {
    const url = resolveGenerationLink({ id: item.id });
    if (!url) {
      toast.error(t('share.unableTitle'), {
        description: t('share.unableMissingLink'),
      });
      return;
    }

    setShareState({
      isOpen: true,
      url,
      domain: item.domain as NamefiNormalizedDomain,
      subject: getGenerationShareSubject(item.type),
    });
    shareDialog.openDialog(item.domain as NamefiNormalizedDomain);
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
    const targetId = deleteTarget.id;
    setDeleteTarget(null);
    deleteMutation.mutate({ id: targetId });
  };

  const handleDeleteDialogChange = (open: boolean) => {
    if (!open) {
      setDeleteTarget(null);
    }
  };

  const handleDownload = async (
    item: Pick<GalleryItem, 'id' | 'domain' | 'url' | 'mimeType'>,
  ) => {
    if (!item.url) return;

    await downloadGenerationAsset({
      url: item.url,
      filename: buildDownloadFilename(
        `${item.domain}-${item.id}`,
        getGenerationFileExtension(item.mimeType),
      ),
    });
  };

  const handlePosterRequest = (generation?: GalleryGeneration) => {
    if (!generation) return;
    openPoster(generation as DerivativeSource);
  };

  const handleAnimationRequest = (generation?: GalleryGeneration) => {
    if (!generation) return;
    openAnimation(generation as DerivativeSource);
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
          {t('gallery.emptyYours')}
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 py-4 px-4">
            {filteredGalleryItems.map((item) => {
              if (item.source === 'pending' && item.status === 'pending') {
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

              if (
                item.status === 'pending' ||
                item.status === 'processing' ||
                item.status === 'failed'
              ) {
                return (
                  <AsyncGenerationTile
                    key={item.id}
                    item={item}
                    onNavigate={handleNavigateToGeneration}
                    onCopy={handleCopyLink}
                    onShare={handleOpenShareDialog}
                    onDownload={handleDownload}
                    onPoster={handlePosterRequest}
                    onAnimation={handleAnimationRequest}
                    onDelete={handleDeleteRequest}
                    isDeleting={deleteMutation.isPending}
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
                  onAnimation={handleAnimationRequest}
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
        shareSubject={shareState.subject}
      />
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={handleDeleteDialogChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const domain = deleteTarget?.domain ?? '';
                if (deleteTarget?.type === 'marketing') {
                  return t('delete.descriptionPoster', { domain });
                }
                if (deleteTarget?.type === 'animation') {
                  return t('delete.descriptionAnimation', { domain });
                }
                return t('delete.descriptionLogo', { domain });
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {tCommon('actions.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending
                ? t('delete.deleting')
                : tCommon('actions.delete')}
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
  const t = useTranslations('aiGeneration');
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <Tabs
        value={activeTab}
        onValueChange={(value) => onTabChange(value as TabValue)}
      >
        <TabsList>
          {showYoursTab && (
            <TabsTrigger value="yours">{t('gallery.yours')}</TabsTrigger>
          )}
          <TabsTrigger value="featured">{t('gallery.featured')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {isYoursActive && (
        <div className="flex items-center gap-2.5 overflow-x-auto whitespace-nowrap">
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  role="combobox"
                  aria-expanded={false}
                  className="h-9 w-56 justify-between rounded-lg bg-muted/30 px-3 text-sm font-medium"
                />
              }
            >
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                {selectedBrands.length > 0
                  ? t('gallery.brandsSelected', {
                      count: selectedBrands.length,
                    })
                  : t('gallery.brands')}
              </span>
              <ChevronDown className="ms-2 h-4 w-4 shrink-0 text-muted-foreground opacity-50" />
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="end" sideOffset={8}>
              <Command className="rounded-lg bg-popover text-popover-foreground">
                <CommandInput
                  placeholder={t('gallery.searchBrand')}
                  className="border-none bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-transparent"
                />
                <CommandList>
                  <CommandEmpty>{t('gallery.noBrands')}</CommandEmpty>
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
                              'me-2 h-4 w-4',
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
            onValueChange={(value) => {
              if (!value) return;
              onTypeChange(value as GalleryFilters['type']);
            }}
          >
            <SelectTrigger className="h-9 w-48 justify-between rounded-lg bg-muted/30 px-3 text-sm font-medium">
              <div className="flex items-center gap-2">
                <ImageIcon className="size-4 text-muted-foreground" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent
              align="end"
              sideOffset={8}
              alignItemWithTrigger={false}
            >
              <SelectItem value="all">{t('gallery.filterAll')}</SelectItem>
              <SelectItem value="logo">{t('gallery.filterLogo')}</SelectItem>
              <SelectItem value="marketing">
                {t('gallery.filterPoster')}
              </SelectItem>
              <SelectItem value="animation">
                {t('gallery.filterAnimation')}
              </SelectItem>
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
  const t = useTranslations('aiGeneration');
  const clamped = Math.max(0, Math.min(100, Math.round(progressValue)));
  const message = t(`progress.messages.${getProgressMessageKey(clamped)}`);

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
          {item.type === 'marketing'
            ? t('progress.generatingPoster')
            : item.type === 'animation'
              ? t('progress.preparingAnimation')
              : t('progress.generatingLogo')}{' '}
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
  onShare: (item: ShareableGenerationItem) => void;
  onDownload: (
    item: Pick<GalleryItem, 'id' | 'domain' | 'url' | 'mimeType'>,
  ) => void;
  onPoster: (generation?: GalleryGeneration) => void;
  onAnimation: (generation?: GalleryGeneration) => void;
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
  onAnimation,
  onDelete,
  isDeleting,
}: ReadyGenerationTileProps) {
  const t = useTranslations('aiGeneration');
  const ctaActions =
    item.type === 'logo' && isReadyLogoGeneration(item.generation)
      ? [
          {
            label: t('logo.actions.createPoster'),
            icon: Sparkles,
            onClick: (event: MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              event.preventDefault();
              onPoster(item.generation);
            },
          },
          {
            label: t('logo.actions.animateLogo'),
            icon: Clapperboard,
            onClick: (event: MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              event.preventDefault();
              onAnimation(item.generation);
            },
          },
        ]
      : undefined;

  return (
    // biome-ignore lint/a11y/useSemanticElements: container wraps nested action buttons within the card
    <div
      role="button"
      tabIndex={0}
      aria-label={t('gallery.openAria', { domain: item.domain })}
      onClick={() => onNavigate(item.id)}
      onKeyDown={(event) => {
        if (
          event.key === 'Enter' ||
          event.key === ' ' ||
          event.key === 'Spacebar' ||
          event.code === 'Space'
        ) {
          event.preventDefault();
          onNavigate(item.id);
        }
      }}
      className="group relative block aspect-[1/1] cursor-pointer overflow-hidden rounded-xl border border-border/40 bg-muted/30 shadow-xs transition hover:border-border hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <GalleryPreview item={item} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="absolute inset-0 flex flex-col justify-between p-3 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex items-start justify-between gap-3 text-white">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-white/90">
              {item.type === 'marketing'
                ? t('kind.poster')
                : item.type === 'animation'
                  ? t('kind.animation')
                  : t('kind.logo')}
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
          ctaActions={ctaActions}
          onCopy={(event) => {
            event.stopPropagation();
            event.preventDefault();
            onCopy(item.id);
          }}
          onShare={(event) => {
            event.stopPropagation();
            event.preventDefault();
            onShare(item);
          }}
          onDownload={(event) => {
            event.stopPropagation();
            event.preventDefault();
            onDownload(item);
          }}
          disabled={{
            share: !item.url,
            download: !item.url,
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

interface AsyncGenerationTileProps {
  item: GalleryItem;
  onNavigate: (id: string) => void;
  onCopy: (id: string) => void;
  onShare: (item: ShareableGenerationItem) => void;
  onDownload: (
    item: Pick<GalleryItem, 'id' | 'domain' | 'url' | 'mimeType'>,
  ) => void;
  onPoster: (generation?: GalleryGeneration) => void;
  onAnimation: (generation?: GalleryGeneration) => void;
  onDelete: (item: GalleryItem) => void;
  isDeleting?: boolean;
}

function AsyncGenerationTile({
  item,
  onNavigate,
  onCopy,
  onShare,
  onDownload,
  onPoster,
  onAnimation,
  onDelete,
  isDeleting,
}: AsyncGenerationTileProps) {
  const t = useTranslations('aiGeneration');
  useEffect(() => {
    if (item.status !== 'failed' || !item.errorMessage) return;

    // biome-ignore lint/suspicious/noConsole: keep provider details out of UI while preserving browser-debug visibility
    console.error('AI generation failed', {
      generationId: item.id,
      domain: item.domain,
      type: item.type,
      errorMessage: item.errorMessage,
    });
  }, [item.domain, item.errorMessage, item.id, item.status, item.type]);

  const ctaActions =
    item.type === 'logo' && isReadyLogoGeneration(item.generation)
      ? [
          {
            label: t('logo.actions.createPoster'),
            icon: Sparkles,
            onClick: (event: MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              event.preventDefault();
              onPoster(item.generation);
            },
          },
          {
            label: t('logo.actions.animateLogo'),
            icon: Clapperboard,
            onClick: (event: MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              event.preventDefault();
              onAnimation(item.generation);
            },
          },
        ]
      : undefined;
  const statusLabel =
    item.status === 'failed'
      ? t('status.failed')
      : item.status === 'processing'
        ? t('status.processing')
        : t('status.pending');

  return (
    // biome-ignore lint/a11y/useSemanticElements: container wraps nested action buttons within the card
    <div
      role="button"
      tabIndex={0}
      aria-label={t('gallery.openAria', { domain: item.domain })}
      onClick={() => onNavigate(item.id)}
      onKeyDown={(event) => {
        if (
          event.key === 'Enter' ||
          event.key === ' ' ||
          event.key === 'Spacebar' ||
          event.code === 'Space'
        ) {
          event.preventDefault();
          onNavigate(item.id);
        }
      }}
      className="group relative block aspect-[1/1] cursor-pointer overflow-hidden rounded-xl border border-border/40 bg-muted/30 shadow-xs transition hover:border-border hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <GalleryPreview item={item} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 flex flex-col justify-between p-3 text-white">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-white/90">
                {item.type === 'marketing'
                  ? 'Poster'
                  : item.type === 'animation'
                    ? 'Animation'
                    : 'Logo'}
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
          <div className="rounded-lg bg-black/45 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-white/80">
              {statusLabel}
            </div>
            <div className="mt-1 text-sm text-white/95">
              {item.status === 'failed'
                ? t('asyncTile.genericError')
                : item.status === 'processing'
                  ? t('asyncTile.stillRunning')
                  : t('asyncTile.queued')}
            </div>
          </div>
        </div>
        <GenerationActionButtons
          appearance="overlay"
          ctaActions={ctaActions}
          onCopy={(event) => {
            event.stopPropagation();
            event.preventDefault();
            onCopy(item.id);
          }}
          onShare={(event) => {
            event.stopPropagation();
            event.preventDefault();
            onShare(item);
          }}
          onDownload={(event) => {
            event.stopPropagation();
            event.preventDefault();
            onDownload(item);
          }}
          disabled={{
            share: !item.url,
            download: !item.url,
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
  item: {
    id: string;
    url: string | null;
    previewUrl: string | null;
    mimeType: string | null;
    domain: string;
    type?: 'logo' | 'marketing' | 'animation';
  };
  onNavigate: (id: string) => void;
  onCopy: (id: string) => void;
  onShare: (item: ShareableGenerationItem) => void;
  onDownload: (
    item: Pick<GalleryItem, 'id' | 'domain' | 'url' | 'mimeType'>,
  ) => void;
}

function FeaturedGenerationTile({
  item,
  onNavigate,
  onCopy,
  onShare,
  onDownload,
}: FeaturedGenerationTileProps) {
  const t = useTranslations('aiGeneration');
  return (
    // biome-ignore lint/a11y/useSemanticElements: container wraps nested action buttons within the card
    <div
      role="button"
      tabIndex={0}
      aria-label={t('gallery.openFeaturedAria', { domain: item.domain })}
      onClick={() => onNavigate(item.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          onNavigate(item.id);
        }
      }}
      className="group relative block aspect-[1/1] cursor-pointer overflow-hidden rounded-xl border border-border/40 bg-muted/30 shadow-xs transition hover:border-border hover:shadow-md focus:outline-none"
    >
      <GalleryPreview item={item} className="h-full w-full object-cover" />
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
            onShare(item);
          }}
          onDownload={(event) => {
            event.stopPropagation();
            event.preventDefault();
            onDownload(item);
          }}
          disabled={{
            share: !item.url,
            download: !item.url,
          }}
        />
      </div>
    </div>
  );
}

interface GalleryPreviewProps {
  item: {
    domain: string;
    previewUrl?: string | null;
    type?: 'logo' | 'marketing' | 'animation';
    url?: string | null;
    status?: GalleryItem['status'];
  };
  className?: string;
}

function GalleryPreview({ item, className }: GalleryPreviewProps) {
  const t = useTranslations('aiGeneration');
  const isTransientStatus =
    item.status === 'pending' ||
    item.status === 'processing' ||
    item.status === 'failed';
  const showPlayIndicator =
    item.type === 'animation' &&
    Boolean(item.url) &&
    item.status !== 'pending' &&
    item.status !== 'processing' &&
    item.status !== 'failed';
  const videoUrl =
    item.type === 'animation' &&
    item.url &&
    (!item.previewUrl || item.previewUrl === item.url)
      ? item.url
      : undefined;

  if (videoUrl) {
    return (
      <>
        <video
          aria-label={t('gallery.animationPreviewAria', {
            domain: item.domain,
          })}
          className={className}
          muted
          playsInline
          preload="metadata"
          src={videoUrl}
        />
        {showPlayIndicator && <VideoPlayIndicator />}
      </>
    );
  }

  if (!item.previewUrl) {
    if (isTransientStatus) {
      return <div className="h-full w-full bg-muted/30" />;
    }

    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/30 text-xs text-muted-foreground">
        {t('gallery.previewUnavailable')}
      </div>
    );
  }

  return (
    <>
      <Image
        src={item.previewUrl}
        alt={item.domain}
        fill
        sizes="(max-width: 1024px) 50vw, 25vw"
        className={className}
      />
      {showPlayIndicator && <VideoPlayIndicator />}
    </>
  );
}

function VideoPlayIndicator() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
    >
      <div className="flex size-12 items-center justify-center rounded-full border border-white/45 bg-black/55 text-white shadow-lg backdrop-blur-sm">
        <Play className="ms-0.5 size-5 fill-current" />
      </div>
    </div>
  );
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
  const t = useTranslations('aiGeneration');
  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Tabs value="yours" className="pointer-events-none opacity-60">
          <TabsList>
            <TabsTrigger value="yours">{t('gallery.yours')}</TabsTrigger>
            <TabsTrigger value="featured">{t('gallery.featured')}</TabsTrigger>
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
