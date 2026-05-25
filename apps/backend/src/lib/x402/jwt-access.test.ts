import { secrets } from '#lib/env';
import * as jose from 'jose';
import { describe, expect, it } from 'vitest';
import {
  generateAccessToken,
  tokenMatchesResource,
  verifyAccessToken,
  type X402AccessTokenPayload,
} from './jwt-access';

/**
 * The same secret `jwt-access`'s `getJwtSecret()` resolves, so adversarial
 * tokens crafted here with `jose` are signed with the key the verifier expects.
 */
const JWT_SECRET = secrets.X402_JWT_SECRET || secrets.API_AUTH_KEY;

const basePayload: X402AccessTokenPayload = {
  resourceType: 'analytics',
  resourceId: 'example.com',
  query: { startDate: '7daysAgo', endDate: 'today' },
  paidAt: '2026-01-01T00:00:00.000Z',
  buyerWallet: '0x0000000000000000000000000000000000000001',
  txHash: '0xabc',
  chainId: 84532,
};

/** Sign a raw JWT with the real secret to craft adversarial tokens. */
async function signRaw(
  claims: Record<string, unknown>,
  opts: { issuer?: string; expiresInSeconds?: number } = {},
): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  const now = Math.floor(Date.now() / 1000);
  return new jose.SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + (opts.expiresInSeconds ?? 3600))
    .setIssuer(opts.issuer ?? 'namefi-x402')
    .sign(secret);
}

describe('x402 jwt-access', () => {
  describe('generateAccessToken / verifyAccessToken', () => {
    it('round-trips a valid token', async () => {
      const token = await generateAccessToken(basePayload);
      const result = await verifyAccessToken(token);

      expect(result.valid).toBe(true);
      if (!result.valid) throw new Error('expected a valid token');
      expect(result.payload.resourceType).toBe('analytics');
      expect(result.payload.resourceId).toBe('example.com');
      expect(result.payload.query).toEqual(basePayload.query);
      expect(result.payload.paidAt).toBe(basePayload.paidAt);
      expect(result.payload.buyerWallet).toBe(basePayload.buyerWallet);
      expect(result.payload.chainId).toBe(84532);
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('rejects an expired token', async () => {
      const token = await signRaw(
        { type: 'x402_access', ...basePayload },
        { expiresInSeconds: -3600 },
      );
      const result = await verifyAccessToken(token);
      expect(result).toEqual({ valid: false, error: 'Token expired' });
    });

    it('rejects a malformed token', async () => {
      const result = await verifyAccessToken('this-is-not-a-jwt');
      expect(result.valid).toBe(false);
    });

    it('rejects a token signed with a different secret', async () => {
      const wrongSecret = new TextEncoder().encode(
        'a-totally-different-secret',
      );
      const token = await new jose.SignJWT({
        type: 'x402_access',
        ...basePayload,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .setIssuer('namefi-x402')
        .sign(wrongSecret);
      const result = await verifyAccessToken(token);
      expect(result).toEqual({
        valid: false,
        error: 'Invalid token signature',
      });
    });

    it('rejects a token with the wrong type', async () => {
      const token = await signRaw({ type: 'not-x402', ...basePayload });
      const result = await verifyAccessToken(token);
      expect(result).toEqual({ valid: false, error: 'Invalid token type' });
    });

    it('rejects a token missing required paidAt / buyerWallet fields', async () => {
      const token = await signRaw({
        type: 'x402_access',
        resourceType: 'analytics',
        resourceId: 'example.com',
        query: {},
      });
      const result = await verifyAccessToken(token);
      expect(result).toEqual({ valid: false, error: 'Invalid token payload' });
    });

    it('rejects a token from an unexpected issuer', async () => {
      const token = await signRaw(
        { type: 'x402_access', ...basePayload },
        { issuer: 'some-other-issuer' },
      );
      const result = await verifyAccessToken(token);
      expect(result.valid).toBe(false);
    });
  });

  describe('tokenMatchesResource', () => {
    it('matches when type, id and query all match', () => {
      expect(
        tokenMatchesResource(basePayload, 'analytics', 'example.com', {
          startDate: '7daysAgo',
          endDate: 'today',
        }),
      ).toBe(true);
    });

    it('does not match a different resource id', () => {
      expect(tokenMatchesResource(basePayload, 'analytics', 'other.com')).toBe(
        false,
      );
    });

    it('does not match a different resource type', () => {
      expect(tokenMatchesResource(basePayload, 'other', 'example.com')).toBe(
        false,
      );
    });

    it('does not match when a query param differs', () => {
      expect(
        tokenMatchesResource(basePayload, 'analytics', 'example.com', {
          startDate: '30daysAgo',
          endDate: 'today',
        }),
      ).toBe(false);
    });

    it('matches the resource when no query is provided', () => {
      expect(
        tokenMatchesResource(basePayload, 'analytics', 'example.com'),
      ).toBe(true);
    });
  });
});
