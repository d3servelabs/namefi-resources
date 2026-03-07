/**
 * Shared JavaScript for x402 paywall system
 *
 * Contains all the browser-side JavaScript for wallet connection,
 * EIP-712 signing, and payment submission.
 */

/**
 * Debug logging functions
 */
export function getDebugLoggingScript(): string {
  return `
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
    }`;
}

/**
 * Viem helper functions (address checksumming)
 */
export function getViemHelpersScript(): string {
  return `
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
    });`;
}

/**
 * Wallet state management
 */
export function getWalletStateScript(): string {
  return `
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
    }`;
}

/**
 * MetaMask connection function
 */
export function getConnectMetaMaskScript(): string {
  return `
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
    }`;
}

/**
 * WalletConnect connection placeholder
 */
export function getConnectWalletConnectScript(hasProjectId: boolean): string {
  if (hasProjectId) {
    return `
    // Connect via WalletConnect
    async function connectWalletConnect() {
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
    }`;
  }

  return `
    // Connect via WalletConnect (not configured)
    async function connectWalletConnect() {
      showError('WalletConnect not configured');
    }`;
}

/**
 * Sign payment function options
 */
export interface SignPaymentScriptOptions {
  /** JavaScript to execute on successful payment (has access to 'result' and 'config' vars) */
  onSuccessScript: string;
}

/**
 * EIP-712 signing and payment submission
 */
export function getSignPaymentScript(
  options: SignPaymentScriptOptions,
): string {
  return `
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
            'PAYMENT-SIGNATURE': paymentHeader,
            'Accept': 'application/json',
          },
        });
        log('Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          logObj('Error response', errorData);
          throw new Error(errorData.message || 'Payment verification failed');
        }

        // Capture redirect options header before consuming response body
        const redirectOptionsHeader = response.headers.get('X-PAYWALL-REDIRECT-OPTIONS');
        if (redirectOptionsHeader) {
          log('Redirect options header found:', redirectOptionsHeader);
        }

        const result = await response.json();
        logObj('Success response', result);

        // Success! Show success state and handle redirect
        showState('success');

        // Custom success handler (has access to: result, config, redirectOptionsHeader)
        ${options.onSuccessScript}

      } catch (error) {
        console.error('Payment error:', error);
        if (error.code === 4001) {
          showError('Transaction rejected by user');
        } else {
          showError(error.message || 'Payment failed. Please try again.');
        }
      }
    }`;
}

/**
 * DOMContentLoaded initialization script
 */
export function getDOMContentLoadedScript(): string {
  return `
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
    });`;
}
