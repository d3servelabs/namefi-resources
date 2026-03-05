import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { logger } from '#lib/logger';

/**
 * PLAIN API Key Utilities
 *
 * This module provides utilities for:
 * - Generating PLAIN API keys (random string with prefix)
 * - Hashing and verifying PLAIN API keys using bcrypt
 *
 * PLAIN keys are used with the X-API-Key header.
 */

/**
 * Prefix for PLAIN API keys
 * Format: nfk_<random 32 bytes base64url encoded>
 */
export const PLAIN_API_KEY_PREFIX = 'nfk_';

/**
 * Number of bytes for the random portion of PLAIN API keys
 */
const API_KEY_RANDOM_BYTES = 32;

/**
 * bcrypt cost factor for hashing API keys
 * Using 10 as a balance between security and performance
 */
const BCRYPT_COST = 10;

/**
 * Length of the key identifier portion stored in keyPrefix
 */
const KEY_PREFIX_IDENTIFIER_LENGTH = 8;

/**
 * Result of generating a new PLAIN API key
 */
export interface GeneratedApiKey {
  /** The full API key (only shown once, not stored) */
  plainKey: string;
  /** bcrypt hash of the key (stored in database) */
  keyHash: string;
  /** Key prefix for identification (e.g., "nfk_abc12345") */
  keyPrefix: string;
}

/**
 * Generate a new PLAIN API key
 *
 * The key format is: nfk_<32 random bytes base64url encoded>
 * Example: nfk_dGhpc2lzYXRlc3RrZXlmb3JuYW1lZmlhc3RyYQ
 *
 * @returns The generated key, its hash, and prefix
 */
export async function generatePlainApiKey(): Promise<GeneratedApiKey> {
  // Generate random bytes
  const randomPortion = randomBytes(API_KEY_RANDOM_BYTES).toString('base64url');

  // Create the full key with prefix
  const plainKey = `${PLAIN_API_KEY_PREFIX}${randomPortion}`;

  // Hash the key for storage
  const keyHash = await bcrypt.hash(plainKey, BCRYPT_COST);

  // Create the prefix for identification
  const keyPrefix = `${PLAIN_API_KEY_PREFIX}${randomPortion.slice(0, KEY_PREFIX_IDENTIFIER_LENGTH)}`;

  return {
    plainKey,
    keyHash,
    keyPrefix,
  };
}

/**
 * Verify a PLAIN API key against its stored hash
 *
 * Uses bcrypt comparison which is timing-safe
 *
 * @param plainKey - The API key to verify
 * @param storedHash - The bcrypt hash from the database
 * @returns True if the key matches the hash
 */
export async function verifyPlainApiKey(
  plainKey: string,
  storedHash: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(plainKey, storedHash);
  } catch (error) {
    logger.error({ error }, 'Error verifying API key');
    return false;
  }
}

/**
 * Extract the prefix portion from a PLAIN API key
 *
 * @param plainKey - The full API key
 * @returns The key prefix (e.g., "nfk_abc12345") or null if invalid
 */
export function extractPlainKeyPrefix(plainKey: string): string | null {
  if (!plainKey.startsWith(PLAIN_API_KEY_PREFIX)) {
    return null;
  }

  const randomPortion = plainKey.slice(PLAIN_API_KEY_PREFIX.length);
  if (randomPortion.length < KEY_PREFIX_IDENTIFIER_LENGTH) {
    return null;
  }

  return `${PLAIN_API_KEY_PREFIX}${randomPortion.slice(0, KEY_PREFIX_IDENTIFIER_LENGTH)}`;
}

/**
 * Validate that a string is a valid PLAIN API key format
 *
 * @param key - The key to validate
 * @returns True if the key has valid format
 */
export function isValidPlainApiKeyFormat(key: string): boolean {
  if (!key.startsWith(PLAIN_API_KEY_PREFIX)) {
    return false;
  }

  const randomPortion = key.slice(PLAIN_API_KEY_PREFIX.length);
  // Base64url encoding of 32 bytes should be ~43 characters
  return randomPortion.length >= 40 && /^[A-Za-z0-9_-]+$/.test(randomPortion);
}
