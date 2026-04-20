import {
  decodePaymentSignatureHeader,
  encodePaymentRequiredHeader,
} from '@x402/core/http';
import type { SettleResponse } from '@x402/core/types';
import type {
  PaymentPayload,
  PaymentRequirements,
  x402ResourceServer as X402ResourceServerClass,
} from '@x402/hono';
import { recoverTypedDataAddress, getAddress } from 'viem';
import {
  buildX402ExactPaymentOption,
  centsToUsdc,
  getX402ConfiguredUsdcEIP712Domain,
} from './payment-option';
import { getX402ResourceServer } from './facilitator';

export type X402PaymentSignaturePayload = PaymentPayload;
export type X402PaymentResponse = SettleResponse;
export type X402PaymentRequiredResponse = Awaited<
  ReturnType<X402ResourceServerClass['createPaymentRequiredResponse']>
>;

export class X402PaymentRequiredError extends Error {
  constructor(
    public readonly data: {
      headers: any;
      paymentRequiredResponse: any;
      metadata: any;
    } & any,
    message = 'Payment Required',
  ) {
    super(message);
    this.name = 'X402PaymentRequiredError';
  }
}

export const X402_PAYMENT_REQUIRED_HEADERS = [
  'PAYMENT',
  'X-PAYMENT',
  'PAYMENT-REQUIRED',
] as const;
export const X402_PAYMENT_SIGNATURE_HEADERS = [
  'PAYMENT-SIGNATURE',
  'X-PAYMENT-SIGNATURE',
] as const;
export const X402_PAYMENT_RESPONSE_HEADERS = [
  'PAYMENT-RESPONSE',
  'X-PAYMENT-RESPONSE',
] as const;

export function getX402Header(
  headerGetter: (headerName: string) => string | undefined | null,
  headers: readonly string[],
): string | null {
  for (const header of headers) {
    const value = headerGetter(header);
    if (value) {
      return value;
    }
  }

  return null;
}

export function getX402PaymentSignatureHeader(
  headerGetter: (headerName: string) => string | undefined | null,
): string | null {
  return getX402Header(headerGetter, X402_PAYMENT_SIGNATURE_HEADERS);
}

export function decodeX402PaymentSignaturePayload(
  paymentSignatureHeader: string,
): X402PaymentSignaturePayload {
  return decodePaymentSignatureHeader(paymentSignatureHeader);
}

export async function buildX402PaymentRequirements({
  amountInUsdCents,
  context,
}: {
  amountInUsdCents: number;
  context: unknown;
}): Promise<{
  priceInUsdc: ReturnType<typeof centsToUsdc>;
  paymentOption: ReturnType<typeof buildX402ExactPaymentOption>;
  paymentRequirements: PaymentRequirements[];
  paymentRequirement: PaymentRequirements;
}> {
  const priceInUsdc = centsToUsdc(amountInUsdCents);
  const paymentOption = buildX402ExactPaymentOption(priceInUsdc);
  const resourceServer = await getX402ResourceServer();
  const paymentRequirements =
    await resourceServer.buildPaymentRequirementsFromOptions(
      [paymentOption],
      context,
    );
  const paymentRequirement = paymentRequirements[0];

  if (!paymentRequirement) {
    throw new Error('Failed to build x402 payment requirement');
  }

  return {
    priceInUsdc,
    paymentOption,
    paymentRequirements,
    paymentRequirement,
  };
}

export async function buildX402PaymentRequiredResponse({
  paymentRequirements,
  resourceInfo,
  reason = 'Payment Required',
}: {
  paymentRequirements: PaymentRequirements[];
  resourceInfo: {
    description: string;
    mimeType: string;
    resource: string;
    url: string;
  };
  reason?: string;
}): Promise<X402PaymentRequiredResponse> {
  const resourceServer = await getX402ResourceServer();
  return resourceServer.createPaymentRequiredResponse(
    paymentRequirements,
    resourceInfo,
    reason,
  );
}

