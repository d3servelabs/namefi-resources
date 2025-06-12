'use client';

import { LogoTab } from '@/components/ai-generation/logo-tab';
import { MarketingTab } from '@/components/ai-generation/marketing-tab';
import { TabSelector } from '@/components/ai-generation/tab-selector';
import { AuthRequired } from '@/components/auth-required';
import { Button } from '@/components/ui/shadcn/button';
import { useAuth } from '@/hooks/useAuth';
import type { Generation } from '@/types/brand';
import { useTRPC } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';

interface BrandDetailPageProps {
  params: Promise<{ domain: string }>;
}

export default function BrandDetailPage({ params }: BrandDetailPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'logo' | 'marketing'>('logo');
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const trpc = useTRPC();

  // Unwrap the params Promise
  const { domain } = use(params);

  // Load generations for this domain
  const { data: generations = [], refetch: refetchGenerations } = useQuery({
    ...trpc.ai.getGenerationsByDomain.queryOptions({ domain }),
    enabled: isAuthenticated && !!domain,
  });

  const handleGenerationComplete = () => {
    // Refetch generations to update the list after a new generation
    refetchGenerations();
  };

  // Create brand name from domain (e.g., "example.com" -> "Example")
  const brandName = domain
    ?.split('.')[0]
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

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

  if (generations.length === 0) {
    return (
      <div className="container mx-auto py-8 px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            No generations found for {domain}
          </h2>
          <Button onClick={() => router.push('/ai-brand-generator')}>
            Go back to AI Brand Generator
          </Button>
        </div>
      </div>
    );
  }

  // Filter generations by type
  const logoGenerations = generations.filter((g) => g.type === 'logo');
  const marketingGenerations = generations.filter(
    (g) => g.type === 'marketing',
  );

  // Map tRPC generations to the frontend Generation type
  const mapGeneration = (gen: (typeof generations)[0]): Generation => ({
    id: gen.id,
    brandId: `brand_${domain}`,
    type: gen.type,
    prompt:
      gen.input.type === 'logo'
        ? `${gen.input.logoType} ${gen.input.logoStyle}${gen.input.description ? ` - ${gen.input.description}` : ''}`
        : gen.input.description || '',
    result: gen.output.url,
    generationCallId: gen.output.externalId,
    createdAt: gen.createdAt.toISOString(),
    metadata:
      gen.input.type === 'logo'
        ? {
            logoStyle: gen.input.logoStyle,
            logoType: gen.input.logoType,
          }
        : undefined,
  });

  const mappedLogoGenerations = logoGenerations.map(mapGeneration);
  const mappedMarketingGenerations = marketingGenerations.map(mapGeneration);

  return (
    <div className="container max-w-4xl mx-auto py-8 px-8">
      {/* Brand Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">{brandName}</h2>
          <p className="text-muted-foreground mt-1">{domain}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-4xl mx-auto">
        <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        {activeTab === 'logo' ? (
          <LogoTab
            existingGenerations={mappedLogoGenerations}
            brandDomain={domain}
            onGenerationUpdate={handleGenerationComplete}
          />
        ) : (
          <MarketingTab
            existingGenerations={mappedMarketingGenerations}
            brandDomain={domain}
            onGenerationUpdate={handleGenerationComplete}
            availableLogos={mappedLogoGenerations}
          />
        )}
      </div>
    </div>
  );
}
