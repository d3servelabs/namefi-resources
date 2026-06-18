'use client';

import { Hero } from './hero';
import { WhyCVMatters } from './why-cv-matters';
import { FamousPeople, type FamousPerson } from './famous-people';
import { WhoCanJoin } from './who-can-join';
import { ExampleProfiles, type ExampleProfile } from './example-profiles';
import { Testimonials, type Testimonial } from './testimonials';
import { CTA } from './cta';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils/namefi-flavor';
import { lazy, Suspense, useEffect, useRef } from 'react';
import { useInView, motion, AnimatePresence } from 'motion/react';
import { useQueryState, parseAsBoolean } from 'nuqs';
import { useDeferredSectionLoad } from '@/hooks/use-deferred-section-load';
import { useCartContext } from '@/components/providers/cart';
import dynamic from 'next/dynamic';

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

const CVHuntSection = dynamic(
  () => import('./hunt-section').then((module) => module.CVHuntSection),
  {
    ssr: false,
    loading: () => <CVHuntSectionFallback />,
  },
);

const FloatingCart = dynamic(
  () =>
    import('@/components/floating-cart').then((module) => module.FloatingCart),
  {
    ssr: false,
    loading: () => null,
  },
);

const CVSearchExperience = lazy(() =>
  import('./search-experience').then((module) => ({
    default: module.CVSearchExperience,
  })),
);

const HUNT_SECTION_SKELETON_ROWS = ['campaign', 'trending'] as const;
const HUNT_SECTION_SKELETON_ITEMS = [
  'first',
  'second',
  'third',
  'fourth',
  'fifth',
] as const;

function CVHuntSectionFallback() {
  return (
    <section id="cv-hunt" className="py-20 px-4 relative">
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
          <div className="sr-only">Loading .cv hunt</div>
        </div>
      </div>
    </section>
  );
}

export interface CVLandingConfig {
  /** The name (e.g., "taylor") - will be auto-capitalized for display */
  name: string;
  /** Array of rotating example names to show before the main name */
  rotatingNames: string[];
  /** Background image URL */
  backgroundImage: string;
  /** Array of famous people with that name */
  famousPeople: FamousPerson[];
  /** Array of example profiles */
  exampleProfiles: ExampleProfile[];
  /** Array of testimonials */
  testimonials: Testimonial[];
}

function CVSearchExperienceFallback({
  config,
  huntUrl,
}: {
  config: CVLandingConfig;
  huntUrl: string;
}) {
  return (
    <Hero
      name={config.name}
      rotatingNames={config.rotatingNames}
      backgroundImage={config.backgroundImage}
      huntUrl={huntUrl}
      searchSlot={
        <div
          className="mx-auto h-16 w-full max-w-3xl rounded-full border border-white/14 bg-[#14161D] animate-pulse"
          aria-busy="true"
        />
      }
    />
  );
}

function CVDefaultFloatingCart() {
  const { cartData } = useCartContext();

  if ((cartData?.length ?? 0) === 0) {
    return null;
  }

  return <FloatingCart />;
}

export const CVLanding = ({ config }: { config: CVLandingConfig }) => {
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
    hash: '#cv-hunt',
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
  const [searchEnabled] = useQueryState(
    'search',
    parseAsBoolean.withDefault(false),
  );
  // Generate derived values
  const displayName =
    config.name.charAt(0).toUpperCase() + config.name.slice(1);
  const domainName = namefiNormalizedDomainSchema.parse(`${config.name}.cv`);
  const huntUrl = `/hunt/domains/${domainName}`;

  const cvContent = (
    <>
      <div ref={huntSectionRef}>
        {shouldLoadHuntSection ? (
          <CVHuntSection name={config.name} />
        ) : (
          <CVHuntSectionFallback />
        )}
      </div>

      <FamousPeople name={displayName} famousPeople={config.famousPeople} />

      <WhoCanJoin name={displayName} />

      <ExampleProfiles exampleProfiles={config.exampleProfiles} />

      <Testimonials name={displayName} testimonials={config.testimonials} />

      <WhyCVMatters />

      <CTA name={config.name} huntUrl={huntUrl} />
    </>
  );

  return (
    <>
      {searchEnabled ? (
        <Suspense
          fallback={
            <CVSearchExperienceFallback config={config} huntUrl={huntUrl} />
          }
        >
          <CVSearchExperience config={config} huntUrl={huntUrl}>
            {cvContent}
          </CVSearchExperience>
        </Suspense>
      ) : (
        <>
          <Hero
            name={config.name}
            rotatingNames={config.rotatingNames}
            backgroundImage={config.backgroundImage}
            huntUrl={huntUrl}
          />
          {cvContent}
        </>
      )}

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
                from={`${config.name}-cv`}
                title="Stay in the Loop"
                description={`Get the latest updates on ${config.name}.cv domain releases, features, and announcements.`}
                showNameField={true}
                variant="default"
                showCloseButton={true}
                onClose={() => setNewsletterVisible(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!searchEnabled && <CVDefaultFloatingCart />}
    </>
  );
};
