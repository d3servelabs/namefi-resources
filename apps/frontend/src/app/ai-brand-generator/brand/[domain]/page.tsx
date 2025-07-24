'use client';

import { AITabs } from '@/components/ai-generation/ai-tabs';
import { AuthRequired } from '@/components/auth-required';
import { EmptyPlaceholder } from '@/components/empty-placeholder';
import { Button } from '@/components/ui/shadcn/button';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import {
  namefiNormalizedDomainSchema,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';

interface BrandDetailPageProps {
  params: Promise<{ domain: string }>;
}

const LoadingSkeleton = () => (
  <div className="container max-w-4xl mx-auto py-8 px-8">
    {/* Brand Header Skeleton */}
    <div className="flex justify-between items-center mb-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-32" />
      </div>
    </div>

    {/* Tab Navigation Skeleton */}
    <div className="max-w-4xl mx-auto">
      <div className="flex space-x-1 mb-8">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Tab Content Skeleton */}
      <div className="space-y-8">
        {/* Generator Form Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Images Grid Skeleton */}
        <div>
          <Skeleton className="h-7 w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="w-full aspect-square rounded-lg" />
                <div className="flex gap-2 justify-center p-3">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
                <div className="px-4 pb-4">
                  <div className="flex gap-2 mb-2">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const EmptyGenerationsPlaceholder = ({
  domain,
  onGoBack,
}: {
  domain: NamefiNormalizedDomain;
  onGoBack: () => void;
}) => (
  <div className="container mx-auto py-8 px-8">
    {/* Brand Header */}
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-2xl font-bold">
          {domain
            ?.split('.')[0]
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')}
        </h2>
        <p className="text-muted-foreground mt-1">{domain}</p>
      </div>
    </div>

    <EmptyPlaceholder>
      <div className="flex size-20 items-center justify-center rounded-full bg-muted">
        <Sparkles className="size-10 text-muted-foreground" />
      </div>
      <EmptyPlaceholder.Title>
        No generations found for {domain}
      </EmptyPlaceholder.Title>
      <EmptyPlaceholder.Description>
        Start creating logos and posters for this domain by using the AI
        generator below, or go back to browse other brands.
      </EmptyPlaceholder.Description>
      <Button variant="outline" onClick={onGoBack} className="mt-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Go back to AI Brand Generator
      </Button>
    </EmptyPlaceholder>
  </div>
);

export default function BrandDetailPage({ params }: BrandDetailPageProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const trpc = useTRPC();

  // Unwrap the params Promise
  const { domain } = use(params);
  const normalizedDomain = namefiNormalizedDomainSchema.safeParse(domain);

  // Load generations for this domain
  const { data: generations = [], isLoading: isGenerationsLoading } = useQuery({
    ...trpc.ai.getGenerationsByDomain.queryOptions({ domain }),
    enabled: isAuthenticated && !!domain,
  });

  // Create brand name from domain (e.g., "example.com" -> "Example")
  const brandName = domain
    ?.split('.')[0]
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  if (!normalizedDomain.success) {
    return <div>Invalid domain</div>;
  }

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthRequired />;
  }

  if (isGenerationsLoading) {
    return <LoadingSkeleton />;
  }

  if (generations.length === 0) {
    return (
      <EmptyGenerationsPlaceholder
        domain={normalizedDomain.data}
        onGoBack={() => router.push('/ai-brand-generator')}
      />
    );
  }

  // Filter generations by type
  const logoGenerations = generations.filter((g) => g.type === 'logo');
  const marketingGenerations = generations.filter(
    (g) => g.type === 'marketing',
  );

  return (
    <div className="container max-w-4xl mx-auto py-8 px-8">
      {/* Brand Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">{brandName}</h2>
          <p className="text-muted-foreground mt-1">{domain}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/ai-brand-generator')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Brands
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-4xl mx-auto">
        <AITabs
          logoTabProps={{
            existingGenerations: logoGenerations,
            brandDomain: normalizedDomain.data,
          }}
          posterTabProps={{
            existingGenerations: marketingGenerations,
            brandDomain: normalizedDomain.data,
            availableLogos: logoGenerations,
          }}
          tabSelectorClassName="max-w-md mx-auto"
        />
      </div>
    </div>
  );
}
