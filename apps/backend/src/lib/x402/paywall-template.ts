/**
 * Namefi Custom EVM Paywall Template
 *
 * A dark-themed paywall matching Namefi Astra design for x402 protocol payments.
 * Supports MetaMask/injected wallets and WalletConnect.
 */

export interface PaywallTemplateConfig {
  /** Amount in USDC (human readable, e.g. 5.00) */
  amount: number;
  /** Amount in atomic units (e.g. 5000000 for 5 USDC) */
  amountInAtomicUnits: string;
  /** Wallet address to pay to */
  payTo: string;
  /** Domain being purchased */
  domain: string;
  /** Duration in years */
  durationInYears: number;
  /** Network in CAIP-2 format (e.g. eip155:8453) */
  network: string;
  /** Chain ID (e.g. 8453) */
  chainId: number;
  /** Chain ID in hex (e.g. 0x2105) */
  chainIdHex: string;
  /** Chain name (e.g. Base) */
  chainName: string;
  /** USDC contract address */
  usdcAddress: string;
  /** RPC URL for the chain */
  rpcUrl: string;
  /** Block explorer URL */
  blockExplorer: string;
  /** Current URL (for redirect after payment) */
  currentUrl: string;
  /** Is testnet */
  testnet: boolean;
  /** WalletConnect project ID (optional) */
  walletConnectProjectId?: string;
  /** Full payment required response */
  paymentRequired: unknown;
  /** Purchase ID for redirect */
  purchaseId?: string;
}

/**
 * Generates the Namefi-themed paywall HTML
 */
