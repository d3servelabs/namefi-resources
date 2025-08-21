import { generateBespokeConfig } from '@/pbns/bespoke/lib/generate-config';

export const { landingConfig, originConfigWithoutLanding } =
  generateBespokeConfig({
    domainName: 'available.today',
    rotatingSubdomains: [
      'appointment',
      'consultation',
      'tickets',
      'inventory',
      'slots',
      'tables',
      'rooms',
      'services',
      'support',
      'delivery',
    ],
    openGraphImage: '/assets/bespoke/available-today/opengraph-image.png',
    testimonials: [
      {
        quote:
          'Our booking.available.today domain eliminated phone tag. Patients book instantly when they see openings.',
        author: 'Dr. Sarah Chen',
        handle: 'Family Practice Owner',
        rating: 5,
      },
      {
        quote:
          'Showing real-time availability on tables.available.today reduced no-shows by 60%.',
        author: 'Marco Rossi',
        handle: '@chefmarco',
        rating: 5,
      },
      {
        quote:
          "The domain itself sets expectations perfectly. Customers know they'll see live availability.",
        author: 'Jessica Park',
        handle: 'UX Consultant',
        rating: 5,
      },
      {
        quote:
          'Support.available.today increased customer satisfaction scores by showing agent availability upfront.',
        author: 'Tom Williams',
        handle: 'Support Manager',
        rating: 5,
      },
      {
        quote:
          'Our limited drops sell out faster with stock.available.today - creates instant urgency!',
        author: 'Chris Jordan',
        handle: 'Streetwear Founder',
        rating: 5,
      },
      {
        quote:
          'Perfect for service businesses. The domain communicates readiness and accessibility.',
        author: 'Linda Zhang',
        handle: 'Business Consultant',
        rating: 5,
      },
    ],
  });
