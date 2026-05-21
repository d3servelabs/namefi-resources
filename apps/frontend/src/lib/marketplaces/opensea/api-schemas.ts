import { z } from 'zod';

/**
 * OpenSea v2 REST response schemas — single source of truth for the API contract.
 *
 * All listing / offer reads go through `@opensea/sdk/viem` (typed SDK methods),
 * so the only raw response parsed here is `POST /api/v2/offers/fulfillment_data`
 * — the ready-to-send accept-offer transaction.
 *
 * The Seaport-order shapes are kept because the adapter also reads
 * `protocol_data.parameters` off SDK results (for the on-chain cancel fallback).
 */

// ---------------------------------------------------------------------------
// Seaport order components (shape that appears on every order's `protocol_data`)
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
// Fulfillment data (POST /api/v2/offers/fulfillment_data response)
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
// Inferred types
// ---------------------------------------------------------------------------

export type OpenSeaProtocolData = z.infer<typeof OpenSeaProtocolDataSchema>;
export type SeaportOrderParameters = z.infer<
  typeof SeaportOrderParametersSchema
>;
export type FulfillmentDataResponse = z.infer<
  typeof FulfillmentDataResponseSchema
>;