export function generatePaywallTemplate(config: PaywallTemplateConfig): string {
  const configJson = JSON.stringify(config);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Required - ${escapeHtml(config.domain)} | Namefi</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            background: '#1a1a1a',
            card: '#2a2a2a',
            foreground: '#fafafa',
            muted: '#a3a3a3',
            'brand-primary': '#22c55e',
            'brand-primary-hover': '#16a34a',
            destructive: '#ef4444',
            border: 'rgba(255,255,255,0.1)',
          },
          borderRadius: {
            DEFAULT: '0.65rem',
          }
        }
      }
    }
  </script>
  <script type="module">
    // Load viem ESM and expose utilities to window
    import { 
      getAddress, 
      toHex,
      createWalletClient,
      custom
    } from 'https://esm.sh/viem@2.43.3';
    import { base, baseSepolia } from 'https://esm.sh/viem@2.43.3/chains';
    
    window.viemGetAddress = getAddress;
    window.viemToHex = toHex;
    window.viemCreateWalletClient = createWalletClient;
    window.viemCustom = custom;
    window.viemChains = { base, baseSepolia };
    window.dispatchEvent(new Event('viem-loaded'));
  </script>
  ${config.walletConnectProjectId ? `<script type="module" src="https://unpkg.com/@walletconnect/modal@2.6.2/dist/index.umd.js"></script>` : ''}
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
    .spinner {
      border: 2px solid transparent;
      border-top-color: currentColor;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .fade-in {
      animation: fadeIn 0.3s ease-in-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body class="min-h-screen bg-background flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <!-- Main Card -->
    <div class="bg-card rounded-xl border border-border p-6 shadow-xl">
      <!-- Logo -->
      <div class="flex justify-center mb-6">
        <img src="https://namefi.io/logotype.svg" alt="Namefi" class="h-8" />
      </div>

      <!-- Header -->
      <div class="text-center mb-6">
        <h1 class="text-xl font-bold text-foreground mb-2">Payment Required</h1>
        <p class="text-muted text-sm">
          Register <span class="text-foreground font-medium">${escapeHtml(config.domain)}</span>
          for ${config.durationInYears} year${config.durationInYears > 1 ? 's' : ''}
        </p>
      </div>

      <!-- Price Display -->
      <div class="bg-background rounded-lg p-4 mb-6 border border-border">
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
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.8 8.2l-9-5.2c-.5-.3-1.1-.3-1.6 0l-9 5.2c-.5.3-.8.8-.8 1.4v10.8c0 .6.3 1.1.8 1.4l9 5.2c.5.3 1.1.3 1.6 0l9-5.2c.5-.3.8-.8.8-1.4V9.6c0-.6-.3-1.1-.8-1.4z"/>
            </svg>
            <span id="btn-metamask-text">Connect Wallet</span>
          </button>

          ${
            config.walletConnectProjectId
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
          <button
            id="btn-pay"
            onclick="signPayment()"
            class="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Pay ${config.amount.toFixed(2)} USDC
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
            <p class="text-foreground font-semibold text-lg">Payment Successful!</p>
            <p class="text-muted text-sm mt-1">Your domain is being registered</p>
          </div>
          <div class="text-muted text-sm">
            Redirecting in <span id="countdown" class="text-foreground font-medium">3</span>s...
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
        Powered by <a href="https://x402.org" target="_blank" class="text-brand-primary hover:underline">x402 Protocol</a>
      </p>
    </div>
  </div>

  <script>
    // Configuration injected from server
    window.x402Config = ${configJson};

    // Debug mode - set to true to enable console logging
    const DEBUG = true;
    
    function log(...args) {
      if (DEBUG) console.log('[x402-paywall]', ...args);
    }
    
    function logObj(label, obj) {
      if (DEBUG) {
        console.log('[x402-paywall]', label + ':');
        console.log(JSON.stringify(obj, null, 2));
      }
    }
    
    // Use viem's getAddress for EIP-55 checksumming
    // Loaded via ESM module and exposed to window.viemGetAddress
    function toChecksumAddress(address) {
      if (!address) return address;
      
      const getAddress = window.viemGetAddress;
      if (!getAddress) {
        console.error('[x402-paywall] ERROR: viem.getAddress not loaded yet! Address checksumming will fail.');
        return address;
      }
      try {
        const checksummed = getAddress(address);
        log('Checksummed address:', { original: address, checksummed });
        return checksummed;
      } catch (err) {
        console.error('[x402-paywall] Error checksumming address:', err);
        return address;
      }
    }
    
    // Wait for viem to load before enabling payment button
    let viemLoaded = !!window.viemGetAddress && !!window.viemToHex && !!window.viemCreateWalletClient;
    window.addEventListener('viem-loaded', () => {
      viemLoaded = true;
      log('viem loaded successfully:', { 
        getAddress: !!window.viemGetAddress, 
        toHex: !!window.viemToHex,
        createWalletClient: !!window.viemCreateWalletClient,
        custom: !!window.viemCustom,
        chains: !!window.viemChains
      });
    });

    // State management
    let connectedAddress = null;
    let provider = null;
    let walletConnectProvider = null;

    // UI state helpers
    function showState(stateId) {
      ['connect', 'connected', 'processing', 'success', 'error'].forEach(s => {
        document.getElementById('state-' + s).classList.add('hidden');
      });
      document.getElementById('state-' + stateId).classList.remove('hidden');
    }

    function showError(message) {
      document.getElementById('error-message').textContent = message;
      showState('error');
    }

    function resetState() {
      connectedAddress = null;
      showState('connect');
    }

    function disconnect() {
      if (walletConnectProvider) {
        try { walletConnectProvider.disconnect(); } catch (e) {}
        walletConnectProvider = null;
      }
      resetState();
    }

    function shortenAddress(addr) {
      return addr.slice(0, 6) + '...' + addr.slice(-4);
    }

    // Check if we're on mobile
    function isMobile() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // Check if injected wallet exists
    function hasInjectedWallet() {
      return typeof window.ethereum !== 'undefined';
    }

    // Connect via MetaMask / injected wallet
    async function connectMetaMask() {
      if (!hasInjectedWallet()) {
        // On mobile, redirect to MetaMask deep link
        if (isMobile()) {
          const currentUrl = encodeURIComponent(window.location.href);
          window.location.href = 'https://metamask.app.link/dapp/' + window.location.host + window.location.pathname + window.location.search;
          return;
        }
        showError('No wallet detected. Please install MetaMask or another Web3 wallet.');
        return;
      }

      try {
        document.getElementById('btn-metamask-text').textContent = 'Connecting...';
        provider = window.ethereum;

        // Request accounts
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts returned');
        }

        connectedAddress = accounts[0];

        // Check and switch chain if needed
        const chainIdHex = await provider.request({ method: 'eth_chainId' });
        const targetChainHex = window.x402Config.chainIdHex;

        if (chainIdHex.toLowerCase() !== targetChainHex.toLowerCase()) {
          try {
            await provider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: targetChainHex }],
            });
          } catch (switchError) {
            // Chain not added, try to add it
            if (switchError.code === 4902) {
              await provider.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: targetChainHex,
                  chainName: window.x402Config.chainName,
                  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                  rpcUrls: [window.x402Config.rpcUrl],
                  blockExplorerUrls: [window.x402Config.blockExplorer],
                }],
              });
            } else {
              throw switchError;
            }
          }
        }

        // Update UI
        document.getElementById('connected-address').textContent = shortenAddress(connectedAddress);
        showState('connected');

      } catch (error) {
        console.error('Connection error:', error);
        document.getElementById('btn-metamask-text').textContent = 'Connect Wallet';
        if (error.code === 4001) {
          showError('Connection rejected by user');
        } else {
          showError(error.message || 'Failed to connect wallet');
        }
      }
    }

    // Connect via WalletConnect
    async function connectWalletConnect() {
      ${
        config.walletConnectProjectId
          ? `
      try {
        // WalletConnect Modal is loaded via UMD
        if (!window.WalletConnectModal) {
          showError('WalletConnect not loaded. Please try MetaMask instead.');
          return;
        }

        const modal = new window.WalletConnectModal.WalletConnectModal({
          projectId: window.x402Config.walletConnectProjectId,
          chains: [window.x402Config.chainId],
        });

        // This is simplified - in production you'd use EthereumProvider
        showError('WalletConnect integration coming soon. Please use MetaMask.');
      } catch (error) {
        console.error('WalletConnect error:', error);
        showError(error.message || 'Failed to connect via WalletConnect');
      }
      `
          : `showError('WalletConnect not configured');`
      }
    }

    // Sign payment using EIP-3009 TransferWithAuthorization
    async function signPayment() {
      log('signPayment called');

      if (!connectedAddress || !provider) {
        showError('Wallet not connected');
        return;
      }
      
      // Check viem is loaded for address checksumming, nonce generation, and signing
      if (!window.viemGetAddress || !window.viemToHex || !window.viemCreateWalletClient) {
        showError('Payment library still loading. Please wait a moment and try again.');
        log('viem not loaded yet:', { 
          viemGetAddress: !!window.viemGetAddress, 
          viemToHex: !!window.viemToHex,
          viemCreateWalletClient: !!window.viemCreateWalletClient
        });
        return;
      }

      try {
        showState('processing');
        document.getElementById('processing-text').textContent = 'Preparing payment...';

        const config = window.x402Config;
        log('Config loaded');
        logObj('Full config', config);

        // Get payment requirements from server response
        const paymentReq = config.paymentRequired;
        logObj('Payment requirements', paymentReq);

        const accepts = paymentReq?.accepts || [];
        log('Accepts array length:', accepts.length);
        logObj('Accepts array', accepts);

        if (accepts.length === 0) {
          throw new Error('No payment options available from server');
        }

        const firstAccept = accepts[0];
        logObj('First accept (selected requirement)', firstAccept);

        // Validate required fields from the payment requirement
        if (!firstAccept.payTo) {
          throw new Error('Payment requirement missing payTo address');
        }
        if (!firstAccept.amount) {
          throw new Error('Payment requirement missing amount');
        }
        if (!firstAccept.asset) {
          throw new Error('Payment requirement missing asset (USDC contract address)');
        }
        if (!firstAccept.extra?.name || !firstAccept.extra?.version) {
          throw new Error('Payment requirement missing extra.name or extra.version for EIP-712 domain');
        }

        // Extract values from the server's payment requirement
        // Apply EIP-55 checksumming to all addresses for consistent signature verification
        const from = toChecksumAddress(connectedAddress);
        const to = toChecksumAddress(firstAccept.payTo);
        const value = firstAccept.amount;
        const asset = toChecksumAddress(firstAccept.asset);
        const maxTimeoutSeconds = firstAccept.maxTimeoutSeconds || 3600;
        
        log('Extracted from firstAccept (checksummed):', { from, to, value, asset, maxTimeoutSeconds });

        const now = Math.floor(Date.now() / 1000);

        // EIP-3009: validAfter/validBefore timing (matches official @x402/evm implementation)
        // validAfter = now - 600 (10 minutes ago, for clock skew tolerance)
        // validBefore = now + maxTimeoutSeconds (authorization expiry)
        const validAfter = String(now - 600); // 10 minutes ago (matches official implementation)
        const validBefore = String(now + maxTimeoutSeconds);

        log('Time values:', {
          now,
          nowDate: new Date(now * 1000).toISOString(),
          validAfter,
          validAfterDate: new Date(parseInt(validAfter) * 1000).toISOString(),
          validBefore,
          validBeforeDate: new Date(parseInt(validBefore) * 1000).toISOString(),
          maxTimeoutSeconds,
        });

        // Generate random nonce (32 bytes as hex) using viem's toHex
        const toHex = window.viemToHex;
        const nonce = toHex(crypto.getRandomValues(new Uint8Array(32)));
        log('Generated nonce:', nonce);

        // EIP-712 domain from payment requirement's extra field
        const domain = {
          name: firstAccept.extra.name,
          version: firstAccept.extra.version,
          chainId: config.chainId,
          verifyingContract: asset,
        };
        logObj('EIP-712 domain', domain);

        // EIP-3009 TransferWithAuthorization types
        const types = {
          TransferWithAuthorization: [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'validAfter', type: 'uint256' },
            { name: 'validBefore', type: 'uint256' },
            { name: 'nonce', type: 'bytes32' },
          ],
        };

        // EIP-712 message with proper types for viem
        // viem's signTypedData handles BigInt conversion internally
        const message = {
          from,
          to,
          value: BigInt(value),
          validAfter: BigInt(validAfter),
          validBefore: BigInt(validBefore),
          nonce,
        };
        logObj('EIP-712 message', {
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
        });

        logObj('EIP-712 domain', domain);
        log('EIP-712 types:', types);

        document.getElementById('processing-text').textContent = 'Please sign in your wallet...';

        // Create viem wallet client from injected provider
        const chain = config.chainId === 8453 ? window.viemChains.base : window.viemChains.baseSepolia;
        const walletClient = window.viemCreateWalletClient({
          account: from,
          chain,
          transport: window.viemCustom(provider),
        });
        log('Created wallet client for chain:', chain.name);

        // Sign using viem's signTypedData
        log('Requesting signature via viem signTypedData...');
        const signature = await walletClient.signTypedData({
          account: from,
          domain,
          types,
          primaryType: 'TransferWithAuthorization',
          message,
        });
        log('Signature received:', signature);

        document.getElementById('processing-text').textContent = 'Submitting payment...';

        // Build x402 v2 payment payload
        // Use the exact requirement from server as 'accepted' (not reconstructed)
        const paymentPayload = {
          x402Version: 2,
          payload: {
            signature,
            authorization: {
              from,
              to,
              value,
              validAfter,
              validBefore,
              nonce,
            },
          },
          // Use the exact requirement from the server
          accepted: firstAccept,
          // Use resource directly from payment requirements
          resource: paymentReq?.resource,
        };
        logObj('Payment payload (before b64)', paymentPayload);

        // Encode as base64 for header
        const paymentHeader = btoa(JSON.stringify(paymentPayload));
        log('Payment header (b64):', paymentHeader);
        log('Payment header decoded for verification:', JSON.parse(atob(paymentHeader)));

        // Submit to the same URL with payment header
        log('Submitting to:', config.currentUrl);
        const response = await fetch(config.currentUrl, {
          method: 'GET',
          headers: {
            'X-PAYMENT-SIGNATURE': paymentHeader,
            'Accept': 'application/json',
          },
        });
        log('Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          logObj('Error response', errorData);
          throw new Error(errorData.message || 'Payment verification failed');
        }

        const result = await response.json();
        logObj('Success response', result);

        // Success! Show success state and redirect
        showState('success');

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

      } catch (error) {
        console.error('Payment error:', error);
        if (error.code === 4001) {
          showError('Transaction rejected by user');
        } else {
          showError(error.message || 'Payment failed. Please try again.');
        }
      }
    }

    // Initialize on load
    document.addEventListener('DOMContentLoaded', function() {
      log('DOM loaded, initializing...');
      
      // Check viem loaded correctly (may not be loaded yet due to ESM async loading)
      log('viem check on DOMContentLoaded:', {
        viemGetAddress: !!window.viemGetAddress,
        viemToHex: !!window.viemToHex,
        viemCreateWalletClient: !!window.viemCreateWalletClient,
        viemLoaded: viemLoaded,
      });
      
      // viem loads async via ESM, so we'll check again when payment is triggered
      
      logObj('Initial x402Config', window.x402Config);

      // Update button text based on wallet availability
      if (!hasInjectedWallet() && isMobile()) {
        document.getElementById('btn-metamask-text').textContent = 'Open in MetaMask';
      }

      log('hasInjectedWallet:', hasInjectedWallet());
      log('isMobile:', isMobile());

      // Debug logging for testnet
      if (window.x402Config.testnet) {
        console.log('x402 Payment Config:', window.x402Config);
      }
    });
  </script>
</body>
</html>`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
