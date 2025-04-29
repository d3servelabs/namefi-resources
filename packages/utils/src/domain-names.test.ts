import { describe, expect, it } from 'vitest';
import { getSubDomainAndParentDomainFromNormalizedDomainName } from './domain-names';

describe('getSubDomainAndParentDomainFromNormalizedDomainName', () => {
  it('should correctly split a basic domain name', () => {
    const result =
      getSubDomainAndParentDomainFromNormalizedDomainName('test.example.com');
    expect(result.subdomain).toBe('test');
    expect(result.parentDomain).toBe('example.com');
  });

  it('should handle domains with multiple levels', () => {
    const result =
      getSubDomainAndParentDomainFromNormalizedDomainName('test.example.co.uk');
    expect(result.subdomain).toBe('test');
    expect(result.parentDomain).toBe('example.co.uk');
  });

  it('should handle domains without a subdomain correctly', () => {
    const result =
      getSubDomainAndParentDomainFromNormalizedDomainName('example.com');
    expect(result.subdomain).toBe('example');
    expect(result.parentDomain).toBe('com');
  });

  it('should handle specific domains used in the app', () => {
    const result =
      getSubDomainAndParentDomainFromNormalizedDomainName('netizen1.0x.city');
    expect(result.subdomain).toBe('netizen1');
    expect(result.parentDomain).toBe('0x.city');
  });
});
