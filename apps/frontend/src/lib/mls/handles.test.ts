import { describe, expect, it } from 'vitest';
import {
  getMlsFeedSourceLabel,
  getMlsHandlePath,
  normalizeMlsFeedSource,
} from './handles';

describe('normalizeMlsFeedSource', () => {
  it('accepts known feed source ids case-insensitively', () => {
    expect(normalizeMlsFeedSource('X')).toBe('x');
    expect(normalizeMlsFeedSource(' NamePros ')).toBe('namepros');
    expect(normalizeMlsFeedSource('dnforum')).toBe('dnforum');
    expect(normalizeMlsFeedSource('namefi_marketplace')).toBe(
      'namefi_marketplace',
    );
  });

  it('rejects unknown or malformed feed source ids', () => {
    expect(normalizeMlsFeedSource('platform')).toBeNull();
    expect(normalizeMlsFeedSource('../x')).toBeNull();
  });
});

describe('getMlsFeedSourceLabel', () => {
  it('returns display labels for feed source ids', () => {
    expect(getMlsFeedSourceLabel('x')).toBe('X');
    expect(getMlsFeedSourceLabel('namefi_marketplace')).toBe('Namefi');
    expect(getMlsFeedSourceLabel(null)).toBeNull();
  });
});

describe('getMlsHandlePath', () => {
  it('namespaces seller handle paths by feed source', () => {
    expect(getMlsHandlePath('x', '@alice')).toBe('/feed/users/x/alice');
    expect(getMlsHandlePath('namepros', '@alice')).toBe(
      '/feed/users/namepros/alice',
    );
  });

  it('keeps URL-safe forum-style seller slugs', () => {
    expect(getMlsHandlePath('dnforum', 'alice-co')).toBe(
      '/feed/users/dnforum/alice-co',
    );
    expect(getMlsHandlePath('namepros', 'alice.co')).toBe(
      '/feed/users/namepros/alice.co',
    );
  });

  it('returns null when the source or handle is invalid', () => {
    expect(getMlsHandlePath('platform', '@alice')).toBeNull();
    expect(getMlsHandlePath('x', 'not valid')).toBeNull();
    expect(getMlsHandlePath('x', '.alice')).toBeNull();
    expect(getMlsHandlePath('x', 'alice-')).toBeNull();
    expect(getMlsHandlePath('x', 'alice..bob')).toBeNull();
    expect(getMlsHandlePath('x', 'alice.-bob')).toBeNull();
  });
});
