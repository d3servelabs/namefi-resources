import { db, usersTable } from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import { logger } from '#lib/logger';
import { verifyApiAuthJwt } from '#lib/auth/jwt';
import type {
  AuthMethod,
  AuthMethodResult,
  AuthRequestContext,
} from '../../auth-registry';

export const JWT_AUTH_METHOD_ID = 'jwt-bearer';
export const AUTHORIZATION_HEADER = 'authorization';

function extractBearerToken(authorizationHeader?: string) {
  if (!authorizationHeader) {
    return null;
  }

  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export function isJwtBearerAuthRequest(ctx: AuthRequestContext): boolean {
  return !!extractBearerToken(ctx.headers[AUTHORIZATION_HEADER]);
}

export async function authenticateWithJwtBearer(
  ctx: AuthRequestContext,
): Promise<Omit<AuthMethodResult, 'methodId'>> {
  try {
    const token = extractBearerToken(ctx.headers[AUTHORIZATION_HEADER]);
    if (!token) {
      return {
        success: false,
        error: 'Missing Bearer token',
      };
    }

    const verificationResult = await verifyApiAuthJwt(token);
    if (!verificationResult.valid) {
      return {
        success: false,
        error: verificationResult.error,
      };
    }

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, verificationResult.payload.userId),
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found for JWT',
      };
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    logger.debug({ error }, 'JWT bearer authentication failed');
    return {
      success: false,
      error: 'Authentication failed',
    };
  }
}

export const jwtBearerAuthMethod: AuthMethod = {
  id: JWT_AUTH_METHOD_ID,
  keyType: 'JWT_BEARER',
  shouldHandle: isJwtBearerAuthRequest,
  authenticate: authenticateWithJwtBearer,
};
