/**
 * Detects a WalletConnect deep link in a wallet's **native custom scheme**
 * (`<scheme>://…wc?uri=…`, never http/https).
 *
 * Reown AppKit opens a connecting wallet by calling `window.open` with this
 * native scheme. iOS Safari does not reliably honor a `window.open` of a custom
 * scheme — the wallet app frequently fails to open and the user lands on a web
 * page (verified live via headless mobile Chrome). The Reown stack intercepts
 * that one `window.open` and re-fires the **same** deep link via
 * `window.location.href` instead, which iOS honors far more reliably — exactly
 * what Uniswap's web app does for its own wallet (it sets
 * `window.location.href = uniswap://wc?uri=…` and explicitly avoids `window.open`
 * for popup-blocker / inconsistency reasons). See
 * `components/providers/reown-wallet-stack` (`installWalletDeepLinkShim`).
 */

// A WalletConnect deep link in a wallet's custom scheme (never http/https):
// `<scheme>://…wc?uri=…`. http(s) links are intentionally excluded so the shim
// only intercepts the native-scheme `window.open` AppKit makes for a wallet.
const WC_NATIVE_DEEPLINK = /^(?!https?:)[a-z][\w.+-]*:\/\/\S*wc\?uri=/i;

export function isWalletConnectNativeDeepLink(url: string): boolean {
  return WC_NATIVE_DEEPLINK.test(url);
}
