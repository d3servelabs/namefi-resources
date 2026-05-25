/**
 * Viem ESM CDN loader script
 *
 * Loads viem utilities from esm.sh and exposes them to window for browser usage.
 */

/**
 * Generates the script tag to load viem from CDN
 */
export function getViemLoaderScript(): string {
  return `
  <script type="module">
    // Load viem ESM and expose utilities to window
     import { 
       getAddress, 
       toHex,
       createWalletClient,
       createPublicClient,
       http,
       parseAbi,
       formatUnits,
       custom
     } from 'https://esm.sh/viem@2.43.3';
     import { base, baseSepolia } from 'https://esm.sh/viem@2.43.3/chains';
     
     window.viem = {
       getAddress,
       toHex,
       createWalletClient,
       createPublicClient,
       http,
       parseAbi,
       formatUnits,
       custom
     };
     window.viemGetAddress = getAddress;
     window.viemToHex = toHex;
     window.viemCreateWalletClient = createWalletClient;
     window.viemCustom = custom;
     window.viemChains = { base, baseSepolia };
     window.dispatchEvent(new Event('viem-loaded'));
  </script>`;
}
