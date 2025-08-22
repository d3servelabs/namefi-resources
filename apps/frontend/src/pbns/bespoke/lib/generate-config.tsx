import type { OriginConfig } from '@/lib/origin';
import type { BespokeLandingConfig } from '../types';

export interface BespokeConfigOutput {
  landingConfig: BespokeLandingConfig;
  originConfigWithoutLanding: Omit<OriginConfig, 'landingPage'>;
}

/**
 * Generates both landing and origin configurations for bespoke domains
 */
export function generateBespokeConfig(
  input: BespokeLandingConfig,
): BespokeConfigOutput {
  const originConfigWithoutLanding: Omit<OriginConfig, 'landingPage'> = {
    metadata: {
      title: `${input.domainName} - Powered by Namefi`,
      description:
        'Premium call-to-action domain designed for maximum conversion rates and marketing campaign success',
      icons: [{ rel: 'icon', url: '/favicon.ico' }],
      openGraph: {
        title: `${input.domainName} - Powered by Namefi`,
        description:
          'High-converting call-to-action domain perfect for campaigns, landing pages, and driving results',
        type: 'website',
        images: [
          {
            url: input.openGraphImage,
            width: 1200,
            height: 630,
            alt: `${input.domainName} - Powered by Namefi`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${input.domainName} - Powered by Namefi`,
        description:
          'High-converting call-to-action domain perfect for campaigns, landing pages, and driving results',
      },
    },
    logo: {
      type: 'image',
      image: '/assets/bespoke/logos/bespoke-logo.svg',
      alt: 'Bespoke Logo',
      title: 'Bespoke',
    },
    authLogo: {
      image: '/assets/bespoke/logos/bespoke-powered-by-namefi.svg',
    },
    // Background is handled by the landing component itself
  };

  return {
    landingConfig: input,
    originConfigWithoutLanding,
  };
}
