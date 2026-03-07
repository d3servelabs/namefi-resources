/**
 * Generic EVM Paywall Handler
 *
 * Brand-agnostic implementation of PaywallNetworkHandler.
 * Works for any x402 resource type, defaults to Namefi branding.
 */

import { generateGenericPaywallTemplate } from './paywall-template';
import {
  CHAIN_CONFIG,
  NAMEFI_BRANDING,
  NAMEFI_THEME,
} from '../shared/constants';
import type {
  GenericPaywallConfig,
  PaymentRequirement,
  PaymentRequiredResponse,
  PaywallHandlerConfig,
  PaywallNetworkHandler,
} from '../shared/types';
import { config as envConfig } from '#lib/env';

/**
 * Generic EVM Paywall Handler
 *
 * Generates brand-agnostic payment pages for any x402 resource on EVM chains.
 * Defaults to Namefi branding if no custom branding is provided.
 */
export const genericEvmPaywall: PaywallNetworkHandler = {
  /**
   * Check if this handler supports the given payment requirement
   */
  supports(requirement: PaymentRequirement): boolean {
    return requirement.network.startsWith('eip155:');
  },

  /**
   * Generate generic paywall HTML
   */
  generateHtml(
    requirement: PaymentRequirement,
    paymentRequired: PaymentRequiredResponse,
    config: PaywallHandlerConfig,
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

    // Get resource description from payment required response or config
    const resourceDescription =
      config.resourceDescription || paymentRequired.resource?.description;

    // Build template config
    const templateConfig: GenericPaywallConfig = {
      amount,
      amountInAtomicUnits,
      payTo: requirement.payTo || '',
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
      // Generic-specific options
      resourceDescription,
      successRedirectUrl: config.successRedirectUrl,
      successRedirectDelaySeconds: config.successRedirectDelaySeconds,
      // Theme and branding (use provided or defaults)
      theme: config.theme || NAMEFI_THEME,
      branding: config.branding || {
        appName: config.appName || NAMEFI_BRANDING.appName,
        appLogo: config.appLogo || NAMEFI_BRANDING.appLogo,
      },
    };

    return generateGenericPaywallTemplate(templateConfig);
  },
};
