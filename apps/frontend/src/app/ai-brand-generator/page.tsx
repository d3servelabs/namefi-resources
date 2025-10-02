'use client';

import { AITabs } from '@/components/ai-generation/ai-tabs';
import { AuthRequired } from '@/components/auth-required';
import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocalStorage } from 'usehooks-ts';
import { AIOnboardingOneShot } from '@/components/ai-generation/onboarding-one-shot';
import { GenerationsColumn } from '@/components/ai-generation/generations-column';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { PosterFlowProvider } from '@/components/ai-generation/poster-flow-context';
import { usePosterFlow } from '@/components/ai-generation/poster-flow-context';
import type { PosterSource } from '@/components/ai-generation/poster-flow-context';
import { useEffect, useRef } from 'react';

export default function AIBrandGeneratorPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const trpc = useTRPC();

  // Get all user domains (which represent "brands")
  const { data: domains = [], isLoading: isDomainsLoading } = useQuery({
    ...trpc.ai.getUserDomains.queryOptions(),
    enabled: isAuthenticated,
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

  if (isAuthLoading) {
    return (
      <PosterFlowProvider>
        <PosterFlowInitializer />
        <div className="container max-w-full mx-auto py-8 px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
            <div className="space-y-6">
              <PageHeader />
              <LeftColumnSkeleton />
            </div>
            <div className="space-y-6">
              <GallerySkeleton />
            </div>
          </div>
        </div>
      </PosterFlowProvider>
    );
  }

  if (!isAuthenticated) {
    return <AuthRequired />;
  }

  const isInitialLoading = isDomainsLoading || isUsageLoading;

  return (
    <PosterFlowProvider>
      <PosterFlowInitializer />
      <div className="container max-w-full mx-auto py-8 px-8">
        {/* Main Content - 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
          {/* Left Column - Generator */}
          <div className="space-y-6">
            {/* Page header moved to left column to align right column at top */}
            <PageHeader />
            {isInitialLoading ? (
              <LeftColumnSkeleton />
            ) : usage && finishedOnboarding && usage.currentCount > 1 ? (
              <AITabs />
            ) : (
              <AIOnboardingOneShot
                onFinishAction={() => setFinishedOnboarding(true)}
              />
            )}
          </div>

          {/* Right Column - Generations Gallery */}
          <div className="space-y-6">
            {isInitialLoading ? (
              <GallerySkeleton />
            ) : (
              <GenerationsColumn domains={domains} />
            )}
          </div>
        </div>
      </div>
    </PosterFlowProvider>
  );
}

function PageHeader() {
  return (
    <div className="mb-6 flex flex-col items-center text-center">
      <Image
        src="/powered-by-namefi-jain.svg"
        alt="Powered by Namefi"
        className="mb-3"
        width={141}
        height={22}
      />
      <h2 className="text-2xl font-bold">AI Brand Generator</h2>
      <p className="text-muted-foreground mt-2">
        Create custom logos and posters for your brand
      </p>
    </div>
  );
}

function LeftColumnSkeleton() {
  return (
    <div className="space-y-6 w-full">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="flex items-center justify-end gap-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-8 rounded" />
            </div>
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-28 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
          <Skeleton className="h-11 w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}

function GallerySkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-40 rounded-lg" />
          <Skeleton className="h-8 w-40 rounded-lg" />
        </div>
      </div>
      <Card className="border-border/50 bg-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                className="aspect-square w-full rounded-xl bg-muted/40"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PosterFlowInitializer() {
  const searchParams = useSearchParams();
  const posterId = searchParams.get('poster');
  const searchParamsString = searchParams.toString();
  const { openPoster } = usePosterFlow();
  const trpc = useTRPC();
  const router = useRouter();
  const openedRef = useRef<string | null>(null);

  const { data: posterGeneration } = useQuery({
    ...trpc.ai.getGenerationById.queryOptions({ id: posterId || '' }),
    enabled: !!posterId,
  });

  useEffect(() => {
    if (!posterId || openedRef.current === posterId) return;
    if (!posterGeneration) return;
    if (
      posterGeneration.type !== 'logo' &&
      posterGeneration.output?.type !== 'logo'
    ) {
      return;
    }

    openPoster(posterGeneration as PosterSource);
    openedRef.current = posterId;

    const params = new URLSearchParams(searchParamsString);
    params.delete('poster');
    params.delete('posterDomain');
    const query = params.toString();
    router.replace(
      query ? `/ai-brand-generator?${query}` : '/ai-brand-generator',
      { scroll: false },
    );
  }, [posterGeneration, posterId, openPoster, router, searchParamsString]);

  return null;
}
