/**
 * Shared TypeScript interfaces for x402 paywall system
 */

/**
 * Theme configuration for paywall UI
 */
export interface ThemeConfig {
  background: string;
  card: string;
  foreground: string;
  muted: string;
  brandPrimary: string;
  brandPrimaryHover: string;
  destructive: string;
  border: string;
  borderRadius?: string;
}

/**
 * Branding configuration for paywall UI
 */
export interface BrandingConfig {
  appName: string;
  appLogo: string;
}

/**
 * Chain configuration for EVM networks
 */
export interface ChainConfig {
  chainId: number;
  name: string;
  usdcAddress: string;
  rpcUrl: string;
  blockExplorer: string;
}

/**
 * Base configuration shared by all paywall variants
 */
export interface BasePaywallConfig {
  // Payment details
  amount: number;
  amountInAtomicUnits: string;
  payTo: string;

  // Network details
  network: string;
  chainId: number;
  chainIdHex: string;
  chainName: string;
  usdcAddress: string;
  rpcUrl: string;
  blockExplorer: string;

  // Request context
  currentUrl: string;
  testnet: boolean;
  paymentRequired: unknown;

  // Optional features
  walletConnectProjectId?: string;

  // Customization (defaults to Namefi)
  theme?: ThemeConfig;
  branding?: BrandingConfig;
}

/**
 * Domain-specific paywall configuration (Namefi)
 */
export interface DomainPaywallConfig extends BasePaywallConfig {
  domain: string;
  durationInYears: number;
  purchaseId?: string;
}

/**
 * Redirect options for generic paywall success state.
 * Can be set statically in config or dynamically via X-PAYWALL-REDIRECT-OPTIONS header.
 */
export interface RedirectOptions {
  /** URL to redirect to after successful payment */
  successRedirectUrl?: string;
  /** Delay in seconds before auto-redirect (only used if autoSuccessRedirect is true) */
  successRedirectDelaySeconds?: number;
  /** If true, auto-redirect after delay. If false, show redirect button instead. Default: true */
  autoSuccessRedirect?: boolean;
  /** Button label when autoSuccessRedirect is false. Default: "Redirect Now" */
  successRedirectBtnLabel?: string;
}

/**
 * Generic resource paywall configuration
 */
export interface GenericPaywallConfig extends BasePaywallConfig {
  resourceDescription?: string;
  // Redirect options (can be overridden by X-PAYWALL-REDIRECT-OPTIONS header)
  successRedirectUrl?: string;
  successRedirectDelaySeconds?: number;
  autoSuccessRedirect?: boolean;
  successRedirectBtnLabel?: string;
}

/**
 * Payment requirement from x402 protocol
 */
export interface PaymentRequirement {
  scheme: string;
  network: string;
  amount?: string;
  maxAmountRequired?: string;
  price?: string;
  payTo?: string;
  maxTimeoutSeconds?: number;
  asset?: string;
  extra?: {
    name?: string;
    version?: string;
  };
}

/**
 * Full payment required response from x402
 */
export interface PaymentRequiredResponse {
  x402Version?: number;
  resource?: {
    url?: string;
    description?: string;
    mimeType?: string;
  };
  accepts?: PaymentRequirement[];
  extensions?: unknown;
}

/**
 * Paywall handler configuration passed from x402 middleware
 */
export interface PaywallHandlerConfig {
  appName?: string;
  appLogo?: string;
  testnet?: boolean;
  currentUrl?: string;
  // Extended for customization
  theme?: ThemeConfig;
  branding?: BrandingConfig;
  // Generic paywall redirect options (can be overridden by X-PAYWALL-REDIRECT-OPTIONS header)
  resourceDescription?: string;
  successRedirectUrl?: string;
  successRedirectDelaySeconds?: number;
  autoSuccessRedirect?: boolean;
  successRedirectBtnLabel?: string;
}

/**
 * PaywallNetworkHandler interface from @x402/paywall
 */
export interface PaywallNetworkHandler {
  supports(requirement: PaymentRequirement): boolean;
  generateHtml(
    requirement: PaymentRequirement,
    paymentRequired: PaymentRequiredResponse,
    config: PaywallHandlerConfig,
  ): string;
}
