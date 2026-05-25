/**
 * HTML builder for x402 paywall pages
 *
 * Combines shared components into complete HTML pages.
 */

import type { ThemeConfig, BrandingConfig } from './types';
import { NAMEFI_THEME, NAMEFI_BRANDING, X402_PROTOCOL_URL } from './constants';
import { getViemLoaderScript } from './viem-loader';
import { getTailwindScript, getBaseStyles } from './styles';
import {
  getDebugLoggingScript,
  getBalanceCheckingScript,
  getViemHelpersScript,
  getWalletStateScript,
  getConnectMetaMaskScript,
  getConnectWalletConnectScript,
  getSignPaymentScript,
  getDOMContentLoadedScript,
} from './scripts';

/**
 * Options for building the paywall HTML
 */
export interface HtmlBuilderOptions {
  /** Page title */
  title: string;

  /** Theme configuration */
  theme?: ThemeConfig;

  /** Branding configuration */
  branding?: BrandingConfig;

  /** WalletConnect project ID (optional) */
  walletConnectProjectId?: string;

  /** JSON config to inject into page */
  configJson: string;

  /** HTML for the header section */
  headerHtml: string;

  /** HTML for the price display section */
  priceDisplayHtml: string;

  /** HTML for the success state content */
  successContentHtml: string;

  /** JavaScript to run on successful payment */
  onSuccessScript: string;

  /** Amount in USDC for pay button */
  amount: number;

  /** Formatted amount string for display (handles sub-cent values) */
  formattedAmount?: string;

  /** Additional JavaScript to include (e.g., helper functions) */
  additionalScripts?: string;
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Build complete paywall HTML page
 */
export function buildPaywallHtml(options: HtmlBuilderOptions): string {
  const theme = options.theme || NAMEFI_THEME;
  const branding = options.branding || NAMEFI_BRANDING;
  const hasWalletConnect = !!options.walletConnectProjectId;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(options.title)}</title>
  ${getTailwindScript(theme)}
  ${getViemLoaderScript()}
  ${hasWalletConnect ? `<script type="module" src="https://unpkg.com/@walletconnect/modal@2.6.2/dist/index.umd.js"></script>` : ''}
  ${getBaseStyles()}
</head>
<body class="min-h-screen bg-background flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <!-- Main Card -->
    <div class="bg-card rounded-xl border border-border p-6 shadow-xl">
      <!-- Logo -->
      <div class="flex justify-center mb-6">
        <img src="${escapeHtml(branding.appLogo)}" alt="${escapeHtml(branding.appName)}" class="h-8" />
      </div>

      <!-- Header -->
      <div class="text-center mb-6">
        ${options.headerHtml}
      </div>

      <!-- Price Display -->
      <div class="bg-background rounded-lg p-4 mb-6 border border-border">
        ${options.priceDisplayHtml}
      </div>

      <!-- Status Container -->
      <div id="status-container">
        <!-- Connect State (Initial) -->
        <div id="state-connect" class="space-y-3">
          <!-- MetaMask / Injected Wallet Button -->
          <button
            id="btn-metamask"
            onclick="connectMetaMask()"
            class="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wallet-icon lucide-wallet"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>
            <span id="btn-metamask-text">Connect Wallet</span>
          </button>

          ${
            hasWalletConnect
              ? `
          <!-- WalletConnect Button -->
          <button
            id="btn-walletconnect"
            onclick="connectWalletConnect()"
            class="w-full bg-background hover:bg-border text-foreground font-semibold py-3 px-4 rounded-lg transition-colors border border-border flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.09 10.26c3.26-3.19 8.54-3.19 11.8 0l.39.38c.16.16.16.42 0 .58l-1.34 1.31c-.08.08-.21.08-.29 0l-.54-.53c-2.27-2.22-5.96-2.22-8.24 0l-.58.56c-.08.08-.21.08-.29 0L5.66 11.2c-.16-.16-.16-.42 0-.58l.43-.36zm14.58 2.71l1.19 1.17c.16.16.16.42 0 .58l-5.37 5.26c-.16.16-.42.16-.58 0l-3.81-3.73c-.04-.04-.11-.04-.15 0l-3.81 3.73c-.16.16-.42.16-.58 0L2.19 14.72c-.16-.16-.16-.42 0-.58l1.19-1.17c.16-.16.42-.16.58 0l3.81 3.73c.04.04.11.04.15 0l3.81-3.73c.16-.16.42-.16.58 0l3.81 3.73c.04.04.11.04.15 0l3.81-3.73c.16-.16.42-.16.58 0z"/>
            </svg>
            WalletConnect
          </button>
          `
              : ''
          }
        </div>

        <!-- Connected State -->
        <div id="state-connected" class="hidden space-y-4 fade-in">
          <div class="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-brand-primary"></div>
              <span class="text-sm text-muted">Connected</span>
            </div>
            <span id="connected-address" class="text-sm text-foreground font-mono"></span>
          </div>
          
          <!-- Balance Display -->
          <div id="balance-container" class="hidden bg-background rounded-lg p-3 border border-border">
            <!-- Balance content will be populated by JavaScript -->
          </div>
          <button
            id="btn-pay"
            onclick="signPayment()"
            class="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Pay ${options.formattedAmount || options.amount.toFixed(2)} USDC
          </button>
          <button
            onclick="disconnect()"
            class="w-full text-muted hover:text-foreground text-sm py-2 transition-colors"
          >
            Disconnect
          </button>
        </div>

        <!-- Processing State -->
        <div id="state-processing" class="hidden text-center space-y-4 fade-in">
          <div class="flex justify-center">
            <div class="spinner text-brand-primary w-8 h-8 border-[3px]"></div>
          </div>
          <div>
            <p id="processing-text" class="text-foreground font-medium">Processing payment...</p>
            <p class="text-muted text-sm mt-1">Please confirm in your wallet</p>
          </div>
        </div>

        <!-- Success State -->
        <div id="state-success" class="hidden text-center space-y-4 fade-in">
          <div class="flex justify-center">
            <div class="w-16 h-16 rounded-full bg-brand-primary/20 flex items-center justify-center">
              <svg class="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
          <div>
            ${options.successContentHtml}
          </div>
        </div>

        <!-- Error State -->
        <div id="state-error" class="hidden space-y-4 fade-in">
          <div class="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <p class="text-destructive font-medium">Payment Failed</p>
                <p id="error-message" class="text-destructive/80 text-sm mt-1"></p>
              </div>
            </div>
          </div>
          <button
            onclick="resetState()"
            class="w-full bg-background hover:bg-border text-foreground font-semibold py-3 px-4 rounded-lg transition-colors border border-border"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="text-center mt-4">
      <p class="text-muted text-xs">
        Powered by <a href="${X402_PROTOCOL_URL}" target="_blank" class="text-brand-primary hover:underline">x402 Protocol</a>
      </p>
    </div>
  </div>

  <script>
    // Configuration injected from server
    window.x402Config = ${options.configJson};

    ${getDebugLoggingScript()}
    ${getBalanceCheckingScript()}
    ${getViemHelpersScript()}
    ${getWalletStateScript()}
    ${getConnectMetaMaskScript()}
    ${getConnectWalletConnectScript(hasWalletConnect)}
    ${getSignPaymentScript({ onSuccessScript: options.onSuccessScript })}
    ${getDOMContentLoadedScript()}
    ${options.additionalScripts || ''}
  </script>
</body>
</html>`;
}
