'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { TabSelector } from './tab-selector';
import { LogoTab } from './logo-tab';
import { PosterTab } from './poster-tab';
import { GenerationUsage } from './generation-usage';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import type { Generation } from './shared/types';

interface AITabsProps {
  className?: string;

  // Logo tab specific props
  logoTabProps?: {
    existingGenerations?: Generation[];
    brandDomain?: NamefiNormalizedDomain;
  };

  // Poster tab specific props
  posterTabProps?: {
    existingGenerations?: Generation[];
    brandDomain?: NamefiNormalizedDomain;
    availableLogos?: Generation[];
  };

  // Tab selector props
  tabSelectorClassName?: string;

  // Initial active tab
  initialTab?: 'logo' | 'marketing';
}

export function AITabs({
  className,
  logoTabProps,
  posterTabProps,
  tabSelectorClassName,
  initialTab = 'logo',
}: AITabsProps) {
  const [activeTab, setActiveTab] = useState<'logo' | 'marketing'>(initialTab);

  return (
    <div className={cn(className, 'w-full')}>
      {/* full width within column */}
      <TabSelector
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className={tabSelectorClassName}
      />
      <GenerationUsage className="my-6" />
      {activeTab === 'logo' ? (
        <LogoTab
          existingGenerations={logoTabProps?.existingGenerations}
          brandDomain={logoTabProps?.brandDomain}
        />
      ) : (
        <PosterTab
          existingGenerations={posterTabProps?.existingGenerations}
          brandDomain={posterTabProps?.brandDomain}
          logoGenerations={posterTabProps?.availableLogos}
        />
      )}
    </div>
  );
}
