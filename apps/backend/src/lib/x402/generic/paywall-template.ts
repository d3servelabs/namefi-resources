/**
 * Generic resource paywall template
 *
 * Brand-agnostic paywall that works for any x402 resource type.
 * Defaults to Namefi branding if none provided.
 *
 * Features:
 * - Handles sub-cent amounts (e.g., 0.0025 USDC)
 * - Displays JSON response via blob URL after payment
 */

import type { GenericPaywallConfig } from '../shared/types';
import {
  NAMEFI_THEME,
  NAMEFI_BRANDING,
  DEFAULT_SUCCESS_REDIRECT_DELAY,
  DEFAULT_REDIRECT_BTN_LABEL,
  DEFAULT_AUTO_SUCCESS_REDIRECT,
} from '../shared/constants';
import { buildPaywallHtml, escapeHtml } from '../shared/html-builder';

/**
 * Format amount for display, handling sub-cent values
 * - Values >= 0.01: show 2 decimal places (e.g., "1.50")
 * - Values < 0.01: show up to 6 decimal places, trimming trailing zeros (e.g., "0.0025")
 */
function formatAmount(amount: number): string {
  if (amount >= 0.01) {
    return amount.toFixed(2);
  }
  // For sub-cent amounts, show up to 6 decimals but trim trailing zeros
  const formatted = amount.toFixed(6);
  return formatted.replace(/\.?0+$/, '');
}

/**
 * Generate generic resource paywall HTML
 */
