import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  disconnectWalletForLogout,
  getRegisteredWalletDisconnect,
  registerWalletDisconnectHandler,
  runRuntimeLogout,
} from './wallet-disconnect';

afterEach(() => {
  registerWalletDisconnectHandler(null);
});

describe('wallet-disconnect registry', () => {
  it('returns null when no wallet stack has registered a handler (email-only session)', () => {
    expect(getRegisteredWalletDisconnect()).toBeNull();
  });

  it('returns the handler the Reown wallet stack registers', () => {
    const handler = vi.fn();
    registerWalletDisconnectHandler(handler);
    expect(getRegisteredWalletDisconnect()).toBe(handler);
  });

  it('can be cleared back to null', () => {
    registerWalletDisconnectHandler(vi.fn());
    registerWalletDisconnectHandler(null);
    expect(getRegisteredWalletDisconnect()).toBeNull();
  });
});

describe('disconnectWalletForLogout', () => {
  it('invokes the registered wallet disconnect', async () => {
    const disconnect = vi.fn().mockResolvedValue(undefined);
    registerWalletDisconnectHandler(disconnect);
    await disconnectWalletForLogout();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('is a safe no-op when no wallet was ever connected', async () => {
    await expect(disconnectWalletForLogout()).resolves.toBeUndefined();
  });

  it('never throws even if the wallet disconnect rejects (must not block logout)', async () => {
    registerWalletDisconnectHandler(() =>
      Promise.reject(new Error('wallet provider gone')),
    );
    await expect(disconnectWalletForLogout()).resolves.toBeUndefined();
  });
});

describe('runRuntimeLogout — REGRESSION GUARD: 2nd wallet-SIWE after logout', () => {
  // The bug (iOS, all wallets): sign in with a wallet via SIWE → log out → try
  // again → "Modal closed" / "Couldn't sign in with wallet". Root cause: logout
  // cleared only the Privy identity session and left the external wallet
  // connected, so the next connect() was a no-op. Logout MUST disconnect the
  // wallet first, so these assertions lock that invariant in.

  it('disconnects the external wallet BEFORE the Privy identity logout', async () => {
    const order: string[] = [];
    registerWalletDisconnectHandler(async () => {
      order.push('wallet-disconnect');
    });
    const privyLogout = vi.fn(async () => {
      order.push('privy-logout');
    });

    await runRuntimeLogout(privyLogout);

    // wallet must be disconnected first, so the next SIWE is a fresh connect
    expect(order).toEqual(['wallet-disconnect', 'privy-logout']);
    expect(privyLogout).toHaveBeenCalledOnce();
  });

  it('still completes the Privy logout even if the wallet disconnect fails', async () => {
    registerWalletDisconnectHandler(() =>
      Promise.reject(new Error('disconnect failed')),
    );
    const privyLogout = vi.fn().mockResolvedValue(undefined);

    await runRuntimeLogout(privyLogout);

    expect(privyLogout).toHaveBeenCalledOnce();
  });

  it('logs out cleanly for an email-only session (no wallet handler registered)', async () => {
    const privyLogout = vi.fn().mockResolvedValue(undefined);

    await runRuntimeLogout(privyLogout);

    expect(privyLogout).toHaveBeenCalledOnce();
  });
});
