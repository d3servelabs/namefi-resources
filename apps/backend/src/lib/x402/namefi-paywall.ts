/**
 * Namefi EVM Paywall Handler
 *
 * Implements PaywallNetworkHandler interface for x402 protocol.
 * Generates Namefi-themed payment pages for EVM chains.
 */

import {
  generatePaywallTemplate,
  type PaywallTemplateConfig,
} from './paywall-template';
import { config as envConfig } from '#lib/env';

/**
 * Chain configuration for supported networks
 */
const CHAIN_CONFIG: Record<
  string,
  {
    chainId: number;
    name: string;
    usdcAddress: string;
    rpcUrl: string;
    blockExplorer: string;
  }
> = {
  'eip155:8453': {
    chainId: 8453,
    name: 'Base',
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
  },
  'eip155:84532': {
    chainId: 84532,
    name: 'Base Sepolia',
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
  },
};

/**
 * Payment requirement from x402 protocol
 */
interface PaymentRequirement {
  scheme: string;
  network: string;
  amount?: string;
  maxAmountRequired?: string;
  price?: string;
  payTo?: string;
}

/**
 * Full payment required response from x402
 */
interface PaymentRequiredResponse {
  resource?: {
    url?: string;
    description?: string;
  };
  accepts?: PaymentRequirement[];
}

/**
 * Paywall configuration
 */
interface PaywallConfig {
  appName?: string;
  appLogo?: string;
  testnet?: boolean;
  currentUrl?: string;
  walletConnectProjectId?: string;
  /** Domain being purchased */
  domain?: string;
  /** Duration in years */
  durationInYears?: number;
}

/**
 * PaywallNetworkHandler interface from @x402/paywall
 */
interface PaywallNetworkHandler {
  supports(requirement: PaymentRequirement): boolean;
  generateHtml(
    requirement: PaymentRequirement,
    paymentRequired: PaymentRequiredResponse,
    config: PaywallConfig,
  ): string;
}

/**
 * Namefi EVM Paywall Handler
 *
 * Generates Namefi-themed payment pages for EVM chains (Base, Base Sepolia).
 */
export const namefiEvmPaywall: PaywallNetworkHandler = {
  /**
   * Check if this handler supports the given payment requirement
   */
  supports(requirement: PaymentRequirement): boolean {
    return requirement.network.startsWith('eip155:');
  },

  /**
   * Generate Namefi-themed paywall HTML
   */
  generateHtml(
    requirement: PaymentRequirement,
    paymentRequired: PaymentRequiredResponse,
    config: PaywallConfig,
  ): string {
    const network = requirement.network;
    const chainConfig = CHAIN_CONFIG[network];

    if (!chainConfig) {
      return `<!DOCTYPE html><html><body><h1>Unsupported network: ${network}</h1></body></html>`;
    }

    // Parse amount from requirement (USDC has 6 decimals)
    const amountInAtomicUnits =
      requirement.amount ||
      requirement.maxAmountRequired ||
      requirement.price ||
      '0';
    const amount = Number.parseFloat(amountInAtomicUnits) / 1e6;

    // Extract domain from resource description or URL
    let domain = config.domain || 'domain.eth';
    let durationInYears = config.durationInYears || 1;

    // Try to parse from resource description like "Register example.com for 2 year(s)"
    if (paymentRequired.resource?.description) {
      const descMatch = paymentRequired.resource.description.match(
        /Register\s+(\S+)\s+for\s+(\d+)\s+year/i,
      );
      if (descMatch) {
        domain = descMatch[1];
        durationInYears = Number.parseInt(descMatch[2], 10);
      }
    }

    // Build template config
    const templateConfig: PaywallTemplateConfig = {
      amount,
      amountInAtomicUnits,
      payTo: requirement.payTo || '',
      domain,
      durationInYears,
      network,
      chainId: chainConfig.chainId,
      chainIdHex: '0x' + chainConfig.chainId.toString(16),
      chainName: chainConfig.name,
      usdcAddress: chainConfig.usdcAddress,
      rpcUrl: chainConfig.rpcUrl,
      blockExplorer: chainConfig.blockExplorer,
      currentUrl: paymentRequired.resource?.url || config.currentUrl || '',
      testnet: config.testnet ?? network.includes('84532'),
      // Read WalletConnect project ID from environment config
      walletConnectProjectId: envConfig.X402_WALLETCONNECT_PROJECT_ID,
      paymentRequired,
    };

    return generatePaywallTemplate(templateConfig);
  },
};
