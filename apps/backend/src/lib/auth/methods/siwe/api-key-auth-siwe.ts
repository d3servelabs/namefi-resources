import { logger } from '#lib/logger';
import type {
  AuthMethod,
  AuthMethodResult,
  AuthRequestContext,
} from '../../auth-registry';
import { getUserOrCreateByWalletAddress } from '#lib/auth/wallet-auth';
import {
  SIWE_SIGNATURE_HEADER_HEADERS,
  SIWE_SIGNATURE_HEADER_METHOD_ID,
  getSiweDetailsFromToken,
} from './api-key-siwe';

/**
 * Header-based SIWE authentication.
 *
 * Expected request shape:
 * - Header: x-namefi-signature
 * - Optional header: x-namefi-signer
 * - Raw body: { timestamp, nonce, payload }
 */
export function isSiweTokenAuthRequest(ctx: AuthRequestContext): boolean {
  const siweToken = ctx.headers[SIWE_SIGNATURE_HEADER_HEADERS.TOKEN];
  return !!siweToken;
}

export async function authenticateWithSiweTokenFromHeader(
  ctx: AuthRequestContext,
): Promise<Omit<AuthMethodResult, 'methodId'>> {
  try {
    const siweToken = ctx.headers[SIWE_SIGNATURE_HEADER_HEADERS.TOKEN];
    if (!siweToken) {
      return {
        success: false,
        error: `Missing ${SIWE_SIGNATURE_HEADER_HEADERS.TOKEN} header`,
      };
    }
    const siweDetails = await getSiweDetailsFromToken(siweToken);

    if (!siweDetails) {
      return {
        success: false,
        error: 'Invalid or expired SIWE Token',
      };
    }

    const authenticatedWalletAddress =
      siweDetails.session.delegatorAddress ?? siweDetails.session.address;

    const user = await getUserOrCreateByWalletAddress(
      authenticatedWalletAddress,
    );

    if (!user) {
      logger.warn(
        {
          signerAddress: siweDetails.session.address,
          authenticatedWalletAddress,
        },
        'SIWE wallet is not linked to any user',
      );

      return {
        success: false,
        error: 'Authenticated wallet is not linked to a user',
      };
    }

    return {
      success: true,
      user,
      chainId: siweDetails.session.chainId,
    };
  } catch (error) {
    logger.debug({ error }, 'SIWE signature-header failed');
    return {
      success: false,
      error: 'Authentication failed',
    };
  }
}

export const SiweAuthMethod: AuthMethod = {
  id: SIWE_SIGNATURE_HEADER_METHOD_ID,
  keyType: 'SIWE_SESSION_TOKEN',
  shouldHandle: isSiweTokenAuthRequest,
  authenticate: authenticateWithSiweTokenFromHeader,
};
