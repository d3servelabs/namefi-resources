export type DreamDomainAwaitsVariant = {
  title: string;
  subject: string;
  intro: string;
  tipHeader: string;
  tips: string[];
  cta: string;
  footer: string;
};

const DREAM_DOMAIN_AWAITS_VARIANTS: DreamDomainAwaitsVariant[] = [
  {
    title: '[Namefi] Find your next domain',
    subject: '[Namefi] Find your next domain',
    intro:
      'When you are ready for your next idea, we can help you find a name that fits and is easy to share.',
    tipHeader: 'Quick ways to get to a great name:',
    tips: [
      'Start with your brand name and a couple of extensions.',
      'Keep it short, clear, and easy to say out loud.',
      'Add a simple keyword that describes what you do.',
    ],
    cta: 'Search domains',
    footer: 'Want a second opinion on a shortlist? Reply and we will help.',
  },
  {
    title: '[Namefi] Pick up where you left off',
    subject: '[Namefi] Pick up where you left off',
    intro:
      'If you are ready to look again, a quick search can surface strong options fast.',
    tipHeader: 'Easy ways to explore:',
    tips: [
      'Start with .com plus one alternative you would actually use.',
      'Say it out loud to check clarity and memorability.',
      'Avoid extra hyphens or numbers when possible.',
    ],
    cta: 'Browse domains',
    footer:
      'Need help narrowing options? Reply and we will walk you through it.',
  },
  {
    title: '[Namefi] A great domain is still available',
    subject: '[Namefi] A great domain is still available',
    intro:
      'The right domain makes everything easier. We are here when you are ready.',
    tipHeader: 'Ideas to try:',
    tips: [
      'Pair your brand with a simple, clear keyword.',
      'Aim for a name people remember after hearing once.',
      'Consider your audience or location if it helps.',
    ],
    cta: 'Find a domain',
    footer: 'Questions about pricing or availability? Reply and we will help.',
  },
];

export const DREAM_DOMAIN_AWAITS_VARIANT_COUNT =
  DREAM_DOMAIN_AWAITS_VARIANTS.length;

export function getDreamDomainAwaitsVariant(variantIndex = 0) {
  const safeIndex =
    ((variantIndex % DREAM_DOMAIN_AWAITS_VARIANT_COUNT) +
      DREAM_DOMAIN_AWAITS_VARIANT_COUNT) %
    DREAM_DOMAIN_AWAITS_VARIANT_COUNT;
  return {
    variant: DREAM_DOMAIN_AWAITS_VARIANTS[safeIndex],
    index: safeIndex,
  };
}
