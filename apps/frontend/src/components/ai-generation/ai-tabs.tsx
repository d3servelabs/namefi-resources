'use client';

import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@namefi-astra/ui/lib/cn';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@namefi-astra/ui/components/shadcn/tabs';
import { GenerationUsage } from './generation-usage';
import { AnimationTab } from './animation-tab';
import { LogoTab } from './logo-tab';
import { PosterTab } from './poster-tab';
import { useDerivativeFlow } from './derivative-flow-context';
import type { Generation } from './shared/types';
import type { DomainPreview } from './shared/gallery-types';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { useAIPostAuthGenerationExecutor } from './use-ai-post-auth-generation-executor';

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
    domains?: DomainPreview[];
  };

  animationTabProps?: {
    existingGenerations?: Generation[];
    brandDomain?: NamefiNormalizedDomain;
    availableLogos?: Generation[];
    domains?: DomainPreview[];
  };
}

type DerivativeTabProps =
  | AITabsProps['posterTabProps']
  | AITabsProps['animationTabProps'];

function hasDerivativeOwnedLogos(tabProps: DerivativeTabProps) {
  return (
    (tabProps?.availableLogos?.length ?? 0) > 0 ||
    (tabProps?.domains ?? []).some((domain) => (domain.logoCount ?? 0) > 0)
  );
}

export function AITabs({
  className,
  logoTabProps,
  posterTabProps,
  animationTabProps,
}: AITabsProps) {
  const {
    mode,
    selectedLogo,
    requestedMode,
    requestedDomain,
    startPoster,
    startAnimation,
    requestPosterLogo,
    requestAnimationLogo,
    closeFlow,
  } = useDerivativeFlow();
  const { isAuthenticated } = useAuth();
  const t = useTranslations('aiGeneration');
  useAIPostAuthGenerationExecutor();

  const hasPosterOwnedLogos = hasDerivativeOwnedLogos(posterTabProps);
  const hasAnimationOwnedLogos = hasDerivativeOwnedLogos(animationTabProps);
  const activeTool = mode ?? requestedMode ?? 'logo';
  const posterBrandDomain =
    posterTabProps?.brandDomain ?? selectedLogo?.domain ?? requestedDomain;
  const animationBrandDomain =
    animationTabProps?.brandDomain ?? selectedLogo?.domain ?? requestedDomain;
  const requestedBrandDomain =
    logoTabProps?.brandDomain ??
    (requestedMode === 'animation'
      ? animationBrandDomain
      : posterBrandDomain) ??
    undefined;

  const handleToolChange = (value: string) => {
    if (value === 'logo') {
      closeFlow();
      return;
    }

    if (value === 'poster') {
      if (isAuthenticated && hasPosterOwnedLogos) {
        startPoster(posterBrandDomain);
      } else {
        requestPosterLogo(posterBrandDomain);
      }
      return;
    }

    if (value === 'animation') {
      if (isAuthenticated && hasAnimationOwnedLogos) {
        startAnimation(animationBrandDomain);
      } else {
        requestAnimationLogo(animationBrandDomain);
      }
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <GenerationUsage className="mb-6" />
      <Tabs
        value={activeTool}
        onValueChange={handleToolChange}
        className="mb-6"
      >
        <TabsList className="grid w-full grid-cols-3 max-sm:flex max-sm:h-auto! max-sm:flex-wrap max-sm:justify-start max-sm:gap-1">
          <TabsTrigger value="logo">{t('tabs.logo')}</TabsTrigger>
          <TabsTrigger value="poster">{t('tabs.poster')}</TabsTrigger>
          <TabsTrigger value="animation">{t('tabs.animation')}</TabsTrigger>
        </TabsList>
      </Tabs>
      {requestedMode && (
        <div className="mb-4 rounded-lg border border-border/70 bg-muted/30 px-4 py-3">
          <p className="text-sm font-medium">{t('prerequisite.title')}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {requestedMode === 'poster'
              ? t('prerequisite.posterDescription')
              : t('prerequisite.animationDescription')}
          </p>
        </div>
      )}
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
              brandDomain={posterBrandDomain ?? undefined}
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
              brandDomain={animationBrandDomain ?? undefined}
              logoGenerations={animationTabProps?.availableLogos}
              focusedLogo={selectedLogo ?? undefined}
              onDismiss={closeFlow}
            />
          </motion.div>
        ) : (
          <motion.div
            key={
              requestedMode ? `${requestedMode}-logo-prerequisite` : 'logo-tab'
            }
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <LogoTab
              existingGenerations={logoTabProps?.existingGenerations}
              brandDomain={requestedBrandDomain}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
