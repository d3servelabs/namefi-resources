import { checksumWalletAddressSchema } from '@namefi-astra/utils';
import { z } from 'zod';

import { createContract } from '../create-contract';
import type { RouterContract } from '../trpc-contract';

/**
 * Contract for the admin NFSC sub-router.
 *
 * The router (`apps/backend/src/trpc/routers/admin/nfscRouter.ts`) is
 * type-checked against this contract via
 * `createContractTRPCRouter<typeof adminNfscContract>`. Procedures use
 * `adminProcedureWithPermissions` / `auditedAdminProcedureWithPermissions`.
 */

// `CHAINS.base.id` is 8453 (Base mainnet). Hardcoded as a default here so
// common doesn't need to import `@namefi-astra/utils/chains` (which pulls in
// viem).
const BASE_CHAIN_ID = 8453;
const chainIdSchema = z.number().int().positive().default(BASE_CHAIN_ID);

const listRecentMintWorkflowsInputSchema = z.object({
  days: z.number().int().min(1).max(30).default(7),
  limit: z.number().int().min(1).max(100).default(50),
  pageToken: z.string().optional(),
});

const mintBulkInputSchema = z.object({
  users: z
    .array(
      z.object({
        walletAddress: checksumWalletAddressSchema,
        amount: z.number().min(1).max(10000),
        memo: z.string().optional(),
      }),
    )
    .min(1)
    .max(100),
  chainId: chainIdSchema,
  reason: z.string().min(1),
});

const listRecentMintWorkflowsOutputSchema = z.custom<{
  workflows: Array<{
    workflowId: string;
    workflowType: string;
    status: string;
    startTime: Date | null;
    closeTime: Date | null;
    runId: string;
    memo: {
      recipientWallet?: string;
      chainId?: number;
      timestamp?: string;
    };
    searchAttributes: Record<string, unknown>;
  }>;
  nextPageToken: string | Uint8Array<ArrayBuffer> | undefined;
  hasNextPage: boolean;
}>(() => true);

const mintBulkOutputSchema = z.custom<{
  success: boolean;
  message: string;
  results: Array<{
    walletAddress: string;
    amount: number;
    workflowId: string;
    status: 'error' | 'started';
    error?: string;
  }>;
  errors: Array<{
    walletAddress: string;
    amount: number;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}>(() => true);

export const adminNfscContract = createContract(
  { softOutput: true },
  {
    listRecentMintWorkflows: {
      type: 'query',
      input: listRecentMintWorkflowsInputSchema,
      output: listRecentMintWorkflowsOutputSchema,
    },
    mintBulk: {
      type: 'mutation',
      input: mintBulkInputSchema,
      output: mintBulkOutputSchema,
    },
  },
);

export type AdminNfscContract = typeof adminNfscContract;
