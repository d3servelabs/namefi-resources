import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { z } from 'zod';

import { itemTypeSchema } from '../shared-schemas';
import { createContract } from './create-contract';
import {
  cartItemMetadataSchema,
  cartItemSchema,
  orderItemDomainSetupOptionsSchema,
  type CartItemSelect,
} from './entity-schemas';
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

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

const addItemsInputSchema = z.array(
  z
    .object({
      normalizedDomainName: namefiNormalizedDomainSchema,
      amountInUSDCents: z.number().int().nonnegative(),
      durationInYears: z.number().int().positive(),
      type: itemTypeSchema,
      registrar: z.string(),
      metadata: cartItemMetadataSchema.optional(),
    })
    .extend({
      eppAuthorizationCode: z.string().optional(),
    }),
);

const updateItemInputSchema = z
  .object({
    id: z.string(),
    durationInYears: z.number().int().positive().optional(),
    eppAuthorizationCode: z.string().optional(),
    // Per-item domain setup flags (autoRenew/autoPark/autoEns/dnssec and the
    // import-only keepExistingNameservers). The backend merges this into the
    // cart item's metadata.domainSetupOptions.
    domainSetupOptions: orderItemDomainSetupOptionsSchema.optional(),
  })
  .refine(
    (data) =>
      data.durationInYears !== undefined ||
      data.eppAuthorizationCode !== undefined ||
      data.domainSetupOptions !== undefined,
    {
      message:
        'At least one of durationInYears, eppAuthorizationCode, or domainSetupOptions must be provided',
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
 * pull a large transitive surface into common, so common keeps only a
 * typed mirror and preserves passthrough runtime validation for claims.
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

export type CartItemWithClaimsLike = CartItemSelect & {
  claims?: CartItemClaimEntryLike[];
};

const cartItemWithClaimsSchema = cartItemSchema.extend({
  // The base cart row is structural. The backend-computed claims aggregate
  // intentionally keeps the previous passthrough contract behavior.
  claims: z.array(z.custom<CartItemClaimEntryLike>(() => true)).optional(),
});

const getItemsOutputSchema = z.array(cartItemWithClaimsSchema);

const cartItemRowOutputSchema = z.array(cartItemSchema);

const clearOutputSchema = z.array(z.never());

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export const cartsContract = createContract(
  { softOutput: true },
  {
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
  },
);

export type CartsContract = typeof cartsContract;
export type { CartItemSelect };
