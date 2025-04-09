import { describe, expect, it } from 'vitest';
import {
  checksumWalletAddressSchema,
  fqdnLowercaseToNamefiNormalizedDomain,
} from './namefi-flavor';

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

describe('ChecksumWalletAddress', () => {
  it('should validate correct checksum addresses', () => {
    expect(
      checksumWalletAddressSchema.safeParse(
        '0x1234567890123456789012345678901234567890',
      ).success,
    ).toBe(true);

    expect(
      checksumWalletAddressSchema.safeParse(
        '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      ).success,
    ).toBe(true);

    // invalid checksum
    expect(
      checksumWalletAddressSchema.safeParse(
        '0xabcdef0123456789ABCDEF0123456789abcdef01',
      ).success,
    ).toBe(false);
  });

  it('should reject invalid addresses', () => {
    expect(checksumWalletAddressSchema.safeParse('0x123').success).toBe(false);
    expect(
      checksumWalletAddressSchema.safeParse(
        '1234567890123456789012345678901234567890',
      ).success,
    ).toBe(false);
    expect(
      checksumWalletAddressSchema.safeParse(
        '0xG234567890123456789012345678901234567890',
      ).success,
    ).toBe(false);
    expect(
      checksumWalletAddressSchema.safeParse(
        '0x123456789012345678901234567890123456789',
      ).success,
    ).toBe(false);
    expect(checksumWalletAddressSchema.safeParse('').success).toBe(false);
  });

  it('should reject non-string inputs', () => {
    expect(checksumWalletAddressSchema.safeParse(123).success).toBe(false);
    expect(checksumWalletAddressSchema.safeParse(null).success).toBe(false);
    expect(checksumWalletAddressSchema.safeParse(undefined).success).toBe(
      false,
    );
    expect(checksumWalletAddressSchema.safeParse({}).success).toBe(false);
  });

  it('should handle case sensitivity correctly', () => {
    const lowerCaseParseResult = checksumWalletAddressSchema.safeParse(
      '0xabcdef0123456789abcdef0123456789abcdef01',
    );
    const upperCaseParseResult = checksumWalletAddressSchema.safeParse(
      '0xABCDEF0123456789ABCDEF0123456789ABCDEF01',
    );
    expect(lowerCaseParseResult.success).toBe(true);
    expect(lowerCaseParseResult.data).toEqual(
      '0xabCDeF0123456789AbcdEf0123456789aBCDEF01',
    );

    // invalid checksum
    expect(upperCaseParseResult.success).toBe(false);
  });
});
