import { describe, expect, it } from 'vitest';
import {
  formatUsdCentsForMppAmount,
  getMppResourceMetadata,
  getWalletAddressFromDid,
} from './helpers';

describe('formatUsdCentsForMppAmount', () => {
  it('formats cents as a USD decimal string', () => {
    expect(formatUsdCentsForMppAmount(1234)).toBe('12.34');
    expect(formatUsdCentsForMppAmount(5)).toBe('0.05');
  });
});

describe('getWalletAddressFromDid', () => {
  it('extracts checksum wallet addresses from DID PKH values', () => {
    expect(
      getWalletAddressFromDid(
        'did:pkh:eip155:1:0x0000000000000000000000000000000000000001',
      ),
    ).toBe('0x0000000000000000000000000000000000000001');
  });

  it('returns undefined for unsupported DID formats', () => {
    expect(getWalletAddressFromDid('did:key:abc123')).toBeUndefined();
  });
});

describe('getMppResourceMetadata', () => {
  it('returns domain purchase metadata for responses', () => {
    expect(
      getMppResourceMetadata({
        durationInYears: 2,
        normalizedDomainName: 'example.com',
        nftReceivingWalletAddress: '0x0000000000000000000000000000000000000001',
        priceInUsdCents: 2500,
      }),
    ).toEqual({
      domain: 'example.com',
      durationInYears: 2,
      nftReceivingWalletAddress: '0x0000000000000000000000000000000000000001',
      priceInUsdCents: 2500,
    });
  });
});
