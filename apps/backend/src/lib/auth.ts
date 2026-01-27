import { type UserSelect, db, usersTable } from '@namefi-astra/db';
import { CHAINS } from '@namefi-astra/utils';
import { eq, sql } from 'drizzle-orm';
import { privyClient } from '../trpc/utils';
import { config, secrets } from '#lib/env';
import { debounceTime, groupBy, mergeMap, Subject, bufferTime } from 'rxjs';
import { logger } from '#lib/logger';
import { temporalClient } from '#temporal/client';
import { TEMPORAL_QUEUES } from '#temporal/shared/enums';
import { mintDevSignupNfscWorkflow } from '#temporal/workflows/mint-dev-signup-nfsc.workflow';

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

    // Find existing user in database
    let [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.privyUserId, userClaims.userId))
      .limit(1)
      .$withCache();

    // Create new user if doesn't exist
    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      // TODO: handle this via webhook
      const newUser = await db
        .insert(usersTable)
        .values({
          privyUserId: userClaims.userId,
          lastSignInAt,
          lastAccessedSessionAt,
        })
        .returning();
      user = newUser[0];

      if (config.DEV_NFSC_ENABLED && config.DEV_NFSC_SIGNUP_MINT_AMOUNT > 0) {
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
          logger.fatal(
            { error, userId: user.id },
            'Failed to start dev signup NFSC mint workflow',
          );
        }
      }
    } else {
      // Update timestamps for existing user
      updateUserLastSignInAtSubject.next({
        userId: user.id,
        lastSignInAt,
        lastAccessedSessionAt,
      });
    }

    return {
      user,
      sessionId: userClaims.sessionId ?? null,
      isNewUser,
      tokenIssuedAt: lastSignInAt,
    };
  } catch (error) {
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
