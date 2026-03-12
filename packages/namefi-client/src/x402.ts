export const X402_PAYMENT_REQUIRED_HEADER_NAMES = [
  'PAYMENT-REQUIRED',
  'X-PAYMENT-REQUIRED',
  'PAYMENT',
  'X-PAYMENT',
] as const;

export const X402_PAYMENT_SIGNATURE_HEADER_NAMES = [
  'PAYMENT-SIGNATURE',
  'X-PAYMENT-SIGNATURE',
] as const;

const TRANSFER_WITH_AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
} as const;

const DEFAULT_X402_VERSION = 2;
const DEFAULT_X402_VALID_AFTER_LEEWAY_SECONDS = 600;
const DEFAULT_X402_MAX_TIMEOUT_SECONDS = 3600;

type UnknownRecord = Record<string, unknown>;

export type X402AcceptedPayment = {
  scheme: string;
  network: string;
  amount: string;
  asset: `0x${string}`;
  payTo: `0x${string}`;
  maxTimeoutSeconds?: number;
  extra?: {
    name?: string;
    version?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type X402PaymentRequired = {
  x402Version?: number;
  resource?: {
    url: string;
    description: string;
    mimeType: string;
    [key: string]: unknown;
  };
  accepts: X402AcceptedPayment[];
  [key: string]: unknown;
};

export type X402Signer = {
  getAddress: () => Promise<`0x${string}`>;
  signTypedData: (data: {
    domain: {
      name: string;
      version: string;
      chainId: number;
      verifyingContract: `0x${string}`;
    };
    types: {
      [key: string]:
        | {
            name: string;
            type: string;
          }[]
        | readonly { name: string; type: string }[];
    };
    primaryType: 'TransferWithAuthorization';
    message: {
      from: `0x${string}`;
      to: `0x${string}`;
      value: bigint;
      validAfter: bigint;
      validBefore: bigint;
      nonce: `0x${string}`;
    };
  }) => Promise<`0x${string}`>;
  generateNonce?: () => `0x${string}`;
};

export type X402RequestContext = {
  url: string;
  method: string;
  path?: readonly string[];
  input?: unknown;
};

export type X402PaymentPredicateContext = {
  signer: X402Signer;
  signerAddress: `0x${string}`;
  request: X402RequestContext;
  paymentRequired: X402PaymentRequired;
  acceptedPayment: X402AcceptedPayment;
};

export type X402PaymentPredicate = (
  context: X402PaymentPredicateContext,
) => boolean | Promise<boolean>;

export function getX402PaymentRequiredHeader(headers: Headers): string | null {
  for (const headerName of X402_PAYMENT_REQUIRED_HEADER_NAMES) {
    const value = headers.get(headerName);
    if (value) {
      return value;
    }
  }
  return null;
}

export function hasX402PaymentSignatureHeader(headers: Headers): boolean {
  return X402_PAYMENT_SIGNATURE_HEADER_NAMES.some((headerName) =>
    headers.has(headerName),
  );
}

export function parseX402PaymentRequiredHeader(
  encodedHeader: string,
): X402PaymentRequired {
  const decoded = decodeBase64Json(encodedHeader);
  if (!isRecord(decoded)) {
    throw new Error('x402 payment-required header must decode to an object');
  }

  const accepts = decoded.accepts;
  if (!Array.isArray(accepts)) {
    throw new Error('x402 payment-required header is missing accepts[]');
  }

  return decoded as X402PaymentRequired;
}

export function selectFirstExactAcceptedPayment(
  paymentRequired: X402PaymentRequired,
): X402AcceptedPayment | null {
  for (const accepted of paymentRequired.accepts) {
    if (!isRecord(accepted)) {
      continue;
    }

    if (accepted.scheme !== 'exact') {
      continue;
    }

    if (
      typeof accepted.network !== 'string' ||
      typeof accepted.amount !== 'string' ||
      typeof accepted.asset !== 'string' ||
      typeof accepted.payTo !== 'string'
    ) {
      continue;
    }

    return accepted as X402AcceptedPayment;
  }

  return null;
}

export function parseChainIdFromCaip2Network(network: string): number {
  const match = network.match(/^eip155:(\d+)$/);
  if (!match) {
    throw new Error(`Unsupported x402 network format: ${network}`);
  }

  return Number.parseInt(match[1], 10);
}

export async function buildX402PaymentSignatureHeader({
  paymentRequired,
  acceptedPayment,
  signer,
  signerAddress,
  validAfterLeewaySeconds = DEFAULT_X402_VALID_AFTER_LEEWAY_SECONDS,
}: {
  paymentRequired: X402PaymentRequired;
  acceptedPayment: X402AcceptedPayment;
  signer: X402Signer;
  signerAddress?: `0x${string}`;
  validAfterLeewaySeconds?: number;
}): Promise<{
  paymentSignatureHeader: string;
  signerAddress: `0x${string}`;
}> {
  const chainId = parseChainIdFromCaip2Network(acceptedPayment.network);
  const resolvedSignerAddress = signerAddress ?? (await signer.getAddress());

  const nowInSeconds = Math.trunc(Date.now() / 1000);
  const validAfter = Math.max(
    0,
    nowInSeconds - Math.max(0, validAfterLeewaySeconds),
  );
  const validBefore =
    nowInSeconds +
    Math.max(
      0,
      acceptedPayment.maxTimeoutSeconds ?? DEFAULT_X402_MAX_TIMEOUT_SECONDS,
    );
  const nonce = normalizeNonce(
    signer.generateNonce?.() ?? generateRandomNonce(),
  );

  const typedDataMessage = {
    from: resolvedSignerAddress.toLowerCase() as `0x${string}`,
    to: acceptedPayment.payTo.toLowerCase() as `0x${string}`,
    value: BigInt(acceptedPayment.amount),
    validAfter: BigInt(validAfter),
    validBefore: BigInt(validBefore),
    nonce,
  };

  const signature = await signer.signTypedData({
    domain: {
      name: acceptedPayment.extra?.name ?? 'USDC',
      version: acceptedPayment.extra?.version ?? '2',
      chainId,
      verifyingContract: acceptedPayment.asset,
    },
    types: TRANSFER_WITH_AUTHORIZATION_TYPES,
    primaryType: 'TransferWithAuthorization',
    message: typedDataMessage,
  });

  const payload = {
    x402Version: paymentRequired.x402Version ?? DEFAULT_X402_VERSION,
    resource: paymentRequired.resource,
    accepted: acceptedPayment,
    payload: {
      signature,
      authorization: {
        from: resolvedSignerAddress as `0x${string}`,
        to: acceptedPayment.payTo as `0x${string}`,
        value: acceptedPayment.amount,
        validAfter: String(validAfter),
        validBefore: String(validBefore),
        nonce,
      },
    },
  };

  return {
    signerAddress: resolvedSignerAddress,
    paymentSignatureHeader: encodeBase64Json(payload),
  };
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function encodeBase64Json(value: unknown): string {
  const json = JSON.stringify(value);

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(json, 'utf8').toString('base64');
  }

  if (typeof btoa !== 'undefined') {
    return btoa(json);
  }

  throw new Error('No base64 encoder available in this runtime');
}

function decodeBase64Json(value: string): unknown {
  const normalized = normalizeBase64(value);

  let decoded: string;

  if (typeof Buffer !== 'undefined') {
    decoded = Buffer.from(normalized, 'base64').toString('utf8');
  } else if (typeof atob !== 'undefined') {
    decoded = atob(normalized);
  } else {
    throw new Error('No base64 decoder available in this runtime');
  }

  return JSON.parse(decoded);
}

function normalizeBase64(value: string): string {
  const replaced = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (replaced.length % 4)) % 4;

  return replaced + '='.repeat(padLength);
}

function generateRandomNonce(): `0x${string}` {
  if (!globalThis.crypto) {
    throw new Error('Crypto API is not available to generate x402 nonce');
  }

  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);

  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');

  return `0x${hex}`;
}

function normalizeNonce(value: string): `0x${string}` {
  const normalized = value.startsWith('0x') ? value : `0x${value}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(normalized)) {
    throw new Error('x402 nonce must be a 32-byte hex string');
  }

  return normalized as `0x${string}`;
}
