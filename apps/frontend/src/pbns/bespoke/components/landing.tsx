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
    </div>
  );
};
