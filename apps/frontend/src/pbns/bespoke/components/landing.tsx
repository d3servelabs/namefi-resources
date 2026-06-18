'use client';

import type { BespokeLandingConfig } from '../types';
import ConversionHero, { type ConversionHeroConfig } from './hero';
import { ValueProposition } from './value-proposition';
import { UseCases } from './use-cases';
import { Testimonials } from './testimonials';
import { Footer } from './footer';
import {
  Users,
  ShoppingCart,
  Calendar,
  Zap,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useInView, motion, AnimatePresence } from 'motion/react';
import { useQueryState, parseAsBoolean } from 'nuqs';
import dynamic from 'next/dynamic';
import { useDeferredSectionLoad } from '@/hooks/use-deferred-section-load';

const NewsletterForm = dynamic(
  () =>
    import('@/components/newsletter/newsletter-form').then(
      (module) => module.NewsletterForm,
    ),
  {
    ssr: false,
    loading: () => <div className="h-12 rounded-md bg-muted animate-pulse" />,
  },
);

const BespokeHuntSection = dynamic(
  () => import('./hunt-section').then((module) => module.BespokeHuntSection),
  {
    ssr: false,
    loading: () => <BespokeHuntSectionFallback />,
  },
);

export interface BespokeLandingProps {
  config: BespokeLandingConfig;
}

const HUNT_SECTION_SKELETON_ROWS = ['campaign', 'trending'] as const;
const HUNT_SECTION_SKELETON_ITEMS = [
  'first',
  'second',
  'third',
  'fourth',
  'fifth',
] as const;

function BespokeHuntSectionFallback({
  domainExtension = 'today',
}: {
  domainExtension?: string;
}) {
  return (
    <section id="bespoke-hunt" className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center">
          <div className="h-14 md:h-16 max-w-4xl mx-auto rounded-xl bg-slate-700/30 animate-pulse" />
          <div className="mt-6 h-6 max-w-3xl mx-auto rounded-full bg-slate-700/25 animate-pulse" />
          <div className="mt-16 grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-12">
            {HUNT_SECTION_SKELETON_ROWS.map((section) => (
              <div key={section} className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-700/40 animate-pulse" />
                  <div className="flex-1 space-y-3">
                    <div className="h-6 max-w-xs rounded-full bg-slate-700/30 animate-pulse" />
                    <div className="h-4 max-w-sm rounded-full bg-slate-800/40 animate-pulse" />
                  </div>
                </div>
                <div className="border border-border shadow-sm rounded-xl bg-white/[0.03] divide-y divide-border">
                  {HUNT_SECTION_SKELETON_ITEMS.map((item) => (
                    <div
                      key={`${section}-${item}`}
                      className="flex items-center gap-4 sm:gap-6 pe-4 sm:pe-6 py-6 sm:py-8 animate-pulse"
                    >
                      <div className="w-20 sm:w-24 flex justify-center border-e border-border px-4 sm:px-6">
                        <div className="w-8 h-8 bg-slate-700/50 rounded" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="h-5 sm:h-6 bg-slate-700/50 rounded w-3/4" />
                        <div className="h-4 bg-slate-800/50 rounded w-1/2" />
                      </div>
                      <div className="w-12 sm:w-16 flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-slate-700/50" />
                        <div className="h-4 w-8 bg-slate-700/50 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="sr-only">Loading .{domainExtension} hunt</div>
        </div>
      </div>
    </section>
  );
}

// Generate default notifications based on rotating subdomains
const generateNotifications = (
  _domainName: string,
  rotatingSubdomains: string[],
) => {
  const icons = [Users, ShoppingCart, Calendar, Zap, Target, TrendingUp];
  const actions = [
    'Just registered',
    'Completed action',
    'Booking confirmed',
    'Started journey',
    'Achieved goal',
    'Making progress',
  ];
  const colors = [
    '#00C9A7',
    '#10B981',
    '#14B8A6',
    '#F59E0B',
    '#06B6D4',
    '#3B82F6',
  ];
  const times = ['30s ago', '2m ago', '5m ago', '8m ago', '12m ago', '15m ago'];

  return rotatingSubdomains.slice(0, 6).map((subdomain, index) => ({
    id: index + 1,
    subdomain,
    action: actions[index % actions.length],
    icon: icons[index % icons.length],
    color: colors[index % colors.length],
    time: times[index % times.length],
  }));
};

export const BespokeLanding = ({ config }: BespokeLandingProps) => {
  const newsletterRef = useRef<HTMLDivElement>(null);
  const huntSectionRef = useRef<HTMLDivElement>(null);
  const [isNewsletterVisible, setNewsletterVisible] = useQueryState(
    'newsletter',
    parseAsBoolean.withDefault(false),
  );

  // Use InView to automatically scroll to newsletter when visible
  const isInView = useInView(newsletterRef, {
    once: false,
    margin: '-20% 0px -20% 0px',
  });
  const shouldLoadHuntSection = useDeferredSectionLoad(huntSectionRef, {
    hash: '#bespoke-hunt',
  });

  // Scroll to newsletter when it becomes visible
  useEffect(() => {
    if (isNewsletterVisible && newsletterRef.current && !isInView) {
      newsletterRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [isNewsletterVisible, isInView]);

  // Convert BespokeLandingConfig to ConversionHeroConfig
  const conversionHeroConfig: ConversionHeroConfig = {
    domainName: config.domainName,
    rotatingSubdomains: config.rotatingSubdomains,
    notifications: generateNotifications(
      config.domainName,
      config.rotatingSubdomains,
    ),
  };

  // Extract domain extension for hunt section
  const domainExtension =
    config.domainName.split('.').pop() || config.domainName;

  // Get domain name without extension for 'from' attribute
  const domainNameWithoutExt = config.domainName.split('.')[0];

  return (
    <div className="min-h-screen bg-background">
      <ConversionHero config={conversionHeroConfig} />

      <div ref={huntSectionRef}>
        {shouldLoadHuntSection ? (
          <BespokeHuntSection
            domainExtension={domainExtension}
            domainName={config.domainName}
          />
        ) : (
          <BespokeHuntSectionFallback domainExtension={domainExtension} />
        )}
      </div>

      <ValueProposition domainName={config.domainName} />

      <UseCases domainName={config.domainName} />

      <Testimonials
        domainName={config.domainName}
        testimonials={config.testimonials}
      />

      <Footer config={config} />

      {/* Newsletter Subscription Section - Hidden by default, shown via footer link */}
      <AnimatePresence mode="wait">
        {isNewsletterVisible && (
          <motion.div
            ref={newsletterRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              duration: 0.4,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="mt-16 mb-8 px-4 flex justify-center"
          >
            <div className="w-full max-w-screen-xl">
              <NewsletterForm
                from={`${domainNameWithoutExt}-${domainExtension}`}
                title="Stay in the Loop"
                description={`Get the latest updates on ${config.domainName} domain releases, features, and announcements.`}
                showNameField={true}
                variant="default"
                showCloseButton={true}
                onClose={() => setNewsletterVisible(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
