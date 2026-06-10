import { describe, expect, it } from 'vitest';
import { mlsContract } from './mls-contract';

describe('getHandleListings contract input', () => {
  it('requires a feed source namespace for seller detail lookups', () => {
    const result = mlsContract.getHandleListings.input.safeParse({
      source: 'x',
      handle: 'alice',
      limit: 20,
      cursor: null,
    });

    expect(result.success).toBe(true);
  });

  it('rejects missing or unknown feed source namespaces', () => {
    expect(
      mlsContract.getHandleListings.input.safeParse({
        handle: 'alice',
      }).success,
    ).toBe(false);

    expect(
      mlsContract.getHandleListings.input.safeParse({
        source: 'platform',
        handle: 'alice',
      }).success,
    ).toBe(false);
  });
});
