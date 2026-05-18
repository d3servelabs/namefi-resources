import { z } from 'zod';

/**
 * OpenSea v2 REST API response schemas.
 *
 * Single source of truth for the API contract. Every fetch from `rest-client.ts` runs
 * through these schemas so a silent shape change in OpenSea's API surfaces as a clear
 * parse error rather than corrupt UI state.
 *
 * Schemas are intentionally permissive (most fields `.optional()`) — OpenSea adds new
 * fields without bumping a version, and we only consume a small subset of each order.
 */

// ---------------------------------------------------------------------------
// Seaport order components (protocol_data shape that comes back on each order)
// ---------------------------------------------------------------------------

const SeaportOfferItemSchema = z
  .object({
    itemType: z.number(),
    token: z.string(),
    identifierOrCriteria: z.union([z.string(), z.number()]),
    startAmount: z.union([z.string(), z.number()]),
    endAmount: z.union([z.string(), z.number()]),
  })
  .passthrough();

const SeaportConsiderationItemSchema = z
  .object({
    itemType: z.number(),
    token: z.string(),
    identifierOrCriteria: z.union([z.string(), z.number()]),
    startAmount: z.union([z.string(), z.number()]),
    endAmount: z.union([z.string(), z.number()]),
    recipient: z.string(),
  })
  .passthrough();

const SeaportOrderParametersSchema = z
  .object({
    offerer: z.string(),
    zone: z.string(),
    offer: z.array(SeaportOfferItemSchema),
    consideration: z.array(SeaportConsiderationItemSchema),
    orderType: z.number(),
    startTime: z.union([z.string(), z.number()]),
    endTime: z.union([z.string(), z.number()]),
    zoneHash: z.string(),
    salt: z.union([z.string(), z.number()]),
    conduitKey: z.string(),
    totalOriginalConsiderationItems: z
      .union([z.string(), z.number()])
      .optional(),
    counter: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

export const OpenSeaProtocolDataSchema = z
  .object({
    parameters: SeaportOrderParametersSchema,
    signature: z.string().nullable().optional(),
  })
  .passthrough();

// ---------------------------------------------------------------------------
// Order (listings + offers share the same shape, distinguished by `side`)
// ---------------------------------------------------------------------------

const PaymentTokenSchema = z
  .object({
    address: z.string().optional(),
    decimals: z.number().optional(),
    symbol: z.string().optional(),
  })
  .passthrough();

const MakerSchema = z
  .object({
    address: z.string().optional(),
  })
  .passthrough();

/**
 * v2 REST order shape. Status is conveyed via boolean flags + `remaining_quantity` +
 * `expiration_time` — there is no `status` string field.
 */
export const OpenSeaApiOrderSchema = z
  .object({
    order_hash: z.string(),
    protocol_address: z.string().optional(),
    current_price: z.string().optional(),
    created_date: z.string().optional(),
    closing_date: z.string().nullable().optional(),
    listing_time: z.number().optional(),
    expiration_time: z.number().optional(),
    side: z.string().optional(),
    order_type: z.string().optional(),

    // Status (boolean flags, not a string enum)
    cancelled: z.boolean().optional(),
    finalized: z.boolean().optional(),
    marked_invalid: z.boolean().optional(),
    remaining_quantity: z.number().optional(),

    maker: MakerSchema.optional(),
    taker: MakerSchema.nullable().optional(),
    payment_token_contract: PaymentTokenSchema.optional(),
    protocol_data: OpenSeaProtocolDataSchema.optional(),
  })
  .passthrough();

export const OpenSeaOrdersResponseSchema = z
  .object({
    orders: z.array(OpenSeaApiOrderSchema).default([]),
    next: z.string().nullable().optional(),
    previous: z.string().nullable().optional(),
  })
  .passthrough();

// ---------------------------------------------------------------------------
// Cancel response
// ---------------------------------------------------------------------------

export const CancelOrderResponseSchema = z
  .object({
    last_signature_issued_valid_until: z.string().nullable().optional(),
  })
  .passthrough();

// ---------------------------------------------------------------------------
// Fulfillment data (used to accept an offer)
//
// OpenSea returns a ready-to-send transaction; we forward it to viem's
// `walletClient.sendTransaction(...)`.
// ---------------------------------------------------------------------------

const FulfillmentTransactionSchema = z
  .object({
    function: z.string().optional(),
    chain: z.union([z.string(), z.number()]).optional(),
    to: z.string(),
    value: z.union([z.string(), z.number()]).optional(),
    input_data: z.unknown().optional(),
  })
  .passthrough();

const FulfillmentActionSchema = z
  .object({
    action: z.string().optional(),
    transaction: FulfillmentTransactionSchema.optional(),
  })
  .passthrough();

export const FulfillmentDataResponseSchema = z
  .object({
    protocol: z.string().optional(),
    fulfillment_data: z
      .object({
        transaction: FulfillmentTransactionSchema.optional(),
        orders: z.array(z.unknown()).optional(),
      })
      .passthrough()
      .optional(),
    actions: z.array(FulfillmentActionSchema).optional(),
  })
  .passthrough();

// ---------------------------------------------------------------------------
// Inferred types — adapters consume these instead of the raw `unknown`.
// ---------------------------------------------------------------------------

export type OpenSeaApiOrder = z.infer<typeof OpenSeaApiOrderSchema>;
export type OpenSeaOrdersResponse = z.infer<typeof OpenSeaOrdersResponseSchema>;
export type OpenSeaProtocolData = z.infer<typeof OpenSeaProtocolDataSchema>;
export type SeaportOrderParameters = z.infer<
  typeof SeaportOrderParametersSchema
>;
export type FulfillmentDataResponse = z.infer<
  typeof FulfillmentDataResponseSchema
>;
