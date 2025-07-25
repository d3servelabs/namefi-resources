import type {
  CVLandingConfig,
  FamousPerson,
  ExampleProfile,
  Testimonial,
} from '../components';
import type { OriginConfig } from '@/lib/origin/types';

/**
 * Input configuration for generating CV landing and origin configs
 */
export interface CVConfigInput {
  /** The name (e.g., "taylor") - will be auto-capitalized for display */
  name: string;
  /** Array of rotating example names to show before the main name */
  rotatingNames: string[];
  /** Background image URL */
  backgroundImage: string;
  /** OpenGraph image URL */
  openGraphImage: string;
  /** Array of famous people with that name */
  famousPeople: FamousPerson[];
  /** Array of example profiles */
  exampleProfiles: ExampleProfile[];
  /** Array of testimonials */
  testimonials: Testimonial[];
}

/**
 * Generated configuration output
 */
export interface CVConfigOutput {
  landingConfig: CVLandingConfig;
  originConfigWithoutLanding: Omit<OriginConfig, 'landingPage'>;
}

/**
 * Generates both landing and origin configurations from unique input data
 */
export function generateCVConfig(input: CVConfigInput): CVConfigOutput {
  const displayName = input.name.charAt(0).toUpperCase() + input.name.slice(1);
  const domainName = `${input.name}.cv`;
  const description = `A community namespace for ${displayName}s. Get your personalized subdomain under ${domainName} for your digital CV, portfolio, or link-in-bio.`;

  const landingConfig: CVLandingConfig = {
    name: input.name,
    rotatingNames: input.rotatingNames,
    backgroundImage: input.backgroundImage,
    famousPeople: input.famousPeople,
    exampleProfiles: input.exampleProfiles,
    testimonials: input.testimonials,
  };

  const originConfigWithoutLanding: Omit<OriginConfig, 'landingPage'> = {
    metadata: {
      title: `${domainName} - Powered by NameFi`,
      description,
      icons: [{ rel: 'icon', url: '/favicon.ico' }],
      openGraph: {
        title: `${domainName} - Powered by NameFi`,
        description,
        type: 'website',
        images: [
          {
            url: input.openGraphImage,
            width: 1200,
            height: 630,
            alt: `${domainName} - Your Digital Identity Awaits`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${domainName} - Your Digital Identity Awaits`,
        description,
      },
    },
    logo: {
      type: 'lottie',
      lottie: '/lottie/namefi_to_nfi.json',
      alt: 'NameFi Logo',
      width: 66,
      height: 19.8,
    },
    background: {
      image: input.backgroundImage,
      alt: `${domainName} Background`,
    },
  };

  return {
    landingConfig,
    originConfigWithoutLanding,
  };
}
