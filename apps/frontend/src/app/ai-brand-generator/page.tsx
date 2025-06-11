'use client';

import { LogoTab } from '@/components/ai-generation/logo-tab';
import { MarketingTab } from '@/components/ai-generation/marketing-tab';
import { TabSelector } from '@/components/ai-generation/tab-selector';
import { AuthRequired } from '@/components/auth-required';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/lib/storage';
import type { Brand, Generation } from '@/types/brand';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function AIBrandGeneratorPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeTab, setActiveTab] = useState<'logo' | 'marketing'>('logo');
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const refreshBrands = useCallback(() => {
    setBrands(storage.getAllBrands());
  }, []);

  // Load existing brands from storage on component mount
  useEffect(() => {
    if (isAuthenticated) {
      const existingBrands = storage.getAllBrands();
      setBrands(existingBrands);
    }
  }, [isAuthenticated]);

  // Refresh brands when the page becomes visible (e.g., when navigating back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        refreshBrands();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, refreshBrands]);

  const handleGenerationComplete = (
    type: 'logo' | 'marketing',
    prompt: string,
    result: string,
    domain: string,
    generationCallId: string | undefined,
    metadata?: Generation['metadata'],
  ) => {
    // Get or create brand based on domain
    const brand = storage.getOrCreateBrand(domain);

    // Add generation to the brand
    storage.addGeneration(brand.id, {
      type,
      prompt,
      result,
      generationCallId,
      metadata,
    });

    // Refresh brands list
    refreshBrands();
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
          <LogoTab
            onComplete={(prompt, result, domain, generationCallId, metadata) =>
              handleGenerationComplete(
                'logo',
                prompt,
                result,
                domain,
                generationCallId,
                metadata,
              )
            }
            onGenerationUpdate={refreshBrands}
          />
        ) : (
          <MarketingTab
            onComplete={(prompt, result, domain, generationCallId, metadata) =>
              handleGenerationComplete(
                'marketing',
                prompt,
                result,
                domain,
                generationCallId,
                metadata,
              )
            }
            onGenerationUpdate={refreshBrands}
          />
        )}
      </div>

      {/* Existing Brands */}
      {brands.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Your Brands</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brands.map((brand) => (
              <Card
                key={brand.id}
                className="cursor-pointer transition-all hover:shadow-lg"
                onClick={() =>
                  router.push(`/ai-brand-generator/brand/${brand.domain}`)
                }
              >
                <CardHeader>
                  <CardTitle>{brand.name}</CardTitle>
                  <CardDescription>{brand.domain}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {brand.generations.length} generation
                      {brand.generations.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(brand.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
