import { describe, expect, it } from 'vitest';
import {
  bareHost,
  buildParkCanonicalUrl,
  isIndexableParkHost,
  isIndexableParkRoot,
  normalizeParkDomainParam,
  shouldNoindexParkRequest,
} from './indexing-policy';

describe('park indexing policy', () => {
  it('normalizes host headers before allowlist checks', () => {
    expect(bareHost('30003.CLICK:443')).toBe('30003.click');
    expect(bareHost('30003.click.')).toBe('30003.click');
    expect(bareHost('[::1]:3003')).toBe('::1');
  });

  it('normalizes domain query params for local convenience URLs', () => {
    expect(normalizeParkDomainParam('<30003.CLICK>')).toBe('30003.click');
    expect(normalizeParkDomainParam('30003.click:443')).toBe('30003.click');
  });

  it('allowlists only the 30003.click apex host', () => {
    expect(isIndexableParkHost('30003.click')).toBe(true);
    expect(isIndexableParkHost('www.30003.click')).toBe(false);
    expect(isIndexableParkHost('namefi.io')).toBe(false);
  });

  it('allows indexing only at the allowlisted root path', () => {
    expect(isIndexableParkRoot({ host: '30003.click', pathname: '/' })).toBe(
      true,
    );
    expect(
      isIndexableParkRoot({ host: '30003.click', pathname: '/marketplaces' }),
    ).toBe(false);
    expect(
      isIndexableParkRoot({
        host: 'localhost',
        pathname: '/',
        search: '?domain=example.com',
      }),
    ).toBe(false);
    expect(
      isIndexableParkRoot({
        host: 'localhost',
        pathname: '/',
        search: '?domain=30003.click',
        domainOverride: '30003.click',
      }),
    ).toBe(true);
    expect(
      isIndexableParkRoot({
        host: 'localhost',
        pathname: '/',
        search: '?domain=%3C30003.click%3E',
        domainOverride: '<30003.click>',
      }),
    ).toBe(true);
    expect(
      isIndexableParkRoot({
        host: 'localhost',
        pathname: '/',
        search: '?domain=30003.click&utm_source=test',
        domainOverride: '30003.click',
      }),
    ).toBe(false);
    expect(isIndexableParkRoot({ host: 'example.com', pathname: '/' })).toBe(
      false,
    );
  });

  it('keeps subpaths crawlable but noindexed by header policy', () => {
    expect(
      shouldNoindexParkRequest({ host: '30003.click', pathname: '/' }),
    ).toBe(false);
    expect(
      shouldNoindexParkRequest({ host: '30003.click', pathname: '/anything' }),
    ).toBe(true);
    expect(
      shouldNoindexParkRequest({
        host: '30003.click',
        pathname: '/',
        search: '?utm_source=test',
      }),
    ).toBe(true);
    expect(
      shouldNoindexParkRequest({
        host: 'localhost',
        pathname: '/',
        search: '?domain=30003.click',
        domainOverride: '30003.click',
      }),
    ).toBe(false);
  });

  it('builds canonical URLs only for allowlisted park roots', () => {
    expect(buildParkCanonicalUrl('30003.click')).toBe('https://30003.click/');
    expect(buildParkCanonicalUrl('localhost', '30003.click')).toBe(
      'https://30003.click/',
    );
    expect(buildParkCanonicalUrl('www.30003.click')).toBeNull();
  });
});
