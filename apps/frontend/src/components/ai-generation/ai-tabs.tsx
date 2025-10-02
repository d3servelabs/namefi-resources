'use client';

import { cn } from '@/lib/cn';
import { LogoTab } from './logo-tab';
import { PosterTab } from './poster-tab';
import { GenerationUsage } from './generation-usage';
import { usePosterFlow } from './poster-flow-context';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import type { Generation } from './shared/types';

interface AITabsProps {
  className?: string;

  logoTabProps?: {
    existingGenerations?: Generation[];
    brandDomain?: NamefiNormalizedDomain;
  };

  posterTabProps?: {
    existingGenerations?: Generation[];
    brandDomain?: NamefiNormalizedDomain;
    availableLogos?: Generation[];
  };
}

export function AITabs({
  className,
  logoTabProps,
  posterTabProps,
}: AITabsProps) {
  const { isPosterVisible, selectedLogo, closePoster } = usePosterFlow();

  return (
    <div className={cn('w-full', className)}>
      <GenerationUsage className="mb-6" />
      {isPosterVisible ? (
        <PosterTab
          existingGenerations={posterTabProps?.existingGenerations}
          brandDomain={
            posterTabProps?.brandDomain ||
            (selectedLogo?.domain as NamefiNormalizedDomain | undefined)
          }
          logoGenerations={posterTabProps?.availableLogos}
          focusedLogo={selectedLogo || undefined}
          onDismiss={closePoster}
        />
      ) : (
        <LogoTab
          existingGenerations={logoTabProps?.existingGenerations}
          brandDomain={logoTabProps?.brandDomain}
        />
      )}
    </div>
  );
}
