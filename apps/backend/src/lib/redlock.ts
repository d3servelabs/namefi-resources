/**
 * `redlock-universal` client wiring for distributed locks (Node-only).
 *
 * NEVER import this from a workflow file — it pulls in the redis client + the
 * adapter. Only ACTIVITIES use it (see `nonce-lock.activities.ts`).
 */

import {
  NodeRedisAdapter,
  createLock,
  type LockHandle,
} from 'redlock-universal';
import { getRedisClient } from './redis';

export type { LockHandle };

let _adapter: NodeRedisAdapter | null = null;

async function getAdapter(): Promise<NodeRedisAdapter> {
  if (!_adapter) {
    _adapter = new NodeRedisAdapter(await getRedisClient());
  }
  return _adapter;
}

/**
 * Build a single-instance lock client for `key`. `acquire()` yields a
 * serializable `LockHandle`; `extend(handle, ttl)` / `release(handle)` operate
 * on it.
 */
export async function createNonceLock(opts: {
  key: string;
  ttlMs: number;
  retryAttempts?: number;
  retryDelay?: number;
}) {
  return createLock({
    adapter: await getAdapter(),
    key: opts.key,
    ttl: opts.ttlMs,
    retryAttempts: opts.retryAttempts ?? 5,
    retryDelay: opts.retryDelay ?? 200,
  });
}

/**
 * Distributed-lock key for a signer's nonce allocation:
 * `eip155:<chainId>:<signerAddress>`, lowercased IN FULL.
 *
 * Normalization: viem returns EIP-55 checksummed (mixed-case) addresses, so the
 * whole string is lowercased — otherwise two workflows for the SAME signer could
 * acquire two different keys and both pin the nonce. The `eip155:` prefix scopes
 * the key to EVM chains identified by chain id.
 */
export function buildSignerNonceLockKey(
  chainId: number,
  signerAddress: string,
): string {
  return `eip155:${chainId}:${signerAddress}`.toLowerCase();
}
