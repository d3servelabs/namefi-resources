import { describe, expect, it } from 'vitest';
import {
  bareHost,
  getCanonicalRedirect,
  isIndexableHost,
} from './host-policy';

describe('bareHost', () => {
  it('strips port and lowercases', () => {
    expect(bareHost('Namefi.IO:3000')).toBe('namefi.io');
  });
  it('handles null/undefined', () => {
    expect(bareHost(null)).toBe('');
    expect(bareHost(undefined)).toBe('');
  });
});

describe('isIndexableHost', () => {
  it.each([['namefi.io'], ['namefi.dev'], ['NAMEFI.IO'], ['namefi.io:443']])(
    'allows %s',
    (host) => {
      expect(isIndexableHost(host)).toBe(true);
    },
  );

  it.each([
    ['app.namefi.io'],
    ['astra.namefi.io'],
    ['www.namefi.io'],
    ['r.namefi.io'],
    ['md.namefi.io'],
    ['api.namefi.io'],
    ['taylor.cv.poweredby.namefi.io'],
    ['backend.astra.namefi.io'],
    ['blog.namefi.io'],
    ['evil.com'],
    [''],
    [null],
    [undefined],
  ])('denies %s', (host) => {
    expect(isIndexableHost(host)).toBe(false);
  });
});

describe('getCanonicalRedirect', () => {
  it.each([
    ['www.namefi.io', 'https://namefi.io'],
    ['astra.namefi.io', 'https://namefi.io'],
    ['app.namefi.io', 'https://namefi.io'],
    ['ASTRA.NAMEFI.IO', 'https://namefi.io'],
    ['astra.namefi.io:443', 'https://namefi.io'],
  ])('redirects %s to %s', (host, expected) => {
    expect(getCanonicalRedirect(host)).toBe(expected);
  });

  it.each([
    ['namefi.io'],
    ['r.namefi.io'],
    ['md.namefi.io'],
    ['taylor.cv.poweredby.namefi.io'],
    [null],
    [undefined],
  ])('does not redirect %s', (host) => {
    expect(getCanonicalRedirect(host)).toBeUndefined();
  });
});
