'use client';

/**
 * Disconnecting the external wagmi/Reown wallet on logout.
 *
 * Privy logout only clears the **identity** session — it does NOT disconnect the
 * connected external wallet. If the wallet stays connected, the *next*
 * wallet-SIWE sign-in is a no-op: AppKit sees "already connected", mounts then
 * immediately closes the modal with no fresh active-address change, so the sign-in
 * chooser's settle logic (which only fires on address-change) never runs SIWE —
 * the user sees "Modal closed" / "Couldn't sign in with wallet" on every wallet.
 * (Reproduced on iOS: sign in with a wallet, log out, try again → all wallets fail.)
 *
 * So logout MUST drop the external wallet connection too, making the next connect
 * a real fresh one. The actual disconnect handler is registered by the (lazily
 * loaded) Reown wallet stack and operates on its module-singleton wagmi config,
 * which is why this stays a tiny leaf module: it never pulls the heavy
 * Reown/WalletConnect code onto the logout/auth path.
 */
type WalletDisconnectHandler = () => Promise<void>;

let walletDisconnectHandler: WalletDisconnectHandler | null = null;

export function registerWalletDisconnectHandler(
  handler: WalletDisconnectHandler | null,
) {
  walletDisconnectHandler = handler;
}

export function getRegisteredWalletDisconnect(): WalletDisconnectHandler | null {
  return walletDisconnectHandler;
}

/**
 * Best-effort disconnect of the external wallet. NEVER throws — a failed wallet
 * disconnect must not block the user from logging out. A no-op when no wallet
 * stack was ever loaded (e.g. an email-only session).
 */
export async function disconnectWalletForLogout(): Promise<void> {
  const handler = walletDisconnectHandler;
  if (!handler) return;
  try {
    await handler();
  } catch {
    // best-effort: a failed disconnect must not block logout
  }
}

/**
 * The logout sequence: drop the external wallet connection FIRST, then run the
 * Privy identity logout. Extracted as a pure function so the invariant — "logout
 * disconnects the wallet so the next SIWE is a fresh connect" — is unit-testable
 * without rendering the Privy provider.
 */
export async function runRuntimeLogout(
  privyLogout: () => Promise<void>,
): Promise<void> {
  await disconnectWalletForLogout();
  await privyLogout();
}
