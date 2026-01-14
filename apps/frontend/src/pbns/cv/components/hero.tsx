import { Button } from '@/components/ui/shadcn/button';
import { ContainerTextFlip } from '@/components/ui/aceternity/container-text-flip';
import { Sparkles, ArrowDown, Trophy } from 'lucide-react';
import Link from 'next/link';
import { AnimatedSection, AnimatedChild } from './animated-section';
import { motion } from 'motion/react';
import { DomainHuntWidget } from '@/pbns/cv/components/domain-hunt-widget';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils/namefi-flavor';
import { SearchInput, type SearchMode } from '@/components/search';
import type { ImportQuery } from '@/components/search/types';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { HUNT_CAMPAIGN_KEYS } from '@/lib/hunt-campaign-keys';

interface HeroProps {
  /** The main name/domain (e.g., "taylor") */
  name: string;
  /** Array of rotating example names to show before the main name */
  rotatingNames: string[];
  /** Background image URL */
  backgroundImage: string;
  /** Hunt domain URL for the "View on Namefi Hunt™" button */
  huntUrl: string;
  /** Whether search is enabled */
  searchEnabled?: boolean;
  /** Search props when search is enabled */
  searchProps?: {
    query: string;
    setQuery: (query: string) => void;
    runSearch: () => void;
    isLoading: boolean;
    searchMode: SearchMode;
    importQuery: Map<NamefiNormalizedDomain, ImportQuery>;
    hasSearchResults?: boolean;
  };
}

