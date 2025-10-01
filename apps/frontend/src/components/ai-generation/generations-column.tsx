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
import { ChevronsUpDown, Check, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useQuery } from '@tanstack/react-query';
import { TwitterShareDialog } from '@/components/hunt/twitter-share-dialog';
import {
  defaultShareConfig,
  useTwitterShareDialog,
} from '@/hooks/use-twitter-share';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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
  isLoading: boolean;
}

export function GenerationsColumn({
  domains,
  isLoading,
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

  const galleryItems = useMemo(() => {
    if (filteredArray.length > 0) {
      return filteredArray.map((g) => ({
        id: g.id,
        url: g.url,
        domain: g.domain,
      }));
    }
    return domains.flatMap((d) =>
      (d.previewGenerations ?? []).map((p) => ({ ...p, domain: d.domain })),
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
    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
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
                className="h-8 w-56 justify-between rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 px-3"
              >
                {selectedBrands.length > 0
                  ? `${selectedBrands.length} selected`
                  : 'Brands'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="end">
              <Command>
                <CommandInput placeholder="Search brand..." />
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
            <SelectTrigger className="h-8 w-56 justify-between rounded-lg border border-border/50! bg-muted/30 hover:bg-muted/50 px-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="size-4 opacity-60" />
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
    <>
      {headerRow}
      <Card className="border-border/50 bg-card py-0">
        <CardContent className="px-0">
          {activeTab === 'yours' ? (
            isLoading || isFilteredLoading ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 pr-1">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="relative overflow-hidden rounded-xl bg-muted/30 border border-border/40 aspect-[1/1]"
                    >
                      <Skeleton className="w-full h-full" />
                    </div>
                  ))}
                </div>
              </div>
            ) : galleryItems.length === 0 ? (
              <div>
                <div className="text-sm text-muted-foreground mb-4">
                  Generate a logo or poster to see it appear here.
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-36 w-full rounded-xl" />
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[700px] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 py-4 px-4">
                  {galleryItems.map((item) => (
                    // biome-ignore lint/a11y/noStaticElementInteractions: <explanation>
                    <div
                      key={item.id}
                      onClick={() =>
                        router.push(
                          `/ai-brand-generator/brand/${item.domain}/${item.id}`,
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          router.push(
                            `/ai-brand-generator/brand/${item.domain}/${item.id}`,
                          );
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
                              const url = `${window.location.origin}/ai-brand-generator/brand/${item.domain}/${item.id}`;
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
                              const url = `${window.location.origin}/ai-brand-generator/brand/${item.domain}/${item.id}`;
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
            )
          ) : isFeaturedLoading ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 py-4 px-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="relative overflow-hidden rounded-xl bg-muted/30 border border-border/40 aspect-[1/1]"
                  >
                    <Skeleton className="w-full h-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="lg:h-[700px] h-[640px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 py-4 px-4">
                {combinedFeaturedItems.map((item) => (
                  // biome-ignore lint/a11y/noStaticElementInteractions: <explanation>
                  <div
                    key={item.id}
                    onClick={() =>
                      router.push(
                        `/ai-brand-generator/brand/${item.domain}/${item.id}`,
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        router.push(
                          `/ai-brand-generator/brand/${item.domain}/${item.id}`,
                        );
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
                            const url = `${window.location.origin}/ai-brand-generator/brand/${item.domain}/${item.id}`;
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
                            const url = `${window.location.origin}/ai-brand-generator/brand/${item.domain}/${item.id}`;
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
    </>
  );
}
