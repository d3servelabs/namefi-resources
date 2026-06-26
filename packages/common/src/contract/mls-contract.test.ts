import { describe, expect, it } from 'vitest';
import { mlsContract, mlsFeedPageSchema } from './mls-contract';

describe('getFeed contract output', () => {
  it('requires count metadata for paginated feed pages', () => {
    const page = {
      rows: [],
      nextCursor: null,
      hasMore: false,
      limit: 20,
      filteredCount: 3,
      totalCount: 10,
    };

    expect(mlsFeedPageSchema.safeParse(page).success).toBe(true);
    expect(
      mlsFeedPageSchema.safeParse({
        ...page,
        filteredCount: undefined,
      }).success,
    ).toBe(false);
    expect(
      mlsFeedPageSchema.safeParse({
        ...page,
        totalCount: undefined,
      }).success,
    ).toBe(false);
  });
});

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
