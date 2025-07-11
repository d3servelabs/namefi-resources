'use client';

import { useState } from 'react';
import type { Generation } from '@namefi-astra/ai/types';
import { TabSelector } from './tab-selector';
import { LogoTab } from './logo-tab';
import { PosterTab } from './poster-tab';

interface AITabsProps {
  className?: string;

  // Logo tab specific props
  logoTabProps?: {
    existingGenerations?: Generation[];
    brandDomain?: string;
  };

  // Poster tab specific props
  posterTabProps?: {
    existingGenerations?: Generation[];
    brandDomain?: string;
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
    <div className={className}>
      <TabSelector
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className={tabSelectorClassName}
      />

      {/* Tab Content */}
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
