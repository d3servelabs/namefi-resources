'use client';

import type { BespokeLandingConfig } from '../types';
import ConversionHero, { type ConversionHeroConfig } from './hero';
import { ValueProposition } from './value-proposition';
import { UseCases } from './use-cases';
import { BespokeHuntSection } from './hunt-section';
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
import { NewsletterForm } from '@/components/newsletter/newsletter-form';
import { useEffect, useRef } from 'react';
import { useInView, motion, AnimatePresence } from 'motion/react';
import { useQueryState, parseAsBoolean } from 'nuqs';

export interface BespokeLandingProps {
  config: BespokeLandingConfig;
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
  const [isNewsletterVisible, setNewsletterVisible] = useQueryState(
    'newsletter',
    parseAsBoolean.withDefault(false),
  );

  // Use InView to automatically scroll to newsletter when visible
  const isInView = useInView(newsletterRef, {
    once: false,
    margin: '-20% 0px -20% 0px',
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

      <BespokeHuntSection
        domainExtension={domainExtension}
        domainName={config.domainName}
      />

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
