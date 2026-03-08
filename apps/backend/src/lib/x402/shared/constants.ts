/**
 * Shared constants for x402 paywall system
 */

import type { ThemeConfig, BrandingConfig, ChainConfig } from './types';
import { CHAINS as Chains } from '@namefi-astra/utils/chains';
/**
 * Namefi dark theme (default)
 */
export const NAMEFI_THEME: ThemeConfig = {
  background: '#1a1a1a',
  card: '#2a2a2a',
  foreground: '#fafafa',
  muted: '#a3a3a3',
  brandPrimary: '#22c55e',
  brandPrimaryHover: '#16a34a',
  destructive: '#ef4444',
  border: 'rgba(255,255,255,0.1)',
  borderRadius: '0.65rem',
};

/**
 * Namefi branding (default)
 */
export const NAMEFI_BRANDING: BrandingConfig = {
  appName: 'Namefi',
  appLogo: 'https://namefi.io/logotype.svg',
};

/**
 * Supported EVM chain configurations
 */
export const CHAIN_CONFIG: Record<string, ChainConfig> = {
  'eip155:8453': {
    chainId: 8453,
    name: 'Base',
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    rpcUrl: Chains.base.rpcUrls.default.http[0],
    blockExplorer: 'https://basescan.org',
  },
  'eip155:84532': {
    chainId: 84532,
    name: 'Base Sepolia',
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    rpcUrl: Chains.baseSepolia.rpcUrls.default.http[0],
    blockExplorer: 'https://sepolia.basescan.org',
  },
};

/**
 * Default success redirect delay in seconds
 */
export const DEFAULT_SUCCESS_REDIRECT_DELAY = 3;

/**
 * Default redirect button label when autoSuccessRedirect is false
 */
export const DEFAULT_REDIRECT_BTN_LABEL = 'Redirect Now';

/**
 * Default auto-redirect behavior (true for backwards compatibility)
 */
export const DEFAULT_AUTO_SUCCESS_REDIRECT = true;

/**
 * Header name for dynamic redirect options from backend response
 */
export const PAYWALL_REDIRECT_OPTIONS_HEADER = 'X-PAYWALL-REDIRECT-OPTIONS';

/**
 * x402 Protocol link
 */
export const X402_PROTOCOL_URL = 'https://x402.org';

/**
 * Coinbase branding and theme configuration for demo
 */
const COINBASE_THEME: ThemeConfig = {
  background: 'oklch(0.94 0 0)',
  card: 'oklch(0.91 0 0)',
  foreground: 'oklch(0.08 0 0)',
  muted: 'oklch(0.15 0 0)',
  brandPrimary: 'oklch(0.58 0.18 256.05)',
  brandPrimaryHover: 'oklch(0.51 0.18 256.05)',
  destructive: '#ef4444',
  border: 'rgba(255,255,255,0.1)',
  borderRadius: '0.85rem',
};
const COINBASE_BRANDING: BrandingConfig = {
  appName: 'Coinbase',
  appLogo:
    'https://static-assets.coinbase.com/ui-infra/illustration/v1/pictogram/svg/light/coinbaseLogoNavigation-4.svg',
};