export function generateGenericPaywallTemplate(
  config: GenericPaywallConfig,
): string {
  const theme = config.theme || NAMEFI_THEME;
  const branding = config.branding || NAMEFI_BRANDING;
  const redirectDelay =
    config.successRedirectDelaySeconds ?? DEFAULT_SUCCESS_REDIRECT_DELAY;

  const formattedAmount = formatAmount(config.amount);

  // Resolve redirect options with defaults for backwards compatibility
  const autoSuccessRedirect =
    config.autoSuccessRedirect ?? DEFAULT_AUTO_SUCCESS_REDIRECT;
  const redirectBtnLabel =
    config.successRedirectBtnLabel ?? DEFAULT_REDIRECT_BTN_LABEL;

  // Include redirect config in the JSON for the frontend script
  const configWithRedirect = {
    ...config,
    successRedirectDelaySeconds: redirectDelay,
    autoSuccessRedirect,
    successRedirectBtnLabel: redirectBtnLabel,
    formattedAmount, // Include for the pay button
  };

  return buildPaywallHtml({
    title: `Payment Required${branding.appName ? ` | ${branding.appName}` : ''}`,
    theme,
    branding,
    walletConnectProjectId: config.walletConnectProjectId,
    configJson: JSON.stringify(configWithRedirect),
    amount: config.amount,
    formattedAmount,

    headerHtml: `
      <h1 class="text-xl font-bold text-foreground mb-2">Payment Required</h1>
      <p class="text-muted text-sm">
        ${escapeHtml(config.resourceDescription || 'Access this resource')}
      </p>
    `,

    priceDisplayHtml: `
      <div class="flex items-center justify-between">
        <span class="text-muted text-sm">Total Amount</span>
        <div class="text-right">
          <span class="text-2xl font-bold text-foreground">${formattedAmount}</span>
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
      <div id="success-message" class="text-muted text-sm mt-2">
        Processing response...
      </div>
      <!-- JSON Response Viewer -->
      <div id="json-viewer-container" class="hidden mt-4">
        <div class="bg-background rounded-lg border border-border overflow-hidden">
          <div class="flex items-center justify-between px-3 py-2 border-b border-border">
            <span class="text-xs text-muted font-medium">Response</span>
            <div class="flex gap-2">
              <button id="btn-copy-json" onclick="copyJsonToClipboard()" class="text-xs text-brand-primary hover:underline">Copy</button>
              <button id="btn-download-json" onclick="downloadJson()" class="text-xs text-brand-primary hover:underline">Download</button>
            </div>
          </div>
          <iframe id="json-iframe" class="w-full bg-background" style="height: 300px; border: none;"></iframe>
        </div>
      </div>
      <!-- Access Token Display -->
      <div id="access-token-container" class="hidden mt-4">
        <div class="bg-background rounded-lg border border-border p-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-muted font-medium">Access Token</span>
            <button onclick="copyAccessToken()" class="text-xs text-brand-primary hover:underline">Copy</button>
          </div>
          <div class="text-xs text-foreground font-mono break-all" id="access-token-value"></div>
          <p class="text-xs text-muted mt-2">Use this token to access the resource without paying again.</p>
        </div>
      </div>
      <!-- Redirect Button (shown when autoSuccessRedirect is false) -->
      <div id="redirect-btn-container" class="hidden mt-4">
        <button
          id="btn-redirect"
          onclick="handleRedirectClick()"
          class="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          ${escapeHtml(redirectBtnLabel)}
        </button>
      </div>
    `,

    onSuccessScript: `
      // Store result globally for copy/download
      window.paymentResult = result;
      
      // Check if response contains an access token
      if (result.accessToken) {
        document.getElementById('access-token-container').classList.remove('hidden');
        document.getElementById('access-token-value').textContent = result.accessToken;
      }
      
      // Display JSON response via blob URL
      try {
        const jsonString = JSON.stringify(result, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const blobUrl = URL.createObjectURL(blob);
        
        // Create HTML content for the iframe with syntax highlighting
        const iframeContent = \`
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body {
                margin: 0;
                padding: 12px;
                font-family: ui-monospace, monospace;
                font-size: 11px;
                line-height: 1.5;
                background: ${theme.background};
                color: ${theme.foreground};
                white-space: pre-wrap;
                word-wrap: break-word;
              }
              .string { color: #a5d6a7; }
              .number { color: #ffcc80; }
              .boolean { color: #80deea; }
              .null { color: #ef9a9a; }
              .key { color: #90caf9; }
            </style>
          </head>
          <body>\${syntaxHighlight(jsonString)}</body>
          </html>
        \`;
        
        const iframe = document.getElementById('json-iframe');
        iframe.srcdoc = iframeContent;
        document.getElementById('json-viewer-container').classList.remove('hidden');
        document.getElementById('success-message').textContent = 'Resource accessed successfully!';
      } catch (e) {
        console.error('Error displaying JSON:', e);
        document.getElementById('success-message').textContent = 'Payment successful! Response received.';
      }
      
      // Build redirect options from static config (defaults for backwards compatibility)
      let redirectOpts = {
        successRedirectUrl: config.successRedirectUrl,
        successRedirectDelaySeconds: config.successRedirectDelaySeconds || ${redirectDelay},
        autoSuccessRedirect: config.autoSuccessRedirect !== false, // default true
        successRedirectBtnLabel: config.successRedirectBtnLabel || '${redirectBtnLabel}',
      };

      // Check for dynamic redirect options from response header (overrides static config)
      if (redirectOptionsHeader) {
        try {
          const headerOpts = JSON.parse(atob(redirectOptionsHeader));
          log('Parsed redirect options from header:', headerOpts);
          redirectOpts = { ...redirectOpts, ...headerOpts };
        } catch (e) {
          console.error('[x402-paywall] Failed to parse X-PAYWALL-REDIRECT-OPTIONS header:', e);
          // Fall back to static config (already set in redirectOpts)
        }
      }

      // Handle redirect based on final options
      if (redirectOpts.successRedirectUrl) {
        if (redirectOpts.autoSuccessRedirect) {
          // Auto-redirect with countdown
          let countdown = redirectOpts.successRedirectDelaySeconds;
          document.getElementById('success-message').innerHTML += 
            '<br>Redirecting in <span id="countdown">' + countdown + '</span>s...';
          const countdownEl = document.getElementById('countdown');
          const timer = setInterval(() => {
            countdown--;
            if (countdownEl) countdownEl.textContent = countdown;
            if (countdown <= 0) {
              clearInterval(timer);
              window.location.href = redirectOpts.successRedirectUrl;
            }
          }, 1000);
        } else {
          // Show redirect button (no countdown)
          const btnContainer = document.getElementById('redirect-btn-container');
          const btn = document.getElementById('btn-redirect');
          btn.textContent = redirectOpts.successRedirectBtnLabel;
          window.paywallRedirectUrl = redirectOpts.successRedirectUrl;
          btnContainer.classList.remove('hidden');
        }
      }
    `,

    // Additional scripts for JSON handling
    additionalScripts: `
      // Syntax highlighting for JSON
      function syntaxHighlight(json) {
        return json.replace(/("(\\\\u[a-zA-Z0-9]{4}|\\\\[^u]|[^\\\\"])*"(\\s*:)?|\\b(true|false|null)\\b|-?\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?)/g, function (match) {
          let cls = 'number';
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              cls = 'key';
              match = match.slice(0, -1) + '</span>:';
              return '<span class="' + cls + '">' + match;
            } else {
              cls = 'string';
            }
          } else if (/true|false/.test(match)) {
            cls = 'boolean';
          } else if (/null/.test(match)) {
            cls = 'null';
          }
          return '<span class="' + cls + '">' + match + '</span>';
        });
      }
      
      // Copy JSON to clipboard
      function copyJsonToClipboard() {
        if (window.paymentResult) {
          const jsonString = JSON.stringify(window.paymentResult, null, 2);
          navigator.clipboard.writeText(jsonString).then(() => {
            const btn = document.getElementById('btn-copy-json');
            const original = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = original; }, 2000);
          }).catch(err => {
            console.error('Failed to copy:', err);
          });
        }
      }
      
      // Download JSON as file
      function downloadJson() {
        if (window.paymentResult) {
          const jsonString = JSON.stringify(window.paymentResult, null, 2);
          const blob = new Blob([jsonString], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'response.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }
      
      // Copy access token to clipboard
      function copyAccessToken() {
        const token = document.getElementById('access-token-value')?.textContent;
        if (token) {
          navigator.clipboard.writeText(token).then(() => {
            // Show feedback
          }).catch(err => {
            console.error('Failed to copy token:', err);
          });
        }
      }

      // Handle redirect button click (when autoSuccessRedirect is false)
      function handleRedirectClick() {
        if (window.paywallRedirectUrl) {
          window.location.href = window.paywallRedirectUrl;
        } else {
          console.error('[x402-paywall] Redirect URL not set');
        }
      }
    `,
  });
}

// Re-export for convenience
export { escapeHtml };
