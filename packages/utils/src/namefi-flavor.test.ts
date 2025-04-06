import { describe, expect, it } from 'vitest';
import { fqdnLowercaseToNamefiNormalizedDomain } from './namefi-flavor';

describe('fqdnLowercaseToNamefiNormalizedDomain', () => {
  it('should normalize valid domain names correctly', () => {
    expect(fqdnLowercaseToNamefiNormalizedDomain('example.com.')).toBe(
      'example.com',
    );
    expect(fqdnLowercaseToNamefiNormalizedDomain('sub.example.com.')).toBe(
      'sub.example.com',
    );
    expect(fqdnLowercaseToNamefiNormalizedDomain('test-domain.com.')).toBe(
      'test-domain.com',
    );
  });

  it('should handle trailing dots correctly', () => {
    expect(fqdnLowercaseToNamefiNormalizedDomain('example.com.')).toBe(
      'example.com',
    );
    expect(fqdnLowercaseToNamefiNormalizedDomain('sub.example.com.')).toBe(
      'sub.example.com',
    );
    expect(fqdnLowercaseToNamefiNormalizedDomain('example.com.')).toBe(
      'example.com',
    );
  });

  it('should throw error for invalid domain names', () => {
    expect(() =>
      fqdnLowercaseToNamefiNormalizedDomain('ExAmPlE.CoM.'),
    ).toThrow();
    expect(() =>
      fqdnLowercaseToNamefiNormalizedDomain('Sub.Example.COM.'),
    ).toThrow();
    expect(() => fqdnLowercaseToNamefiNormalizedDomain('!')).toThrow();
    expect(() =>
      fqdnLowercaseToNamefiNormalizedDomain('example..com.'),
    ).toThrow();
    expect(() =>
      fqdnLowercaseToNamefiNormalizedDomain('-example.com.'),
    ).toThrow();
    expect(() =>
      fqdnLowercaseToNamefiNormalizedDomain('example-.com.'),
    ).toThrow();
    expect(() =>
      fqdnLowercaseToNamefiNormalizedDomain('exam ple.com.'),
    ).toThrow();
  });
});
