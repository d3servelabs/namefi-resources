/**
 * JWT Access Token Utilities for x402 Paid Resources
 *
 * Generates and verifies JWT tokens that allow re-access to paid resources
 * without requiring additional payment.
 *
 * Token payload includes:
 * - Resource identifier (e.g., domain name)
 * - Query parameters (e.g., startDate, endDate)
 * - Timestamp of original payment
 * - Expiration time
 */

import * as jose from 'jose';
import { secrets } from '#lib/env';
import { createLogger } from '#lib/logger';

const logger = createLogger({ context: 'X402_JWT_ACCESS' });

/**
 * Payload for x402 access tokens
 */
export interface X402AccessTokenPayload {
  /** Resource type (e.g., 'analytics') */
  resourceType: string;
  /** Resource identifier (e.g., domain name) */
  resourceId: string;
  /** Query parameters that were paid for */
  query: Record<string, string>;
  /** Timestamp when payment was made (ISO string) */
  paidAt: string;
  /** Buyer wallet address */
  buyerWallet: string;
  /** Transaction hash from the payment settlement */
  txHash?: string;
  /** Chain ID where the payment was made */
  chainId?: number;
}

/**
 * Verified token result
 *
 * Standard JWT claims included:
 * - iss (Issuer): "namefi-x402" - identifies the token issuer
 * - iat (Issued At): Unix timestamp when the token was created
 * - exp (Expiration Time): Unix timestamp after which the token is invalid
 */
export interface VerifiedAccessToken {
  valid: true;
  payload: X402AccessTokenPayload;
  /** Expiration time from the JWT 'exp' claim */
  expiresAt: Date;
}

export interface InvalidAccessToken {
  valid: false;
  error: string;
}

export type AccessTokenVerificationResult =
  | VerifiedAccessToken
  | InvalidAccessToken;

/**
 * Default token expiration: 30 days
 */
const DEFAULT_EXPIRATION_DAYS = 30;

/**
 * Get the JWT secret, using X402_JWT_SECRET or falling back to API_AUTH_KEY
 */
function getJwtSecret(): Uint8Array {
  const secret = secrets.X402_JWT_SECRET || secrets.API_AUTH_KEY;
  if (!secret) {
    throw new Error(
      'No JWT secret configured (X402_JWT_SECRET or API_AUTH_KEY)',
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Generate an x402 access token for a paid resource
 *
 * The generated JWT includes standard claims:
 * - iss (Issuer): Identifies the principal that issued the JWT ("namefi-x402")
 * - iat (Issued At): Unix timestamp when the token was created
 * - exp (Expiration Time): Unix timestamp after which the token is invalid
 *
 * @param payload - Token payload with resource details
 * @param expirationDays - Token expiration in days (default: 30)
 * @returns JWT token string
 */
export async function generateAccessToken(
  payload: X402AccessTokenPayload,
  expirationDays: number = DEFAULT_EXPIRATION_DAYS,
): Promise<string> {
  const secret = getJwtSecret();

  const token = await new jose.SignJWT({
    ...payload,
    type: 'x402_access',
  })
    .setProtectedHeader({ alg: 'HS256' }) // Algorithm: HMAC SHA-256
    .setIssuedAt() // iat: Current timestamp (seconds since epoch)
    .setExpirationTime(`${expirationDays}d`) // exp: iat + expirationDays
    .setIssuer('namefi-x402') // iss: Token issuer identifier
    .sign(secret);

  logger.info(
    {
      resourceType: payload.resourceType,
      resourceId: payload.resourceId,
      expirationDays,
    },
    'Generated x402 access token',
  );

  return token;
}

/**
 * Verify an x402 access token
 *
 * @param token - JWT token string
 * @returns Verification result with payload or error
 */
export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenVerificationResult> {
  try {
    const secret = getJwtSecret();

    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: 'namefi-x402',
    });

    // Validate payload structure
    if (payload.type !== 'x402_access') {
      return { valid: false, error: 'Invalid token type' };
    }

    // All four fields are required by X402AccessTokenPayload and are relied on
    // for payment-gated access control downstream, so reject tokens missing any.
    if (
      !payload.resourceType ||
      !payload.resourceId ||
      !payload.paidAt ||
      !payload.buyerWallet
    ) {
      return { valid: false, error: 'Invalid token payload' };
    }

    const accessPayload: X402AccessTokenPayload = {
      resourceType: payload.resourceType as string,
      resourceId: payload.resourceId as string,
      query: (payload.query as Record<string, string>) || {},
      paidAt: payload.paidAt as string,
      buyerWallet: payload.buyerWallet as string,
      txHash: payload.txHash as string | undefined,
      chainId: payload.chainId as number | undefined,
    };

    return {
      valid: true,
      payload: accessPayload,
      expiresAt: new Date((payload.exp as number) * 1000),
    };
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      return { valid: false, error: 'Token expired' };
    }
    if (error instanceof jose.errors.JWTInvalid) {
      return { valid: false, error: 'Invalid token format' };
    }
    if (error instanceof jose.errors.JWSSignatureVerificationFailed) {
      return { valid: false, error: 'Invalid token signature' };
    }

    logger.error({ error }, 'Error verifying access token');
    return { valid: false, error: 'Token verification failed' };
  }
}

/**
 * Check if an access token matches the requested resource
 *
 * @param token - Verified token payload
 * @param resourceType - Expected resource type
 * @param resourceId - Expected resource ID
 * @param query - Expected query parameters (optional - if not provided, any query matches)
 * @returns true if token matches the resource
 */
export function tokenMatchesResource(
  token: X402AccessTokenPayload,
  resourceType: string,
  resourceId: string,
  query?: Record<string, string>,
): boolean {
  // Check resource type and ID
  if (token.resourceType !== resourceType) {
    return false;
  }

  if (token.resourceId !== resourceId) {
    return false;
  }

  // If query is provided, check that all query params match
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (token.query[key] !== value) {
        return false;
      }
    }
  }

  return true;
}
