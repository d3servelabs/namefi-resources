export type DomainTrafficSurgeVariant = {
  title: string;
  subject: string;
  intro: string;
  card: string;
  cta: string;
  footer: string;
};

const DOMAIN_TRAFFIC_SURGE_VARIANTS: DomainTrafficSurgeVariant[] = [
  {
    title: '[Namefi] Domain activity is heating up',
    subject: '[Namefi] Domain activity is heating up',
    intro:
      'One or more of your domains picked up meaningful interest this week. When that happens, related names often start getting attention too.',
    card: 'Keep active domains pointed to live pages, and review similar available names while interest is rising.',
    cta: 'Review domain activity',
    footer: 'No pressure, these are just options if they fit your roadmap.',
  },
];

export const DOMAIN_TRAFFIC_SURGE_VARIANT_COUNT =
  DOMAIN_TRAFFIC_SURGE_VARIANTS.length;

export function getDomainTrafficSurgeVariant(variantIndex = 0) {
  const safeIndex =
    ((variantIndex % DOMAIN_TRAFFIC_SURGE_VARIANT_COUNT) +
      DOMAIN_TRAFFIC_SURGE_VARIANT_COUNT) %
    DOMAIN_TRAFFIC_SURGE_VARIANT_COUNT;
  return {
    variant: DOMAIN_TRAFFIC_SURGE_VARIANTS[safeIndex],
    index: safeIndex,
  };
}
