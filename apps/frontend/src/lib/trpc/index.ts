'use client';

import type { adminContract } from '@namefi-astra/common/contract/admin/admin-contract';
import type { aiContract } from '@namefi-astra/common/contract/ai-contract';
import type { analyticsContract } from '@namefi-astra/common/contract/analytics-contract';
import type { apiKeysContract } from '@namefi-astra/common/contract/api-keys-contract';
import type { authContract } from '@namefi-astra/common/contract/auth-contract';
import type { cartsContract } from '@namefi-astra/common/contract/carts-contract';
import type { configContract } from '@namefi-astra/common/contract/config-contract';
import type { dnsCacheContract } from '@namefi-astra/common/contract/dns-cache-contract';
import type { dnsRecordsContract } from '@namefi-astra/common/contract/dns-records-contract';
import type { domainConfigContract } from '@namefi-astra/common/contract/domain-config-contract';
import type { feedbackContract } from '@namefi-astra/common/contract/feedback-contract';
import type { freeClaimsContract } from '@namefi-astra/common/contract/free-claims-contract';
import type { huntContract } from '@namefi-astra/common/contract/hunt-contract';
import type { leadgenContract } from '@namefi-astra/common/contract/leadgen-contract';
import type { mlsContract } from '@namefi-astra/common/contract/mls-contract';
import type { newsletterContract } from '@namefi-astra/common/contract/newsletter-contract';
import type { ordersContract } from '@namefi-astra/common/contract/orders-contract';
import type { paymentsContract } from '@namefi-astra/common/contract/payments-contract';
import type { pbnIssuanceReservationsContract } from '@namefi-astra/common/contract/pbn-issuance-reservations-contract';
import type { poweredByNamefiOwnerContract } from '@namefi-astra/common/contract/powered-by-namefi-owner-contract';
import type { registryContract } from '@namefi-astra/common/contract/registry-contract';
import type { searchContract } from '@namefi-astra/common/contract/search-contract';
import type { shareContract } from '@namefi-astra/common/contract/share-contract';
import type { testSignedPayloadContract } from '@namefi-astra/common/contract/test-signed-payload-contract';
import type {
  ContractRouter,
  ProcedureFor,
} from '@namefi-astra/common/contract/trpc-contract';
import type { usersContract } from '@namefi-astra/common/contract/users-contract';
import type { versionContract } from '@namefi-astra/common/contract/version-contract';
import type { wishlistContract } from '@namefi-astra/common/contract/wishlist-contract';
import type { x402Contract } from '@namefi-astra/common/contract/x402-contract';
import type {
  inferRouterInputs,
  inferRouterOutputs,
  TRPCRouterDef,
  TRPC_ERROR_CODE_NUMBER,
} from '@trpc/server';
import type { z } from 'zod';

import { createTRPCContext } from '@trpc/tanstack-react-query';

/**
 * Contract-derived sub-router types. These routers now have a contract
 * declared in `@namefi-astra/common/contract/*-contract`, so we can synthesize their
 * full `Router` type directly from the contract without reaching into the
 * backend's runtime router instance.
 */
type ContractBackedRecord = {
  admin: ContractRouter<typeof adminContract>;
  ai: ContractRouter<typeof aiContract>;
  analytics: ContractRouter<typeof analyticsContract>;
  apiKeys: ContractRouter<typeof apiKeysContract>;
  auth: ContractRouter<typeof authContract>;
  carts: ContractRouter<typeof cartsContract>;
  config: ContractRouter<typeof configContract>;
  dnsCache: ContractRouter<typeof dnsCacheContract>;
  dnsRecords: ContractRouter<typeof dnsRecordsContract>;
  domainConfig: ContractRouter<typeof domainConfigContract>;
  feedback: ContractRouter<typeof feedbackContract>;
  freeClaims: ContractRouter<typeof freeClaimsContract>;
  hunt: ContractRouter<typeof huntContract>;
  leadgen: ContractRouter<typeof leadgenContract>;
  mls: ContractRouter<typeof mlsContract>;
  newsletter: ContractRouter<typeof newsletterContract>;
  orders: ContractRouter<typeof ordersContract>;
  payments: ContractRouter<typeof paymentsContract>;
  pbnOwner: ContractRouter<typeof poweredByNamefiOwnerContract>;
  pbnReservations: ContractRouter<typeof pbnIssuanceReservationsContract>;
  registry: ContractRouter<typeof registryContract>;
  search: ContractRouter<typeof searchContract>;
  share: ContractRouter<typeof shareContract>;
  testSignedPayload: ContractRouter<typeof testSignedPayloadContract>;
  users: ContractRouter<typeof usersContract>;
  /** Top-level `appRouter.version` query — not a sub-router. */
  version: ProcedureFor<typeof versionContract>;
  wishlist: ContractRouter<typeof wishlistContract>;
  x402: ContractRouter<typeof x402Contract>;
};

export type TrpcErrorShape = {
  message: string;
  code: TRPC_ERROR_CODE_NUMBER;
  data: {
    code:
      | 'BAD_GATEWAY'
      | 'BAD_REQUEST'
      | 'CLIENT_CLOSED_REQUEST'
      | 'CONFLICT'
      | 'FORBIDDEN'
      | 'GATEWAY_TIMEOUT'
      | 'INTERNAL_SERVER_ERROR'
      | 'METHOD_NOT_SUPPORTED'
      | 'NOT_FOUND'
      | 'NOT_IMPLEMENTED'
      | 'PARSE_ERROR'
      | 'PAYLOAD_TOO_LARGE'
      | 'PAYMENT_REQUIRED'
      | 'PRECONDITION_FAILED'
      | 'SERVICE_UNAVAILABLE'
      | 'TIMEOUT'
      | 'TOO_MANY_REQUESTS'
      | 'UNAUTHORIZED'
      | 'UNPROCESSABLE_CONTENT'
      | 'UNSUPPORTED_MEDIA_TYPE';
    httpStatus: number;
    path?: string | undefined;
    stack?: string | undefined;
    zodError: z.ZodFlattenedError<unknown, string> | null;
  };
};

export type AppRouter = {
  // biome-ignore lint/style/useNamingConvention: matches tRPC internals.
  _def: TRPCRouterDef<
    {
      // biome-ignore lint/suspicious/noExplicitAny: mirrors tRPC router definition generics.
      ctx: any;
      // biome-ignore lint/suspicious/noExplicitAny: mirrors tRPC router definition generics.
      meta: any;
      errorShape: TrpcErrorShape;
      transformer: true;
    },
    ContractBackedRecord
  >;
  // biome-ignore lint/suspicious/noExplicitAny: caller type is supplied by tRPC runtime.
  createCaller: any;
};

export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>();

export type AppRouterOutput = inferRouterOutputs<AppRouter>;
export type AppRouterInput = inferRouterInputs<AppRouter>;
