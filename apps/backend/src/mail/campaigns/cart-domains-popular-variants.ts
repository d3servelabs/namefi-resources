export type CartDomainsPopularVariant = {
  title: string;
  subject: string;
  intro: (args: { domainCountLabel: string }) => string;
  card: string;
  cta: string;
  footer: string;
};

const CART_DOMAINS_POPULAR_VARIANTS: CartDomainsPopularVariant[] = [
  {
    title: '[Namefi] Your domains are popular',
    subject: '[Namefi] Your domains are popular',
    intro: ({ domainCountLabel }) =>
      `You still have ${domainCountLabel} waiting in your cart. If you are still deciding, that is totally fine. Just a heads-up that availability can change.`,
    card: 'Domains are only reserved after checkout. If these feel right, a quick purchase locks them in.',
    cta: 'Review your cart',
    footer: 'We will keep them in your cart for now while you decide.',
  },
  {
    title: '[Namefi] Still thinking it over?',
    subject: '[Namefi] Still thinking it over?',
    intro: ({ domainCountLabel }) =>
      `We saved ${domainCountLabel} in your cart. Take your time, and remember that availability can change.`,
    card: 'Checkout is the only way to reserve them under your account.',
    cta: 'Complete checkout',
    footer: 'Questions about the process? Reply to this email.',
  },
  {
    title: '[Namefi] Your cart is ready when you are',
    subject: '[Namefi] Your cart is ready when you are',
    intro: ({ domainCountLabel }) =>
      `Your cart still has ${domainCountLabel}. If one of these feels right, checkout is the only way to reserve it.`,
    card: 'Tip: shorter names are easier to remember and share.',
    cta: 'Secure these domains',
    footer: 'We are happy to help if you want a second opinion.',
  },
  {
    title: '[Namefi] Finish your domain checkout',
    subject: '[Namefi] Finish your domain checkout',
    intro: ({ domainCountLabel }) =>
      `${domainCountLabel} in your cart are still available right now. If you are ready, checkout only takes a moment.`,
    card: 'Once purchased, the domains are reserved for you.',
    cta: 'Finish checkout',
    footer:
      'No pressure. They will stay in your cart for now while you decide.',
  },
];

export const CART_DOMAINS_POPULAR_VARIANT_COUNT =
  CART_DOMAINS_POPULAR_VARIANTS.length;

export function getCartDomainsPopularVariant(variantIndex = 0) {
  const safeIndex =
    ((variantIndex % CART_DOMAINS_POPULAR_VARIANT_COUNT) +
      CART_DOMAINS_POPULAR_VARIANT_COUNT) %
    CART_DOMAINS_POPULAR_VARIANT_COUNT;
  return {
    variant: CART_DOMAINS_POPULAR_VARIANTS[safeIndex],
    index: safeIndex,
  };
}
