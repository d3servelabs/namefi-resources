import { type UserSelect, db, usersTable } from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import { config } from '#lib/env';
import { logger } from '#lib/logger';

/**
 * Determines if skip auth should be enabled based on the header and environment.
 * If enabled, looks up the configured test user from the database.
 *
 * Skip auth is ONLY allowed in local/development environments.
 * Preview and production environments are public-facing and must NOT allow skip auth.
 * In production, this function will ALWAYS return null regardless of the header value.
 *
 * @param skipAuthHeader - The value of the X-Skip-Auth header
 * @param environment - The current environment (process.env.ENVIRONMENT)
 * @returns The real user from the database if skip auth is enabled and user exists, null otherwise
 */
export async function getSkipAuthTestUser(
  skipAuthHeader: string | undefined,
  environment: string | undefined,
): Promise<UserSelect | null> {
  // SECURITY: Only allow skip auth in truly local environments.
  // Preview deployments are public-facing and must NOT allow auth bypass.
  const isDevEnvironment =
    environment === 'local' || environment === 'development';

  if (skipAuthHeader !== '1' || !isDevEnvironment) {
    return null;
  }

  // Check if a skip auth user email is configured
  const skipAuthUserEmail = config.SKIP_AUTH_USER_EMAIL;
  if (!skipAuthUserEmail) {
    logger.warn(
      'Skip auth header detected but SKIP_AUTH_USER_EMAIL is not configured',
    );
    return null;
  }

  // Look up the real user from the database by email
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.primaryEmail, skipAuthUserEmail),
  });

  if (!user) {
    logger.warn(
      { skipAuthUserEmail },
      'Skip auth user not found in database. Please ensure the user exists.',
    );
    return null;
  }

  return user;
}
