import type { UserSelect } from '@namefi-astra/db';

/**
 * Determines if skip auth should be enabled based on the header and environment.
 * Returns a mock test user if skip auth is enabled, null otherwise.
 *
 * Skip auth is ONLY allowed in dev/preview/local environments.
 * In production, this function will ALWAYS return null regardless of the header value.
 *
 * @param skipAuthHeader - The value of the X-Skip-Auth header
 * @param environment - The current environment (process.env.ENVIRONMENT)
 * @returns A mock UserSelect if skip auth is enabled, null otherwise
 */
export function getSkipAuthTestUser(
  skipAuthHeader: string | undefined,
  environment: string | undefined,
): UserSelect | null {
  const isDevEnvironment =
    environment === 'local' ||
    environment === 'development' ||
    environment === 'preview';

  if (skipAuthHeader === '1' && isDevEnvironment) {
    return {
      id: 'skip-auth-mock-user-id',
      privyUserId: 'skip-auth-mock-privy-user-id',
      primaryEmail: 'tester+alice@d3serve.xyz',
      stripeCustomerId: null,
      subscribeToEmails: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignInAt: new Date(),
      lastAccessedSessionAt: new Date(),
    };
  }

  return null;
}
