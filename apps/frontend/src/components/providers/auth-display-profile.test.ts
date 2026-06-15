import { describe, expect, it } from 'vitest';
import {
  areAuthDisplayProfilesEqual,
  getAuthContactEmail,
  getAuthContactEmailFromRuntimeUser,
  getAuthDisplayProfileSafeIdentifier,
  getAuthDisplayProfileFromRuntimeUser,
  isUsefulAuthDisplayProfile,
  mergeAuthDisplayProfiles,
} from './auth-display-profile';

describe('auth display profile helpers', () => {
  it('extracts safe display fields from runtime Privy users', () => {
    expect(
      getAuthDisplayProfileFromRuntimeUser({
        id: 'did:privy:user',
        customMetadata: { fullName: ' Ada Lovelace ' },
        email: { address: ' ada@example.com ' },
        wallet: { address: ' 0xabc ' },
      }),
    ).toEqual({
      displayName: 'Ada Lovelace',
      email: 'ada@example.com',
      walletAddress: '0xabc',
    });
  });

  it('falls back to linked account email and wallet values', () => {
    expect(
      getAuthDisplayProfileFromRuntimeUser({
        id: 'did:privy:user',
        linkedAccounts: [
          { type: 'email', address: ' linked@example.com ' },
          { type: 'wallet', address: ' 0xlinked ' },
        ],
      }),
    ).toEqual({
      displayName: null,
      email: 'linked@example.com',
      walletAddress: '0xlinked',
    });
  });

  it('extracts contact email from top-level runtime email only', () => {
    expect(
      getAuthContactEmailFromRuntimeUser({
        email: { address: ' runtime@example.com ' },
      }),
    ).toBe('runtime@example.com');

    expect(
      getAuthContactEmailFromRuntimeUser({
        linkedAccounts: [{ type: 'email', address: ' linked@example.com ' }],
      }),
    ).toBeNull();

    expect(
      getAuthContactEmailFromRuntimeUser({
        google: { email: 'google@example.com' },
      }),
    ).toBeNull();
  });

  it('falls back to identity-token display email when runtime email is unavailable', () => {
    expect(
      getAuthContactEmail({
        privyUser: null,
        unsafeDisplayProfile: {
          displayName: null,
          email: ' identity@example.com ',
          walletAddress: '0xabc',
        },
      }),
    ).toBe('identity@example.com');
  });

  it('does not treat internal ids as useful display fields', () => {
    expect(
      getAuthDisplayProfileFromRuntimeUser({ id: 'did:privy:user' }),
    ).toBeNull();
    expect(isUsefulAuthDisplayProfile(null)).toBe(false);
  });

  it('lets real runtime data replace stale cached fields while preserving missing fields', () => {
    expect(
      mergeAuthDisplayProfiles(
        {
          displayName: 'Ada Lovelace',
          email: 'ada@namefi.test',
          walletAddress: null,
        },
        {
          displayName: null,
          email: 'runtime@example.com',
          walletAddress: '0xruntime',
        },
      ),
    ).toEqual({
      displayName: 'Ada Lovelace',
      email: 'runtime@example.com',
      walletAddress: '0xruntime',
    });
  });

  it('returns a display-only safe identifier without internal ids', () => {
    expect(
      getAuthDisplayProfileSafeIdentifier({
        displayName: null,
        email: 'ada@example.com',
        walletAddress: '0xabc',
      }),
    ).toBe('ada@example.com');
    expect(getAuthDisplayProfileSafeIdentifier(null)).toBeNull();
  });

  it('compares display profiles by their safe fields', () => {
    expect(
      areAuthDisplayProfilesEqual(
        { displayName: null, email: 'ada@example.com', walletAddress: null },
        { displayName: null, email: 'ada@example.com', walletAddress: null },
      ),
    ).toBe(true);

    expect(
      areAuthDisplayProfilesEqual(
        { displayName: null, email: 'ada@example.com', walletAddress: null },
        { displayName: null, email: 'grace@example.com', walletAddress: null },
      ),
    ).toBe(false);
  });
});
