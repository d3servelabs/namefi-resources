import type { LandingComponent } from '@/components/search/types';
import type { Metadata } from 'next';
import type { StaticImageData } from 'next/image';

type BaseBrandLogo = {
  /**
   * Alt text for accessibility
   */
  alt: string;
  /**
   * Optional title for the brand
   */
  title?: string;
};

type ImageLogo = BaseBrandLogo & {
  type: 'image';
  /**
   * Static image for the brand logo
   */
  image: StaticImageData | string;
};

type LottieLogo = BaseBrandLogo & {
  type: 'lottie';
  /**
   * Lottie animation data for the brand logo
   */
  lottie: string;
  /**
   * Width of the Lottie animation in pixels
   */
  width: number;
  /**
   * Height of the Lottie animation in pixels
   */
  height: number;
};

type Background = {
  /**
   * Background image for the origin
   */
  image: StaticImageData | string;
  /**
   * Alt text for accessibility
   */
  alt: string;
};

/**
 * Brand logo configuration with support for either static images or Lottie animations
 */
export type Logo = ImageLogo | LottieLogo;

/**
 * Privy auth logo configuration
 */
export type PbnLogo = {
  image: string;
  monoImage?: string;
};

export type LandingPage = {
  component?: LandingComponent;
  headerIsBlurred?: boolean;
};

/**
 * Origin-specific configuration
 */
export type OriginConfig = {
  metadata: Metadata;
  logo: Logo;
  pbnLogo?: PbnLogo;
  background?: Background;
  landingPage?: LandingPage;
  /*
   * Optional theme for the origin, if not specified, it will fallback to the a theme named by origin (if found) or default theme
   */
  theme?:
    | 'pbn'
    | 'fallback-thirdparty'
    | 'astra'
    | '.cv'
    | '0x.city'
    | '.today';
};

/**
 * Configuration by origin type
 */
export type OriginConfigMap = {
  firstParty: OriginConfig;
  thirdParty: Record<string, OriginConfig>;
  fallbackThirdParty: ({ hostname }: { hostname: string }) => OriginConfig;
};

/**
 * Information about the origin
 */
export interface OriginInfo {
  isFirstPartyOrigin: boolean;
  thirdPartyHostname: string | null;
  config: OriginConfig;
}

export type OriginRuntime = OriginInfo & {
  origin: string | null;
};
