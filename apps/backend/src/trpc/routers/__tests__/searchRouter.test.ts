import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as namefiRegistry from '#lib/namefi-registry';
import type { TrpcContext } from '../../base';
import { searchRouter } from '../searchRouter';
import { RANKED_TLDS } from '#lib/tld-rank';
import {
  rotateString,
  stringRotatePermutations,
  windowedSubStrings,
} from '#lib/domain-suggestions';
import type { DomainAvailabilityInfo } from '#lib/namefi-registry';

const testUser = {
  privyUserId: '123',
} as any;

describe('Search Router', () => {
  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();

    // Provide a default mock implementation for getDomainListInfo
    // It should return an array matching the structure expected by the router
    vi.spyOn(namefiRegistry, 'getDomainListInfo').mockImplementation(
      async (domains: NamefiNormalizedDomain[]) =>
        domains.map(
          (domain) =>
            ({
              domain,
              availability: true, // Default to available
              importable: false,
              pricingDetails: {
                registrationPrice: {
                  type: 'PER_YEAR',
                  price: { amount: 9.99, currency: 'USD' },
                },
                renewalPrice: {
                  type: 'PER_YEAR',
                  price: { amount: 9.99, currency: 'USD' },
                },
                importPrice: {
                  type: 'PER_YEAR',
                  price: { amount: 9.99, currency: 'USD' },
                },
              },
              currentOwner: undefined,
              durationValidationInYears: {
                min: 1,
                max: 10,
              },
              supported: true,
            }) satisfies DomainAvailabilityInfo,
        ),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Create an actual caller for the router
  // The search router doesn't use context values, so we can use a type assertion
  const caller = searchRouter.createCaller({
    poweredByNamefiDomain: null,
    testUser,
  } satisfies Omit<TrpcContext, 'db' | 'req' | 'res'> as TrpcContext);

  it('should return domain suggestions', async () => {
    // Act: Call the getDomainSuggestions procedure with test input
    const result = await caller.getDomainSuggestions({
      query: 'test-domain',
      parentDomain: '0x.city',
    });

    // Assert: Check the structure of the response
    expect(result).toHaveProperty('domains');
    expect(Array.isArray(result.domains)).toBe(true);
    expect(result.domains.length).toBeGreaterThan(0);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.nextPage).toBeNull();

    // Check that the suggestions include the parent domain
    for (const domain of result.domains) {
      expect(domain.endsWith('.0x.city')).toBe(true);
    }
  });

  it('should trim invalid characters from the query', async () => {
    // Test with a query containing invalid characters
    const result = await caller.getDomainSuggestions({
      query: 'test@domain!',
      parentDomain: '0x.city',
    });

    // Check that the suggestions are properly sanitized
    expect(result.domains.length).toBeGreaterThan(0);
    for (const domain of result.domains) {
      expect(domain).not.toContain('@');
      expect(domain).not.toContain('!');
      expect(domain.endsWith('.0x.city')).toBe(true);
    }
  });

  it('should use the specified parent domain in suggestions', async () => {
    // Test with defi.build parent domain
    const result = await caller.getDomainSuggestions({
      query: 'test-domain',
      parentDomain: 'defi.build',
    });

    // Check that the suggestions include the correct parent domain
    expect(result.domains.length).toBeGreaterThan(0);
    for (const domain of result.domains) {
      expect(domain.endsWith('.defi.build')).toBe(true);
    }
  });

  it('should generate English word club suggestions', async () => {
    const result = await caller.getDomainSuggestions({
      query: 'test',
      parentDomain: '0x.city',
    });

    expect(result.domains.length).toBeGreaterThan(0);

    // Check that the suggestions include the parent domain
    for (const domain of result.domains) {
      expect(domain.endsWith('.0x.city')).toBe(true);
    }
  });

  it('should generate number club suggestions', async () => {
    const result = await caller.getDomainSuggestions({
      query: '123',
      parentDomain: '0x.city',
    });

    expect(result.domains.length).toBeGreaterThan(0);

    // Check that the suggestions include the parent domain
    for (const domain of result.domains) {
      expect(domain.endsWith('.0x.city')).toBe(true);
    }
  });

  it('should paginate ranked TLD suggestions', async () => {
    const pageSize = 10;
    const secondPageTld = RANKED_TLDS[pageSize];
    const expectedTotalPages = Math.ceil(RANKED_TLDS.length / pageSize);
    const result = await caller.getDomainSuggestions({
      query: 'pagetest',
      page: 2,
      pageSize,
    });

    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(expectedTotalPages);
    expect(result.nextPage).toBe(3);
    expect(result.pageSize).toBe(pageSize);
    expect(result.domains.length).toBeGreaterThan(0);
    expect(
      result.domains.some((domain) => domain.endsWith(`.${secondPageTld}`)),
    ).toBe(true);

    const lastPage = await caller.getDomainSuggestions({
      query: 'pagetest',
      page: 99,
      pageSize,
    });
    expect(lastPage.page).toBe(expectedTotalPages);
    expect(lastPage.nextPage).toBeNull();
    expect(lastPage.pageSize).toBe(pageSize);
  });
});

describe('String Rotation Permutations', () => {
  it('should generate all unique rotations of a string', () => {
    const input = 'abc';
    const expected = ['abc', 'bca', 'cab'];

    const result = stringRotatePermutations(input);
    expect(result).toEqual(expected);
  });
});

describe('String windowed sub strings', () => {
  it('should generate all unique windowed sub strings of a string', () => {
    const input = 'abc';
    const expected = ['a', 'b', 'c', 'ab', 'bc'];

    const result = windowedSubStrings(input);
    expect(result).toEqual(expected);
  });
});
describe('Rotate String', () => {
  it('should rotate a string by the specified positions', () => {
    expect(rotateString('abc', 1)).toEqual('bca');
    expect(rotateString('abc', 2)).toEqual('cab');
    expect(rotateString('abc', 3)).toEqual('abc');
    expect(rotateString('abc', 4)).toEqual('bca');
    expect(rotateString('abc', 5)).toEqual('cab');
    expect(rotateString('abc', 6)).toEqual('abc');

    expect(rotateString('abc', -1)).toEqual('cab');
    expect(rotateString('abc', -2)).toEqual('bca');
    expect(rotateString('abc', -3)).toEqual('abc');
    expect(rotateString('abc', -4)).toEqual('cab');
    expect(rotateString('abc', -5)).toEqual('bca');
    expect(rotateString('abc', -6)).toEqual('abc');
  });
});
