import { generateBespokeConfig } from '@/pbns/bespoke/lib/generate-config';

export const { landingConfig, originConfigWithoutLanding } =
  generateBespokeConfig({
    domainName: 'starts.today',
    rotatingSubdomains: [
      'conference',
      'sale',
      'course',
      'campaign',
      'bootcamp',
      'hackathon',
      'workshop',
      'challenge',
      'launch',
      'beta',
    ],
    openGraphImage: '/og/starts-today.jpg',
    testimonials: [
      {
        quote:
          'Our product launch on launch.starts.today created immediate buzz. The domain itself communicates urgency and excitement.',
        author: 'David Park',
        handle: 'Product Manager at TechCo',
        rating: 5,
      },
      {
        quote:
          'Using conference.starts.today for our annual event increased registrations by 40%. The domain creates perfect FOMO.',
        author: 'Rachel Green',
        handle: '@eventpro',
        rating: 5,
      },
      {
        quote:
          'My bootcamp.starts.today domain perfectly captures the energy of starting something new. Students love it!',
        author: 'Marcus Johnson',
        handle: 'Coding Instructor',
        rating: 5,
      },
      {
        quote:
          'The .starts.today domain gave our crowdfunding campaign the perfect sense of immediacy and action.',
        author: 'Sophie Chen',
        handle: 'Startup Founder',
        rating: 5,
      },
      {
        quote:
          'Our sale.starts.today subdomain became our most effective marketing URL. Simple, clear, and actionable.',
        author: 'Tom Wilson',
        handle: 'E-commerce Director',
        rating: 5,
      },
      {
        quote:
          'Perfect for time-sensitive campaigns. The domain itself is a call to action!',
        author: 'Emily Rodriguez',
        handle: 'Marketing Consultant',
        rating: 5,
      },
    ],
  });
