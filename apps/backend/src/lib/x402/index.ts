/**
 * x402 Paywall Module
 *
 * Provides customizable paywall implementations for x402 protocol payments.
 *
 * Two variants are available:
 * - namefiEvmPaywall: Domain-specific paywall tailored for Namefi domain registration
 * - genericEvmPaywall: Brand-agnostic paywall for any x402 resource type
 *
 * Both default to Namefi branding but support full theme customization.
 *
 * Also includes JWT access token utilities for re-accessing paid resources.
 */

// Domain paywall (Namefi-specific)
export { namefiEvmPaywall } from './domain/namefi-paywall';
export { generateDomainPaywallTemplate } from './domain/paywall-template';

// Generic paywall (brand-agnostic, defaults to Namefi)
export { genericEvmPaywall } from './generic/generic-paywall';
export { generateGenericPaywallTemplate } from './generic/paywall-template';

// Shared types
export type {
  ThemeConfig,
  BrandingConfig,
  BasePaywallConfig,
  DomainPaywallConfig,
  GenericPaywallConfig,
  RedirectOptions,
  PaymentRequirement,
  PaymentRequiredResponse,
  PaywallHandlerConfig,
  PaywallNetworkHandler,
  ChainConfig,
} from './shared/types';

// Shared constants
export {
  NAMEFI_THEME,
  NAMEFI_BRANDING,
  CHAIN_CONFIG,
  DEFAULT_SUCCESS_REDIRECT_DELAY,
  DEFAULT_REDIRECT_BTN_LABEL,
  DEFAULT_AUTO_SUCCESS_REDIRECT,
  PAYWALL_REDIRECT_OPTIONS_HEADER,
  X402_PROTOCOL_URL,
} from './shared/constants';

// HTML builder utilities
export { buildPaywallHtml, escapeHtml } from './shared/html-builder';

// Backwards compatibility: re-export DomainPaywallConfig as PaywallTemplateConfig
export type { DomainPaywallConfig as PaywallTemplateConfig } from './shared/types';

// JWT access token utilities
export {
  generateAccessToken,
  verifyAccessToken,
  tokenMatchesResource,
  type X402AccessTokenPayload,
  type VerifiedAccessToken,
  type InvalidAccessToken,
  type AccessTokenVerificationResult,
} from './jwt-access';
