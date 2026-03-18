import type { FacilitatorClient, FacilitatorConfig } from '@x402/core/server';
import { HTTPFacilitatorClient } from '@x402/core/server';

const ONESHOT_FACILITATOR_BASE_URL = 'https://api.1shotapi.com/v0';
const ONESHOT_FACILITATOR_V1_ROUTE = '/x402';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface OneShotCredentials {
  apiKey: string;
  apiSecret: string;
}

interface OneShotFacilitatorClientConfig {
  apiKey?: string;
  apiSecret?: string;
  url?: string;
}

type CreateHeaders = NonNullable<FacilitatorConfig['createAuthHeaders']>;

/**
 * Resolves 1Shot API credentials from arguments or environment variables.
 *
 * @param apiKey - Optional API key override
 * @param apiSecret - Optional API secret override
 * @returns Resolved credentials
 */
function resolveCredentials(
  apiKey?: string,
  apiSecret?: string,
): OneShotCredentials {
  const resolvedApiKey = apiKey ?? process.env.ONESHOT_API_KEY;
  const resolvedApiSecret = apiSecret ?? process.env.ONESHOT_API_KEY_SECRET;

  if (!resolvedApiKey || !resolvedApiSecret) {
    throw new Error(
      'Missing 1Shot API credentials: set ONESHOT_API_KEY and ONESHOT_API_KEY_SECRET, or pass apiKey/apiSecret directly.',
    );
  }

  return {
    apiKey: resolvedApiKey,
    apiSecret: resolvedApiSecret,
  };
}

/**
 * Creates a 1Shot API auth header for the facilitator service
 *
 * @param apiKey - The 1Shot API key
 * @param apiSecret - The 1Shot API secret
 * @returns A function that returns the auth headers
 */
export function create1ShotAPIAuthHeaders(
  apiKey?: string,
  apiSecret?: string,
): CreateHeaders {
  let authToken: TokenResponse | null = null;
  let tokenExpiry: Date | null = null;

  return async () => {
    const credentials = resolveCredentials(apiKey, apiSecret);

    if (!authToken || !tokenExpiry || tokenExpiry <= new Date()) {
      // Token is missing or expired → trigger refresh logic
      const response = await fetch(`${ONESHOT_FACILITATOR_BASE_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: credentials.apiKey,
          client_secret: credentials.apiSecret,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `[1SHOT] Failed to get access token: ${response.statusText}`,
        );
      }

      authToken = (await response.json()) as TokenResponse;
      if (!authToken) {
        throw new Error('[1SHOT] Failed to get access token');
      }
      tokenExpiry = new Date(Date.now() + authToken.expires_in * 1000);
    }

    const headers = {
      verify: {} as Record<string, string>,
      settle: {} as Record<string, string>,
      supported: {} as Record<string, string>,
    };

    headers.verify.Authorization = `Bearer ${authToken.access_token}`;
    headers.settle.Authorization = `Bearer ${authToken.access_token}`;
    headers.supported.Authorization = `Bearer ${authToken.access_token}`;

    return headers;
  };
}

/**
 * Creates a facilitator config for the 1Shot API X402 facilitator
 *
 * @param apiKeyId - The 1Shot API key ID
 * @param apiKeySecret - The 1Shot API secret
 * @returns A facilitator config
 */
export function createFacilitatorConfig(
  apiKeyId?: string,
  apiKeySecret?: string,
): FacilitatorConfig {
  return {
    url: `${ONESHOT_FACILITATOR_BASE_URL}${ONESHOT_FACILITATOR_V1_ROUTE}`,
    createAuthHeaders: create1ShotAPIAuthHeaders(apiKeyId, apiKeySecret),
  };
}

/**
 * HTTP facilitator client configured for the 1Shot API x402 facilitator.
 * Compatible with the core FacilitatorClient interface.
 */
export class OneShotAPIFacilitatorClient
  extends HTTPFacilitatorClient
  implements FacilitatorClient
{
  /**
   * Creates a 1Shot facilitator client.
   *
   * @param config - Optional API credentials and URL override
   */
  constructor(config?: OneShotFacilitatorClientConfig) {
    super({
      url:
        config?.url ??
        `${ONESHOT_FACILITATOR_BASE_URL}${ONESHOT_FACILITATOR_V1_ROUTE}`,
      createAuthHeaders: create1ShotAPIAuthHeaders(
        config?.apiKey,
        config?.apiSecret,
      ),
    });
  }
}

/**
 * Creates a FacilitatorClient instance for the 1Shot API x402 facilitator.
 *
 * @param config - Optional API credentials and URL override
 * @returns A facilitator client compatible with x402ResourceServer
 */
export function create1ShotAPIFacilitatorClient(
  config?: OneShotFacilitatorClientConfig,
): FacilitatorClient {
  return new OneShotAPIFacilitatorClient(config);
}

export const facilitator = createFacilitatorConfig();
