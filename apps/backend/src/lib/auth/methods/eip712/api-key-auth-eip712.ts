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
  EIP712_SIGNATURE_HEADER_HEADERS,
  EIP712_SIGNATURE_HEADER_METHOD_ID,
  consumeEIP712SignatureNonce,
  isValidEIP712SignatureTimestamp,
  parseEIP712SignatureEnvelope,
  verifyEIP712RawBodySignature,
} from './api-key-eip712';

/**
 * Header-based EIP712 authentication.
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

export function isEIP712SignatureHeaderAuthRequest(
  ctx: AuthRequestContext,
): boolean {
  const signature = ctx.headers[EIP712_SIGNATURE_HEADER_HEADERS.SIGNATURE];
  if (!signature) {
    return false;
  }

  // Avoid collisions with existing auth methods.
  if (ctx.headers['x-namefi-access-key']) {
    return false;
  }

  if (ctx.headers['x-namefi-key-id']) {
    return false;
  }

  if (ctx.headers['x-api-key']) {
    return false;
  }

  return (
    !!ctx.headers[EIP712_SIGNATURE_HEADER_HEADERS.SIGNER] &&
    !!ctx.headers[EIP712_SIGNATURE_HEADER_HEADERS.TYPE]
  );
}

export async function authenticateWithEIP712SignatureHeader(
  ctx: AuthRequestContext,
): Promise<Omit<AuthMethodResult, 'methodId'>> {
  try {
    const signature = ctx.headers[EIP712_SIGNATURE_HEADER_HEADERS.SIGNATURE];
    if (!signature) {
      return {
        success: false,
        error: 'Missing x-namefi-signature header',
      };
    }

    const parsedEnvelope = parseEIP712SignatureEnvelope(ctx.rawBody);
    if (!parsedEnvelope.valid || !parsedEnvelope.envelope) {
      return {
        success: false,
        error: parsedEnvelope.error || 'Invalid signed request body',
      };
    }

    if (!isValidEIP712SignatureTimestamp(parsedEnvelope.envelope.timestamp)) {
      return {
        success: false,
        error: 'Signature timestamp is invalid or expired',
      };
    }

    const expectedSignerAddress =
      ctx.headers[EIP712_SIGNATURE_HEADER_HEADERS.SIGNER];
    const expectedType = ctx.headers[EIP712_SIGNATURE_HEADER_HEADERS.TYPE];

    const signatureVerification = await verifyEIP712RawBodySignature({
      rawBody: ctx.rawBody,
      signature,
      expectedSignerAddress,
      types: ctx.eip712Types ?? {},
      primaryType: expectedType ?? '', //todo
    });

    if (
      !signatureVerification.valid ||
      !signatureVerification.recoveredAddress
    ) {
      return {
        success: false,
        error: signatureVerification.error || 'Invalid signature',
      };
    }

    const nonceResult = await consumeEIP712SignatureNonce({
      signerAddress: signatureVerification.recoveredAddress,
      nonce: parsedEnvelope.envelope.nonce,
    });

    if (!nonceResult.valid) {
      return {
        success: false,
        error: nonceResult.error || 'Nonce validation failed',
      };
    }

    const user = await getUserOrCreateBySignerAddress(
      signatureVerification.recoveredAddress,
    );

    if (!user) {
      logger.warn(
        { signerAddress: signatureVerification.recoveredAddress },
        'EIP712 signer wallet is not linked to any user',
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
    logger.error({ error }, 'EIP712 signature-header failed');
    return {
      success: false,
      error: 'Authentication failed',
    };
  }
}

export const eip712AuthMethod: AuthMethod = {
  id: EIP712_SIGNATURE_HEADER_METHOD_ID,
  keyType: 'EIP712',
  shouldHandle: isEIP712SignatureHeaderAuthRequest,
  authenticate: authenticateWithEIP712SignatureHeader,
};
