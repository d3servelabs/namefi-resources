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
  logo: StaticImageData | string;
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

/**
 * Brand logo configuration with support for either static images or Lottie animations
 */
export type BrandLogoConfig = ImageLogo | LottieLogo;

/**
 * Origin-specific configuration
 */
export type OriginConfig = {
  metadata: Metadata;
  brandLogo: BrandLogoConfig;
};

/**
 * Configuration by origin type
 */
export type OriginConfigMap = {
  firstParty: OriginConfig;
  thirdParty: Record<string, OriginConfig>;
};
