import { type UserSelect, db, usersTable } from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import { privyClient } from '../trpc/utils';

/**
 * Shared authentication utility for verifying Privy auth tokens
 * and creating/fetching users from the database.
 */

export interface AuthResult {
  user: UserSelect | null;
  error?: string;
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
    return { user: testUser };
  }

  // Extract token from Authorization header
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null };
  }

  const authToken = authHeader.replace('Bearer ', '');

  try {
    // Verify the token with Privy
    const userClaims = await privyClient.verifyAuthToken(authToken);

    // Find existing user in database
    let user = await db.query.usersTable.findFirst({
      where: eq(usersTable.privyUserId, userClaims.userId),
    });

    // Create new user if doesn't exist
    if (!user) {
      // TODO: handle this via webhook
      const newUser = await db
        .insert(usersTable)
        .values({
          privyUserId: userClaims.userId,
        })
        .returning();
      user = newUser[0];
    }

    return { user };
  } catch (error) {
    // Return null user with error info for debugging
    return {
      user: null,
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
): Promise<UserSelect> {
  if (testUser) {
    return testUser;
  }

  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Authorization header missing or invalid');
  }

  const result = await verifyUserAuthAndGetUser(authHeader, testUser);

  if (!result.user) {
    throw new Error(result.error || 'Authentication failed');
  }

  return result.user;
}
