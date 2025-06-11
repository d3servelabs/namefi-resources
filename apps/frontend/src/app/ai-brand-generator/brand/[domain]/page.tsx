'use client';

import { LogoTab } from '@/components/ai-generation/logo-tab';
import { MarketingTab } from '@/components/ai-generation/marketing-tab';
import { TabSelector } from '@/components/ai-generation/tab-selector';
import { AuthRequired } from '@/components/auth-required';
import { Button } from '@/components/ui/shadcn/button';
import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/lib/storage';
import type { Brand, Generation } from '@/types/brand';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

interface BrandDetailPageProps {
  params: Promise<{ domain: string }>;
}

export default function BrandDetailPage({ params }: BrandDetailPageProps) {
  const router = useRouter();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [activeTab, setActiveTab] = useState<'logo' | 'marketing'>('logo');
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Unwrap the params Promise
  const { domain } = use(params);

  // Load brand from storage on component mount
  useEffect(() => {
    if (isAuthenticated && domain) {
      const loadedBrand = storage.getBrandByDomain(domain);
      setBrand(loadedBrand);
    }
  }, [isAuthenticated, domain]);

  const handleGenerationComplete = (
    type: 'logo' | 'marketing',
    prompt: string,
    result: string,
    domainParam: string,
    generationCallId: string | undefined,
    metadata?: Generation['metadata'],
  ) => {
    // Get or create brand based on domain
    const updatedBrand = storage.getOrCreateBrand(domainParam);

    // Add generation to the brand
    const generation = storage.addGeneration(updatedBrand.id, {
      type,
      prompt,
      result,
      generationCallId,
      metadata,
    });

    if (generation) {
      // Update local state
      setBrand({
        ...updatedBrand,
        generations: [...updatedBrand.generations, generation],
      });
    }
  };

  const refreshGenerations = () => {
    // Reload brand from storage to get latest generations
    const loadedBrand = storage.getBrandByDomain(domain);
    if (loadedBrand) {
      setBrand(loadedBrand);
    }
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

  if (!brand) {
    return (
      <div className="container mx-auto py-8 px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Brand not found</h2>
          <Button onClick={() => router.push('/ai-brand-generator')}>
            Go back to AI Brand Generator
          </Button>
        </div>
      </div>
    );
  }

  // Filter generations by type
  const logoGenerations = brand.generations.filter((g) => g.type === 'logo');
  const marketingGenerations = brand.generations.filter(
    (g) => g.type === 'marketing',
  );

  return (
    <div className="container max-w-4xl mx-auto py-8 px-8">
      {/* Brand Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">{brand.name}</h2>
          <p className="text-muted-foreground mt-1">{brand.domain}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-4xl mx-auto">
        <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        {activeTab === 'logo' ? (
          <LogoTab
            onComplete={(
              prompt,
              result,
              domainParam,
              generationCallId,
              metadata,
            ) =>
              handleGenerationComplete(
                'logo',
                prompt,
                result,
                domainParam,
                generationCallId,
                metadata,
              )
            }
            existingGenerations={logoGenerations}
            brandDomain={brand.domain}
            onGenerationUpdate={refreshGenerations}
          />
        ) : (
          <MarketingTab
            onComplete={(
              prompt,
              result,
              domainParam,
              generationCallId,
              metadata,
            ) =>
              handleGenerationComplete(
                'marketing',
                prompt,
                result,
                domainParam,
                generationCallId,
                metadata,
              )
            }
            existingGenerations={marketingGenerations}
            brandDomain={brand.domain}
            onGenerationUpdate={refreshGenerations}
            availableLogos={logoGenerations}
          />
        )}
      </div>
    </div>
  );
}
