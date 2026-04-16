import { z } from 'zod';

import type { RouterContract } from '../trpc-contract';

/**
 * Contract for the admin orders sub-router.
 *
 * The router (`apps/backend/src/trpc/routers/admin/adminOrdersRouter.ts`)
 * is type-checked against this contract via
 * `createContractTRPCRouter<typeof adminOrdersContract>`. Procedures use
 * `adminProcedureWithPermissions` with multi-permission modes.
 */

const columnFilterSchema = z.object({
  id: z.string(),
  value: z.object({
    operator: z.enum(['like', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte']),
    value: z.union([z.string(), z.number(), z.date()]),
  }),
});

const sortingSchema = z.object({
  id: z.string(),
  desc: z.boolean(),
});

const listOrderItemsInputSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(25),
  searchTerm: z.string().optional(),
  columnFilters: z.array(columnFilterSchema).optional(),
  sorting: z.array(sortingSchema).optional(),
});

const listOrdersInputSchema = listOrderItemsInputSchema.extend({
  userId: z.string().optional(),
});

/**
 * Wire shape of `listOrderItems` / `listOrders` — paginated arrays of
 * join-flattened rows with dynamic columns. The row shape has dozens of
 * fields that frontend code reads individually; `z.any()` on each row
 * keeps the contract tractable while the top-level wrapper gives tRPC a
 * real `z.object(...)` to infer through.
 */
const paginatedOrdersOutputSchema = z.object({
  items: z.array(z.any()),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const adminOrdersContract = {
  listOrderItems: {
    type: 'query',
    input: listOrderItemsInputSchema,
    output: paginatedOrdersOutputSchema,
  },
  listOrders: {
    type: 'query',
    input: listOrdersInputSchema,
    output: paginatedOrdersOutputSchema,
  },
} as const satisfies RouterContract;

export type AdminOrdersContract = typeof adminOrdersContract;
