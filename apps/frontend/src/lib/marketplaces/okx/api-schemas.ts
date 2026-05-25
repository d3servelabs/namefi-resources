import { z } from 'zod';

/**
 * Zod schemas for the OKX NFT marketplace responses the adapter consumes.
 *
 * The `nftMarketplaces` backend proxy is a thin passthrough — it returns OKX's
 * shapes untouched — so all OKX-specific parsing lives here. OKX is inconsistent
 * about encoding numbers as JS numbers vs strings, so numeric fields accept
 * both via `numberLike`. Schemas `.passthrough()` to tolerate extra fields.
 */

/** A number OKX may encode as either a JS number or a decimal/hex string. */
const numberLike = z.union([z.string(), z.number()]);

/** A Seaport offer/consideration item carried on an OKX order's `protocolData`. */
const okxSeaportItemSchema = z
  .object({
    itemType: numberLike,
    token: z.string(),
    identifierOrCriteria: numberLike,
    startAmount: numberLike,
    endAmount: numberLike,
    recipient: z.string().optional(),
  })
  .passthrough();

/** Seaport `OrderComponents` parameters carried on an OKX order. */
export const OkxOrderParametersSchema = z
  .object({
    offerer: z.string(),
    zone: z.string(),
    offer: z.array(okxSeaportItemSchema),
    consideration: z.array(okxSeaportItemSchema),
    orderType: numberLike,
    startTime: numberLike,
    endTime: numberLike,
    zoneHash: z.string(),
    salt: numberLike,
    conduitKey: z.string(),
    counter: numberLike.optional(),
    totalOriginalConsiderationItems: numberLike.optional(),
  })
  .passthrough();

const okxProtocolDataSchema = z
  .object({
    parameters: OkxOrderParametersSchema,
    signature: z.string().nullable().optional(),
  })
  .passthrough();

/** A single OKX order from `markets/listings` or `markets/offers`. */
export const OkxOrderSchema = z
  .object({
    orderId: z.string(),
    orderHash: z.string().optional(),
    chain: z.string().optional(),
    collectionAddress: z.string(),
    tokenId: z.string(),
    maker: z.string(),
    /** "BuyNow" for listings, "Offer" for offers. */
    orderType: z.string(),
    /** Unit price — wei as a decimal string. */
    price: z.string(),
    currencyAddress: z.string(),
    amount: z.string().optional(),
    createTime: z.coerce.number().optional(),
    updateTime: z.coerce.number().optional(),
    listingTime: z.coerce.number().optional(),
    /** Order expiry, unix seconds. */
    expirationTime: z.coerce.number().optional(),
    /** "active" | "inactive" | "cancelled" | "sold". */
    status: z.string(),
    protocolAddress: z.string().optional(),
    protocolData: okxProtocolDataSchema.optional(),
  })
  .passthrough();

/** One item inside an OKX response `step` (approval, signature, or transaction). */
const okxStepItemSchema = z
  .object({
    kind: z.string(),
    status: z.string().optional(),
    // kind: "nftApproval"
    approvalAddress: z.string().optional(),
    collectionAddress: z.string().optional(),
    // kind: "signature"
    signKind: z.string().optional(),
    primaryType: z.string().optional(),
    data: z.unknown().optional(),
    domain: z
      .object({
        name: z.string().optional(),
        version: z.string().optional(),
        chainId: numberLike.optional(),
        verifyingContract: z.string().optional(),
      })
      .passthrough()
      .optional(),
    types: z
      .record(
        z.string(),
        z.array(z.object({ name: z.string(), type: z.string() })),
      )
      .optional(),
    post: z
      .object({
        method: z.string().optional(),
        endpoint: z.string(),
        body: z.unknown().optional(),
      })
      .passthrough()
      .optional(),
    // kind: "transaction"
    contractAddress: z.string().optional(),
    input: z.string().optional(),
    value: numberLike.optional(),
    // kind: "erc20Approval"
    amount: numberLike.optional(),
    tokenAddress: z.string().optional(),
  })
  .passthrough();

const okxStepSchema = z
  .object({
    action: z.string(),
    items: z.array(okxStepItemSchema).default([]),
  })
  .passthrough();

/** An order summary returned by `create-listing` (in the `orders` array). */
const okxCreatedOrderSchema = z
  .object({
    id: z.string(),
    price: z.string().optional(),
    tokenId: z.string().optional(),
    collectionAddress: z.string().optional(),
    currencyAddress: z.string().optional(),
    validTime: z.coerce.number().optional(),
  })
  .passthrough();

/** Response shape of `markets/create-listing`. */
export const OkxCreateListingResponseSchema = z
  .object({
    errors: z.array(z.unknown()).default([]),
    orders: z.array(okxCreatedOrderSchema).default([]),
    steps: z.array(okxStepSchema).default([]),
  })
  .passthrough();

/** Response shape of `markets/buy`. */
export const OkxBuyResponseSchema = z
  .object({
    errors: z.array(z.unknown()).default([]),
    steps: z.array(okxStepSchema).default([]),
  })
  .passthrough();

export type OkxOrder = z.infer<typeof OkxOrderSchema>;
export type OkxOrderParameters = z.infer<typeof OkxOrderParametersSchema>;
export type OkxStep = z.infer<typeof okxStepSchema>;
export type OkxStepItem = z.infer<typeof okxStepItemSchema>;
export type OkxCreateListingResponse = z.infer<
  typeof OkxCreateListingResponseSchema
>;
export type OkxBuyResponse = z.infer<typeof OkxBuyResponseSchema>;
