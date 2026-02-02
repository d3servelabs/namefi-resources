import type { UserSelect } from '@namefi-astra/db';
import { logger } from '#lib/logger';

/**
 * API Authentication Registry
 *
 * Provides a pluggable authentication system where methods register
 * themselves with predicates to determine applicability.
 *
 * Methods are tried in registration order - first match wins.
 */

/**
 * Context passed to auth method predicates and handlers
 * Contains all information needed to authenticate a request
 */
export interface AuthRequestContext {
  /** All request headers (lowercase keys recommended) */
  headers: Record<string, string | undefined>;
  /** Raw request body (empty string for GET/no body) */
  rawBody: string;
  /** Request path (e.g., "/api/domains") */
  path: string;
  /** HTTP method (GET, POST, etc.) */
  method: string;
  /** Client IP address (null if unknown) */
  clientIp: string | null;
  /** Origin header value (null if not present) */
  origin: string | null;
}

/**
 * Result returned by authentication methods
 */
export interface AuthMethodResult {
  /** Whether authentication was successful */
  success: boolean;
  /** The authenticated user (if successful) */
  user?: UserSelect;
  /** The API key ID that was used (if successful) */
  apiKeyId?: string;
  /** Error message (if failed) */
  error?: string;
}

/**
 * API key types supported by the system
 */
export type ApiKeyType = 'PLAIN' | 'PUBLIC_PRIVATE' | 'HMAC';

/**
 * Definition of an authentication method
 */
export interface AuthMethod {
  /** Unique identifier for this auth method */
  id: string;
  /** Database key type (for logging/debugging) */
  keyType: ApiKeyType;
  /**
   * Predicate to check if this method should handle the request
   * Called with request context to determine if headers match this method
   *
   * @param ctx - The request context
   * @returns True if this method should attempt authentication
   */
  shouldHandle: (ctx: AuthRequestContext) => boolean;
  /**
   * Authenticate the request using this method
   * Only called if shouldHandle() returns true
   *
   * @param ctx - The request context
   * @returns Authentication result
   */
  authenticate: (ctx: AuthRequestContext) => Promise<AuthMethodResult>;
}

/**
 * Registry of authentication methods
 * Methods are tried in registration order - first match wins
 */
const API_AUTH_METHOD_REGISTRY: AuthMethod[] = [];

/**
 * Register an authentication method
 *
 * Methods are tried in registration order, so register more specific
 * methods first and more general methods last.
 *
 * @param method - The authentication method to register
 */
export function registerAuthMethod(method: AuthMethod): void {
  // Check for duplicate IDs
  const existing = API_AUTH_METHOD_REGISTRY.find((m) => m.id === method.id);
  if (existing) {
    logger.warn(
      { methodId: method.id },
      'Auth method already registered, skipping duplicate',
    );
    return;
  }

  API_AUTH_METHOD_REGISTRY.push(method);
  logger.debug(
    { methodId: method.id, keyType: method.keyType },
    'Registered auth method',
  );
}

/**
 * Get all registered authentication methods
 * Useful for debugging and logging
 *
 * @returns Readonly array of registered methods
 */
export function getRegisteredMethods(): ReadonlyArray<AuthMethod> {
  return API_AUTH_METHOD_REGISTRY;
}

/**
 * Clear all registered authentication methods
 * Primarily useful for testing
 */
export function clearRegisteredMethods(): void {
  API_AUTH_METHOD_REGISTRY.length = 0;
}

/**
 * Main authentication entry point
 *
 * Tries each registered method in order until one handles the request.
 * A method "handles" the request if its shouldHandle() predicate returns true.
 *
 * @param ctx - The request context containing headers, body, path, etc.
 * @returns Authentication result from the first matching method, or failure
 */
export async function authenticateRequest(
  ctx: AuthRequestContext,
): Promise<AuthMethodResult> {
  // Try each registered method in order
  for (const method of API_AUTH_METHOD_REGISTRY) {
    try {
      // Check if this method should handle the request
      if (method.shouldHandle(ctx)) {
        logger.debug(
          { methodId: method.id, keyType: method.keyType, path: ctx.path },
          'Auth method matched, attempting authentication',
        );

        // Attempt authentication
        const result = await method.authenticate(ctx);

        // Log result
        if (result.success) {
          logger.debug(
            {
              methodId: method.id,
              keyType: method.keyType,
              apiKeyId: result.apiKeyId,
            },
            'Authentication successful',
          );
        } else {
          logger.debug(
            {
              methodId: method.id,
              keyType: method.keyType,
              cause: result.error,
            },
            'Authentication failed',
          );
        }

        return result;
      }
    } catch (error) {
      logger.error({ error, methodId: method.id }, 'Error in auth method');
      // Continue to next method on error
    }
  }

  // No method matched or all failed
  return {
    success: false,
    error: 'No valid authentication provided',
  };
}

/**
 * Helper to create an AuthRequestContext from common request objects
 *
 * @param headers - Request headers object
 * @param rawBody - Raw request body string
 * @param path - Request path
 * @param method - HTTP method
 * @param clientIp - Client IP address
 * @returns AuthRequestContext
 */
export function createAuthContext(
  headers: Record<string, string | string[] | undefined>,
  rawBody: string,
  path: string,
  method: string,
  clientIp: string | null,
): AuthRequestContext {
  // Normalize headers to lowercase keys and single string values
  const normalizedHeaders: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(headers)) {
    const normalizedKey = key.toLowerCase();
    normalizedHeaders[normalizedKey] = Array.isArray(value) ? value[0] : value;
  }

  return {
    headers: normalizedHeaders,
    rawBody,
    path,
    method: method.toUpperCase(),
    clientIp,
    origin: normalizedHeaders['origin'] || null,
  };
}
