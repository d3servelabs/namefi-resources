import { checksumWalletAddressSchema } from '@namefi-astra/utils';
import { SignJWT, jwtVerify } from 'jose';
import { z } from 'zod';
import { config, secrets } from '#lib/env';

const API_AUTH_JWT_ISSUER = 'namefi-api';
const API_AUTH_JWT_AUDIENCE = 'namefi-api';
const JWT_ALGORITHM = 'HS256';

const apiAuthJwtPayloadSchema = z.object({
  sub: z.string().uuid(),
  walletAddress: checksumWalletAddressSchema,
  chain: z.string().min(1),
  exp: z.number().int().positive(),
  iat: z.number().int().positive(),
});

export type ApiAuthJwtPayload = {
  chain: string;
  expiresAt: string;
  issuedAt: string;
  token: string;
  userId: string;
  walletAddress: z.infer<typeof checksumWalletAddressSchema>;
};

type CreateApiAuthJwtInput = {
  chain: string;
  userId: string;
  walletAddress: z.infer<typeof checksumWalletAddressSchema>;
  sessionDurationInSeconds?: number;
};

function getApiAuthJwtSecret() {
  if (!secrets.API_AUTH_JWT_SECRET) {
    throw new Error('getApiAuthJwtSecret: This AuthMethod is Not Allowed');
  }
  const apiAuthJwtSecret = new TextEncoder().encode(
    secrets.API_AUTH_JWT_SECRET,
  );
  return apiAuthJwtSecret;
}

export async function createApiAuthJwt(
  input: CreateApiAuthJwtInput,
): Promise<ApiAuthJwtPayload> {
  const apiAuthJwtSecret = getApiAuthJwtSecret();
  const now = Math.floor(Date.now() / 1000);
  const expiresAtSeconds =
    now + (input.sessionDurationInSeconds ?? config.API_AUTH_JWT_TTL_SECONDS);

  const token = await new SignJWT({
    chain: input.chain,
    walletAddress: input.walletAddress,
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM, typ: 'JWT' })
    .setIssuer(API_AUTH_JWT_ISSUER)
    .setAudience(API_AUTH_JWT_AUDIENCE)
    .setSubject(input.userId)
    .setIssuedAt(now)
    .setExpirationTime(expiresAtSeconds)
    .sign(apiAuthJwtSecret);

  return {
    chain: input.chain,
    expiresAt: new Date(expiresAtSeconds * 1000).toISOString(),
    issuedAt: new Date(now * 1000).toISOString(),
    token,
    userId: input.userId,
    walletAddress: input.walletAddress,
  };
}

export type VerifyApiAuthJwtResult =
  | {
      valid: true;
      payload: Omit<ApiAuthJwtPayload, 'token'>;
    }
  | {
      valid: false;
      error: string;
    };

export async function verifyApiAuthJwt(
  token: string,
): Promise<VerifyApiAuthJwtResult> {
  try {
    const apiAuthJwtSecret = getApiAuthJwtSecret();

    const { payload } = await jwtVerify(token, apiAuthJwtSecret, {
      algorithms: [JWT_ALGORITHM],
      audience: API_AUTH_JWT_AUDIENCE,
      issuer: API_AUTH_JWT_ISSUER,
    });

    const parsedPayload = apiAuthJwtPayloadSchema.safeParse(payload);
    if (!parsedPayload.success) {
      return {
        valid: false,
        error: parsedPayload.error.issues[0]?.message || 'Invalid JWT payload',
      };
    }

    return {
      valid: true,
      payload: {
        chain: parsedPayload.data.chain,
        expiresAt: new Date(parsedPayload.data.exp * 1000).toISOString(),
        issuedAt: new Date(parsedPayload.data.iat * 1000).toISOString(),
        userId: parsedPayload.data.sub,
        walletAddress: parsedPayload.data.walletAddress,
      },
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid JWT',
    };
  }
}
