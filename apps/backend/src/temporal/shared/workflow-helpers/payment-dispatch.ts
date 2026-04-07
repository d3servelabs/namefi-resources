/**
 * Shared payment-provider dispatch helpers for Temporal workflows.
 *
 * Consolidates duplicated payment-provider logic previously spread across
 * chargeUser, refundUser, multi-charge, and multi-refund workflows.
 *
 * All exports are pure data / pure functions -- no activities, no
 * workflow.executeChild -- so they are fully Temporal-deterministic.
 *
 * @see https://github.com/d3servelabs/namefi-astra/issues/3762
 */

import {
  type PaymentProvider,
  type PaymentStatus,
  paymentProviderSchema,
  paymentStatusSchema,
} from '@namefi-astra/db/types';
import * as workflow from '@temporalio/workflow';
import type { PaymentPriority } from './payment-priority';

// ---------------------------------------------------------------------------
// Default payment priority (was duplicated in multi-charge & multi-refund)
// ---------------------------------------------------------------------------

/**
 * Default priority order shared by multi-charge and multi-refund workflows.
 * Stripe first for better UX, then MPP, NFSC chains, then X402.
 */
export const DEFAULT_PAYMENT_PRIORITY: PaymentPriority = [
  'STRIPE',
  'MPP',
  'NFSC_ETHEREUM_SEPOLIA',
  'NFSC_BASE',
  'NFSC_ETHEREUM',
  'X402',
] as PaymentPriority;

// ---------------------------------------------------------------------------
// NFSC provider detection (was duplicated in chargeUser with a filter)
// ---------------------------------------------------------------------------

/**
 * The set of all NFSC_* payment provider values, derived from the schema.
 */
export const NFSC_PAYMENT_PROVIDERS: readonly string[] = (
  paymentProviderSchema.options as readonly string[]
).filter((p) => p.startsWith('NFSC_'));

const _nfscSet: ReadonlySet<string> = new Set(NFSC_PAYMENT_PROVIDERS);

/**
 * Check whether a payment provider string is one of the NFSC_* variants.
 */
export function isNfscProvider(provider: string): boolean {
  return _nfscSet.has(provider);
}

// ---------------------------------------------------------------------------
// Provider-priority sorting (was duplicated in multi-charge & multi-refund)
// ---------------------------------------------------------------------------

/**
 * Sort items by payment provider according to a priority list.
 * Items whose provider is not in the priority list sort to the end.
 */
export function sortByProviderPriority<T>(
  items: T[],
  getProvider: (item: T) => PaymentProvider | string,
  priority:
    | PaymentPriority
    | readonly PaymentProvider[] = DEFAULT_PAYMENT_PRIORITY,
): T[] {
  return [...items].sort((a, b) => {
    const indexA = (priority as readonly string[]).indexOf(getProvider(a));
    const indexB = (priority as readonly string[]).indexOf(getProvider(b));

    const effectiveA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
    const effectiveB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;

    return effectiveA - effectiveB;
  });
}

// ---------------------------------------------------------------------------
// Charge result type (standardises what per-provider handlers return)
// ---------------------------------------------------------------------------

export type ChargeProviderResult = {
  paymentStatus: PaymentStatus;
  paymentProviderReferenceId: string | undefined;
  /** Updated x402 details to persist (only set for X402 settlements). */
  updatedX402PaymentDetails?: Record<string, unknown>;
};

/**
 * Build a failed ChargeProviderResult with a log message.
 * Reduces boilerplate in per-provider catch blocks.
 */
export function failedChargeResult(
  logMessage: string,
  error?: unknown,
): ChargeProviderResult {
  if (error !== undefined) {
    workflow.log.error(`${logMessage}, cause: ${JSON.stringify(error)}`);
  } else {
    workflow.log.error(logMessage);
  }
  return {
    paymentStatus: paymentStatusSchema.enum.FAILED,
    paymentProviderReferenceId: undefined,
  };
}

/**
 * Build a succeeded ChargeProviderResult.
 */
export function succeededChargeResult(
  paymentProviderReferenceId: string,
  extra?: { updatedX402PaymentDetails?: Record<string, unknown> },
): ChargeProviderResult {
  return {
    paymentStatus: paymentStatusSchema.enum.SUCCEEDED,
    paymentProviderReferenceId,
    ...extra,
  };
}
