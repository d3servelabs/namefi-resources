import type { Address } from 'viem';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NonceLockToken } from './nonce-lock.activities';

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };

// A stand-in for redlock-universal's LockAcquisitionError so `instanceof` works.
const { FakeLockAcquisitionError } = vi.hoisted(() => {
  class FakeLockAcquisitionError extends Error {}
  return { FakeLockAcquisitionError };
});

const fakeLock = {
  acquire: vi.fn(),
  extend: vi.fn(async () => true),
  release: vi.fn(async () => true),
};
const createNonceLock = vi.fn(async () => fakeLock);
const getViemWalletClient = vi.fn(async () => ({
  account: { address: '0xMintSigner' as Address },
}));
const getX402WalletClient = vi.fn(async () => ({
  account: { address: '0xX402Signer' as Address },
}));

vi.mock('@temporalio/activity', () => ({
  Context: { current: () => ({ log }) },
}));
vi.mock('@temporalio/common', () => ({
  ApplicationFailure: class ApplicationFailure extends Error {
    type?: string;
    nonRetryable?: boolean;
    static create({
      message,
      type,
      nonRetryable,
    }: {
      message?: string;
      type?: string;
      nonRetryable?: boolean;
    }) {
      const e = new ApplicationFailure(message);
      e.type = type;
      e.nonRetryable = nonRetryable;
      return e;
    }
  },
}));
vi.mock('redlock-universal', () => ({
  LockAcquisitionError: FakeLockAcquisitionError,
}));
vi.mock('#lib/redlock', () => ({
  createNonceLock,
  buildSignerNonceLockKey: (chainId: number, addr: string) =>
    `eip155:${chainId}:${addr}`.toLowerCase(),
}));
vi.mock('#lib/crypto/viem-clients', () => ({ getViemWalletClient }));
vi.mock('#lib/crypto/x402-viem-clients', () => ({ getX402WalletClient }));

const { acquireNonceLock, extendNonceLock, releaseNonceLock } = await import(
  './nonce-lock.activities'
);

const HANDLE = {
  id: 'id',
  key: 'eip155:8453:0xmintsigner',
  value: 'tok',
  acquiredAt: 0,
  ttl: 90_000,
};

beforeEach(() => {
  vi.clearAllMocks();
  fakeLock.acquire.mockResolvedValue(HANDLE);
  fakeLock.extend.mockResolvedValue(true);
  fakeLock.release.mockResolvedValue(true);
  createNonceLock.mockResolvedValue(fakeLock);
});

describe('acquireNonceLock', () => {
  it('locks on the lowercased eip155 key for the mint signer and stamps the deadline', async () => {
    const before = Date.now();
    const token = await acquireNonceLock({
      chainId: 8453,
      signerKind: 'mint',
      ttlMs: 90_000,
      absoluteMaxMs: 100_000,
    });

    expect(getViemWalletClient).toHaveBeenCalledWith(8453);
    expect(createNonceLock).toHaveBeenCalledWith({
      key: 'eip155:8453:0xmintsigner',
      ttlMs: 90_000,
    });
    expect(token.handle).toBe(HANDLE);
    expect(token.absoluteDeadlineMs).toBeGreaterThanOrEqual(before + 100_000);
    expect(token.absoluteDeadlineMs).toBeLessThanOrEqual(Date.now() + 100_000);
  });

  it("routes to the x402 signer when signerKind is 'x402'", async () => {
    await acquireNonceLock({
      chainId: 8453,
      signerKind: 'x402',
      ttlMs: 90_000,
      absoluteMaxMs: 100_000,
    });
    expect(getX402WalletClient).toHaveBeenCalledWith(8453);
    expect(getViemWalletClient).not.toHaveBeenCalled();
    expect(createNonceLock).toHaveBeenCalledWith({
      key: 'eip155:8453:0xx402signer',
      ttlMs: 90_000,
    });
  });

  it('surfaces contention as a RETRYABLE failure (not nonRetryable)', async () => {
    fakeLock.acquire.mockRejectedValueOnce(
      new FakeLockAcquisitionError('contended'),
    );
    await expect(
      acquireNonceLock({
        chainId: 8453,
        signerKind: 'mint',
        ttlMs: 90_000,
        absoluteMaxMs: 100_000,
      }),
    ).rejects.toMatchObject({
      type: 'nonce-lock/contended',
      nonRetryable: undefined,
    });
  });
});

describe('extendNonceLock', () => {
  const futureToken: NonceLockToken = {
    handle: HANDLE,
    absoluteDeadlineMs: Date.now() + 60_000,
  };

  it('extends and returns the lock result before the absolute deadline', async () => {
    fakeLock.extend.mockResolvedValueOnce(true);
    const held = await extendNonceLock({ token: futureToken, ttlMs: 90_000 });
    expect(held).toBe(true);
    expect(fakeLock.extend).toHaveBeenCalledWith(HANDLE, 90_000);
  });

  it('REFUSES (returns false, no redis extend) once the absolute deadline passes', async () => {
    const expiredToken: NonceLockToken = {
      handle: HANDLE,
      absoluteDeadlineMs: Date.now() - 1,
    };
    const held = await extendNonceLock({ token: expiredToken, ttlMs: 90_000 });
    expect(held).toBe(false);
    expect(fakeLock.extend).not.toHaveBeenCalled();
  });
});

describe('releaseNonceLock', () => {
  it('releases the handle (best-effort)', async () => {
    await releaseNonceLock({
      token: { handle: HANDLE, absoluteDeadlineMs: Date.now() + 60_000 },
    });
    expect(fakeLock.release).toHaveBeenCalledWith(HANDLE);
  });

  it('swallows a release failure', async () => {
    fakeLock.release.mockRejectedValueOnce(new Error('not held'));
    await expect(
      releaseNonceLock({
        token: { handle: HANDLE, absoluteDeadlineMs: Date.now() + 60_000 },
      }),
    ).resolves.toBeUndefined();
  });
});
