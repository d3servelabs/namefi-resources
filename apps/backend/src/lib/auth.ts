import { type UserSelect, db, usersTable } from '@namefi-astra/db';
import {
  privyCustomMetadataSchema,
  privyStorageToPrivyCustomMetadata,
} from '@namefi-astra/common/privy-custom-metadata';
import { CHAINS } from '@namefi-astra/utils';
import { eq, sql } from 'drizzle-orm';
import { privyClient } from '../trpc/utils';
import { config, secrets } from '#lib/env';
import { debounceTime, groupBy, mergeMap, Subject, bufferTime } from 'rxjs';
import { logger } from '#lib/logger';
import { temporalClient } from '#temporal/client';
import { TEMPORAL_QUEUES } from '#temporal/shared/enums';
import { mintDevSignupNfscWorkflow } from '#temporal/workflows/mint-dev-signup-nfsc.workflow';
import type { User as PrivyIdentityUser } from '@privy-io/server-auth';

/**
 * Shared authentication utility for verifying Privy auth tokens
 * and creating/fetching users from the database.
 */

export interface AuthResult {
  user: UserSelect | null;
  sessionId: string | null;
  error?: string;
  isNewUser?: boolean;
  tokenIssuedAt?: Date;
}

export type AuthIdentityDisplayProfile = {
  displayName: string | null;
  email: string | null;
  walletAddress: string | null;
};

type PrivyIdentityLinkedAccount = PrivyIdentityUser['linkedAccounts'][number];

