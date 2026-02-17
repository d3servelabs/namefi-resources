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
    title: '[Namefi] Your domains are heating up',
    subject: '[Namefi] Your domains are heating up',
    intro:
      'A few of your domains picked up meaningful interest this week. When that happens, related names often start getting attention too.',
    card: 'Steady move: keep your active domains pointed to live pages, and review similar available names while interest is rising.',
    cta: 'Review your domains',
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
