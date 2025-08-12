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
      title: `${input.domainName} - Powered by NameFi`,
      description: 'Bespoke domain for your business',
      icons: [{ rel: 'icon', url: '/favicon.ico' }],
      openGraph: {
        title: `${input.domainName} - Your Digital Identity`,
        description: 'Bespoke domain for your business',
        type: 'website',
        images: [
          {
            url: input.openGraphImage,
            width: 1200,
            height: 630,
            alt: `${input.domainName} - Powered by NameFi`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${input.domainName} - Your Digital Identity`,
        description: 'Bespoke domain for your business',
      },
    },
    logo: {
      type: 'lottie',
      lottie: '/lottie/namefi_to_nfi.json',
      alt: 'NameFi Logo',
      width: 66,
      height: 19.8,
    },
    // Background is handled by the landing component itself
  };

  return {
    landingConfig: input,
    originConfigWithoutLanding,
  };
}
