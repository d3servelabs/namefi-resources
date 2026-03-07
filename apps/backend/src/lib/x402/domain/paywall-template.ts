/**
 * Domain-specific paywall template for Namefi
 *
 * Tailored for domain registration purchases with domain name and duration.
 */

import type { DomainPaywallConfig } from '../shared/types';
import { NAMEFI_THEME, NAMEFI_BRANDING } from '../shared/constants';
import { buildPaywallHtml, escapeHtml } from '../shared/html-builder';

/**
 * Generate domain-specific paywall HTML
 */
export function generateDomainPaywallTemplate(
  config: DomainPaywallConfig,
): string {
  const theme = config.theme || NAMEFI_THEME;
  const branding = config.branding || NAMEFI_BRANDING;
  const appName = branding.appName;

  return buildPaywallHtml({
    title: `Payment Required - ${config.domain} | ${appName}`,
    theme,
    branding,
    walletConnectProjectId: config.walletConnectProjectId,
    configJson: JSON.stringify(config),
    amount: config.amount,

    headerHtml: `
      <h1 class="text-xl font-bold text-foreground mb-2">Payment Required</h1>
      <p class="text-muted text-sm">
        Register <span class="text-foreground font-medium">${escapeHtml(config.domain)}</span>
        for ${config.durationInYears} year${config.durationInYears > 1 ? 's' : ''}
      </p>
    `,

    priceDisplayHtml: `
      <div class="flex items-center justify-between">
        <span class="text-muted text-sm">Total Amount</span>
        <div class="text-right">
          <span class="text-2xl font-bold text-foreground">${config.amount.toFixed(2)}</span>
          <span class="text-muted ml-1">USDC</span>
        </div>
      </div>
      <div class="mt-2 flex items-center justify-end gap-2">
        <div class="w-2 h-2 rounded-full ${config.testnet ? 'bg-yellow-500' : 'bg-brand-primary'}"></div>
        <span class="text-xs text-muted">${escapeHtml(config.chainName)}${config.testnet ? ' (Testnet)' : ''}</span>
      </div>
    `,

    successContentHtml: `
      <p class="text-foreground font-semibold text-lg">Payment Successful!</p>
      <p class="text-muted text-sm mt-1">Your domain is being registered</p>
      <div class="text-muted text-sm mt-2">
        Redirecting in <span id="countdown">3</span>s...
      </div>
    `,

    onSuccessScript: `
      let countdown = 3;
      const countdownEl = document.getElementById('countdown');
      const timer = setInterval(() => {
        countdown--;
        countdownEl.textContent = countdown;
        if (countdown <= 0) {
          clearInterval(timer);
          // Redirect to purchase status page
          const purchaseId = result.purchaseId || config.purchaseId;
          if (purchaseId) {
            window.location.href = '/x402/purchase/' + purchaseId;
          } else {
            window.location.reload();
          }
        }
      }, 1000);
    `,
  });
}

// Re-export for backwards compatibility
export { escapeHtml };
