'use client';

import { AITabs } from '@/components/ai-generation/ai-tabs';
import { AuthRequired } from '@/components/auth-required';
import { EmptyPlaceholder } from '@/components/empty-placeholder';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AIOnboardingOneShot } from '@/components/ai-generation/onboarding-one-shot';

const LoadingSkeletons = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: 6 }).map((_, index) => (
      <Card
        key={index}
        className="cursor-pointer transition-all hover:shadow-lg"
      >
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-6" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-6" />
            </div>
            <div className="pt-2 border-t">
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const EmptyBrandsPlaceholder = () => (
  <EmptyPlaceholder>
    <div className="flex size-20 items-center justify-center rounded-full bg-muted">
      <Sparkles className="size-10 text-muted-foreground" />
    </div>
    <EmptyPlaceholder.Title>
      You haven't created any brands yet
    </EmptyPlaceholder.Title>
    <EmptyPlaceholder.Description>
      All your generated logos and posters will appear here. Create your first
      brand to get started!
    </EmptyPlaceholder.Description>
  </EmptyPlaceholder>
);

export default function AIBrandGeneratorPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const trpc = useTRPC();

  // Get all user domains (which represent "brands")
  const { data: domains = [], isLoading: isDomainsLoading } = useQuery({
    ...trpc.ai.getUserDomains.queryOptions(),
    enabled: isAuthenticated,
  });

  // Get usage to detect first-time users
  const { data: usage } = useQuery({
    ...trpc.ai.getUserGenerationUsage.queryOptions(),
    enabled: isAuthenticated,
  });

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

  return (
    <div className="container max-w-4xl mx-auto py-8 px-8">
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

      {/* Onboarding for first-time users */}
      {usage && usage.currentCount === 0 ? (
        <div className="mx-auto mb-12">
          <AIOnboardingOneShot />
        </div>
      ) : (
        <div className="mx-auto mb-12">
          <AITabs tabSelectorClassName="max-w-md mx-auto" />
        </div>
      )}

      {/* Existing Domains */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Your brands</h3>
        {isDomainsLoading ? (
          <LoadingSkeletons />
        ) : domains.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {domains.map((domainInfo) => {
              return (
                <Card
                  key={domainInfo.domain}
                  className="cursor-pointer transition-all hover:shadow-lg"
                  onClick={() =>
                    router.push(
                      `/ai-brand-generator/brand/${domainInfo.domain}`,
                    )
                  }
                >
                  <CardHeader>
                    <CardTitle>{domainInfo.domain}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-600">Logos:</span>
                        <span className="text-sm text-muted-foreground">
                          {domainInfo.logoCount}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-600">Posters:</span>
                        <span className="text-sm text-muted-foreground">
                          {domainInfo.marketingCount}
                        </span>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          Latest:{' '}
                          {domainInfo.latestGeneration
                            ? new Date(
                                domainInfo.latestGeneration,
                              ).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyBrandsPlaceholder />
        )}
      </div>
    </div>
  );
}
