import type { UserSelect } from '@namefi-astra/db';
import type { User as PrivyUser } from '@privy-io/server-auth';
import { logger } from '#lib/logger';
import { privyClient } from '../../trpc/utils';

/**
 * API Key Authentication - Unified Entry Point
 *
 * This module provides a unified interface for API key authentication,
 * supporting PLAIN, PUBLIC_PRIVATE (asymmetric), and HMAC key types.
 *
 * Header schemes:
 * - PLAIN: X-API-Key header with the full API key
 * - PUBLIC_PRIVATE: X-Namefi-Access-Key, X-Namefi-Timestamp, X-Namefi-Signature headers
 * - HMAC: X-Namefi-Key-Id, X-Namefi-Timestamp, X-Namefi-Signature headers
 *
 * The registry-based system allows pluggable authentication methods.
 */

// Import for internal use
import {
  type AuthRequestContext,
  registerAuthMethod,
  authenticateRequest,
} from './auth-registry';

import { plainAuthMethod } from './api-key-auth-plain';

/**
 * Initialize the authentication registry with all auth methods
 *
 * This function registers all authentication methods in order.
 * Order matters - more specific methods should be registered first.
 *
 * Call this once during application startup.
 */
export function initializeAuthRegistry(): void {
  // Register PLAIN last (most general - uses X-API-Key)
  registerAuthMethod(plainAuthMethod);

  logger.debug('API key authentication registry initialized');
}

/**
 * Options for PLAIN API key authentication (backward compatibility)
 */
export interface PlainApiKeyAuthOptions {
  /** The client's IP address (for IP restriction validation) */
  clientIp: string | null;
  /** The Origin header value (for origin restriction validation) */
  origin: string | null;
}

/**
 * Get user from API key using the new context-based authentication
 *
 * This is the preferred method for authenticating API keys. It uses
 * the registry system to try all registered authentication methods.
 *
 * @param ctx - The authentication request context
 * @returns The user if authentication succeeds, null otherwise
 */
export async function getUserFromApiKeyContext(
  ctx: AuthRequestContext,
): Promise<UserSelect | null> {
  const result = await authenticateRequest(ctx);
  return result.success ? (result.user ?? null) : null;
}

/**
 * Get both user and Privy user using context-based authentication
 *
 * @param ctx - The authentication request context
 * @returns Both internal user and Privy user if authentication succeeds
 */
export async function getUserAndPrivyUserFromApiKeyContext(
  ctx: AuthRequestContext,
): Promise<{ user: UserSelect | null; privyUser: PrivyUser | null }> {
  const user = await getUserFromApiKeyContext(ctx);

  if (!user) {
    return { user: null, privyUser: null };
  }

  try {
    const privyUser = await privyClient.getUser(user.privyUserId);
    return { user, privyUser };
  } catch (error) {
    logger.trace(
      { error, userId: user.id },
      'Failed to fetch Privy user for API key auth',
    );
    return { user, privyUser: null };
  }
}
