import { describe, expect, it, vi } from 'vitest';
import {
  getAlreadyConnectedSiweTarget,
  isSameSiweLoginTarget,
  runWalletSignInConnectFlow,
} from './sign-in-chooser-wallet';

describe('getAlreadyConnectedSiweTarget', () => {
  it('returns a SIWE target for an already-connected wagmi account', () => {
    expect(
      getAlreadyConnectedSiweTarget({
        status: 'connected',
        address: '0x0000000000000000000000000000000000000001',
        chainId: 1,
      }),
    ).toEqual({
      address: '0x0000000000000000000000000000000000000001',
      caip2ChainId: 'eip155:1',
    });
  });

  it('does not treat disconnected accounts as SIWE-ready', () => {
    expect(
      getAlreadyConnectedSiweTarget({
        status: 'disconnected',
        address: undefined,
        chainId: undefined,
      }),
    ).toBeNull();
  });

  it('requires both address and chain id before bypassing AppKit connect', () => {
    expect(
      getAlreadyConnectedSiweTarget({
        status: 'connected',
        address: '0x0000000000000000000000000000000000000001',
        chainId: undefined,
      }),
    ).toBeNull();

    expect(
      getAlreadyConnectedSiweTarget({
        status: 'connected',
        address: undefined,
        chainId: 1,
      }),
    ).toBeNull();
  });

  it('matches SIWE targets by address and chain', () => {
    expect(
      isSameSiweLoginTarget(
        {
          address: '0x00000000000000000000000000000000000000aA',
          caip2ChainId: 'eip155:1',
        },
        {
          address: '0x00000000000000000000000000000000000000aa',
          caip2ChainId: 'eip155:1',
        },
      ),
    ).toBe(true);

    expect(
      isSameSiweLoginTarget(
        {
          address: '0x00000000000000000000000000000000000000aA',
          caip2ChainId: 'eip155:1',
        },
        {
          address: '0x00000000000000000000000000000000000000aa',
          caip2ChainId: 'eip155:8453',
        },
      ),
    ).toBe(false);

    expect(
      isSameSiweLoginTarget(null, {
        address: '0x00000000000000000000000000000000000000aa',
        caip2ChainId: 'eip155:1',
      }),
    ).toBe(false);
  });
});

describe('runWalletSignInConnectFlow', () => {
  it('skips AppKit and completes SIWE when wagmi is already connected', async () => {
    const openWalletModal = vi.fn();
    const waitForConnectFlowSettled = vi.fn();
    const completeSiweLogin = vi.fn();

    await expect(
      runWalletSignInConnectFlow({
        readAccount: () => ({
          status: 'connected',
          address: '0x0000000000000000000000000000000000000001',
          chainId: 1,
        }),
        openWalletModal,
        waitForConnectFlowSettled,
        completeSiweLogin,
      }),
    ).resolves.toEqual({
      openedWalletModal: false,
      completedSiweLogin: true,
    });

    expect(openWalletModal).not.toHaveBeenCalled();
    expect(waitForConnectFlowSettled).not.toHaveBeenCalled();
    expect(completeSiweLogin).toHaveBeenCalledWith({
      address: '0x0000000000000000000000000000000000000001',
      caip2ChainId: 'eip155:1',
    });
  });

  it('opens AppKit and signs in the wallet that connects after settlement', async () => {
    const accounts = [
      {
        status: 'disconnected',
        address: undefined,
        chainId: undefined,
      },
      {
        status: 'connected',
        address: '0x0000000000000000000000000000000000000002',
        chainId: 8453,
      },
    ];
    const openWalletModal = vi.fn();
    const waitForConnectFlowSettled = vi.fn();
    const completeSiweLogin = vi.fn();

    await expect(
      runWalletSignInConnectFlow({
        readAccount: () => accounts.shift() ?? accounts[0],
        openWalletModal,
        waitForConnectFlowSettled,
        completeSiweLogin,
      }),
    ).resolves.toEqual({
      openedWalletModal: true,
      completedSiweLogin: true,
    });

    expect(openWalletModal).toHaveBeenCalledOnce();
    expect(waitForConnectFlowSettled).toHaveBeenCalledOnce();
    expect(completeSiweLogin).toHaveBeenCalledWith({
      address: '0x0000000000000000000000000000000000000002',
      caip2ChainId: 'eip155:8453',
    });
  });
});
