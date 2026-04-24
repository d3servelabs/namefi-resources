import { SignJWT, importJWK, type JWTPayload } from 'jose';
import { randomBytes } from 'node:crypto';

/**
 * JwtOptions contains configuration for JWT generation.
 *
 * This interface holds all necessary parameters for generating a JWT token
 * for authenticating with Coinbase's REST APIs. It supports both EC (ES256)
 * and Ed25519 (EdDSA) keys.
 */
export interface JwtOptions {
  /**
   * The API key ID
   *
   * Examples:
   *  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
   *  'organizations/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/apiKeys/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
   */
  apiKeyId: string;

  /**
   * The API key secret
   *
   * Examples:
   *  'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx==' (Edwards key (Ed25519))
   *  '-----BEGIN EC PRIVATE KEY-----\n...\n...\n...==\n-----END EC PRIVATE KEY-----\n' (EC key (ES256))
   */
  apiKeySecret: string;

  /**
   * The HTTP method for the request (e.g. 'GET', 'POST'), or null for JWTs intended for websocket connections
   */
  requestMethod?: string | null;

  /**
   * The host for the request (e.g. 'api.cdp.coinbase.com'), or null for JWTs intended for websocket connections
   */
  requestHost?: string | null;

  /**
   * The path for the request (e.g. '/platform/v1/wallets'), or null for JWTs intended for websocket connections
   */
  requestPath?: string | null;

  /**
   * Optional expiration time in seconds (defaults to 120)
   */
  expiresIn?: number;

  /**
   * Optional audience claim for the JWT
   */
  audience?: string[];
}

/**
 * Generates a JWT (also known as a Bearer token) for authenticating with Coinbase's REST APIs.
 * Supports both EC (ES256) and Ed25519 (EdDSA) keys. Also supports JWTs meant for
 * websocket connections by allowing requestMethod, requestHost, and requestPath to all be
 * null, in which case the 'uris' claim is omitted from the JWT.
 *
 * @param options - The configuration options for generating the JWT
 * @returns The generated JWT (Bearer token) string
 * @throws {Error} If required parameters are missing, invalid, or if JWT signing fails
 */
export async function generateJwt(options: JwtOptions): Promise<string> {
  // Validate required parameters
  if (!options.apiKeyId) {
    throw new Error('Key name is required');
  }
  if (!options.apiKeySecret) {
    throw new Error('Private key is required');
  }

  // Check if we have a REST API request or a websocket connection
  const hasAllRequestParams = Boolean(
    options.requestMethod && options.requestHost && options.requestPath,
  );
  const hasNoRequestParams =
    (options.requestMethod === undefined || options.requestMethod === null) &&
    (options.requestHost === undefined || options.requestHost === null) &&
    (options.requestPath === undefined || options.requestPath === null);

  // Ensure we either have all request parameters or none (for websocket)
  if (!hasAllRequestParams && !hasNoRequestParams) {
    throw new Error(
      'Either all request details (method, host, path) must be provided, or all must be null for JWTs intended for websocket connections',
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = options.expiresIn || 120; // Default to 120 seconds if not specified

  // Prepare the JWT payload
  const claims: JWTPayload = {
    sub: options.apiKeyId,
    iss: 'cdp',
    aud: options.audience,
  };

  // Add the uris claim only for REST API requests
  if (hasAllRequestParams) {
    claims.uris = [
      `${options.requestMethod} ${options.requestHost}${options.requestPath}`,
    ];
  }

  // Generate random nonce for the header
  const randomNonce = nonce();

  // Determine if we're using EC or Edwards key based on the key format
  if (isValidEd25519Key(options.apiKeySecret)) {
    return await buildEdwardsJWT(
      options.apiKeySecret,
      options.apiKeyId,
      claims,
      now,
      expiresIn,
      randomNonce,
    );
  }
  throw new UserInputValidationError(
    'Invalid key format - must be either PEM EC key or base64 Ed25519 key',
  );
}

/**
 * Builds a JWT using an Ed25519 key.
 *
 * @param privateKey - The Ed25519 private key in base64 format
 * @param keyName - The key name/ID
 * @param claims - The JWT claims
 * @param now - Current timestamp in seconds
 * @param expiresIn - Number of seconds until the token expires
 * @param nonce - Random nonce for the JWT header
 * @returns A JWT token using an Ed25519 key
 * @throws {Error} If key parsing, import, or signing fails
 */
async function buildEdwardsJWT(
  privateKey: string,
  keyName: string,
  claims: JWTPayload,
  now: number,
  expiresIn: number,
  nonce: string,
): Promise<string> {
  try {
    // Decode the base64 key (expecting 64 bytes: 32 for seed + 32 for public key)
    const decoded = Buffer.from(privateKey, 'base64');
    if (decoded.length !== 64) {
      throw new UserInputValidationError('Invalid Ed25519 key length');
    }

    const seed = decoded.subarray(0, 32);
    const publicKey = decoded.subarray(32);

    // Create JWK from the key components
    const jwk = {
      kty: 'OKP',
      crv: 'Ed25519',
      d: seed.toString('base64url'),
      x: publicKey.toString('base64url'),
    };

    // Import the key for signing
    const key = await importJWK(jwk, 'EdDSA');

    // Sign and return the JWT
    return await new SignJWT(claims)
      .setProtectedHeader({ alg: 'EdDSA', kid: keyName, typ: 'JWT', nonce })
      .setIssuedAt(Math.floor(now))
      .setNotBefore(Math.floor(now))
      .setExpirationTime(Math.floor(now + expiresIn))
      .sign(key);
  } catch (error) {
    throw new Error(
      `Failed to generate Ed25519 JWT: ${(error as Error).message}`,
    );
  }
}

/**
 * Generates a random nonce for the JWT.
 *
 * @returns {string} The generated nonce.
 */
function nonce(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Determines if a string could be a valid Ed25519 key
 *
 * @param str - The string to test
 * @returns True if the string could be a valid Ed25519 key, false otherwise
 */
function isValidEd25519Key(str: string): boolean {
  try {
    const decoded = Buffer.from(str, 'base64');
    return decoded.length === 64;
  } catch {
    return false;
  }
}

/**
 * UserInputValidationError is thrown when validation of a user-supplied input fails.
 */
export class UserInputValidationError extends Error {
  /**
   * Initializes a new UserInputValidationError instance.
   *
   * @param message - The user input validation error message.
   */
  constructor(message: string) {
    super(message);
    this.name = 'UserInputValidationError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UserInputValidationError);
    }
  }
}
