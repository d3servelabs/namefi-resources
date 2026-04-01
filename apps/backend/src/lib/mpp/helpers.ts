import { checksumWalletAddressSchema } from '@namefi-astra/utils';
import { Challenge, Credential, type Receipt } from 'mppx';
import type * as Tempo from 'mppx/tempo';
import { charge as createStripeCharge } from 'mppx/stripe/server';
import Stripe from 'stripe';
import { tempoModerato } from 'viem/chains';
import { db } from '@namefi-astra/db';
import { config, secrets } from '#lib/env';
import { createLogger } from '#lib/logger';
import {
  validateDomainForInstantPurchase,
  type ValidateDomainForPurchaseResult,
} from '#lib/instant-buy/index';
import type { z } from 'zod';
import { tempo } from 'mppx/server';
import { getSignerAccount } from '#lib/crypto/viem-clients';

const logger = createLogger({ context: 'MPP' });
const stripe = new Stripe(secrets.STRIPE_SECRET_KEY);

tempoModerato.extend({
  feeToken: getMppTempoCurrency(),
});

const [tempoMethod, _tempoSessionMethod] = tempo({
  currency: getMppTempoCurrency(),
  decimals: 6,
  recipient: getMppTempoRecipientOrThrow(),
  testnet: config.MPP_TEMPO_TESTNET,
  feePayer: true,
});

const stripeMethod = createStripeCharge({
  client: stripe,
  networkId: config.MPP_STRIPE_NETWORK_ID,
  paymentMethodTypes: ['card'],
});

type TempoRequestInput = z.input<typeof Tempo.Methods.charge.schema.request>;
type TempoRequest = z.output<typeof Tempo.Methods.charge.schema.request>;
type StripeRequestInput = z.input<typeof stripeMethod.schema.request>;
type StripeRequest = z.output<typeof stripeMethod.schema.request>;
type PaymentChallenge = ReturnType<typeof Challenge.fromMethod>;

type RegisterDomainMppPaymentBaseInput = {
  durationInYears: number;
  nftReceivingWalletAddress: `0x${string}`;
  normalizedDomainName: string;
  request: Request;
};

type PaymentAttemptResult =
  | { challenge: PaymentChallenge; status: 'payment_required' }
  | { receipt: Receipt.Receipt; status: 'paid' };

export type RegisterDomainMppPaymentRequiredResult = {
  challenge: Response;
  priceInUsdCents: number;
  status: 'payment_required';
  validation: ValidateDomainForPurchaseResult;
};

export type RegisterDomainMppPaidResult = {
  credential: Credential.Credential;
  priceInUsdCents: number;
  receipt: Receipt.Receipt;
  status: 'paid';
  validation: ValidateDomainForPurchaseResult;
};

export type RegisterDomainMppPaymentResult =
  | RegisterDomainMppPaymentRequiredResult
  | RegisterDomainMppPaidResult;

export const MPP_PAYMENT_RECEIPT_HEADER = 'Payment-Receipt';

export class MppPaymentRequiredError extends Error {
  constructor(
    public readonly data: {
      headers: Record<string, string>;
      metadata: Record<string, unknown>;
    },
    message = 'Payment Required',
  ) {
    super(message);
    this.name = 'MppPaymentRequiredError';
  }
}

export function ensureMppConfigured() {
  if (!config.MPP_ENABLED) {
    throw new Error('MPP payment protocol is not allowed');
  }

  getMppTempoRecipientOrThrow();
}

export function getMppTempoRecipient() {
  return config.MPP_TEMPO_RECIPIENT || config.X402_SIGNER_ADDRESS;
}

export function formatUsdCentsForMppAmount(amountInUsdCents: number) {
  return (amountInUsdCents / 100).toFixed(2);
}

export function getMppResourceMetadata(input: {
  durationInYears: number;
  normalizedDomainName: string;
  priceInUsdCents: number;
  nftReceivingWalletAddress: string;
}) {
  return {
    domain: input.normalizedDomainName,
    durationInYears: input.durationInYears,
    nftReceivingWalletAddress: input.nftReceivingWalletAddress,
    priceInUsdCents: input.priceInUsdCents,
  };
}

