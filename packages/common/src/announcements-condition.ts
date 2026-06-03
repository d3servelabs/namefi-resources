import { z } from 'zod';

/**
 * Conditional-display rules for announcements.
 *
 * An announcement may carry an optional `condition`. When present, the backend
 * evaluates it on each `announcements.getActive` request and only surfaces the
 * announcement when the condition currently holds. A `null`/absent condition
 * means the announcement always applies (subject to its active flag and
 * scheduling window).
 *
 * This is the single source of truth for the condition shape — imported by the
 * DB column `$type<>()`, the public/admin tRPC contracts, the backend
 * evaluator, and the admin form. The schema is a discriminated union on `type`
 * so new condition kinds can be added without breaking existing data.
 */

/** Which registrar price of the TLD to compare against. */
export const tldPriceKindSchema = z.enum([
  'registration',
  'renewal',
  'transfer',
]);

export type TldPriceKind = z.infer<typeof tldPriceKindSchema>;

/** Numeric comparison operators for price conditions. */
export const conditionOperatorSchema = z.enum(['eq', 'lt', 'lte', 'gt', 'gte']);

export type ConditionOperator = z.infer<typeof conditionOperatorSchema>;

/**
 * A single side of a price comparison. Each operand resolves to a USD/year
 * number at evaluation time.
 *
 * - `literal`: a fixed amount. Currency: USD. Unit: per year (decimal).
 * - `tld`: the live price of a TLD. `tld` is normalized at write time
 *   (leading dot stripped, lowercased); `priceKind` selects which price
 *   (registration/renewal/transfer) to read.
 */
export const literalPriceOperandSchema = z.object({
  kind: z.literal('literal'),
  amountUsd: z.number().nonnegative(),
});

export const tldPriceOperandSchema = z.object({
  kind: z.literal('tld'),
  tld: z.string().min(1),
  priceKind: tldPriceKindSchema,
});

export const priceOperandSchema = z.discriminatedUnion('kind', [
  literalPriceOperandSchema,
  tldPriceOperandSchema,
]);

export type PriceOperand = z.infer<typeof priceOperandSchema>;

/**
 * Show the announcement only when `left <operator> right` holds, where each
 * side is either a fixed USD amount or a TLD's live price. This subsumes the
 * simpler "TLD price vs fixed amount" case (use a `tld` left operand and a
 * `literal` right operand) and also supports comparing two TLD prices.
 *
 * If either operand can't be resolved (unknown TLD, or no price for the chosen
 * `priceKind`), the condition evaluates to `false` (never show).
 */
export const priceCompareConditionSchema = z.object({
  type: z.literal('PRICE_COMPARE'),
  left: priceOperandSchema,
  operator: conditionOperatorSchema,
  right: priceOperandSchema,
});

export type PriceCompareCondition = z.infer<typeof priceCompareConditionSchema>;

/** Discriminated union of all supported announcement conditions. */
export const announcementConditionSchema = z.discriminatedUnion('type', [
  priceCompareConditionSchema,
]);

export type AnnouncementCondition = z.infer<typeof announcementConditionSchema>;
