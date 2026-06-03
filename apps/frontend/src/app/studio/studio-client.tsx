'use client';

import { AITabs } from '@/components/ai-generation/ai-tabs';
import { DerivativeFlowProvider } from '@/components/ai-generation/derivative-flow-context';
import { GalleryPendingProvider } from '@/components/ai-generation/gallery-pending-context';
import {
  GenerationsColumn,
  GenerationsColumnSkeleton,
} from '@/components/ai-generation/generations-column';
import { StudioDerivativeRouteInitializer } from '@/components/ai-generation/studio-derivative-route';
import { PageShell } from '@/components/page-shell';
import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';
import { Card, CardContent } from '@namefi-astra/ui/components/shadcn/card';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';

export function NamefiBrandStudioClient() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const trpc = useTRPC();

  const { data: domains = [], isLoading: isDomainsLoading } = useQuery({
    ...trpc.ai.getUserDomains.queryOptions(),
    enabled: isAuthenticated,
  });

  const isInitialLoading =
    isAuthLoading || (isAuthenticated && isDomainsLoading);

  if (isInitialLoading) {
    return (
      <GalleryPendingProvider>
        <DerivativeFlowProvider>
          <NamefiBrandStudioSkeleton />
        </DerivativeFlowProvider>
      </GalleryPendingProvider>
    );
  }

  return (
    <GalleryPendingProvider>
      <DerivativeFlowProvider>
        <StudioDerivativeRouteInitializer domains={domains} />
        <PageShell
          size="full"
          padding="none"
          shellClassName="py-8 px-8 lg:py-6"
          className="lg:flex lg:flex-col lg:h-[calc(100vh-10rem)] lg:max-h-[calc(100vh-10rem)] lg:min-h-0 lg:overflow-hidden"
        >
          <div className="grid grid-cols-1 gap-10 mb-12 flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:min-h-0 lg:overflow-hidden lg:mb-0">
            <div className="flex min-w-0 flex-col gap-6 px-1 pb-1 lg:min-h-0 lg:overflow-auto">
              <PageHeader />
              <AITabs
                posterTabProps={{ domains }}
                animationTabProps={{ domains }}
              />
            </div>

            <div className="flex min-w-0 flex-col gap-6 lg:h-full lg:min-h-0 lg:overflow-hidden">
              <GenerationsColumn domains={domains} className="flex-1" />
            </div>
          </div>
        </PageShell>
      </DerivativeFlowProvider>
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
      <h2 className="text-2xl font-bold">Namefi Brand Studio</h2>
      <p className="text-muted-foreground mt-2">
        Create custom logos, posters, and animations for your brand
      </p>
    </div>
  );
}

function LeftColumnSkeleton() {
  return (
    <div className="space-y-5 w-full">
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

      <div className="grid grid-cols-3 gap-1 rounded-md bg-muted p-1">
        <Skeleton className="h-9 rounded-sm" />
        <Skeleton className="h-9 rounded-sm" />
        <Skeleton className="h-9 rounded-sm" />
      </div>

      <Card className="py-0">
        <CardContent className="space-y-5 p-5">
          <Skeleton className="h-11 w-full rounded-md" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Skeleton className="h-9 w-28 rounded-md" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-10 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-24 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </CardContent>
      </Card>
    </div>
  );
}

export function NamefiBrandStudioSkeleton() {
  return (
    <PageShell
      size="full"
      padding="none"
      shellClassName="py-8 px-8 lg:py-6"
      className="lg:flex lg:flex-col lg:h-[calc(100vh-10rem)] lg:max-h-[calc(100vh-10rem)] lg:min-h-0 lg:overflow-hidden"
    >
      <div className="grid grid-cols-1 gap-10 mb-12 flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:min-h-0 lg:overflow-hidden lg:mb-0">
        <div className="flex min-w-0 flex-col gap-6 px-1 pb-1 lg:min-h-0 lg:overflow-auto">
          <PageHeader />
          <LeftColumnSkeleton />
        </div>
        <div className="flex min-w-0 flex-col gap-6 lg:h-full lg:min-h-0 lg:overflow-hidden">
          <GenerationsColumnSkeleton className="flex-1" />
        </div>
      </div>
    </PageShell>
  );
}
