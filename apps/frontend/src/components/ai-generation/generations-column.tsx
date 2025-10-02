'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { Button } from '@/components/ui/shadcn/button';
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
import { useTRPC, type AppRouterOutput } from '@/lib/trpc';
import {
  Building2,
  ChevronsUpDown,
  Check,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useQuery } from '@tanstack/react-query';
import { TwitterShareDialog } from '@/components/hunt/twitter-share-dialog';
import {
  defaultShareConfig,
  useTwitterShareDialog,
} from '@/hooks/use-twitter-share';
import { toast } from 'sonner';
import {
  ArrowUpRight,
  Copy as CopyIcon,
  Download as DownloadIcon,
  Sparkles,
  Twitter,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePosterFlow } from './poster-flow-context';
import type { PosterSource } from './poster-flow-context';

type Preview = { id: string; url: string };
export type DomainPreview = {
  domain: string;
  latestGeneration?: Date | string | null;
  logoCount?: number;
  marketingCount?: number;
  previewGenerations?: Preview[];
};

interface GenerationsColumnProps {
  domains: DomainPreview[];
  className?: string;
}

const GallerySkeletonGrid = ({ className }: { className?: string }) => (
  <div className={cn('py-4 px-4', className)}>
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton
          key={i}
          className="aspect-[1/1] w-full rounded-xl bg-muted/40"
        />
      ))}
    </div>
  </div>
);

