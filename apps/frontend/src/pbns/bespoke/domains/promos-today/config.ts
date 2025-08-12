import { generateBespokeConfig } from '@/pbns/bespoke/lib/generate-config';

export const { landingConfig, originConfigWithoutLanding } =
  generateBespokeConfig({
    domainName: 'promos.today',
    rotatingSubdomains: [
      'blackfriday',
      'summer',
      'flash',
      'exclusive',
      'vip',
      'member',
      'student',
      'holiday',
      'weekend',
      'clearance',
    ],
    openGraphImage: '/og/promos-today.jpg',
    testimonials: [
      {
        quote:
          'Our deals.promos.today domain became the go-to destination for bargain hunters. Sales up 125%!',
        author: 'Jennifer Liu',
        handle: 'Head of Digital Marketing',
        rating: 5,
      },
      {
        quote:
          "The .promos.today extension immediately tells customers they're getting something special.",
        author: 'Carlos Martinez',
        handle: '@retailguru',
        rating: 5,
      },
      {
        quote:
          "We use different subdomains for each campaign. It's brilliant for tracking and brand consistency.",
        author: 'Amanda Foster',
        handle: 'E-commerce Director',
        rating: 5,
      },
      {
        quote:
          'Member.promos.today transformed our loyalty program. Members love the exclusive feel.',
        author: 'Ryan Park',
        handle: 'CRM Manager',
        rating: 5,
      },
      {
        quote:
          'The domain itself is marketing gold. Customers know exactly what to expect before they click.',
        author: 'Sophie Anderson',
        handle: 'Brand Strategist',
        rating: 5,
      },
      {
        quote:
          'Our referral.promos.today campaign went viral. The domain made sharing irresistible!',
        author: 'Mike Chen',
        handle: 'Growth Hacker',
        rating: 5,
      },
    ],
  });