export const Hero = ({
  name,
  rotatingNames,
  backgroundImage,
  huntUrl: _huntUrl,
  searchEnabled = false,
  searchProps,
}: HeroProps) => {
  // Generate derived values
  const domainName = `${name}.cv`;
  const normalizedDomainName = namefiNormalizedDomainSchema.parse(domainName);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative flex-1 py-12 sm:py-24 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        {/* Full Screen Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pt-16"
          style={{ backgroundImage: `url('${backgroundImage}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900" />
        <AnimatedSection
          triggerOnScroll={false}
          variant="fade-in-soft"
          duration={0.8}
          staggerChildren={0.08}
          className="max-w-5xl mx-auto text-center relative z-10 w-full"
          customEase={[0.25, 0.46, 0.45, 0.94]}
        >
          <AnimatedChild
            delay={0.15}
            variant="scale-fade-gentle"
            duration={0.6}
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full px-4 py-1.5 mb-8 sm:mb-12 backdrop-blur-sm relative">
              <Sparkles className="w-3 h-3 text-purple-400 relative z-10" />
              <span className="text-purple-300 font-medium text-xs tracking-wide uppercase relative z-10">
                First Powered by Namefi™ Launch for .cv
              </span>
            </div>
          </AnimatedChild>

          <AnimatedChild
            delay={0.25}
            variant="fade-up-gentle"
            duration={0.7}
            customEase={[0.25, 0.46, 0.45, 0.94]}
          >
            <div className="mb-8 sm:mb-12 px-4 sm:px-8">
              <ContainerTextFlip
                words={rotatingNames}
                interval={2000}
                className="shadow-none"
                textClassName="text-4xl sm:text-6xl md:text-8xl font-extrabold tracking-tight"
                animationDuration={500}
              />
              <span className="text-4xl sm:text-6xl md:text-7xl font-bold">
                .{name}.cv
              </span>
            </div>
          </AnimatedChild>

          <AnimatedChild
            delay={0.35}
            variant="fade-up-gentle"
            duration={0.6}
            customEase={[0.25, 0.46, 0.45, 0.94]}
          >
            <p
              className={`text-xl sm:text-2xl md:text-3xl text-slate-200 ${searchEnabled ? 'mb-8 sm:mb-10' : 'mb-12 sm:mb-16'} max-w-4xl mx-auto font-semibold leading-tight px-4 sm:px-0`}
            >
              {searchEnabled ? (
                <>
                  Search available{' '}
                  <span className="text-brand-primary font-bold">
                    {name}.cv subdomains.
                  </span>
                </>
              ) : (
                <>
                  Help us launch{' '}
                  <span className="text-brand-primary font-bold">
                    {domainName}
                  </span>{' '}
                  by voting to show your interest!
                  <br className="hidden md:block" />
                  <span className="md:hidden"> </span>
                  Early supporters get priority access when registration opens.
                </>
              )}
            </p>
          </AnimatedChild>

          {/* Search or Voting Widget */}
          <AnimatedChild
            delay={0.45}
            variant="scale-fade-gentle"
            duration={0.55}
            customEase={[0.25, 0.46, 0.45, 0.94]}
          >
            <div className="flex flex-col items-center gap-4 mb-12 sm:mb-16 px-4 sm:px-0">
              {searchEnabled && searchProps ? (
                <div className="w-full max-w-3xl">
                  <SearchInput
                    query={searchProps.query}
                    setQuery={searchProps.setQuery}
                    isLoading={searchProps.isLoading}
                    searchMode={searchProps.searchMode}
                    importQuery={searchProps.importQuery}
                    onSearch={searchProps.runSearch}
                    parentDomain={normalizedDomainName}
                  />
                </div>
              ) : (
                <div className="w-full sm:w-auto">
                  <DomainHuntWidget
                    domainName={normalizedDomainName}
                    shareConfig={{
                      enabled: true,
                      trackShares: true,
                      campaignKeyResolver: () => HUNT_CAMPAIGN_KEYS.CV,
                    }}
                  />
                </div>
              )}
            </div>
          </AnimatedChild>

          {!searchEnabled && (
            <>
              <AnimatedChild
                delay={0.55}
                variant="fade-up-gentle"
                duration={0.5}
                customEase={[0.25, 0.46, 0.45, 0.94]}
              >
                <div
                  className={`flex justify-center gap-4 mb-8 sm:mb-10 px-8 sm:px-0 ${searchEnabled && searchProps?.hasSearchResults ? 'invisible' : ''}`}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 0.6,
                      duration: 0.45,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                  >
                    <Button
                      size="lg"
                      className="px-6 sm:px-8 py-4 sm:py-6"
                      onClick={() => {
                        document
                          .getElementById('famous-people')
                          ?.scrollIntoView({
                            behavior: 'smooth',
                          });
                      }}
                    >
                      <ArrowDown className="w-5 h-5 mr-1" />
                      Learn More
                    </Button>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 0.65,
                      duration: 0.45,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                  >
                    <Button
                      size="lg"
                      className="px-6 sm:px-8 py-4 sm:py-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0"
                      onClick={() => {
                        document.getElementById('cv-hunt')?.scrollIntoView({
                          behavior: 'smooth',
                        });
                      }}
                    >
                      <Trophy className="w-5 h-5 mr-1" />
                      Join the .cv Namefi Hunt™
                    </Button>
                  </motion.div>
                </div>
              </AnimatedChild>
            </>
          )}

          <AnimatedChild
            delay={0.7}
            variant="fade-in-soft"
            duration={0.45}
            customEase={[0.25, 0.46, 0.45, 0.94]}
          >
            <div
              className={`text-center px-4 sm:px-0 ${searchEnabled && searchProps?.hasSearchResults ? 'invisible' : ''}`}
            >
              <div className="flex items-center justify-center gap-3">
                <motion.span
                  className="text-slate-400 text-sm tracking-wide"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.75, duration: 0.4 }}
                >
                  A collaboration of
                </motion.span>
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.35 }}
                >
                  <Link
                    href="https://ola.cv"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src="/assets/cv/logos/cv-logo.png"
                      alt=".cv"
                      className="h-6 w-auto"
                    />
                  </Link>
                </motion.div>
                <motion.span
                  className="text-slate-400 text-sm tracking-wide"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.85, duration: 0.4 }}
                >
                  and
                </motion.span>
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.35 }}
                >
                  <Link
                    href="https://namefi.io"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src="/logotype.svg"
                      alt="Namefi"
                      className="h-6 w-auto"
                    />
                  </Link>
                </motion.div>
              </div>
            </div>
          </AnimatedChild>
        </AnimatedSection>
        {/* Blur fade at bottom of hero to next section */}
        <div className="absolute bottom-0 left-0 w-full h-32 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900" />
        </div>
      </section>
    </div>
  );
};
