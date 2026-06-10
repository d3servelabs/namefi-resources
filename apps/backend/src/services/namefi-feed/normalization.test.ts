import { describe, expect, it } from 'vitest';
import {
  buildSaleSearchQuery,
  decodeListingCursor,
  encodeListingCursor,
  normalizeCurrencyCode,
  normalizeHandleLookup,
  normalizePriceAndCurrency,
  normalizePublicHttpUrl,
} from './normalization';

describe('Namefi feed normalization', () => {
  it('does not duplicate X search filters', () => {
    expect(buildSaleSearchQuery('domain for sale -is:retweet')).toBe(
      'domain for sale -is:retweet -is:reply',
    );
    expect(buildSaleSearchQuery('domain for sale -is:retweet -is:reply')).toBe(
      'domain for sale -is:retweet -is:reply',
    );
  });

  it('normalizes currency names, symbols, and embedded codes', () => {
    expect(normalizeCurrencyCode('$2,500')).toBe('USD');
    expect(normalizeCurrencyCode('priced in euros')).toBe('EUR');
    expect(normalizeCurrencyCode('15k GBP')).toBe('GBP');
    expect(normalizeCurrencyCode('bitcoin')).toBeNull();
  });

  it('splits display price from currency without duplicating labels', () => {
    expect(
      normalizePriceAndCurrency({
        askingPrice: '$2,500 USD',
        askingCurrency: null,
      }),
    ).toEqual({ askingPrice: '2,500', askingCurrency: 'USD' });

    expect(
      normalizePriceAndCurrency({
        askingPrice: 'EUR 3,000',
        askingCurrency: 'euro',
      }),
    ).toEqual({ askingPrice: '3,000', askingCurrency: 'EUR' });

    expect(
      normalizePriceAndCurrency({
        askingPrice: 'make offer',
        askingCurrency: null,
      }),
    ).toEqual({ askingPrice: 'make offer', askingCurrency: null });
  });

  it('keeps public purchase URLs and rejects unsafe schemes or hosts', () => {
    expect(normalizePublicHttpUrl('https://example.com/buy')).toBe(
      'https://example.com/buy',
    );
    expect(normalizePublicHttpUrl('javascript:alert(1)')).toBeNull();
    expect(
      normalizePublicHttpUrl('https://user:pass@example.com/listing'),
    ).toBeNull();
    expect(normalizePublicHttpUrl('http://127.0.0.1/listing')).toBeNull();
    expect(normalizePublicHttpUrl('http://100.64.0.1/listing')).toBeNull();
    expect(normalizePublicHttpUrl('http://198.18.0.1/listing')).toBeNull();
    expect(normalizePublicHttpUrl('http://203.0.113.10/listing')).toBeNull();
    expect(normalizePublicHttpUrl('http://224.0.0.1/listing')).toBeNull();
    expect(normalizePublicHttpUrl('https://internal.local/listing')).toBeNull();
  });

  it('trims decoded listing cursor ids', () => {
    const cursor = encodeListingCursor(
      new Date('2026-06-02T09:00:00Z'),
      ' abc ',
    );

    expect(decodeListingCursor(cursor)).toEqual({
      sortAt: new Date('2026-06-02T09:00:00Z'),
      id: 'abc',
    });
  });

  it('allows URL-safe forum-style seller handles', () => {
    expect(normalizeHandleLookup('@alice-co')).toBe('alice-co');
    expect(normalizeHandleLookup('alice.co')).toBe('alice.co');
    expect(normalizeHandleLookup('not valid')).toBeNull();
  });

  it('rejects unsafe dot and hyphen seller handle separators', () => {
    expect(normalizeHandleLookup('.alice')).toBeNull();
    expect(normalizeHandleLookup('-alice')).toBeNull();
    expect(normalizeHandleLookup('alice-')).toBeNull();
    expect(normalizeHandleLookup('alice.')).toBeNull();
    expect(normalizeHandleLookup('..')).toBeNull();
    expect(normalizeHandleLookup('--')).toBeNull();
    expect(normalizeHandleLookup('alice..bob')).toBeNull();
    expect(normalizeHandleLookup('alice-.bob')).toBeNull();
    expect(normalizeHandleLookup('alice.-bob')).toBeNull();
  });
});
