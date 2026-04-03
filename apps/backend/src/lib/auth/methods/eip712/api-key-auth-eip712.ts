import { getAddress } from 'viem';
import { logger } from '#lib/logger';
import type {
  AuthMethod,
  AuthMethodResult,
  AuthRequestContext,
} from '../../auth-registry';
import {
  getDelegatedAccountHeaderValue,
  getUserOrCreateByWalletAddress,
  parseEip7702AccountAddress,
} from '#lib/auth/wallet-auth';
import {
  EIP712_SIGNATURE_HEADER_HEADERS,
  EIP712_SIGNATURE_HEADER_METHOD_ID,
  consumeEIP712SignatureNonce,
  isValidEIP712SignatureTimestamp,
  parseEIP712SignatureEnvelope,
  verifyEIP712RawBodySignature,
} from './api-key-eip712';

/**
 * Header-based EIP712 authentication.
 *
 * Expected request shape:
 * - Header: x-namefi-signature
 * - Optional header: x-namefi-signer
 * - Raw body: { timestamp, nonce, payload }
 */
export function isEIP712SignatureHeaderAuthRequest(
  ctx: AuthRequestContext,
): boolean {
  const signature = ctx.headers[EIP712_SIGNATURE_HEADER_HEADERS.SIGNATURE];
  if (!signature) {
    return false;
  }

  // Avoid collisions with existing auth methods.
  if (ctx.headers['x-namefi-access-key']) {
    return false;
  }

  if (ctx.headers['x-namefi-key-id']) {
    return false;
  }

  if (ctx.headers['x-api-key']) {
    return false;
  }

  return (
    !!ctx.headers[EIP712_SIGNATURE_HEADER_HEADERS.SIGNER] &&
    !!ctx.headers[EIP712_SIGNATURE_HEADER_HEADERS.TYPE]
  );
}

export async function authenticateWithEIP712SignatureHeader(
  ctx: AuthRequestContext,
): Promise<Omit<AuthMethodResult, 'methodId'>> {
  try {
    const signature = ctx.headers[EIP712_SIGNATURE_HEADER_HEADERS.SIGNATURE];
    if (!signature) {
      return {
        success: false,
        error: 'Missing x-namefi-signature header',
      };
    }

    const parsedEnvelope = parseEIP712SignatureEnvelope(ctx.rawBody);
    if (!parsedEnvelope.valid || !parsedEnvelope.envelope) {
      return {
        success: false,
        error: parsedEnvelope.error || 'Invalid signed request body',
      };
    }

    if (!isValidEIP712SignatureTimestamp(parsedEnvelope.envelope.timestamp)) {
      return {
        success: false,
        error: 'Signature timestamp is invalid or expired',
      };
    }

    const rawExpectedSignerAddress =
      ctx.headers[EIP712_SIGNATURE_HEADER_HEADERS.SIGNER];
    const expectedSignerAddress = rawExpectedSignerAddress
      ? getAddress(rawExpectedSignerAddress)
      : undefined;
    const expectedType = ctx.headers[EIP712_SIGNATURE_HEADER_HEADERS.TYPE];

    const rawChainId = ctx.headers[EIP712_SIGNATURE_HEADER_HEADERS.CHAIN_ID];
    const chainId = rawChainId ? Number.parseInt(rawChainId, 10) : undefined;
    if (rawChainId && (!chainId || !Number.isFinite(chainId))) {
      return {
        success: false,
        error: `Invalid ${EIP712_SIGNATURE_HEADER_HEADERS.CHAIN_ID} header`,
      };
    }

    const delegatorAddressRaw = getDelegatedAccountHeaderValue(ctx.headers);
    const parsedDelegator = parseEip7702AccountAddress(delegatorAddressRaw);

    if (!parsedDelegator.valid) {
      return {
        success: false,
        error: parsedDelegator.error,
      };
    }

    const eip1271Account =
      parsedDelegator.accountAddress &&
      parsedDelegator.accountAddress !== expectedSignerAddress
        ? parsedDelegator.accountAddress
        : undefined;

    const signatureVerification = await verifyEIP712RawBodySignature({
      rawBody: ctx.rawBody,
      signature,
      expectedSignerAddress,
      types: ctx.eip712Types ?? {},
      primaryType: expectedType ?? '', //todo
      eip1271Account,
      chainId,
    });

    if (!signatureVerification.valid) {
      return {
        success: false,
        error: signatureVerification.error || 'Invalid signature',
      };
    }

    const walletAddress =
      signatureVerification.delegatorAddress ??
      signatureVerification.signerAddress;

    if (!walletAddress) {
      return {
        success: false,
        error: 'Could not determine authenticated wallet address',
      };
    }

    const nonceSignerAddress =
      signatureVerification.signerAddress ?? walletAddress;

    const nonceResult = await consumeEIP712SignatureNonce({
      signerAddress: nonceSignerAddress,
      nonce: parsedEnvelope.envelope.nonce,
    });

    if (!nonceResult.valid) {
      return {
        success: false,
        error: nonceResult.error || 'Nonce validation failed',
      };
    }

    const user = await getUserOrCreateByWalletAddress(walletAddress);

    if (!user) {
      logger.warn(
        {
          signerAddress: signatureVerification.signerAddress,
          delegatorAddress: signatureVerification.delegatorAddress,
          walletAddress,
        },
        'EIP712 wallet is not linked to any user',
      );

      return {
        success: false,
        error: 'Authenticated wallet is not linked to a user',
      };
    }

    return {
      success: true,
      user,
      chainId,
    };
  } catch (error) {
    logger.error({ error }, 'EIP712 signature-header failed');
    return {
      success: false,
      error: 'Authentication failed',
    };
  }
}

export const eip712AuthMethod: AuthMethod = {
  id: EIP712_SIGNATURE_HEADER_METHOD_ID,
  keyType: 'EIP712',
  shouldHandle: isEIP712SignatureHeaderAuthRequest,
  authenticate: authenticateWithEIP712SignatureHeader,
};
