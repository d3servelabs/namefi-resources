'use client';

import { AITabs } from '@/components/ai-generation/ai-tabs';
import { AuthRequired } from '@/components/auth-required';
import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useLocalStorage } from 'usehooks-ts';
import { AIOnboardingOneShot } from '@/components/ai-generation/onboarding-one-shot';
import { GenerationsColumn } from '@/components/ai-generation/generations-column';
import { Skeleton } from '@/components/ui/shadcn/skeleton';

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
  );
}
