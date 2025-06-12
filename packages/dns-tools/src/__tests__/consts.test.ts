import { describe, expect, it } from 'vitest';
import {
  DIGEST_TYPE,
  DIGEST_TYPE_DISPLAY_NAME,
  getDigestTypeDisplayName,
  getDigestTypeName,
} from '../consts';

describe('getDigestTypeDisplayName', () => {
  it('should return correct display name for SHA-1', () => {
    const displayName = getDigestTypeDisplayName(DIGEST_TYPE.sha1);
    expect(displayName).toBe(DIGEST_TYPE_DISPLAY_NAME.sha1);
    expect(displayName).toBe('SHA-1');
  });

  it('should return correct display name for SHA-256', () => {
    const displayName = getDigestTypeDisplayName(DIGEST_TYPE.sha256);
    expect(displayName).toBe(DIGEST_TYPE_DISPLAY_NAME.sha256);
    expect(displayName).toBe('SHA-256');
  });

  it('should return correct display name for GOST R 34.11-94', () => {
    const displayName = getDigestTypeDisplayName(DIGEST_TYPE.gost_r3411_94);
    expect(displayName).toBe(DIGEST_TYPE_DISPLAY_NAME.gost_r3411_94);
    expect(displayName).toBe('GOST R 34.11-94');
  });

  it('should return correct display name for SHA-384', () => {
    const displayName = getDigestTypeDisplayName(DIGEST_TYPE.sha384);
    expect(displayName).toBe(DIGEST_TYPE_DISPLAY_NAME.sha384);
    expect(displayName).toBe('SHA-384');
  });

  it('should return null for unknown digest type', () => {
    const displayName = getDigestTypeDisplayName(999 as DIGEST_TYPE);
    expect(displayName).toBeNull();
  });
});

describe('getDigestTypeName', () => {
  it('should return correct crypto name for SHA-1', () => {
    const name = getDigestTypeName(DIGEST_TYPE.sha1);
    expect(name).toBe('sha1');
  });

  it('should return correct crypto name for SHA-256', () => {
    const name = getDigestTypeName(DIGEST_TYPE.sha256);
    expect(name).toBe('sha256');
  });

  it('should return correct crypto name for GOST R 34.11-94', () => {
    const name = getDigestTypeName(DIGEST_TYPE.gost_r3411_94);
    expect(name).toBe('gost_r3411_94');
  });

  it('should return correct crypto name for SHA-384', () => {
    const name = getDigestTypeName(DIGEST_TYPE.sha384);
    expect(name).toBe('sha384');
  });

  it('should return null for unknown digest type', () => {
    const name = getDigestTypeName(999 as DIGEST_TYPE);
    expect(name).toBeNull();
  });
});
