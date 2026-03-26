'use client';

import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/cn';
import { GenerationUsage } from './generation-usage';
import { AnimationTab } from './animation-tab';
import { LogoTab } from './logo-tab';
import { PosterTab } from './poster-tab';
import { useDerivativeFlow } from './derivative-flow-context';
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

  animationTabProps?: {
    existingGenerations?: Generation[];
    brandDomain?: NamefiNormalizedDomain;
    availableLogos?: Generation[];
  };
}

export function AITabs({
  className,
  logoTabProps,
  posterTabProps,
  animationTabProps,
}: AITabsProps) {
  const { mode, selectedLogo, closeFlow } = useDerivativeFlow();

  return (
    <div className={cn('w-full', className)}>
      <GenerationUsage className="mb-6" />
      <AnimatePresence mode="wait" initial={false}>
        {mode === 'poster' ? (
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
              onDismiss={closeFlow}
            />
          </motion.div>
        ) : mode === 'animation' ? (
          <motion.div
            key="animation-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <AnimationTab
              existingGenerations={animationTabProps?.existingGenerations}
              brandDomain={
                animationTabProps?.brandDomain ?? selectedLogo?.domain
              }
              logoGenerations={animationTabProps?.availableLogos}
              focusedLogo={selectedLogo ?? undefined}
              onDismiss={closeFlow}
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
