import { describe, expect, it } from 'vitest';
import {
  deserializeInitialAuthSessionSnapshot,
  serializeInitialAuthSessionSnapshot,
} from './auth-initial-snapshot';

describe('initial auth session snapshot serialization', () => {
  it('round-trips Date fields through a JSON-safe snapshot', () => {
    const createdAt = new Date('2026-06-11T01:02:03.000Z');
    const updatedAt = new Date('2026-06-11T02:03:04.000Z');
    const lastAccessedSessionAt = new Date('2026-06-11T03:04:05.000Z');
    const user = {
      id: 'd8988592-91c7-4b2c-a2ca-1eb612386f43',
      privyUserId: 'did:privy:test-user',
      subscribeToEmails: true,
      stripeCustomerId: null,
      createdAt,
      updatedAt,
      lastSignInAt: null,
      lastAccessedSessionAt,
      displayProfile: {
        displayName: 'Test User',
        email: 'test@example.com',
        walletAddress: '0xabc',
      },
    };

    const serialized = serializeInitialAuthSessionSnapshot({
      resolvedAtMs: 1_780_000_000_000,
      session: {
        user,
        permissions: ['READ_USERS'],
        impersonationStatus: {
          impersonating: false,
          actorUserId: user.id,
          targetUserId: null,
          actor: null,
          target: null,
          targetPrivyUser: null,
          effectiveUser: user,
        },
      },
    });

    const deserialized = deserializeInitialAuthSessionSnapshot(serialized);

    expect(deserialized?.resolvedAtMs).toBe(1_780_000_000_000);
    expect(deserialized?.session.user.createdAt).toBeInstanceOf(Date);
    expect(deserialized?.session.user.createdAt.toISOString()).toBe(
      createdAt.toISOString(),
    );
    expect(deserialized?.session.user.updatedAt.toISOString()).toBe(
      updatedAt.toISOString(),
    );
    expect(
      deserialized?.session.user.lastAccessedSessionAt?.toISOString(),
    ).toBe(lastAccessedSessionAt.toISOString());
    expect(deserialized?.session.user.displayProfile).toEqual({
      displayName: 'Test User',
      email: 'test@example.com',
      walletAddress: '0xabc',
    });
    expect(deserialized?.session.permissions).toEqual(['READ_USERS']);
    expect(deserialized?.session.impersonationStatus).toEqual({
      impersonating: false,
      actorUserId: user.id,
      targetUserId: null,
      actor: null,
      target: null,
      targetPrivyUser: null,
      effectiveUser: user,
    });
  });

  it('treats a missing or malformed snapshot as absent', () => {
    expect(deserializeInitialAuthSessionSnapshot(null)).toBeNull();
    expect(
      deserializeInitialAuthSessionSnapshot({
        json: null,
      } as ReturnType<typeof serializeInitialAuthSessionSnapshot>),
    ).toBeNull();
  });
});
