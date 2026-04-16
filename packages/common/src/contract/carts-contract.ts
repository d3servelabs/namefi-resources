import type { cartItemsTable } from '@namefi-astra/db';
import { cartItemInsertSchema, cartItemUpdateSchema } from '@namefi-astra/db';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { z } from 'zod';

import type { RouterContract } from './trpc-contract';

/**
 * Contract for the carts router.
 *
 * The router (`apps/backend/src/trpc/routers/cartsRouter.ts`) is
 * type-checked against this contract via
 * `createContractTRPCRouter<typeof cartsContract>`. Mutations
 * (`addItems`, `updateItem`, `removeItem`) are wrapped in
 * `withAudit(protectedProcedure, ...)` at the router file — those
 * middleware decisions stay at the call site.
 */

/**
 * Drizzle row type for `cart_items` — `$inferSelect` rather than the
 * drizzle-zod `cartItemSelectSchema` because `db.query.cartItemsTable.findMany`
 * returns the row shape with `metadata: T | null`, while `cartItemSelectSchema`
 * has `metadata?: T | undefined`. Using the row type keeps the contract
 * structurally compatible with the actual handler return type.
 */
type CartItemRow = typeof cartItemsTable.$inferSelect;

// ---------------------------------------------------------------------------
// Inputs — reuse the drizzle-zod schemas from `@namefi-astra/db`.
// ---------------------------------------------------------------------------

const addItemsInputSchema = z.array(
  cartItemInsertSchema
    .omit({
      id: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
      encryptionKeyId: true,
      encryptedEppAuthorizationCode: true,
    })
    .required()
    .partial({
      metadata: true,
    })
    .extend({
      // Plain-text EPP authorization code; the handler encrypts it before
      // persisting.
      eppAuthorizationCode: z.string().optional(),
    }),
);

const updateItemInputSchema = cartItemUpdateSchema
  .pick({
    id: true,
    durationInYears: true,
  })
  .required()
  .partial({
    durationInYears: true,
  })
  .extend({
    eppAuthorizationCode: z.string().optional(),
  })
  .refine(
    (data) =>
      data.durationInYears !== undefined ||
      data.eppAuthorizationCode !== undefined,
    {
      message:
        'At least one of durationInYears or eppAuthorizationCode must be provided',
    },
  );

const removeItemInputSchema = z.array(namefiNormalizedDomainSchema).min(1);

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

/**
 * `getItems` returns each cart row PLUS an optional `claims[]` aggregate
 * computed at the handler level via `checkItemClaimEligibility`. The
 * claim shape lives in the backend's free-claim activities and would
 * pull a large transitive surface into common, so we use the escape
 * hatch with a structural mirror.
 */
type CartItemClaimEntryLike = {
  groupOrCampaignKey: string;
  claimsAvailable: number;
  exactMatchClaims: Array<{
    createdAt: Date;
    updatedAt: Date;
    id: string;
    userId: string;
    groupOrCampaignKey: string;
    reason: string | null;
    exactDomainName?: string | null;
    parentDomain?: string | null;
    expirationDate: Date | null;
    orderItemId: string | null;
    claimingStatus: 'CLAIMED' | 'CLAIMING' | 'IDLE';
    claimedDomainName?: string | null;
    claimedAt: Date | null;
    metadata: unknown;
  }>;
  parentMatchClaims: Array<{
    createdAt: Date;
    updatedAt: Date;
    id: string;
    userId: string;
    groupOrCampaignKey: string;
    reason: string | null;
    exactDomainName?: string | null;
    parentDomain?: string | null;
    expirationDate: Date | null;
    orderItemId: string | null;
    claimingStatus: 'CLAIMED' | 'CLAIMING' | 'IDLE';
    claimedDomainName?: string | null;
    claimedAt: Date | null;
    metadata: unknown;
  }>;
};

export type CartItemWithClaimsLike = CartItemRow & {
  claims?: CartItemClaimEntryLike[];
};

// TODO(contract): replace with a structural zod schema for the cart-item +
// claims aggregate. The base `cartItemSelectSchema` is already structural;
// the `claims?: ...` extension is the part that lives in backend activity
// land.
const cartItemWithClaimsSchema = z.custom<CartItemWithClaimsLike>(() => true);

const getItemsOutputSchema = z.array(cartItemWithClaimsSchema);

// addItems / updateItem / removeItem all return drizzle rows from
// `db.insert(...).returning()` (or similar). Use the `$inferSelect` row
// type via `z.custom<CartItemRow>()` so the contract matches the actual
// nullability the driver hands back.
// TODO(contract): replace with a structural zod schema for cartItemsTable rows.
const cartItemRowSchema = z.custom<CartItemRow>(() => true);
const cartItemRowOutputSchema = z.array(cartItemRowSchema);

const clearOutputSchema = z.array(z.never());

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export const cartsContract = {
  getItems: {
    type: 'query',
    input: z.void(),
    output: getItemsOutputSchema,
  },
  addItems: {
    type: 'mutation',
    input: addItemsInputSchema,
    output: cartItemRowOutputSchema,
  },
  updateItem: {
    type: 'mutation',
    input: updateItemInputSchema,
    output: cartItemRowOutputSchema,
  },
  removeItem: {
    type: 'mutation',
    input: removeItemInputSchema,
    output: cartItemRowOutputSchema,
  },
  clear: {
    type: 'mutation',
    input: z.void(),
    output: clearOutputSchema,
  },
} as const satisfies RouterContract;

export type CartsContract = typeof cartsContract;