export function encodeX402PaymentRequiredResponse(
  paymentRequiredResponse: X402PaymentRequiredResponse,
): string {
  return encodePaymentRequiredHeader(paymentRequiredResponse);
}

export async function verifyX402PaymentSignature({
  paymentPayload,
  paymentRequirement,
}: {
  paymentPayload: X402PaymentSignaturePayload;
  paymentRequirement: PaymentRequirements;
}) {
  const resourceServer = await getX402ResourceServer();
  return resourceServer.verifyPayment(paymentPayload, paymentRequirement);
}

export async function settleX402Payment({
  paymentPayload,
  paymentRequirement,
}: {
  paymentPayload: X402PaymentSignaturePayload;
  paymentRequirement: PaymentRequirements;
}): Promise<X402PaymentResponse> {
  const resourceServer = await getX402ResourceServer();
  return resourceServer.settlePayment(paymentPayload, paymentRequirement);
}

export function encodeX402PaymentResponse(
  paymentResponse: X402PaymentResponse,
): string {
  return Buffer.from(JSON.stringify(paymentResponse)).toString('base64');
}

export function extractBuyerWallet(
  paymentPayload: X402PaymentSignaturePayload,
): string | null {
  try {
    const payload = paymentPayload.payload;

    if (payload && typeof payload === 'object') {
      if ('from' in payload && typeof payload.from === 'string') {
        return payload.from;
      }

      if (
        'authorization' in payload &&
        payload.authorization &&
        typeof payload.authorization === 'object'
      ) {
        const authorization = payload.authorization as Record<string, unknown>;
        if ('from' in authorization && typeof authorization.from === 'string') {
          return authorization.from;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function extractX402PaymentNonce(
  paymentPayload: X402PaymentSignaturePayload,
): string {
  const payload = paymentPayload.payload as {
    authorization?: { nonce?: string | number };
    nonce?: string | number;
  };
  const authorizationNonce = payload?.authorization?.nonce;
  if (typeof authorizationNonce === 'string') {
    return authorizationNonce;
  }

  if (typeof authorizationNonce === 'number') {
    return String(authorizationNonce);
  }

  const nonce = payload?.nonce;
  if (typeof nonce === 'string') {
    return nonce;
  }

  if (typeof nonce === 'number') {
    return String(nonce);
  }

  throw new Error('Payment payload missing nonce field');
}

/**
 * EIP-3009 TransferWithAuthorization typed data types.
 * Used to recover the signer wallet address from an x402 payment signature.
 */
const EIP3009_TRANSFER_WITH_AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
} as const;

/**
 * Recover the wallet address that signed the x402 payment payload.
 *
 * Uses `recoverTypedDataAddress` on the EIP-3009 TransferWithAuthorization
 * typed data to derive the actual signer. This may differ from the `from`
 * field if a delegate signed on behalf of the token holder.
 */
export async function recoverX402SignerWallet(
  paymentPayload: X402PaymentSignaturePayload,
): Promise<string | null> {
  try {
    const payload = paymentPayload.payload as Record<string, unknown>;
    const signature = payload?.signature as string | undefined;
    const authorization = payload?.authorization as
      | Record<string, unknown>
      | undefined;

    if (!signature || !authorization) {
      return null;
    }

    const message = authorization as unknown as {
      from: `0x${string}`;
      to: `0x${string}`;
      value: bigint;
      validAfter: bigint;
      validBefore: bigint;
      nonce: `0x${string}`;
    };

    const address = await recoverTypedDataAddress({
      domain: getX402ConfiguredUsdcEIP712Domain(),
      types: EIP3009_TRANSFER_WITH_AUTHORIZATION_TYPES,
      primaryType: 'TransferWithAuthorization',
      message,
      signature: signature as `0x${string}`,
    });

    return getAddress(address);
  } catch {
    return null;
  }
}