export function buildMppPaymentRequiredResponse(input: {
  challenge: Response;
  metadata: Record<string, unknown>;
}) {
  const headers = new Headers(input.challenge.headers);
  headers.set('Content-Type', 'application/json');

  return new Response(
    JSON.stringify({
      message: 'Payment Required',
      status: 402,
      ...input.metadata,
    }),
    {
      headers,
      status: 402,
    },
  );
}

export function getMppPaymentRequiredError(input: {
  challenge: Response;
  metadata: Record<string, unknown>;
}) {
  return new MppPaymentRequiredError({
    headers: Object.fromEntries(input.challenge.headers.entries()),
    metadata: input.metadata,
  });
}

export function getWalletAddressFromDid(source?: string) {
  if (!source) {
    return undefined;
  }

  const match = source.match(/^did:pkh:eip155:\d+:(0x[a-fA-F0-9]{40})$/);
  if (!match) {
    return undefined;
  }

  const result = checksumWalletAddressSchema.safeParse(match[1]);
  if (!result.success) {
    return undefined;
  }

  return result.data;
}

export async function assertNoActiveMppRegistration(
  normalizedDomainName: string,
) {
  const activeOrderItem = await db.query.orderItemsTable.findFirst({
    where: (table, { and, eq, inArray }) =>
      and(
        eq(table.normalizedDomainName, normalizedDomainName as any),
        inArray(table.status, ['CREATED', 'PROCESSING']),
      ),
    columns: { id: true },
  });

  if (activeOrderItem) {
    throw new Error('A purchase is already in progress for this domain');
  }
}

function getMppTempoCurrency() {
  return checksumWalletAddressSchema.parse(config.MPP_TEMPO_CURRENCY);
}

function getMppTempoRecipientOrThrow() {
  return checksumWalletAddressSchema.parse(getMppTempoRecipient());
}

function buildTempoPaymentRequest(input: {
  amount: string;
  description: string;
}): TempoRequestInput {
  return {
    amount: input.amount,
    currency: getMppTempoCurrency(),
    decimals: 6,
    description: input.description,
    recipient: getMppTempoRecipientOrThrow(),
  };
}

function buildStripePaymentRequest(input: {
  amount: string;
  description: string;
}): StripeRequestInput {
  return {
    amount: input.amount,
    currency: 'usd',
    decimals: 2,
    description: input.description,
    networkId: config.MPP_STRIPE_NETWORK_ID,
    paymentMethodTypes: ['card'],
  };
}

function buildChallengeResponse(challenges: PaymentChallenge[]) {
  const headers = new Headers();
  for (const challenge of challenges) {
    headers.append('WWW-Authenticate', Challenge.serialize(challenge));
  }

  return new Response(null, {
    headers,
    status: 402,
  });
}

function parseCredentialFromRequest(request: Request) {
  try {
    return Credential.fromRequest(request);
  } catch {
    return null;
  }
}

function credentialMatchesChallenge(input: {
  challenge: PaymentChallenge;
  credential: Credential.Credential;
  methodName: string;
}) {
  if (input.credential.challenge.method !== input.methodName) {
    return false;
  }

  if (
    !Challenge.verify(input.credential.challenge, {
      secretKey: secrets.COOKIE_SECRET,
    })
  ) {
    return false;
  }

  const routeRequest = input.challenge.request as Record<string, unknown>;
  const echoedRequest = input.credential.challenge.request as Record<
    string,
    unknown
  >;

  for (const field of ['amount', 'currency', 'recipient'] as const) {
    if (
      routeRequest[field] !== undefined &&
      (echoedRequest[field] === undefined ||
        String(routeRequest[field]) !== String(echoedRequest[field]))
    ) {
      return false;
    }
  }

  return true;
}

async function tryTempoRegisterDomainMppPayment(input: {
  credential: Credential.Credential | null;
  description: string;
  meta: Record<string, string>;
  priceInUsdCents: number;
  realm: string;
}): Promise<PaymentAttemptResult> {
  const requestInput = buildTempoPaymentRequest({
    amount: formatUsdCentsForMppAmount(input.priceInUsdCents),
    description: input.description,
  });

  const challenge = Challenge.fromMethod(tempoMethod, {
    description: input.description,
    expires: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    meta: input.meta,
    realm: input.realm,
    request: requestInput,
    secretKey: secrets.COOKIE_SECRET,
  });

  if (
    !input.credential ||
    !credentialMatchesChallenge({
      challenge,
      credential: input.credential,
      methodName: tempoMethod.name,
    })
  ) {
    return { challenge, status: 'payment_required' };
  }

  tempoMethod.schema.credential.payload.parse(input.credential.payload);
  const request = await tempoMethod.request?.({
    credential: input.credential,
    request: requestInput,
  });

  return {
    receipt: await tempoMethod.verify({
      credential: input.credential as any,
      request: request ?? requestInput,
    }),
    status: 'paid',
  };
}