export function GenerationsColumn({
  domains,
  className,
}: GenerationsColumnProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const shareDialog = useTwitterShareDialog({
    ...defaultShareConfig,
    enabled: true,
    trackShares: false,
    featureKey: 'ai_generation',
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareDomain, setShareDomain] = useState<string>('');
  const { openPoster } = usePosterFlow();

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(objectUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'logo' | 'marketing'>(
    'all',
  );
  const [activeTab, setActiveTab] = useState<'yours' | 'featured'>('yours');

  const typesForQuery: Array<'logo' | 'marketing'> =
    typeFilter === 'all' ? ['logo', 'marketing'] : [typeFilter];

  const {
    data: filtered = [],
    isLoading: isFilteredLoading,
    isFetching: isFilteredFetching,
  } = useQuery(
    trpc.ai.getUserGenerationsFiltered.queryOptions(
      {
        types: typesForQuery,
        domains:
          selectedBrands.length > 0 ? (selectedBrands as any) : undefined,
        limit: 120,
      },
      {
        enabled: true,
        staleTime: 10_000,
        placeholderData: (prev) => prev,
      },
    ),
  );

  const { data: featuredAndRecent, isLoading: isFeaturedLoading } = useQuery({
    ...trpc.ai.getFeaturedAndRecentGenerations.queryOptions(),
    staleTime: 10_000,
  });

  type UserGen = AppRouterOutput['ai']['getUserGenerationsFiltered'][number];
  const filteredArray = (filtered as unknown as UserGen[]) ?? [];

  type GalleryItem = {
    id: string;
    url: string;
    domain: string;
    type?: 'logo' | 'marketing';
    generation?: UserGen;
  };

  const galleryItems = useMemo<GalleryItem[]>(() => {
    if (filteredArray.length > 0) {
      return filteredArray.map((g) => ({
        id: g.id,
        url: g.url,
        domain: g.domain,
        type: g.type,
        generation: g,
      }));
    }
    return domains.flatMap((d) =>
      (d.previewGenerations ?? []).map((p) => ({
        ...p,
        domain: d.domain,
      })),
    );
  }, [filteredArray, domains]);

  type FeaturedRecent =
    AppRouterOutput['ai']['getFeaturedAndRecentGenerations'];
  const combinedFeaturedItems = useMemo(() => {
    if (!featuredAndRecent)
      return [] as Array<{ id: string; url: string; domain: string }>;
    const fr = featuredAndRecent as unknown as FeaturedRecent;
    const seen = new Set<string>();
    const ordered: Array<{ id: string; url: string; domain: string }> = [];
    for (const g of fr.featured ?? []) {
      if (seen.has(g.id)) continue;
      ordered.push({ id: g.id, url: g.url, domain: g.domain });
      seen.add(g.id);
    }
    for (const g of fr.recent ?? []) {
      if (seen.has(g.id)) continue;
      ordered.push({ id: g.id, url: g.url, domain: g.domain });
      seen.add(g.id);
    }
    return ordered;
  }, [featuredAndRecent]);

  const hasUserGenerations = filteredArray.length > 0;
  const shouldShowYoursTab =
    hasUserGenerations || isFilteredLoading || isFilteredFetching;

  useEffect(() => {
    // Avoid auto-switching away from "Your Generations" while a refetch is in progress
    if (
      !hasUserGenerations &&
      activeTab === 'yours' &&
      !(isFilteredLoading || isFilteredFetching)
    ) {
      setActiveTab('featured');
    }
  }, [hasUserGenerations, activeTab, isFilteredLoading, isFilteredFetching]);

  // Header row above the card: tabs + filters in a single horizontal row
  const headerRow = (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          {shouldShowYoursTab && (
            <TabsTrigger value="yours">Your Generations</TabsTrigger>
          )}
          <TabsTrigger value="featured">Featured</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === 'yours' && (
        <div className="flex items-center gap-2.5 overflow-x-auto whitespace-nowrap">
          {/* Brands multi-select combobox */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                role="combobox"
                aria-expanded={false}
                className="h-9 w-56 justify-between rounded-lg border border-border/50 bg-muted/30 px-3 text-sm font-medium"
              >
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {selectedBrands.length > 0
                    ? `${selectedBrands.length} selected`
                    : 'Brands'}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="end">
              <Command className="rounded-lg border border-border bg-popover text-popover-foreground">
                <CommandInput
                  placeholder="Search brand..."
                  className="px-3 py-2 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <CommandList>
                  <CommandEmpty>No brands found.</CommandEmpty>
                  <CommandGroup>
                    {domains.map((d) => {
                      const isSelected = selectedBrands.includes(d.domain);
                      return (
                        <CommandItem
                          key={d.domain}
                          value={d.domain}
                          onSelect={(currentValue) => {
                            setSelectedBrands((prev) =>
                              prev.includes(currentValue)
                                ? prev.filter((x) => x !== currentValue)
                                : [...prev, currentValue],
                            );
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              isSelected ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          {d.domain}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Type single-select */}
          <Select
            value={typeFilter}
            onValueChange={(v) =>
              setTypeFilter(v as 'all' | 'logo' | 'marketing')
            }
          >
            <SelectTrigger className="h-9 w-48 justify-between rounded-lg border border-border/50 bg-muted/30 px-3 text-sm font-medium">
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

  // Otherwise, show tabs: Yours (with filters) and Featured (no filters)
  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      {headerRow}
      <Card className="flex-1 border-border/50 bg-card py-0 flex flex-col min-h-0">
        <CardContent className="px-0 flex-1 flex flex-col min-h-0">
          {activeTab === 'yours' ? (
            isFilteredLoading ? (
              <GallerySkeletonGrid className="flex-1" />
            ) : galleryItems.length === 0 ? (
              <div className="flex-1 px-4 py-6 text-sm text-muted-foreground">
                Generate a logo or poster to see it appear here.
              </div>
            ) : (
              <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4 py-4 px-4">
                    {galleryItems.map((item) => (
                      // biome-ignore lint/a11y/noStaticElementInteractions: <explanation>
                      <div
                        key={item.id}
                        onClick={() =>
                          router.push(`/ai-brand-generator/${item.id}`)
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            router.push(`/ai-brand-generator/${item.id}`);
                          }
                        }}
                        className="relative block overflow-hidden rounded-xl bg-muted/30 border border-border/40 shadow-xs transition hover:shadow-md hover:border-border aspect-[1/1] group cursor-pointer"
                      >
                        <img
                          src={item.url}
                          alt={item.domain}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {/* Full overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between">
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
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                router.push(`/ai-brand-generator/${item.id}`);
                              }}
                            >
                              <ArrowUpRight className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 justify-end flex-wrap">
                            {item.type === 'logo' && item.generation && (
                              <Button
                                size="sm"
                                className="h-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/80 gap-2 shadow-md transition"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  openPoster(item.generation as PosterSource);
                                }}
                              >
                                <Sparkles className="h-4 w-4" />
                                Create Poster
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 rounded-full border-border/30 bg-white/20 backdrop-blur text-white shadow transition hover:bg-white/30"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                const url = `${window.location.origin}/ai-brand-generator/${item.id}`;
                                void navigator.clipboard
                                  .writeText(url)
                                  .then(() =>
                                    toast('Link copied to clipboard', {
                                      description:
                                        'You can now share this generation with others',
                                    }),
                                  )
                                  .catch(() =>
                                    toast.error('Failed to copy link', {
                                      description: 'Please try again',
                                    }),
                                  );
                              }}
                            >
                              <CopyIcon className="h-4 w-4 mr-1" />
                              Copy
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 rounded-full border-border/30 bg-white/20 backdrop-blur text-white shadow transition hover:bg-white/30"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                const url = `${window.location.origin}/ai-brand-generator/${item.id}`;
                                setShareUrl(url);
                                setShareDomain(item.domain);
                                shareDialog.openDialog(item.domain as any);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Twitter className="h-4 w-4 mr-1" />
                              Tweet
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 rounded-full border-border/30 bg-white/20 backdrop-blur text-white shadow transition hover:bg-white/30"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                void downloadImage(
                                  item.url,
                                  `${item.domain}-${item.id}.png`,
                                );
                              }}
                            >
                              <DownloadIcon className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          ) : isFeaturedLoading ? (
            <GallerySkeletonGrid className="flex-1" />
          ) : (
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 py-4 px-4">
                  {combinedFeaturedItems.map((item) => (
                    // biome-ignore lint/a11y/noStaticElementInteractions: <explanation>
                    <div
                      key={item.id}
                      onClick={() =>
                        router.push(`/ai-brand-generator/${item.id}`)
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          router.push(`/ai-brand-generator/${item.id}`);
                        }
                      }}
                      className="relative block overflow-hidden rounded-xl bg-muted/30 border border-border/40 shadow-xs transition hover:shadow-md hover:border-border aspect-[1/1] group cursor-pointer"
                    >
                      <img
                        src={item.url}
                        alt={item.domain}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Full overlay */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60" />
                      <div className="absolute inset-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between">
                        <div className="text-sm font-semibold text-white drop-shadow-sm">
                          {item.domain}
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-full border-border/50 bg-background/60 hover:bg-background/80 text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              const url = `${window.location.origin}/ai-brand-generator/${item.id}`;
                              void navigator.clipboard
                                .writeText(url)
                                .then(() =>
                                  toast('Link copied to clipboard', {
                                    description:
                                      'You can now share this generation with others',
                                  }),
                                )
                                .catch(() =>
                                  toast.error('Failed to copy link', {
                                    description: 'Please try again',
                                  }),
                                );
                            }}
                          >
                            Copy
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-full border-border/50 bg-background/60 hover:bg-background/80 text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              const url = `${window.location.origin}/ai-brand-generator/${item.id}`;
                              setShareUrl(url);
                              setShareDomain(item.domain);
                              shareDialog.openDialog(item.domain as any);
                              setIsDialogOpen(true);
                            }}
                          >
                            Tweet
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-full border-border/50 bg-background/60 hover:bg-background/80 text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              void downloadImage(
                                item.url,
                                `${item.domain}-${item.id}.png`,
                              );
                            }}
                          >
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Shared Twitter dialog for AI Generation previews */}
      <TwitterShareDialog
        isOpen={isDialogOpen && !!shareDialog.isOpen}
        onClose={() => {
          setIsDialogOpen(false);
          shareDialog.onClose();
        }}
        domainName={shareDomain as any}
        shareUrl={shareUrl}
        hasShared={false}
        isCheckingStatus={false}
        isSubmitting={false}
        onSubmit={async () => {}}
        trackShares={false}
        campaignKey={undefined}
        featureKey="ai_generation"
      />
    </div>
  );
}

export function GenerationsColumnSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Tabs value="yours" className="opacity-60 pointer-events-none">
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
      <Card className="flex-1 border-border/50 bg-card py-0 flex flex-col min-h-0">
        <CardContent className="px-0 flex-1 flex flex-col min-h-0">
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
