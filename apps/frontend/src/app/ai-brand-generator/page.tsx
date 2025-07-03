'use client';

import { LogoTab } from '@/components/ai-generation/logo-tab';
import { MarketingTab } from '@/components/ai-generation/marketing-tab';
import { TabSelector } from '@/components/ai-generation/tab-selector';
import { AuthRequired } from '@/components/auth-required';
import { EmptyPlaceholder } from '@/components/empty-placeholder';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useTRPC } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
  const [activeTab, setActiveTab] = useState<'logo' | 'marketing'>('logo');
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const trpc = useTRPC();

  // Get all user domains (which represent "brands")
  const {
    data: domains = [],
    isLoading: isDomainsLoading,
    refetch: refetchDomains,
  } = useQuery({
    ...trpc.ai.getUserDomains.queryOptions(),
    enabled: isAuthenticated,
  });

  const handleGenerationComplete = () => {
    // Refetch domains to update the list after a new generation
    refetchDomains();
  };

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">AI Brand Generator</h2>
          <p className="text-muted-foreground mt-1">
            Create custom logos and posters for your brand
          </p>
        </div>
      </div>

      {/* Generation UI */}
      <div className="mx-auto mb-12">
        <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'logo' ? (
          <LogoTab onGenerationUpdate={handleGenerationComplete} />
        ) : (
          <MarketingTab onGenerationUpdate={handleGenerationComplete} />
        )}
      </div>

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
                        <span className="text-sm text-green-600">
                          Marketing:
                        </span>
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
