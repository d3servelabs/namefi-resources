import { z } from 'zod';

/**
 * Zod schemas for the Rarible v0.1 REST order responses — single source of
 * truth for the API contract. The REST client validates every response against
 * these, so a Rarible API shape change throws immediately instead of silently
 * producing empty/garbage data.
 *
 * Only the slice the adapter reads is modelled; `.passthrough()` keeps the rest.
 */

const BigNumberLikeSchema = z.union([z.string(), z.number()]);

/**
 * Rarible union asset type — a discriminated shape keyed by `@type`
 * (`ETH`, `ERC20`, `ERC721`, …). `contract` is a union-prefixed address
 * (`BASE:0x…`) for token types.
 */
const RaribleAssetTypeSchema = z
  .object({
    '@type': z.string(),
    contract: z.string().optional(),
    tokenId: BigNumberLikeSchema.optional(),
    blockchain: z.string().optional(),
  })
  .passthrough();

const RaribleAssetSchema = z
  .object({
    type: RaribleAssetTypeSchema,
    value: BigNumberLikeSchema,
  })
  .passthrough();

export const RaribleOrderSchema = z
  .object({
    id: z.string(),
    platform: z.string(),
    status: z.string(),
    cancelled: z.boolean().optional(),
    startedAt: z.string().optional(),
    endedAt: z.string().optional(),
    createdAt: z.string().optional(),
    lastUpdatedAt: z.string().optional(),
    makePrice: BigNumberLikeSchema.optional(),
    takePrice: BigNumberLikeSchema.optional(),
    maker: z.string(),
    taker: z.string().optional(),
    /** Sell order: the NFT. Bid order: the currency offered. */
    make: RaribleAssetSchema,
    /** Sell order: the currency wanted. Bid order: the NFT. */
    take: RaribleAssetSchema,
    signature: z.string().nullable().optional(),
  })
  .passthrough();

export const RaribleOrdersResponseSchema = z
  .object({
    orders: z.array(RaribleOrderSchema).default([]),
    continuation: z.string().nullable().optional(),
  })
  .passthrough();

export type RaribleAssetType = z.infer<typeof RaribleAssetTypeSchema>;
export type RaribleOrder = z.infer<typeof RaribleOrderSchema>;
export type RaribleOrdersResponse = z.infer<typeof RaribleOrdersResponseSchema>;
