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
      'We noticed a surge of interest on a few of your domains this past week. If you are planning a launch, now is a great time to capture the momentum.',
    card: 'Quick win: point these domains to a live site or a simple landing page so visitors know where to go.',
    cta: 'Review domains',
    footer:
      'Want help turning the momentum into sign-ups or sales? Reply and we will help.',
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
