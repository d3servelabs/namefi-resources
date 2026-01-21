import type { AppRouterInput } from '@/lib/trpc';

type CreateOrderV2Input = AppRouterInput['orders']['createOrderV2'];

/**
 * Maximum allowed rounding delta in cents when normalizing payment amounts.
 *
 * Backend requires all payments[].amountInUsdCents to be integers (zod .int()),
 * and enforces that sum(payments) === cartTotalInUsdCents.
 *
 * NFSC balance conversions (formatUnits with 18 decimals → cents) can produce
 * floats like 1527.9849999849998. We round each payment to integer cents and
 * adjust the last payment by the delta to preserve totals.
 *
 * We limit the delta to prevent masking serious calculation bugs. If the delta
 * exceeds this threshold, it indicates a systemic issue that should be
 * investigated (not silently corrected).
 */
export const MAX_PAYMENT_ROUNDING_DELTA_CENTS = 5;

/**
 * Result of payment normalization to safe integer cents.
 */
export type NormalizePaymentsResult =
  | { success: true; payments: CreateOrderV2Input['payments'] }
  | { success: false; error: string };

/**
 * Normalize payment amounts to integer cents for backend validation.
 *
 * Backend (apps/backend/src/trpc/types.ts) requires:
 * 1. payments[].amountInUsdCents must be z.number().int()
 * 2. sum(payments.amountInUsdCents) must equal totalAmountInUsdCents
 * 3. Stripe payments (if > 0) must be >= 100 cents
 *
 * This function:
 * - Rounds each payment amount to nearest integer cent
 * - Computes delta = totalAmountInUsdCents - sum(roundedPayments)
 * - If |delta| > MAX_PAYMENT_ROUNDING_DELTA_CENTS: returns error (exceptional case)
 * - Otherwise: applies delta to last payment to preserve exact totals
 * - Validates Stripe minimum (>= 100 cents) after adjustment
 *
 * @param payments - The payments array (may contain floating-point cents)
 * @param totalAmountInUsdCents - The cart total in cents (must be integer)
 * @returns Normalized payments or error
 */
export function normalizeCreateOrderV2PaymentsToSafeIntCents({
  payments,
  totalAmountInUsdCents,
}: {
  payments: CreateOrderV2Input['payments'];
  totalAmountInUsdCents: number;
}): NormalizePaymentsResult {
  if (payments.length === 0) {
    return { success: false, error: 'No payments provided' };
  }

  // Validate input total is integer
  if (!Number.isInteger(totalAmountInUsdCents)) {
    return {
      success: false,
      error: `Cart total must be an integer, got ${totalAmountInUsdCents}`,
    };
  }

  // Round each payment to integer cents
  const roundedPayments = payments.map((p) => ({
    ...p,
    amountInUsdCents: Math.round(p.amountInUsdCents),
  }));

  // Compute the rounding delta
  const roundedTotal = roundedPayments.reduce(
    (sum, p) => sum + p.amountInUsdCents,
    0,
  );
  const delta = totalAmountInUsdCents - roundedTotal;

  // Check if delta is within acceptable bounds
  if (Math.abs(delta) > MAX_PAYMENT_ROUNDING_DELTA_CENTS) {
    return {
      success: false,
      error: `Payment rounding error: total mismatch is ${delta} cents (max allowed: ${MAX_PAYMENT_ROUNDING_DELTA_CENTS}). This indicates a calculation issue that should be investigated.`,
    };
  }

  // Validate Stripe minimum for all payments (must be >= 100 cents if present)
  // This check applies regardless of delta adjustment
  for (const payment of roundedPayments) {
    if (
      payment.paymentProviderDetails.paymentProvider === 'STRIPE' &&
      payment.amountInUsdCents > 0 &&
      payment.amountInUsdCents < 100
    ) {
      return {
        success: false,
        error: `Stripe payment amount (${payment.amountInUsdCents} cents) is below minimum (100 cents)`,
      };
    }
  }

  // If delta is 0, we're done
  if (delta === 0) {
    return { success: true, payments: roundedPayments };
  }

  // Apply delta to the last payment
  // Prefer Stripe payment if present (more flexible), otherwise use the last payment
  const lastPaymentIndex = roundedPayments.length - 1;
  let adjustmentIndex = lastPaymentIndex;

  // Find Stripe payment if exists
  for (let i = roundedPayments.length - 1; i >= 0; i--) {
    const provider = roundedPayments[i].paymentProviderDetails.paymentProvider;
    if (provider === 'STRIPE') {
      adjustmentIndex = i;
      break;
    }
  }

  // Apply delta
  const adjustedPayments = [...roundedPayments];
  adjustedPayments[adjustmentIndex] = {
    ...adjustedPayments[adjustmentIndex],
    amountInUsdCents:
      adjustedPayments[adjustmentIndex].amountInUsdCents + delta,
  };

  // Validate the adjusted payment
  const adjustedAmount = adjustedPayments[adjustmentIndex].amountInUsdCents;
  if (adjustedAmount <= 0) {
    return {
      success: false,
      error: `Payment adjustment resulted in non-positive amount: ${adjustedAmount} cents`,
    };
  }

  // Check Stripe minimum if the adjusted payment is Stripe
  const adjustedProvider =
    adjustedPayments[adjustmentIndex].paymentProviderDetails.paymentProvider;
  if (adjustedProvider === 'STRIPE' && adjustedAmount < 100) {
    return {
      success: false,
      error: `Stripe payment amount after adjustment (${adjustedAmount} cents) is below minimum (100 cents)`,
    };
  }

  // Final verification: sum must equal total
  const finalTotal = adjustedPayments.reduce(
    (sum, p) => sum + p.amountInUsdCents,
    0,
  );
  if (finalTotal !== totalAmountInUsdCents) {
    return {
      success: false,
      error: `Internal error: final payment total (${finalTotal}) does not match cart total (${totalAmountInUsdCents})`,
    };
  }

  return { success: true, payments: adjustedPayments };
}
