import {
  type UserInsert,
  type UserSelect,
  db,
  usersTable,
} from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import { logger } from '#lib/logger';
import { privyClient } from '#trpc/utils';
import type {
  AuthMethod,
  AuthMethodResult,
  AuthRequestContext,
} from '../../auth-registry';
import {
  SIWE_SIGNATURE_HEADER_HEADERS,
  SIWE_SIGNATURE_HEADER_METHOD_ID,
  getSiweDetailsFromToken,
} from './api-key-siwe';

/**
 * Header-based SIWE authentication.
 *
 * Expected request shape:
 * - Header: x-namefi-signature
 * - Optional header: x-namefi-signer
 * - Raw body: { timestamp, nonce, payload }
 */
async function getUserRowOrCreate(
  userInsert: UserInsert,
): Promise<UserSelect | null> {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.privyUserId, userInsert.privyUserId),
  });
  if (user) {
    return user;
  }
  const newUser = await db
    .insert(usersTable)
    .values({
      ...userInsert,
      lastSignInAt: new Date(),
      lastAccessedSessionAt: new Date(),
    })
    .onConflictDoNothing()
    .returning();

  if (newUser[0]) {
    return newUser[0];
  }
  return (
    (await db.query.usersTable.findFirst({
      where: eq(usersTable.privyUserId, userInsert.privyUserId),
    })) ?? null
  );
}
async function getPrivyUserOrCreateByWalletAddress(signerAddress: string) {
  let privyUser = await privyClient.getUserByWalletAddress(
    signerAddress.toLowerCase(),
  );
  if (!privyUser) {
    privyUser = await privyClient.importUser({
      linkedAccounts: [
        {
          type: 'wallet',
          chainType: 'ethereum',
          address: signerAddress.toLowerCase(),
        },
      ],
    });
    if (!privyUser) {
      return null;
    }
  }
  return privyUser;
}

async function getUserOrCreateBySignerAddress(
  signerAddress: string,
): Promise<UserSelect | null> {
  const privyUser = await getPrivyUserOrCreateByWalletAddress(signerAddress);
  if (!privyUser) {
    return null;
  }

  return await getUserRowOrCreate({
    privyUserId: privyUser.id,
  });
}

export function isSiweTokenAuthRequest(ctx: AuthRequestContext): boolean {
  const siweToken = ctx.headers[SIWE_SIGNATURE_HEADER_HEADERS.TOKEN];
  return !!siweToken;
}

export async function authenticateWithSiweTokenFromHeader(
  ctx: AuthRequestContext,
): Promise<Omit<AuthMethodResult, 'methodId'>> {
  try {
    const siweToken = ctx.headers[SIWE_SIGNATURE_HEADER_HEADERS.TOKEN];
    if (!siweToken) {
      return {
        success: false,
        error: `Missing ${SIWE_SIGNATURE_HEADER_HEADERS.TOKEN} header`,
      };
    }
    const siweDetails = await getSiweDetailsFromToken(siweToken);

    if (!siweDetails) {
      return {
        success: false,
        error: 'Invalid or expired SIWE Token',
      };
    }

    const user = await getUserOrCreateBySignerAddress(
      siweDetails.session.address,
    );

    if (!user) {
      logger.warn(
        { signerAddress: siweDetails.session.address },
        'SIWE signer wallet is not linked to any user',
      );

      return {
        success: false,
        error: 'Signer wallet is not linked to a user',
      };
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    logger.error({ error }, 'SIWE signature-header failed');
    return {
      success: false,
      error: 'Authentication failed',
    };
  }
}

export const SiweAuthMethod: AuthMethod = {
  id: SIWE_SIGNATURE_HEADER_METHOD_ID,
  keyType: 'SIWE_SESSION_TOKEN',
  shouldHandle: isSiweTokenAuthRequest,
  authenticate: authenticateWithSiweTokenFromHeader,
};
