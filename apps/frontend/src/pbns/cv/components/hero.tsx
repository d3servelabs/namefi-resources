import type { ReactNode } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { ContainerTextFlip } from '@/components/ui/aceternity/container-text-flip';
import { Sparkles, ArrowDown, Trophy } from 'lucide-react';
import Link from 'next/link';
import { AnimatedSection, AnimatedChild } from './animated-section';
import { motion } from 'motion/react';

interface HeroProps {
  /** The main name/domain (e.g., "taylor") */
  name: string;
  /** Array of rotating example names to show before the main name */
  rotatingNames: string[];
  /** Background image URL */
  backgroundImage: string;
  /** Hunt domain URL for the "View on Namefi Hunt™" button */
  huntUrl: string;
  /** Domain hunt widget component */
  domainHuntWidget: ReactNode;
}

export const Hero = ({
  name,
  rotatingNames,
  backgroundImage,
  huntUrl: _huntUrl,
  domainHuntWidget,
}: HeroProps) => {
  // Generate derived values
  const domainName = `${name}.cv`;

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
          duration={1.5}
          staggerChildren={0.12}
          className="max-w-5xl mx-auto text-center relative z-10 w-full"
          customEase={[0.22, 0.61, 0.36, 1]} // Smooth ease-out-cubic
        >
          <AnimatedChild delay={0.3} variant="scale-fade-gentle" duration={1.1}>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full px-4 py-1.5 mb-8 sm:mb-12 backdrop-blur-sm relative">
              <Sparkles className="w-3 h-3 text-purple-400 relative z-10" />
              <span className="text-purple-300 font-medium text-xs tracking-wide uppercase relative z-10">
                First Powered by Namefi™ Launch for .cv
              </span>
            </div>
          </AnimatedChild>

          <AnimatedChild
            delay={0.5}
            variant="fade-up-gentle"
            duration={1.3}
            customEase={[0.16, 0.84, 0.44, 1]}
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
            delay={0.75}
            variant="fade-up-gentle"
            duration={1.1}
            customEase={[0.22, 0.61, 0.36, 1]}
          >
            <p className="text-xl sm:text-2xl md:text-3xl text-slate-200 mb-12 sm:mb-16 max-w-4xl mx-auto font-semibold leading-tight px-4 sm:px-0">
              Help us launch{' '}
              <span className="text-brand-primary font-bold">{domainName}</span>{' '}
              by voting to show your interest!
              <br className="hidden md:block" />
              <span className="md:hidden"> </span>
              Early supporters get priority access when registration opens.
            </p>
          </AnimatedChild>

          {/* Voting Widget */}
          <AnimatedChild
            delay={0.95}
            variant="scale-fade-gentle"
            duration={1.0}
            customEase={[0.25, 0.46, 0.45, 0.94]}
          >
            <div className="flex justify-center mb-12 sm:mb-16 px-4 sm:px-0">
              <div className="w-full sm:w-auto">{domainHuntWidget}</div>
            </div>
          </AnimatedChild>

          <AnimatedChild
            delay={1.15}
            variant="fade-up-gentle"
            duration={0.9}
            customEase={[0.22, 0.61, 0.36, 1]}
          >
            <div className="flex justify-center gap-4 mb-8 sm:mb-10 px-8 sm:px-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: 1.25,
                  duration: 0.8,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                <Button
                  size="lg"
                  className="px-6 sm:px-8 py-4 sm:py-6"
                  onClick={() => {
                    document.getElementById('famous-people')?.scrollIntoView({
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
                  delay: 1.35,
                  duration: 0.8,
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

          <AnimatedChild
            delay={1.5}
            variant="fade-in-soft"
            duration={0.8}
            customEase={[0.43, 0.13, 0.23, 0.96]}
          >
            <div className="text-center px-4 sm:px-0">
              <div className="flex items-center justify-center gap-3">
                <motion.span
                  className="text-slate-400 text-sm tracking-wide"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.6, duration: 0.7 }}
                >
                  A collaboration of
                </motion.span>
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.7, duration: 0.6 }}
                >
                  <Link
                    href="https://ola.cv"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src="/assets/cv/cv-logo.png"
                      alt=".cv"
                      className="h-6 w-auto"
                    />
                  </Link>
                </motion.div>
                <motion.span
                  className="text-slate-400 text-sm tracking-wide"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.75, duration: 0.7 }}
                >
                  and
                </motion.span>
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.85, duration: 0.6 }}
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
