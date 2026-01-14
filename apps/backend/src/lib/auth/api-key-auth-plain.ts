import {
  type UserSelect,
  db,
  apiKeysTable,
  usersTable,
} from '@namefi-astra/db';
import { eq, and, isNull, or, gt } from 'drizzle-orm';
import { logger } from '#lib/logger';
import {
  extractPlainKeyPrefix,
  isValidPlainApiKeyFormat,
  verifyPlainApiKey,
  PLAIN_API_KEY_PREFIX,
} from './api-key-plain';

/**
 * PLAIN API Key Authentication
 *
 * This module handles authentication using PLAIN API keys.
 * PLAIN keys are passed in the X-API-Key header.
 */

/**
 * Result of API key authentication
 */
export interface ApiKeyAuthResult {
  success: boolean;
  user?: UserSelect;
  apiKeyId?: string;
  error?: string;
}

/**
 * Update the lastUsedAt timestamp for an API key
 *
 * @param apiKeyId - The API key ID to update
 */
async function updateApiKeyLastUsed(apiKeyId: string): Promise<void> {
  await db
    .update(apiKeysTable)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeysTable.id, apiKeyId));
}

/**
 * Authenticate a request using a PLAIN API key
 *
 * @param apiKey - The API key from the X-API-Key header
 * @returns Authentication result with user if successful
 */
export async function authenticateWithPlainApiKey(
  apiKey: string,
): Promise<ApiKeyAuthResult> {
  try {
    // Validate key format
    if (!isValidPlainApiKeyFormat(apiKey)) {
      return { success: false, error: 'Invalid API key format' };
    }

    // Extract prefix for lookup
    const keyPrefix = extractPlainKeyPrefix(apiKey);
    if (!keyPrefix) {
      return { success: false, error: 'Invalid API key format' };
    }

    // Find potential matching keys by prefix
    const now = new Date();
    const potentialKeys = await db
      .select({
        apiKey: apiKeysTable,
        user: usersTable,
      })
      .from(apiKeysTable)
      .innerJoin(usersTable, eq(apiKeysTable.userId, usersTable.id))
      .where(
        and(
          eq(apiKeysTable.keyPrefix, keyPrefix),
          eq(apiKeysTable.type, 'PLAIN'),
          isNull(apiKeysTable.revokedAt),
          or(isNull(apiKeysTable.expiresAt), gt(apiKeysTable.expiresAt, now)),
        ),
      );

    // Verify the key hash for each potential match
    for (const { apiKey: apiKeyRecord, user } of potentialKeys) {
      if (!apiKeyRecord.keyHash) continue;

      const isValid = await verifyPlainApiKey(apiKey, apiKeyRecord.keyHash);
      if (isValid) {
        // Update last used timestamp (fire and forget)
        updateApiKeyLastUsed(apiKeyRecord.id).catch((err) => {
          logger.error(
            { err, apiKeyId: apiKeyRecord.id },
            'Failed to update API key last used',
          );
        });

        return {
          success: true,
          user,
          apiKeyId: apiKeyRecord.id,
        };
      }
    }

    return { success: false, error: 'Invalid API key' };
  } catch (error) {
    logger.error({ error }, 'Error authenticating with PLAIN API key');
    return { success: false, error: 'Authentication failed' };
  }
}

/**
 * Check if an API key header indicates a PLAIN API key
 *
 * @param apiKeyHeader - The API key header value
 * @returns True if the header looks like a PLAIN API key
 */
export function isPlainApiKeyHeader(apiKeyHeader: string): boolean {
  return apiKeyHeader.startsWith(PLAIN_API_KEY_PREFIX);
}
