'use client';

import { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { Button } from '@/components/ui/shadcn/button';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/shadcn/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/shadcn/command';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';

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
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [types, setTypes] = useState<{ logo: boolean; marketing: boolean }>({
    logo: true,
    marketing: true,
  });
  const [activeTab, setActiveTab] = useState<'yours' | 'featured'>('yours');

  const { data: filtered = [], isLoading: isFilteredLoading } = useQuery(
    trpc.ai.getUserGenerationsFiltered.queryOptions(
      {
        types: [types.logo && 'logo', types.marketing && 'marketing'].filter(
          Boolean,
        ) as Array<'logo' | 'marketing'>,
        domains:
          selectedBrands.length > 0 ? (selectedBrands as any) : undefined,
        limit: 120,
      },
      {
        enabled: true,
        staleTime: 10_000,
      },
    ),
  );

  const { data: featuredAndRecent, isLoading: isFeaturedLoading } = useQuery({
    ...trpc.ai.getFeaturedAndRecentGenerations.queryOptions(),
    staleTime: 10_000,
  });

  const galleryItems = useMemo(() => {
    if (filtered.length > 0) {
      return filtered.map((g: any) => ({
        id: g.id,
        url: g.url,
        domain: g.domain,
      }));
    }
    return domains.flatMap((d) =>
      (d.previewGenerations ?? []).map((p) => ({ ...p, domain: d.domain })),
    );
  }, [filtered, domains]);

  const combinedFeaturedItems = useMemo(() => {
    if (!featuredAndRecent)
      return [] as Array<{ id: string; url: string; domain: string }>;
    const seen = new Set<string>();
    const ordered: Array<{ id: string; url: string; domain: string }> = [];
    for (const g of featuredAndRecent.featured ?? []) {
      if (seen.has(g.id)) continue;
      ordered.push({ id: g.id, url: g.url, domain: g.domain });
      seen.add(g.id);
    }
    for (const g of featuredAndRecent.recent ?? []) {
      if (seen.has(g.id)) continue;
      ordered.push({ id: g.id, url: g.url, domain: g.domain });
      seen.add(g.id);
    }
    return ordered;
  }, [featuredAndRecent]);

  const hasUserGenerations = domains.length > 0 || galleryItems.length > 0;

  // If user has no generations at all, show Featured only (no filters)
  if (!hasUserGenerations) {
    return (
      <Card className="border-border/50 bg-card">
        <CardHeader className="flex-row items-center justify-between space-y-0 px-4 py-3">
          <CardTitle className="text-sm font-semibold tracking-wide text-foreground/90">
            Featured
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {isFeaturedLoading ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 pr-1">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="relative overflow-hidden rounded-xl bg-muted/30 border border-border/40 aspect-[3/2]"
                  >
                    <Skeleton className="w-full h-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[640px] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                {combinedFeaturedItems.map((item) => (
                  <div
                    key={item.id}
                    className="relative overflow-hidden rounded-xl bg-muted/30 border border-border/40 shadow-xs transition hover:shadow-md hover:border-border aspect-[3/2]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.domain}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2 opacity-0 hover:opacity-100 transition-opacity">
                      <div className="rounded-md bg-gradient-to-t from-black/70 to-black/0 p-2">
                        <div className="text-xs font-medium text-white/90">
                          {item.domain}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Otherwise, show tabs: Yours (with filters) and Featured (no filters)
  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="flex-col gap-2 space-y-0 px-4 py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold tracking-wide text-foreground/90">
            Generations
          </CardTitle>
          {activeTab === 'yours' && (
            <div className="hidden lg:flex items-center gap-2.5">
              {/* Brands dropdown */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-56 justify-between rounded-lg border-border/50 bg-muted/30 hover:bg-muted/50"
                  >
                    {selectedBrands.length > 0
                      ? `${selectedBrands.length} selected`
                      : 'Brands'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  <Command className="rounded-md">
                    <CommandInput placeholder="Search brands" />
                    <CommandEmpty>No results.</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        {domains.map((d) => {
                          const checked = selectedBrands.includes(d.domain);
                          return (
                            <CommandItem
                              key={d.domain}
                              onSelect={() => {
                                setSelectedBrands((prev) =>
                                  checked
                                    ? prev.filter((x) => x !== d.domain)
                                    : [...prev, d.domain],
                                );
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={checked}
                                  aria-label={d.domain}
                                />
                                <span className="text-sm">{d.domain}</span>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Type dropdown */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-40 justify-between rounded-lg border-border/50 bg-muted/30 hover:bg-muted/50"
                  >
                    {types.logo && types.marketing
                      ? 'Type: All'
                      : types.logo
                        ? 'Type: Logo'
                        : types.marketing
                          ? 'Type: Poster'
                          : 'Type'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        <CommandItem
                          onSelect={() =>
                            setTypes((t) => ({ ...t, logo: !t.logo }))
                          }
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox checked={types.logo} aria-label="Logo" />
                            <span className="text-sm">Logo</span>
                          </div>
                        </CommandItem>
                        <CommandItem
                          onSelect={() =>
                            setTypes((t) => ({ ...t, marketing: !t.marketing }))
                          }
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={types.marketing}
                              aria-label="Poster"
                            />
                            <span className="text-sm">Poster</span>
                          </div>
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="yours">Your Generations</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {activeTab === 'yours' ? (
          isLoading || isFilteredLoading ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 pr-1">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="relative overflow-hidden rounded-xl bg-muted/30 border border-border/40 aspect-[3/2]"
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
              <div className="grid grid-cols-2 gap-3 pr-1">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-36 w-full rounded-xl" />
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[640px] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                {galleryItems.map((item) => (
                  <div
                    key={item.id}
                    className="relative overflow-hidden rounded-xl bg-muted/30 border border-border/40 shadow-xs transition hover:shadow-md hover:border-border aspect-[3/2]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.domain}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2 opacity-0 hover:opacity-100 transition-opacity">
                      <div className="rounded-md bg-gradient-to-t from-black/70 to-black/0 p-2">
                        <div className="text-xs font-medium text-white/90">
                          {item.domain}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : isFeaturedLoading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 pr-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-xl bg-muted/30 border border-border/40 aspect-[3/2]"
                >
                  <Skeleton className="w-full h-full" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[640px] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              {combinedFeaturedItems.map((item) => (
                <div
                  key={item.id}
                  className="relative overflow-hidden rounded-xl bg-muted/30 border border-border/40 shadow-xs transition hover:shadow-md hover:border-border aspect-[3/2]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.domain}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <img
                    src={item.url}
                    alt={item.domain}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2 opacity-0 hover:opacity-100 transition-opacity">
                    <div className="rounded-md bg-gradient-to-t from-black/70 to-black/0 p-2">
                      <div className="text-xs font-medium text-white/90">
                        {item.domain}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
