import { describe, expect, it } from 'vitest';
import {
  getMlsDomainDisplayParts,
  getMlsDomainMark,
} from './mls-domain-display';

describe('getMlsDomainDisplayParts', () => {
  it('decodes punycode domains before splitting display parts', () => {
    expect(getMlsDomainDisplayParts('xn--p8jucybyu3erc.xyz')).toEqual({
      full: 'うちはマダラ.xyz',
      label: 'うちはマダラ',
      tld: 'xyz',
    });
  });

  it('keeps invalid domains displayable without throwing', () => {
    expect(getMlsDomainDisplayParts('not a domain')).toEqual({
      full: 'not a domain',
      label: 'not a domain',
      tld: null,
    });
  });
});

describe('getMlsDomainMark', () => {
  it('uses the first Unicode letter for IDN labels', () => {
    expect(getMlsDomainMark('うちはマダラ')).toBe('う');
  });
});