async function tryStripeRegisterDomainMppPayment(input: {
  credential: Credential.Credential | null;
  description: string;
  meta: Record<string, string>;
  priceInUsdCents: number;
  realm: string;
}): Promise<PaymentAttemptResult> {
  const requestInput = buildStripePaymentRequest({
    amount: formatUsdCentsForMppAmount(input.priceInUsdCents),
    description: input.description,
  });

  const challenge = Challenge.fromMethod(stripeMethod, {
    description: input.description,
    expires: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    meta: input.meta,
    realm: input.realm,
    request: requestInput,
    secretKey: secrets.COOKIE_SECRET,
  });

  if (
    !input.credential ||
    !credentialMatchesChallenge({
      challenge,
      credential: input.credential,
      methodName: stripeMethod.name,
    })
  ) {
    return { challenge, status: 'payment_required' };
  }

  stripeMethod.schema.credential.payload.parse(input.credential.payload);

  return {
    receipt: await stripeMethod.verify({
      credential: input.credential as any,
      request: requestInput,
    }),
    status: 'paid',
  };
}

export async function getRegisterDomainMppPaymentResult(
  input: RegisterDomainMppPaymentBaseInput,
): Promise<RegisterDomainMppPaymentResult> {
  ensureMppConfigured();
  checksumWalletAddressSchema.parse(input.nftReceivingWalletAddress);

  const validation = await validateDomainForInstantPurchase({
    durationInYears: input.durationInYears,
    normalizedDomainName: input.normalizedDomainName as any,
    user: undefined,
  });

  if (!validation.isValid) {
    throw new Error(validation.error || 'Domain not available for purchase');
  }

  await assertNoActiveMppRegistration(input.normalizedDomainName);

  const description = `Register ${input.normalizedDomainName} for ${input.durationInYears} year(s)`;
  const meta = {
    domain: input.normalizedDomainName,
    durationInYears: String(input.durationInYears),
    priceInUsdCents: String(validation.priceInUsdCents),
  };
  const realm = new URL(input.request.url).host;
  const credential = parseCredentialFromRequest(input.request);

  logger.info(
    {
      credential,
    },
    'parseCredentialFromRequest',
  );
  const tempoResult = await tryTempoRegisterDomainMppPayment({
    credential,
    description,
    meta,
    priceInUsdCents: validation.priceInUsdCents,
    realm,
  });
  if (tempoResult.status === 'paid') {
    logger.info(
      {
        domain: input.normalizedDomainName,
        method: tempoResult.receipt.method,
        reference: tempoResult.receipt.reference,
      },
      'MPP payment verified',
    );

    return {
      credential: credential!,
      priceInUsdCents: validation.priceInUsdCents,
      receipt: tempoResult.receipt,
      status: 'paid',
      validation,
    };
  }

  const stripeResult = await tryStripeRegisterDomainMppPayment({
    credential,
    description,
    meta,
    priceInUsdCents: validation.priceInUsdCents,
    realm,
  });
  if (stripeResult.status === 'paid') {
    logger.info(
      {
        domain: input.normalizedDomainName,
        method: stripeResult.receipt.method,
        reference: stripeResult.receipt.reference,
      },
      'MPP payment verified',
    );

    return {
      credential: credential!,
      priceInUsdCents: validation.priceInUsdCents,
      receipt: stripeResult.receipt,
      status: 'paid',
      validation,
    };
  }

  logger.info(
    {
      domain: input.normalizedDomainName,
      priceInUsdCents: validation.priceInUsdCents,
    },
    'MPP payment challenge issued',
  );

  return {
    challenge: buildChallengeResponse([
      tempoResult.challenge,
      stripeResult.challenge,
    ]),
    priceInUsdCents: validation.priceInUsdCents,
    status: 'payment_required',
    validation,
  };
}
