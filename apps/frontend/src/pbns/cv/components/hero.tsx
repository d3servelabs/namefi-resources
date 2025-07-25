import type { ReactNode } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { ContainerTextFlip } from '@/components/ui/aceternity/container-text-flip';
import { Sparkles, ArrowDown, Trophy } from 'lucide-react';
import Link from 'next/link';

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
  huntUrl,
  domainHuntWidget,
}: HeroProps) => {
  // Generate derived values
  const displayName = name.charAt(0).toUpperCase() + name.slice(1);
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
        <div className="max-w-5xl mx-auto text-center relative z-10 w-full">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full px-4 py-1.5 mb-8 sm:mb-12 backdrop-blur-sm relative">
            <Sparkles className="w-3 h-3 text-purple-400 relative z-10" />
            <span className="text-purple-300 font-medium text-xs tracking-wide uppercase relative z-10">
              First surname identity launch
            </span>
          </div>

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

          <p className="text-lg sm:text-2xl md:text-3xl text-slate-200 mb-12 sm:mb-16 max-w-4xl mx-auto font-semibold leading-tight px-4 sm:px-0">
            Claim your exclusive subdomain under{' '}
            <span className="text-brand-primary font-bold">{domainName}</span> —
            <br className="hidden md:block" />
            the ultimate digital identity for every {displayName}.
          </p>

          {/* Voting Widget */}
          <div className="flex justify-center mb-12 sm:mb-16 px-4 sm:px-0">
            {domainHuntWidget}
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8 sm:mb-10 px-4 sm:px-0">
            <Button
              size="lg"
              className="px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto"
              onClick={() => {
                document.getElementById('why-cv-matters')?.scrollIntoView({
                  behavior: 'smooth',
                });
              }}
            >
              <ArrowDown className="w-5 h-5 mr-1" />
              Learn More
            </Button>
            <Link href={huntUrl} className="w-full sm:w-auto">
              <Button
                size="lg"
                className="px-6 sm:px-8 py-4 sm:py-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 w-full sm:w-auto"
              >
                <Trophy className="w-5 h-5 mr-1" />
                View on Namefi Hunt™
              </Button>
            </Link>
          </div>
          <div className="text-center px-4 sm:px-0">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <span className="text-slate-400 text-sm tracking-wide">
                A collaboration of
              </span>
              <div className="flex items-center gap-2 sm:gap-3">
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
                <span className="text-slate-400 text-sm tracking-wide">
                  and
                </span>
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
              </div>
            </div>
          </div>
        </div>
        {/* Blur fade at bottom of hero to next section */}
        <div className="absolute bottom-0 left-0 w-full h-32 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900" />
        </div>
      </section>
    </div>
  );
};
