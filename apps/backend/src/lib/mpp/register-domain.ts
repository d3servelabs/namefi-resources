import type {
  ChecksumWalletAddress,
  NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import { checksumWalletAddressSchema } from '@namefi-astra/utils';
import { db } from '@namefi-astra/db';
import {
  orderItemsTable,
  ordersTable,
  paymentsTable,
  type PaymentMetadata,
} from '@namefi-astra/db/schema';
import { itemTypeSchema } from '@namefi-astra/db/types';
import { TRPCError } from '@trpc/server';
import type { Credential, Receipt } from 'mppx';
import { sql } from 'drizzle-orm';
import { temporalClient } from '#temporal/client';
import { TEMPORAL_QUEUES } from '#temporal/shared';
import { processOrderWorkflow } from '#temporal/workflows/processOrder.workflow';
import { getDefaultAllowedNftChainId } from '#lib/env/allowed-chains';
import { createLogger } from '#lib/logger';
import { emitOrderPlacedIfTracked } from '#lib/tracking/checkout/events';
import {
  resolveApiCheckoutTracking,
  toGaEventTracking,
} from '#lib/tracking/checkout/context';
import {
  findOrCreateUserFromWallet,
  type FindOrCreateUserFromWalletResult,
} from '#temporal/activities/x402.activities';
import type { ValidateDomainForPurchaseResult } from '#lib/instant-buy/index';
import { getWalletAddressFromDid } from './helpers';

const logger = createLogger({ context: 'MPP_REGISTER_DOMAIN' });

type AuthenticatedUser = {
  id: string;
  privyUserId: string;
};

type CreateMppInstantRegistrationInput = {
  credential: Credential.Credential;
  durationInYears: number;
  nftReceivingWalletAddress: ChecksumWalletAddress;
  normalizedDomainName: NamefiNormalizedDomain;
  receipt: Receipt.Receipt;
  user?: AuthenticatedUser;
  validation: ValidateDomainForPurchaseResult;
};

export type CreateMppInstantRegistrationResult = {
  domain: NamefiNormalizedDomain;
  estimatedCompletionSeconds: number;
  message: string;
  nftReceivingWalletAddress: ChecksumWalletAddress;
  orderId: string;
  payerDid?: string;
  payerWalletAddress?: ChecksumWalletAddress;
  paymentId: string;
  paymentMethod: 'stripe' | 'tempo';
  status: 'accepted';
};

type ResolvedMppUserContext = {
  nftReceivingWalletAddress: ChecksumWalletAddress;
  payerWalletAddress?: ChecksumWalletAddress;
  userId: string;
};

type MppCredentialSummary = {
  source?: string;
  tempoPayloadType?: 'hash' | 'transaction';
  stripeExternalId?: string;
};

function getCredentialSummary(credential: Credential.Credential) {
  if (!credential.payload || typeof credential.payload !== 'object') {
    return credential.source ? { source: credential.source } : undefined;
  }

  const payload = credential.payload as Record<string, unknown>;
  const summary: MppCredentialSummary = {
    source: credential.source,
  };

  if (typeof payload.type === 'string') {
    if (payload.type === 'hash' || payload.type === 'transaction') {
      summary.tempoPayloadType = payload.type;
    }
  }

  if (typeof payload.externalId === 'string') {
    summary.stripeExternalId = payload.externalId;
  }

  return Object.values(summary).some(Boolean) ? summary : undefined;
}

async function findOrCreateUserContextFromWallet(
  walletAddress: ChecksumWalletAddress,
): Promise<FindOrCreateUserFromWalletResult> {
  return findOrCreateUserFromWallet({ walletAddress });
}

async function resolveMppUserContext(input: {
  credential: Credential.Credential;
  nftReceivingWalletAddress: ChecksumWalletAddress;
  user?: AuthenticatedUser;
}): Promise<ResolvedMppUserContext> {
  const payerWalletAddress = getWalletAddressFromDid(input.credential.source);

  if (input.user) {
    return {
      nftReceivingWalletAddress: input.nftReceivingWalletAddress,
      payerWalletAddress,
      userId: input.user.id,
    };
  }

  const userResult = await findOrCreateUserContextFromWallet(
    input.nftReceivingWalletAddress,
  );
  return {
    nftReceivingWalletAddress: input.nftReceivingWalletAddress,
    payerWalletAddress,
    userId: userResult.userId,
  };
}

export async function createMppInstantRegistration(
  input: CreateMppInstantRegistrationInput,
): Promise<CreateMppInstantRegistrationResult> {
  if (!input.nftReceivingWalletAddress) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'MPP purchases require nftReceivingWalletAddress',
    });
  }

  const resolvedUserContext = await resolveMppUserContext({
    credential: input.credential,
    nftReceivingWalletAddress: input.nftReceivingWalletAddress,
    user: input.user,
  });
  const gaEventTracking = await resolveApiCheckoutTracking({
    userId: resolvedUserContext.userId,
  });

  const orderResult = await db.transaction(async (tx) => {
    const lockKey = `mpp-register:${input.normalizedDomainName}`;

    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`);

    const existingOrderItem = await tx.query.orderItemsTable.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.normalizedDomainName, input.normalizedDomainName),
          eq(table.status, 'PROCESSING'),
        ),
      columns: { id: true },
    });

    if (existingOrderItem) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'A purchase is already in progress for this domain',
      });
    }

    const [order] = await tx
      .insert(ordersTable)
      .values({
        amountInUSDCents: input.validation.priceInUsdCents,
        nftChainId: getDefaultAllowedNftChainId(),
        nftWalletAddress: resolvedUserContext.nftReceivingWalletAddress,
        status: 'PROCESSING',
        userId: resolvedUserContext.userId,
      })
      .returning();

    const [orderItem] = await tx
      .insert(orderItemsTable)
      .values({
        amountInUSDCents: input.validation.priceInUsdCents,
        durationInYears: input.durationInYears,
        normalizedDomainName: input.normalizedDomainName,
        orderId: order.id,
        registrar: input.validation.registrar,
        status: 'PROCESSING',
        type: itemTypeSchema.enum.REGISTER,
      })
      .returning();

    const metadata: PaymentMetadata = {
      mppPaymentDetails: {
        challenge: input.credential.challenge as Record<string, unknown>,
        credentialSummary: getCredentialSummary(input.credential),
        method: input.receipt.method as 'tempo' | 'stripe',
        nftReceivingWalletAddress:
          resolvedUserContext.nftReceivingWalletAddress,
        payerDid: input.credential.source,
        payerWalletAddress: resolvedUserContext.payerWalletAddress,
        presettled: true,
        receipt: {
          ...input.receipt,
          method: input.receipt.method as 'tempo' | 'stripe',
        },
        settledAt: input.receipt.timestamp,
      },
    };

    const [payment] = await tx
      .insert(paymentsTable)
      .values({
        amountInUSDCents: input.validation.priceInUsdCents,
        metadata,
        orderId: order.id,
        paymentProvider: 'MPP',
        paymentProviderReferenceId: input.receipt.reference,
        status: 'CREATED',
      })
      .returning();

    return {
      orderId: order.id,
      orderItemId: orderItem.id,
      paymentId: payment.id,
    };
  });

  try {
    await temporalClient.workflow.start(processOrderWorkflow, {
      args: [
        {
          gaEventTracking: toGaEventTracking(gaEventTracking),
          orderId: orderResult.orderId,
          paymentsMetadata: {},
        },
      ],
      taskQueue: TEMPORAL_QUEUES.DOMAINS,
      workflowId: `process-order-${orderResult.orderId}`,
    });
  } catch (error) {
    logger.error(
      { error, orderId: orderResult.orderId },
      'Could not start MPP order workflow',
    );
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message:
        'Could not initiate the order, please contact support if the issue persists',
    });
  }

  void emitOrderPlacedIfTracked({
    tracking: gaEventTracking,
    userId: resolvedUserContext.userId,
    order: {
      id: orderResult.orderId,
      amountInUSDCents: input.validation.priceInUsdCents,
      items: [input.normalizedDomainName],
    },
    paymentCount: 1,
    orderSource: 'instant_buy',
  }).catch((error) => {
    logger.warn(
      { error, orderId: orderResult.orderId },
      'Failed to emit MPP order_placed analytics event',
    );
  });

  return {
    domain: input.normalizedDomainName,
    estimatedCompletionSeconds: 60,
    message: 'Payment accepted, processing domain registration',
    nftReceivingWalletAddress: checksumWalletAddressSchema.parse(
      resolvedUserContext.nftReceivingWalletAddress,
    ),
    orderId: orderResult.orderId,
    payerDid: input.credential.source,
    payerWalletAddress: resolvedUserContext.payerWalletAddress,
    paymentId: orderResult.paymentId,
    paymentMethod: input.receipt.method as 'tempo' | 'stripe',
    status: 'accepted',
  };
}
