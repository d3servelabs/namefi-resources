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
 * Balance checking functions for USDC
 */
export function getBalanceCheckingScript(): string {
  return `
    // USDC ABI for balance checking
    // const USDC_ABI = [
    //   {
    //     name: 'balanceOf',
    //     type: 'function',
    //     stateMutability: 'view',
    //     inputs: [{ name: 'owner', type: 'address' }],
    //     outputs: [{ type: 'uint256' }]
    //   },
    //   {
    //     name: 'decimals',
    //     type: 'function',
    //     stateMutability: 'view',
    //     inputs: [],
    //     outputs: [{ type: 'uint8' }]
    //   }
    // ];
    const USDC_ABI = [
      'function transfer(address recipient, uint256 amount) external returns (bool)',
      'function balanceOf(address account) external view returns (uint256)',
      'function decimals() external view returns (uint8)',
    ];

    // Escape a value for safe interpolation into HTML text or attributes.
    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    // Fetch USDC balance for a specific chain
    async function fetchUsdcBalance(address, chainConfig) {
      try {
        log('Fetching balance for address:', address, 'on chain:', chainConfig.name);

        // Use the existing viem library loaded via ESM
        if (!window.viem) {
          log('Viem not loaded yet');
          return null;
        }
        const { createPublicClient, http, parseAbi, formatUnits } = window.viem;
        if (!createPublicClient) {
          log('Viem functions not available');
          return null;
        }

        // Create a public client for the specific chain
        // Try to use predefined chain if available, otherwise create custom
        let chainDefinition;
        if (chainConfig.chainId === 8453) {
          chainDefinition = window.viemChains.base;
        } else if (chainConfig.chainId === 84532) {
          chainDefinition = window.viemChains.baseSepolia;
        } else {
          // Fallback to custom chain definition
          chainDefinition = {
            id: chainConfig.chainId,
            name: chainConfig.name,
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: { default: { http: [chainConfig.rpcUrl] } },
            blockExplorers: { default: { name: 'Explorer', url: chainConfig.blockExplorer } }
          };
        }

        const publicClient = createPublicClient({
          chain: chainDefinition,
          transport: http()
        });

        // Parse ABI and create contract
        const abi = parseAbi(USDC_ABI);

        // Fetch balance and decimals using direct contract calls
        const [balance, decimals] = await Promise.all([
          publicClient.readContract({
            address: chainConfig.usdcAddress,
            abi,
            functionName: 'balanceOf',
            args: [address]
          }),
          publicClient.readContract({
            address: chainConfig.usdcAddress,
            abi,
            functionName: 'decimals'
          })
        ]);

        // Convert to human readable format
        const balanceInUsdc = Number(formatUnits(balance, decimals));
        log('Raw balance:', balance.toString(), 'Decimals:', decimals, 'Formatted:', balanceInUsdc);

        return balanceInUsdc;
      } catch (error) {
        log('Error fetching USDC balance for chain', chainConfig.name, ':', error);
        return null;
      }
    }

    // Fetch balances for all accepted payment methods
    async function fetchAllBalances(address) {
      if (!address || !window.x402Config.paymentRequired?.accepts) {
        log('No address or accepts found, returning empty array');
        log('Address:', address);
        log('PaymentRequired:', window.x402Config.paymentRequired);
        log('ChainConfigs:', window.x402Config.chainConfigs);
        return [];
      }

      const accepts = window.x402Config.paymentRequired.accepts;
      const balancePromises = [];

      log('Processing accepts array:', accepts);

      for (const requirement of accepts) {
        const chainConfig = window.x402Config.chainConfigs[requirement.network];
        log('Looking for chain config for network:', requirement.network, 'found:', !!chainConfig);

        if (chainConfig) {
          balancePromises.push(
            fetchUsdcBalance(address, chainConfig)
              .then(balance => ({
                network: requirement.network,
                chainName: chainConfig.name,
                chainId: chainConfig.chainId,
                balance: balance,
                error: balance === null ? 'Failed to fetch balance' : null
              }))
          );
        } else {
          balancePromises.push(Promise.resolve({
            network: requirement.network,
            chainName: 'Unknown Chain',
            chainId: null,
            balance: null,
            error: 'Chain config not found'
          }));
        }
      }

      const results = await Promise.allSettled(balancePromises);
      const settledResults = results.map(result =>
        result.status === 'fulfilled' ? result.value : {
          network: result.reason.network || 'unknown',
          chainName: result.reason.chainName || 'Unknown Chain',
          chainId: result.reason.chainId || null,
          balance: null,
          error: result.reason.message || result.reason.toString()
        }
      );
      log('Fetched balances (settled):', settledResults);
      return settledResults;
    }

    // Update balance display in UI
    async function updateBalanceDisplay(address) {
      const balanceContainer = document.getElementById('balance-container');
      if (!balanceContainer) {
        log('Balance container not found!');
        return;
      }

      log('Updating balance display for address:', address);
      log('Balance container found, classes:', balanceContainer.className);

      // Show loading state
      balanceContainer.innerHTML = \`
        <div class="text-center py-2">
          <div class="inline-block w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <span class="text-xs text-muted ml-2">Checking balances...</span>
        </div>
      \`;

      try {
        const balances = await fetchAllBalances(address);

        if (balances.length === 0) {
          balanceContainer.innerHTML = '<p class="text-xs text-muted text-center">No payment methods available</p>';
          return;
        }

        // Build balance display HTML
        let balanceHtml = '<div class="space-y-2">';

        for (const balanceInfo of balances) {
          if (balanceInfo.error) {
            balanceHtml += \`
              <div class="flex items-center justify-between text-xs">
                <span class="text-muted">\${escapeHtml(balanceInfo.chainName)}</span>
                <span class="text-destructive" title="\${escapeHtml(balanceInfo.error)}">Failed</span>
              </div>
            \`;
          } else {
            const formattedBalance = balanceInfo.balance >= 0.01
              ? balanceInfo.balance.toFixed(2)
              : balanceInfo.balance.toFixed(6).replace(/\\.?0+$/, '');

            balanceHtml += \`
              <div class="flex items-center justify-between text-xs">
                <span class="text-muted">\${escapeHtml(balanceInfo.chainName)}</span>
                <span class="text-foreground font-medium">\${formattedBalance} USDC</span>
              </div>
            \`;
          }
        }

        balanceHtml += '</div>';
        log('Setting balance HTML:', balanceHtml);
        balanceContainer.innerHTML = balanceHtml;
        log('Balance container updated successfully');

      } catch (error) {
        log('Error updating balance display:', error);
        balanceContainer.innerHTML = '<p class="text-xs text-destructive text-center">Failed to load balances</p>';
        log('Error state applied to balance container');
      }
    }
  `;
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

      // Hide balance container
      const balanceContainer = document.getElementById('balance-container');
      if (balanceContainer) {
        balanceContainer.classList.add('hidden');
      }

      // Reset button text based on wallet availability
      const btnText = document.getElementById('btn-metamask-text');
      if (btnText) {
        if (!hasInjectedWallet() && isMobile()) {
          btnText.textContent = 'Open in MetaMask';
        } else {
          btnText.textContent = 'Connect Wallet';
        }
      }

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

        // Show balance container and fetch balances
        const balanceContainer = document.getElementById('balance-container');
        if (balanceContainer) {
          balanceContainer.classList.remove('hidden');
          updateBalanceDisplay(connectedAddress);
        }

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
