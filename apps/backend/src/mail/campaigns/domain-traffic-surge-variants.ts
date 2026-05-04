export type DomainTrafficSurgeVariant = {
  subject: string;
  cta: string;
};

const DOMAIN_TRAFFIC_SURGE_VARIANTS: DomainTrafficSurgeVariant[] = [
  {
    subject: '[Namefi] Your domains are heating up',
    cta: 'Review domains in Namefi',
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
