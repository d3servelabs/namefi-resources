'use client';

import { cn } from '@/lib/cn';
import { LogoTab } from './logo-tab';
import { PosterTab } from './poster-tab';
import { GenerationUsage } from './generation-usage';
import { usePosterFlow } from './poster-flow-context';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import type { Generation } from './shared/types';
import { AnimatePresence, motion } from 'motion/react';

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
      <AnimatePresence mode="wait" initial={false}>
        {isPosterVisible ? (
          <motion.div
            key="poster-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <PosterTab
              existingGenerations={posterTabProps?.existingGenerations}
              brandDomain={posterTabProps?.brandDomain ?? selectedLogo?.domain}
              logoGenerations={posterTabProps?.availableLogos}
              focusedLogo={selectedLogo ?? undefined}
              onDismiss={closePoster}
            />
          </motion.div>
        ) : (
          <motion.div
            key="logo-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <LogoTab
              existingGenerations={logoTabProps?.existingGenerations}
              brandDomain={logoTabProps?.brandDomain}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
