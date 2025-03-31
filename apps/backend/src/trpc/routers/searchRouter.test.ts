import { config } from 'dotenv';
/**
 * tRPC Integration Test for searchRouter
 *
 * This tests the actual tRPC router implementation.
 * Environment variables are loaded from .env.test
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as namefiRegistry from '#services/namefi-registry';
import type { TrpcContext } from '../base';
import { searchRouter } from './searchRouter';

// TODO: consider use vitest setup to do it globally after NamefiRegistry
config({ path: '.env.test' });

describe('Search Router', () => {
  beforeEach(() => {
    vi.spyOn(namefiRegistry, 'getDomainListInfo').mockImplementation(
      namefiRegistry._mockGetDomainInfo,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Create an actual caller for the router
  // The search router doesn't use context values, so we can use a type assertion
  const caller = searchRouter.createCaller({} as unknown as TrpcContext);

  it('should return search results with suggestions and availability', async () => {
    // Act: Call the actual search procedure with test input
    const result = await caller.search({
      query: 'test-domain',
      parentDomain: '0x.city',
    });

    // Assert: Check the structure of the response
    expect(result).toHaveProperty('suggestions');
    expect(result).toHaveProperty('bulkAvailability');

    // Check suggestions array contents
    expect(Array.isArray(result.suggestions)).toBe(true);
    expect(result.suggestions.length).toBeGreaterThan(0);

    // First suggestion should be the trimmed query
    expect(result.suggestions[0]).toBe('test-domain');

    // Check that other suggestions include the parent domain
    for (let i = 1; i < result.suggestions.length; i++) {
      expect(result.suggestions[i].includes('0x.city')).toBe(true);
    }

    // Check bulk availability array has same length as suggestions
    expect(Array.isArray(result.bulkAvailability)).toBe(true);
    expect(result.bulkAvailability.length).toBe(result.suggestions.length);

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
    expect(result.suggestions[0]).toBe('testdomain');
  });

  it('should use the specified parent domain in suggestions', async () => {
    // Test with defi.build parent domain
    const result = await caller.search({
      query: 'test-domain',
      parentDomain: 'defi.build',
    });

    // First suggestion should be the query
    expect(result.suggestions[0]).toBe('test-domain');

    // Other suggestions should use defi.build
    for (let i = 1; i < result.suggestions.length; i++) {
      expect(result.suggestions[i].includes('defi.build')).toBe(true);
      expect(result.suggestions[i].includes('0x.city')).toBe(false);
    }
  });
});
