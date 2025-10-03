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
import {
  GenerationsColumn,
  GenerationsColumnSkeleton,
} from '@/components/ai-generation/generations-column';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { PosterFlowProvider } from '@/components/ai-generation/poster-flow-context';
import { usePosterFlow } from '@/components/ai-generation/poster-flow-context';
import type { PosterSource } from '@/components/ai-generation/poster-flow-context';
import { GalleryPendingProvider } from '@/components/ai-generation/gallery-pending-context';
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
      <GalleryPendingProvider>
        <PosterFlowProvider>
          <PosterFlowInitializer />
          <div className="container max-w-full mx-auto py-8 px-8 lg:flex lg:flex-col lg:h-[calc(100vh-10rem)] lg:max-h-[calc(100vh-10rem)] lg:min-h-0 lg:overflow-hidden lg:py-6">
            <div className="grid grid-cols-1 gap-10 mb-12 flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:min-h-0 lg:overflow-hidden lg:mb-0">
              <div className="flex flex-col space-y-6 lg:min-h-0 lg:overflow-auto">
                <PageHeader />
                <LeftColumnSkeleton />
              </div>
              <div className="flex flex-col space-y-6 lg:h-full lg:min-h-0 lg:overflow-hidden">
                <GenerationsColumnSkeleton className="flex-1" />
              </div>
            </div>
          </div>
        </PosterFlowProvider>
      </GalleryPendingProvider>
    );
  }

  if (!isAuthenticated) {
    return <AuthRequired />;
  }

  const isInitialLoading = isDomainsLoading || isUsageLoading;

  return (
    <GalleryPendingProvider>
      <PosterFlowProvider>
        <PosterFlowInitializer />
        <div className="container max-w-full mx-auto py-8 px-8 lg:flex lg:flex-col lg:h-[calc(100vh-10rem)] lg:max-h-[calc(100vh-10rem)] lg:min-h-0 lg:overflow-hidden lg:py-6">
          {/* Main Content - 2 Column Layout */}
          <div className="grid grid-cols-1 gap-10 mb-12 flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:min-h-0 lg:overflow-hidden lg:mb-0">
            {/* Left Column - Generator */}
            <div className="flex flex-col space-y-6 lg:min-h-0 lg:overflow-auto">
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
            <div className="flex flex-col space-y-6 lg:h-full lg:min-h-0 lg:overflow-hidden">
              {isInitialLoading ? (
                <GenerationsColumnSkeleton className="flex-1" />
              ) : (
                <GenerationsColumn domains={domains} className="flex-1" />
              )}
            </div>
          </div>
        </div>
      </PosterFlowProvider>
    </GalleryPendingProvider>
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
    <div className="space-y-4 w-full">
      <Card>
        <CardContent className="p-4 py-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardContent className="space-y-4 p-5">
          <Skeleton className="h-11 w-full rounded-xl" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Skeleton className="h-9 w-28 rounded-full" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-10 rounded-full" />
            </div>
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
