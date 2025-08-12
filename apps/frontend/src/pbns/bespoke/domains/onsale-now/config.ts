import { generateBespokeConfig } from '@/pbns/bespoke/lib/generate-config';

export const { landingConfig, originConfigWithoutLanding } =
  generateBespokeConfig({
    domainName: 'onsale.now',
    rotatingSubdomains: [
      'flash',
      'mega',
      'super',
      'daily',
      'hourly',
      'exclusive',
      'clearance',
      'warehouse',
      'outlet',
      'limited',
    ],
    openGraphImage: '/og/onsale-now.jpg',
    testimonials: [
      {
        quote:
          'The .now extension creates unmatched urgency. Our flash.onsale.now sales sell out in minutes!',
        author: 'Maria Rodriguez',
        handle: 'Fashion Retailer CEO',
        rating: 5,
      },
      {
        quote:
          'Best domain investment ever. The psychological impact of "onsale.now" is incredible.',
        author: 'David Kim',
        handle: '@ecommercepro',
        rating: 5,
      },
      {
        quote:
          'Our conversion rate exploded with deals.onsale.now - customers act immediately!',
        author: 'Sarah Johnson',
        handle: 'Digital Marketing Lead',
        rating: 5,
      },
      {
        quote:
          'The domain communicates everything: what (sale), when (now). Pure marketing genius.',
        author: 'Alex Chen',
        handle: 'Brand Strategist',
        rating: 5,
      },
      {
        quote:
          'Live.onsale.now transformed our live shopping events. Engagement up 400%!',
        author: 'Rachel Green',
        handle: 'Live Commerce Manager',
        rating: 5,
      },
      {
        quote:
          'No other domain creates this level of FOMO. Sales velocity increased 10x!',
        author: 'Tom Anderson',
        handle: 'E-commerce Director',
        rating: 5,
      },
    ],
  });
