/**
 * Normalize Stripe `amount` for Stripe Elements options.
 *
 * Stripe requires the amount to be an integer in the smallest currency unit
 * (e.g. USD cents). We round to the nearest integer and clamp negatives to 0.
 */
export function normalizeStripeAmountInSubunits(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.max(0, Math.round(amount));
}
