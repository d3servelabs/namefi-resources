import { generateBespokeConfig } from '@/pbns/bespoke/lib/generate-config';

export const { landingConfig, originConfigWithoutLanding } =
  generateBespokeConfig({
    domainName: 'ends.today',
    rotatingSubdomains: [
      'sale',
      'offer',
      'promo',
      'deal',
      'registration',
      'earlybird',
      'discount',
      'enrollment',
      'auction',
      'campaign',
    ],
    openGraphImage: '/og/ends-today.jpg',
    testimonials: [
      {
        quote:
          'Our flash.ends.today domain increased last-minute sales by 85%. The urgency is built right into the URL!',
        author: 'Lisa Chang',
        handle: 'CMO at FastFashion',
        rating: 5,
      },
      {
        quote:
          'Using registration.ends.today for our conference doubled our conversion rate in the final week.',
        author: 'Mark Stevens',
        handle: '@eventmanager',
        rating: 5,
      },
      {
        quote:
          'The psychological impact of the .ends.today domain is incredible. Customers act immediately.',
        author: 'Sarah Kim',
        handle: 'E-commerce Strategist',
        rating: 5,
      },
      {
        quote:
          'Perfect for creating FOMO. Our campaign.ends.today URL became our most effective CTA.',
        author: 'Alex Thompson',
        handle: 'Digital Marketing Pro',
        rating: 5,
      },
      {
        quote:
          'Auction.ends.today drove 3x more final-hour bids than our previous domain setup.',
        author: 'Robert Chen',
        handle: 'Auction Platform CEO',
        rating: 5,
      },
      {
        quote:
          'Clear, urgent, effective. The domain communicates exactly what users need to know.',
        author: 'Emma Davis',
        handle: 'UX Designer',
        rating: 5,
      },
    ],
  });
