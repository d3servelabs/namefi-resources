'use client';

import { LogoTab } from '@/components/ai-generation/logo-tab';
import { MarketingTab } from '@/components/ai-generation/marketing-tab';
import { TabSelector } from '@/components/ai-generation/tab-selector';
import { AuthRequired } from '@/components/auth-required';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { useAuth } from '@/hooks/useAuth';
import { useTRPC } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AIBrandGeneratorPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'logo' | 'marketing'>('logo');
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const trpc = useTRPC();

  // Get all user domains (which represent "brands")
  const { data: domains = [], refetch: refetchDomains } = useQuery({
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
            Generate logos and marketing images for your brands
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
      {domains.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Your Domains</h3>
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
        </div>
      )}
    </div>
  );
}
