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
