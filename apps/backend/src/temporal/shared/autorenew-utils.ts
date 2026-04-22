/**
 * Pure utility functions for auto-renewal workflows.
 *
 * IMPORTANT: This file must remain free of Temporal activity context,
 * Node.js-only APIs, and side effects so it can be imported by both
 * workflow code (sandboxed) and activity code.
 */

/**
 * Determine the action required based on the failure error message.
 * Canonical implementation used by the report workflow, report activities,
 * and the admin tRPC router.
 */
export function determineActionRequired(errorMessage: string): string {
  const lower = errorMessage.toLowerCase();

  if (lower.includes('price') || lower.includes('pricing')) {
    return 'Check pricing data';
  }
  if (lower.includes('locked')) {
    return 'Unlock domain and retry';
  }
  if (lower.includes('timeout')) {
    return 'Retry renewal';
  }
  if (lower.includes('api')) {
    return 'Check registrar API';
  }
  if (lower.includes('transfer period')) {
    return 'Wait for transfer period to end';
  }
  if (lower.includes('expired')) {
    return 'Domain already expired';
  }
  if (lower.includes('balance') || lower.includes('payment')) {
    return 'Contact user about payment';
  }
  return 'Manual investigation required';
}

/**
 * Returns true when the failure reason indicates a payment-related issue
 * (charge failure, declined card, insufficient funds, etc.).
 * Case-insensitive.
 */
export function isPaymentFailure(reason: string): boolean {
  const lower = reason.toLowerCase();
  return (
    lower.includes('charge') ||
    lower.includes('payment') ||
    lower.includes('declined') ||
    lower.includes('insufficient')
  );
}

/**
 * Format a row-level error-reason string for a domain that was deferred
 * due to insufficient NFSC balance. Used by the admin tRPC router's
 * `domains[]` rows, the CSV attachment, and the orchestration-level
 * legacy `failures[]` array.
 *
 * All three numbers are user-level (not per-row):
 * - `required` = total USD the user needed for all their renewals this cycle.
 * - `balance`  = user's NFSC balance at run start (USD, summed across chains).
 * - `short`    = balance shortfall in USD (i.e. `required - balance`).
 *
 * The per-row charge lives in a separate column/field — this string is
 * the user-level context, labeled clearly so no number can be misread as
 * belonging to the single row.
 */
export function formatDeferredRowReason(args: {
  availableBalanceInUsd: number | undefined;
  shortfallInUsdCents: number | undefined;
}): string {
  const { availableBalanceInUsd, shortfallInUsdCents } = args;
  if (typeof shortfallInUsdCents !== 'number' || shortfallInUsdCents <= 0) {
    return 'Deferred — insufficient balance';
  }
  const shortfallInUsd = shortfallInUsdCents / 100;
  if (typeof availableBalanceInUsd !== 'number') {
    return `Deferred — run total short by $${shortfallInUsd.toFixed(2)}`;
  }
  // Required = balance + shortfall, by definition of `shortfallInUsdCents`.
  const requiredInUsd = availableBalanceInUsd + shortfallInUsd;
  return `Deferred — required $${requiredInUsd.toFixed(2)}, balance $${availableBalanceInUsd.toFixed(2)}, short $${shortfallInUsd.toFixed(2)}`;
}