function normalizeDisplayValue(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeIdentityDisplayProfile(
  displayProfile: AuthIdentityDisplayProfile,
): AuthIdentityDisplayProfile | null {
  if (
    !displayProfile.displayName &&
    !displayProfile.email &&
    !displayProfile.walletAddress
  ) {
    return null;
  }

  return displayProfile;
}

function getLinkedAccount(
  user: PrivyIdentityUser,
  type: PrivyIdentityLinkedAccount['type'],
) {
  return user.linkedAccounts.find((account) => account.type === type);
}

function getLinkedAccountAddress(
  user: PrivyIdentityUser,
  type: 'email' | 'wallet',
) {
  const account = getLinkedAccount(user, type);
  if (!account || !('address' in account)) return null;

  return normalizeDisplayValue(account.address);
}

function getIdentityCustomMetadata(user: PrivyIdentityUser) {
  if (
    user.customMetadata &&
    typeof user.customMetadata === 'object' &&
    'data' in user.customMetadata
  ) {
    const storageMetadata = privyStorageToPrivyCustomMetadata.safeParse(
      user.customMetadata,
    );
    if (storageMetadata.success) {
      return storageMetadata.data;
    }
  }

  const directMetadata = privyCustomMetadataSchema.safeParse(
    user.customMetadata,
  );
  return directMetadata.success ? directMetadata.data : null;
}

function getIdentityDisplayProfile(
  user: PrivyIdentityUser,
): AuthIdentityDisplayProfile | null {
  const customMetadata = getIdentityCustomMetadata(user);

  return normalizeIdentityDisplayProfile({
    displayName: normalizeDisplayValue(customMetadata?.fullName),
    email: getLinkedAccountAddress(user, 'email'),
    walletAddress: getLinkedAccountAddress(user, 'wallet'),
  });
}

export async function resolveAuthIdentityDisplayProfile({
  identityToken,
  privyUserId,
}: {
  identityToken?: string | null;
  privyUserId: string;
}): Promise<AuthIdentityDisplayProfile | null> {
  if (!identityToken) {
    return null;
  }

  try {
    const identityUser = await privyClient.getUser({
      idToken: identityToken,
    });

    if (identityUser.id !== privyUserId) {
      logger.warn(
        { privyUserId, identityTokenPrivyUserId: identityUser.id },
        'Ignoring Privy identity token for a different user',
      );
      return null;
    }

    return getIdentityDisplayProfile(identityUser);
  } catch (error) {
    logger.debug(
      { error, privyUserId },
      'Failed to verify Privy identity token for display profile',
    );
    return null;
  }
}

async function maybeStartDevSignupNfscMint(user: UserSelect) {
  if (!config.DEV_NFSC_ENABLED || config.DEV_NFSC_SIGNUP_MINT_AMOUNT <= 0) {
    return;
  }

  const workflowInput = {
    userId: user.id,
    privyUserId: user.privyUserId,
    chainId: CHAINS.sepolia.id,
    amountInUsd: config.DEV_NFSC_SIGNUP_MINT_AMOUNT,
  };
  const workflowId = mintDevSignupNfscWorkflow.generateId({
    userId: user.id,
  });

  try {
    await temporalClient.workflow.start(mintDevSignupNfscWorkflow, {
      workflowId,
      taskQueue: TEMPORAL_QUEUES.DEFAULT,
      args: [workflowInput],
      workflowRunTimeout: '3 days',
      workflowIdReusePolicy: 'ALLOW_DUPLICATE',
      workflowIdConflictPolicy: 'USE_EXISTING',
      searchAttributes: {
        callerType: ['system'],
        caller: ['auth.signup'],
        userId: [user.id],
        affectedResources: ['nfsc', `nfsc:${user.id}`],
      },
      memo: {
        description: 'Dev signup NFSC mint workflow',
        userId: user.id,
        privyUserId: user.privyUserId,
        amountInUsd: config.DEV_NFSC_SIGNUP_MINT_AMOUNT,
        chainId: CHAINS.sepolia.id,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error(
      { error, userId: user.id },
      'Failed to start dev signup NFSC mint workflow',
    );
  }
}

async function resolveAuthenticatedDbUser({
  lastAccessedSessionAt,
  lastSignInAt,
  privyUserId,
}: {
  lastAccessedSessionAt: Date;
  lastSignInAt: Date;
  privyUserId: string;
}): Promise<{ user: UserSelect; isNewUser: boolean }> {
  const [existingUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.privyUserId, privyUserId))
    .limit(1)
    .$withCache();

  if (existingUser) {
    updateUserLastSignInAtSubject.next({
      userId: existingUser.id,
      lastSignInAt,
      lastAccessedSessionAt,
    });
    return { user: existingUser, isNewUser: false };
  }

  // TODO: handle this via webhook
  const [newUser] = await db
    .insert(usersTable)
    .values({
      privyUserId,
      lastSignInAt,
      lastAccessedSessionAt,
    })
    .onConflictDoNothing({
      target: usersTable.privyUserId,
    })
    .returning();
  if (newUser) {
    await maybeStartDevSignupNfscMint(newUser);
    return { user: newUser, isNewUser: true };
  }

  const [conflictingUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.privyUserId, privyUserId))
    .limit(1);
  if (!conflictingUser) {
    throw new Error('Failed to resolve authenticated user after insert race');
  }

  updateUserLastSignInAtSubject.next({
    userId: conflictingUser.id,
    lastSignInAt,
    lastAccessedSessionAt,
  });
  return { user: conflictingUser, isNewUser: false };
}

/**
 * Verifies a Privy authentication token and returns the associated user.
 * Creates a new user if one doesn't exist.
 * Returns null if no token is provided or if verification fails.
 *
 * @param authHeader - The Authorization header value (e.g., "Bearer <token>")
 * @param testUser - Optional test user for testing environments
 * @returns AuthResult with user or null, and optional error message
 */
export async function verifyUserAuthAndGetUser(
  authHeader?: string,
  testUser?: UserSelect | null,
): Promise<AuthResult> {
  // Return test user if provided (for testing environments)
  if (testUser) {
    return { user: testUser, sessionId: null };
  }

  // Extract token from Authorization header
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, sessionId: null };
  }

  const authToken = authHeader.replace('Bearer ', '');

  try {
    // Verify the token with Privy
    const userClaims = await privyClient.verifyAuthToken(
      authToken,
      secrets.PRIVY_SIGNATURE_VERIFICATION_KEY ?? undefined,
    );

    // Token's issuedAt represents when the user actually signed in
    // Current time represents when they're accessing this session
    const lastSignInAt = userClaims.issuedAt
      ? new Date(userClaims.issuedAt * 1000)
      : new Date();
    const lastAccessedSessionAt = new Date();

    const { user, isNewUser } = await resolveAuthenticatedDbUser({
      lastAccessedSessionAt,
      lastSignInAt,
      privyUserId: userClaims.userId,
    });

    return {
      user,
      sessionId: userClaims.sessionId ?? null,
      isNewUser,
      tokenIssuedAt: lastSignInAt,
    };
  } catch (error) {
    logger.debug(
      { error },
      'Failed to verify Privy auth token or resolve user',
    );
    // Return null user with error info for debugging
    return {
      user: null,
      sessionId: null,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

/**
 * Verifies a Privy authentication token and returns the associated user.
 * Throws an error if authentication fails (for protected routes).
 *
 * @param authHeader - The Authorization header value (e.g., "Bearer <token>")
 * @param testUser - Optional test user for testing environments
 * @returns The authenticated user
 * @throws Error if authentication fails or no token provided
 */
export async function requireUserAuth(
  authHeader?: string,
  testUser?: UserSelect | null,
): Promise<{
  user: UserSelect;
  sessionId: string | null;
  isNewUser: boolean;
  tokenIssuedAt: Date | null;
}> {
  if (testUser) {
    return {
      user: testUser,
      sessionId: null,
      isNewUser: false,
      tokenIssuedAt: null,
    };
  }

  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Authorization header missing or invalid');
  }

  const result = await verifyUserAuthAndGetUser(authHeader, testUser);

  if (!result.user) {
    throw new Error(result.error || 'Authentication failed');
  }

  return {
    user: result.user,
    sessionId: result.sessionId,
    isNewUser: result.isNewUser ?? false,
    tokenIssuedAt: result.tokenIssuedAt ?? null,
  };
}

interface UpdateUserLastSignInAt {
  userId: string;
  lastSignInAt: Date;
  lastAccessedSessionAt: Date;
}
// Create a Subject to handle materialized view refresh notifications
const updateUserLastSignInAtSubject = new Subject<UpdateUserLastSignInAt>();

// Setup debounced refresh handling - debounce by 1 second per materialized view
updateUserLastSignInAtSubject
  .pipe(
    groupBy((update) => update.userId),
    mergeMap((group) => group.pipe(debounceTime(30_000))),
    bufferTime(60_000, null, 10), // Buffer for 1 minute, max 10 updates
  )
  .subscribe(async (updates) => {
    try {
      logger.trace({ updates }, 'Updating user last sign in at');
      if (updates.length === 0) return;
      const updatesMap = new Map<string, UpdateUserLastSignInAt>();
      for (const update of updates) {
        updatesMap.set(update.userId, {
          lastSignInAt: update.lastSignInAt,
          lastAccessedSessionAt: update.lastAccessedSessionAt,
          userId: update.userId,
        });
      }
      const updateStatements = Array.from(updatesMap.values()).map((update) => {
        return db
          .update(usersTable)
          .set({
            lastSignInAt: update.lastSignInAt,
            lastAccessedSessionAt: update.lastAccessedSessionAt,
          })
          .where(eq(usersTable.id, update.userId))
          .getSQL()
          .inlineParams();
      });
      await db.execute(sql.join(updateStatements, sql`;\n`));
    } catch (error) {
      logger.warn({ error }, 'Failed to update user last sign in at');
    }
  });

// Ensure cleanup on process termination
process.on('SIGTERM', () => updateUserLastSignInAtSubject.complete());

process.on('SIGINT', () => updateUserLastSignInAtSubject.complete());
