'use client';

import { AnimatedList } from '@/components/ui/magicui/animated-list';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { type LucideIcon, Trophy, Sparkles, ArrowDown } from 'lucide-react';
import { cn } from '@namefi-astra/ui/lib/cn';
import { ContainerTextFlip } from '@/components/ui/aceternity/container-text-flip';
import { DomainHuntWidget } from './domain-hunt-widget';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils/namefi-flavor';
import { HUNT_CAMPAIGN_KEYS } from '@/lib/hunt-campaign-keys';
import Image from 'next/image';

export interface ConversionNotification {
  id: number;
  subdomain: string;
  action: string;
  icon: LucideIcon;
  color: string;
  time: string;
}

export interface ConversionHeroConfig {
  domainName: string;
  rotatingSubdomains: string[];
  notifications: ConversionNotification[];
}

function NotificationCard({
  notification,
  domainName,
}: {
  notification: ConversionNotification;
  domainName: string;
}) {
  const Icon = notification.icon;

  return (
    <figure
      className={cn(
        'relative min-h-fit w-full max-w-[400px] cursor-pointer overflow-hidden rounded-2xl p-4',
        'bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 shadow-xl',
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <div
          className="flex size-10 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: notification.color,
          }}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <figcaption className="flex flex-row items-center whitespace-pre text-lg font-medium text-white">
            <span className="text-sm sm:text-lg">
              {notification.subdomain}.{domainName}
            </span>
            <span className="mx-1">·</span>
            <span className="text-xs text-gray-400">{notification.time}</span>
          </figcaption>
          <p className="text-sm font-normal text-gray-300">
            {notification.action}
          </p>
        </div>
      </div>
    </figure>
  );
}

export default function ConversionHero({
  config,
}: {
  config: ConversionHeroConfig;
}) {
  const normalizedDomainName = namefiNormalizedDomainSchema.parse(
    config.domainName,
  );

  return (
    <section className="relative min-h-screen lg:h-screen overflow-hidden flex items-center py-12 lg:py-0">
      {/* Background image */}
      <Image
        src="/assets/bespoke/background.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center"
        preload
      />

      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Vignette effect */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.3) 70%, rgba(0, 0, 0, 0.6) 100%)',
        }}
      />

      {/* Main container */}
      <div className="relative z-10 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[6fr_3fr] gap-8 lg:gap-12 max-w-5xl mx-auto items-center">
          {/* Left content section */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span className="text-cyan-300 font-medium text-xs tracking-wide uppercase">
                Subdomain Issuance on {config.domainName}
              </span>
            </div>

            {/* Main heading with rotating text */}
            <div className="mb-8">
              <h1 className="text-4xl lg:text-5xl font-bold text-white">
                <ContainerTextFlip
                  words={config.rotatingSubdomains}
                  interval={2000}
                  className="shadow-none"
                  textClassName="text-4xl lg:text-6xl font-extrabold tracking-tight"
                  animationDuration={500}
                />
                <span className="inline-block mt-2 text-gray-300">
                  .{config.domainName}
                </span>
              </h1>
            </div>

            {/* Description */}
            <p className="text-xl lg:text-2xl text-gray-200 mb-12 max-w-3xl leading-relaxed">
              Launch subdomains that inspire action and drive conversions.
              <br className="hidden lg:block" />
              <span className="text-white font-semibold">
                Early supporters get priority access
              </span>{' '}
              when registration opens.
            </p>

            {/* Domain Hunt Widget */}
            <div className="flex justify-center lg:justify-start mb-10">
              <div className="max-w-lg sm:w-auto">
                <DomainHuntWidget
                  domainName={normalizedDomainName}
                  shareConfig={{
                    enabled: true,
                    trackShares: true,
                    campaignKeyResolver: () => HUNT_CAMPAIGN_KEYS.CTA,
                  }}
                />
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6"
                onClick={() => {
                  document.getElementById('learn-more')?.scrollIntoView({
                    behavior: 'smooth',
                  });
                }}
              >
                <ArrowDown className="w-5 h-5 mr-2" />
                Learn More
              </Button>
              <Button
                size="lg"
                className="px-8 py-6 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700"
                onClick={() => {
                  window.location.href = `/hunt/domains/${normalizedDomainName}`;
                }}
              >
                <Trophy className="w-5 h-5 mr-2" />
                View on Namefi Hunt™
              </Button>
            </div>
          </div>

          {/* Right animated list section - showing real-time conversions */}
          <div className="relative hidden lg:flex lg:h-[500px] flex-col overflow-hidden">
            <AnimatedList delay={1500}>
              {[...config.notifications, ...config.notifications].map(
                (notification, idx) => (
                  <NotificationCard
                    key={`${notification.id}-${idx}`}
                    notification={notification}
                    domainName={config.domainName}
                  />
                ),
              )}
            </AnimatedList>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4" />
          </div>
        </div>
      </div>
    </section>
  );
}
