'use client';

import { AITabs } from '@/components/ai-generation/ai-tabs';
import { AuthRequired } from '@/components/auth-required';
import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import Image from 'next/image';
import { useLocalStorage } from 'usehooks-ts';
import { AIOnboardingOneShot } from '@/components/ai-generation/onboarding-one-shot';
import { GenerationsColumn } from '@/components/ai-generation/generations-column';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { Card, CardContent } from '@/components/ui/shadcn/card';

// removed old LoadingSkeletons

const ShowcaseSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: 6 }).map((_, index) => (
      <Card key={index} className="overflow-hidden">
        <div className="aspect-square bg-muted animate-pulse" />
        <CardContent className="py-4 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export default function AIBrandGeneratorPage() {
  // const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const trpc = useTRPC();

  // Get all user domains (which represent "brands")
  const { data: domains = [], isLoading: isDomainsLoading } = useQuery({
    ...trpc.ai.getUserDomains.queryOptions(),
    enabled: isAuthenticated,
  });

  const { data: featuredAndRecent, isLoading: isFeaturedAndRecentLoading } =
    useQuery({
      ...trpc.ai.getFeaturedAndRecentGenerations.queryOptions(),
    });

  // Get usage to detect first-time users
  const { data: usage, isLoading: isUsageLoading } = useQuery({
    ...trpc.ai.getUserGenerationUsage.queryOptions(),
    enabled: isAuthenticated,
  });

  // Onboarding completion (persisted)
  const [finishedOnboarding, setFinishedOnboarding] = useLocalStorage<boolean>(
    'ai_onboarding_complete',
    false,
  );

  const showcaseGenerations = useMemo(() => {
    if (!featuredAndRecent) return [];
    const seen = new Set<string>();
    const ordered: NonNullable<typeof featuredAndRecent>['featured'] = [];

    for (const generation of featuredAndRecent.featured ?? []) {
      if (seen.has(generation.id)) continue;
      ordered.push(generation);
      seen.add(generation.id);
    }

    for (const generation of featuredAndRecent.recent ?? []) {
      if (seen.has(generation.id)) continue;
      ordered.push(generation);
      seen.add(generation.id);
    }

    return ordered;
  }, [featuredAndRecent]);

  const renderPageSkeleton = () => (
    <div className="container max-w-7xl mx-auto py-8 px-8">
      {/* Header shows immediately */}
      <div className="flex flex-col justify-center items-center mb-14">
        <Image
          src="/powered-by-namefi-jain.svg"
          alt="Powered by Namefi"
          className="mb-4"
          width={141}
          height={22}
        />
        <h2 className="text-2xl font-bold">AI Brand Generator</h2>
        <p className="text-muted-foreground mt-2">
          Create custom logos and posters for your brand
        </p>
      </div>
      {/* Content skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (isAuthLoading) {
    return renderPageSkeleton();
  }

  if (!isAuthenticated) {
    return <AuthRequired />;
  }

  const isInitialLoading = isDomainsLoading || isUsageLoading;

  return (
    <div className="container max-w-7xl mx-auto py-8 px-8">
      <div className="flex flex-col justify-center items-center mb-14">
        <Image
          src="/powered-by-namefi-jain.svg"
          alt="Powered by Namefi"
          className="mb-4"
          width={141}
          height={22}
        />
        <h2 className="text-2xl font-bold">AI Brand Generator</h2>
        <p className="text-muted-foreground mt-2">
          Create custom logos and posters for your brand
        </p>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Left Column - Generator */}
        <div className="space-y-6">
          {isInitialLoading ? (
            <>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-48 w-full" />
            </>
          ) : usage && finishedOnboarding && usage.currentCount > 1 ? (
            <AITabs tabSelectorClassName="max-w-md" />
          ) : (
            <AIOnboardingOneShot
              onFinishAction={() => setFinishedOnboarding(true)}
            />
          )}
        </div>

        {/* Right Column - Generations Gallery */}
        <div className="space-y-6">
          <GenerationsColumn domains={domains} isLoading={isInitialLoading} />
        </div>
      </div>

      <div className="mt-16">
        <h3 className="text-xl font-semibold mb-4">Trending inspirations</h3>
        {isFeaturedAndRecentLoading ? (
          <ShowcaseSkeleton />
        ) : showcaseGenerations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {showcaseGenerations.map((generation) => (
              <Card key={generation.id} className="overflow-hidden">
                <div className="relative aspect-square bg-muted">
                  <img
                    src={generation.url}
                    alt={generation.domain}
                    className="object-cover w-full h-full"
                    loading="lazy"
                  />
                </div>
                <CardContent className="py-4">
                  <p className="text-sm font-medium truncate">
                    {generation.domain}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
                    {generation.type}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No public generations to showcase yet. Check back soon!
          </p>
        )}
      </div>
    </div>
  );
}
