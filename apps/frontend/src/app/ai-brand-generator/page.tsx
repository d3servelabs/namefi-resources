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

  const renderPageSkeleton = () => (
    <div className="container max-w-full mx-auto py-8 px-8">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
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
    <PosterFlowProvider>
      <PosterFlowInitializer />
      <div className="container max-w-full mx-auto py-8 px-8">
        {/* Main Content - 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
          {/* Left Column - Generator */}
          <div className="space-y-6">
            {/* Page header moved to left column to align right column at top */}
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
            {isInitialLoading ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-48 w-full" />
              </>
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
            <GenerationsColumn domains={domains} isLoading={isInitialLoading} />
          </div>
        </div>
      </div>
    </PosterFlowProvider>
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
