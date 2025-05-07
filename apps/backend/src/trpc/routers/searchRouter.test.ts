import { config } from 'dotenv';

import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as namefiRegistry from '#lib/namefi-registry';
import type { TrpcContext } from '../base';
import {
  rotateString,
  searchRouter,
  stringRotatePermutations,
  windowedSubStrings,
} from './searchRouter';

const testUser = {
  privyUserId: '123',
} as any;
// TODO: consider use vitest setup to do it globally after NamefiRegistry
config({ path: '.env.test' });

describe('Search Router', () => {
  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();

    // Provide a default mock implementation for getDomainListInfo
    // It should return an array matching the structure expected by the router
    vi.spyOn(namefiRegistry, 'getDomainListInfo').mockImplementation(
      async (domains: NamefiNormalizedDomain[]) =>
        domains.map((domain) => ({
          domain,
          availability: true, // Default to available
          priceInUSD: 9.99, // Add a mock price
          currentOwner: undefined,
        })),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Create an actual caller for the router
  // The search router doesn't use context values, so we can use a type assertion
  const caller = searchRouter.createCaller({
    thirdPartyOriginHostname: null,
    testUser,
  } satisfies Omit<TrpcContext, 'db' | 'req' | 'res'> as TrpcContext);

  it('should return search results with suggestions and availability', async () => {
    // Act: Call the actual search procedure with test input
    const result = await caller.search({
      query: 'test-domain',
      parentDomain: '0x.city',
      withSuggestions: true,
    });

    // Assert: Check the structure of the response
    expect(result).toHaveProperty('suggestions');
    expect(result).toHaveProperty('bulkAvailability');

    // Check suggestions array contents
    expect(Array.isArray(result.suggestions)).toBe(true);
    expect(result.suggestions.length).toBeGreaterThan(0);

    // First suggestion should be the trimmed query
    expect(result.bulkAvailability[0].domain).toBe('test-domain.0x.city');

    // Check that other suggestions include the parent domain
    for (let i = 1; i < result.suggestions.length; i++) {
      expect(result.bulkAvailability[i].domain.endsWith('0x.city')).toBe(true);
    }

    // Check bulk availability array has same length as suggestions
    expect(Array.isArray(result.bulkAvailability)).toBe(true);
    expect(result.bulkAvailability.length).toBe(result.suggestions.length);

    // Check that getDomainListInfo was called with the generated suggestions
    expect(namefiRegistry.getDomainListInfo).toHaveBeenCalledWith(
      result.suggestions,
      testUser,
    );

    // Check availability items have required structure
    for (const item of result.bulkAvailability) {
      expect(item).toHaveProperty('domain');
      expect(item).toHaveProperty('availability');
      expect(typeof item.availability).toBe('boolean');
      expect(item).toHaveProperty('priceInUSD');
    }
  });

  it('should trim invalid characters from the query', async () => {
    // Test with a query containing invalid characters
    const result = await caller.search({
      query: 'test@domain!',
      parentDomain: '0x.city',
    });

    // First suggestion should be trimmed
    expect(result.bulkAvailability[0].domain).toBe('testdomain.0x.city');
  });

  it('should use the specified parent domain in suggestions', async () => {
    // Test with defi.build parent domain
    const result = await caller.search({
      query: 'test-domain',
      parentDomain: 'defi.build',
    });

    // First suggestion should be the query
    expect(result.bulkAvailability[0].domain).toBe('test-domain.defi.build');

    // Other suggestions should use defi.build
    for (let i = 1; i < result.suggestions.length; i++) {
      expect(result.suggestions[i].endsWith('defi.build')).toBe(true);
      expect(result.suggestions[i].endsWith('0x.city')).toBe(false);
    }
  });

  it('should generate English word club suggestions', async () => {
    const result = await caller.getDomainSuggestions({
      query: 'test',
      parentDomain: '0x.city',
    });

    expect(result.length).toBeGreaterThan(0);

    // Check that the suggestions include the parent domain
    for (const item of result) {
      expect(item.domain.endsWith('.0x.city')).toBe(true);
    }
  });

  it('should generate number club suggestions', async () => {
    const result = await caller.getDomainSuggestions({
      query: '123',
      parentDomain: '0x.city',
    });

    expect(result.length).toBeGreaterThan(0);

    // Check that the suggestions include the parent domain
    for (const item of result) {
      expect(item.domain.endsWith('.0x.city')).toBe(true);
    }
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
