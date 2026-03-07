/**
 * Namefi Domain Paywall Handler
 *
 * Implements PaywallNetworkHandler interface for domain registration.
 * Generates Namefi-themed payment pages for EVM chains.
 */

import { generateDomainPaywallTemplate } from './paywall-template';
import {
  CHAIN_CONFIG,
  NAMEFI_BRANDING,
  NAMEFI_THEME,
} from '../shared/constants';
import type {
  DomainPaywallConfig,
  PaymentRequirement,
  PaymentRequiredResponse,
  PaywallHandlerConfig,
  PaywallNetworkHandler,
} from '../shared/types';
import { config as envConfig } from '#lib/env';

/**
 * Namefi EVM Paywall Handler
 *
 * Generates Namefi-themed payment pages for domain registration on EVM chains.
 */
export const namefiEvmPaywall: PaywallNetworkHandler = {
  /**
   * Check if this handler supports the given payment requirement
   */
  supports(requirement: PaymentRequirement): boolean {
    return requirement.network.startsWith('eip155:');
  },

  /**
   * Generate Namefi-themed paywall HTML for domain registration
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

    // Extract domain from resource description or URL
    let domain = 'domain.eth';
    let durationInYears = 1;

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
    const templateConfig: DomainPaywallConfig = {
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
      // Theme and branding (use provided or defaults)
      theme: config.theme || NAMEFI_THEME,
      branding: config.branding || {
        appName: config.appName || NAMEFI_BRANDING.appName,
        appLogo: config.appLogo || NAMEFI_BRANDING.appLogo,
      },
    };

    return generateDomainPaywallTemplate(templateConfig);
  },
};
