import { describe, expect, it } from 'vitest';
import {
  getUserDisplayIdentifier,
  getUserDisplayName,
  getUserDisplaySafeIdentifier,
  getUserDisplaySafeIdentifierPair,
} from './user';

describe('user display helpers', () => {
  it('uses human-readable Privy profile fields for safe auth display', () => {
    expect(
      getUserDisplaySafeIdentifier({
        id: 'did:privy:user',
        customMetadata: { fullName: 'Ada Lovelace' },
        email: { address: 'ada@example.com' },
        wallet: { address: '0x123' },
      }),
    ).toBe('Ada Lovelace');

    expect(
      getUserDisplaySafeIdentifier({
        id: 'did:privy:user',
        email: { address: 'ada@example.com' },
      }),
    ).toBe('ada@example.com');

    expect(
      getUserDisplaySafeIdentifier({
        id: 'did:privy:user',
        linkedAccounts: [{ type: 'email', address: 'linked@example.com' }],
      }),
    ).toBe('linked@example.com');

    expect(
      getUserDisplaySafeIdentifier({
        id: 'did:privy:user',
        linkedAccounts: [{ type: 'wallet', address: '0x123' }],
      }),
    ).toBe('0x123');
  });

  it('does not treat internal ids as safe auth display values', () => {
    expect(getUserDisplaySafeIdentifier({ id: 'did:privy:user' })).toBeNull();
    expect(
      getUserDisplaySafeIdentifier({
        id: 'd8988592-91c7-4b2c-a2ca-1eb612386f43',
      }),
    ).toBeNull();
    expect(getUserDisplaySafeIdentifier({ id: 'app-user-123' })).toBeNull();
  });

  it('builds profile header identifiers without exposing Privy DIDs', () => {
    expect(
      getUserDisplaySafeIdentifierPair({
        id: 'did:privy:user',
        email: { address: 'ada@example.com' },
        wallet: { address: '0x123' },
      }),
    ).toEqual({
      primary: '0x123',
      secondary: 'ada@example.com',
    });

    expect(
      getUserDisplaySafeIdentifierPair({
        id: 'did:privy:user',
      }),
    ).toEqual({
      primary: null,
      secondary: null,
    });
  });

  it('keeps the legacy display helpers unchanged for non-auth call sites', () => {
    expect(getUserDisplayIdentifier({ id: 'app-user-123' })).toBe(
      'app-user-123',
    );
    expect(getUserDisplayName(null)).toBe('Account');
  });
});
