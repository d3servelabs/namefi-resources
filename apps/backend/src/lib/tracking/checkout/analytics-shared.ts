import type { GaReportRow } from '#lib/analytics-parser';
import {
  CHECKOUT_FLOW_EVENT_SEQUENCE,
  type CheckoutFlowEventName,
} from './analytics-client';
import type { CheckoutFlowEventParsed } from './analytics-types';

/**
 * Standard marker used when GA4 omits or cannot determine a value.
 */
export const OUTCOME_NOT_SET = '(NOT SET)';

/**
 * Outcome values considered successful across checkout analytics.
 */
export const SUCCESS_EQUIVALENT_OUTCOMES = new Set(['SUCCESS', 'SUCCEEDED']);

/**
 * Global outcome sort priority used for deterministic ordering.
 */
export const OUTCOME_PRIORITY = [
  'SUCCESS',
  'SUCCEEDED',
  'FAILURE',
  'TIMEOUT',
  OUTCOME_NOT_SET,
];

/**
 * Numerical tolerance used for Sankey link filtering and rounding checks.
 */
export const EPSILON = 0.000001;

// Naming glossary used by parser helpers:
// - "ExcludingNotSet" means rows where key is not '(NOT SET)'.
// - "explicitNotSet" means GA explicitly returned '(NOT SET)'.
// - "inferredNotSet" is the remainder needed to match total event count.

type BreakdownRow = { key: string; count: number };

/**
 * Parses a string-like metric value into an integer.
 *
 * @returns Parsed integer, or `0` when parsing fails.
 */
export function toInt(value: string | null | undefined): number {
  const parsed = Number.parseInt((value ?? '').toString(), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Safely extracts one GA row dimension value.
 *
 * @param row - GA report row.
 * @param index - Dimension index to read (0-based).
 * @returns Dimension value, or empty string when missing.
 */
export function safeGetDimension(row: GaReportRow, index = 0): string {
  return row?.dimensionValues?.[index]?.value ?? '';
}

/**
 * Safely extracts one GA row metric value as integer.
 *
 * @param row - GA report row.
 * @param index - Metric index to read (0-based).
 * @returns Parsed metric value, or `0` when missing/invalid.
 */
export function safeGetMetric(row: GaReportRow, index = 0): number {
  return toInt(row?.metricValues?.[index]?.value ?? '0');
}

/**
 * Type guard that checks whether a string is a known checkout flow event.
 */
export function isCheckoutFlowEventName(
  value: string,
): value is CheckoutFlowEventName {
  return (CHECKOUT_FLOW_EVENT_SEQUENCE as readonly string[]).includes(value);
}

/**
 * Rounds a number to one decimal place.
 */
export function roundToSingleDecimal(value: number): number {
  return Number(value.toFixed(1));
}

/**
 * Normalizes status/order-status values to a GA-safe uppercase token.
 *
 * @remarks
 * Empty values and common "not set" variants collapse to `(NOT SET)`.
 */
export function normalizeOutcomeValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return OUTCOME_NOT_SET;

  const normalized = trimmed.toUpperCase();
  if (
    normalized === '(NOT SET)' ||
    normalized === '(NOT_SET)' ||
    normalized === 'NOT SET'
  ) {
    return OUTCOME_NOT_SET;
  }

  return normalized.replace(/[^A-Z0-9_]+/g, '_');
}

/**
 * Checks whether an outcome value resolves to `(NOT SET)`.
 */
export function isNotSetOutcome(outcome: string): boolean {
  return normalizeOutcomeValue(outcome) === OUTCOME_NOT_SET;
}

/**
 * Converts a normalized outcome token to a presentation label.
 *
 * @example
 * `ORDER_COMPLETED` -> `Order Completed`
 */
export function formatOutcomeLabel(outcome: string): string {
  if (isNotSetOutcome(outcome)) {
    return 'Unspecified';
  }

  return outcome
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getOutcomeSortRank(outcome: string): number {
  const normalized = normalizeOutcomeValue(outcome);
  const index = OUTCOME_PRIORITY.indexOf(normalized);
  return index === -1 ? OUTCOME_PRIORITY.length : index;
}

/**
 * Sorts rows by outcome priority and then alphabetically.
 */
export function sortOutcomeRows(rows: BreakdownRow[]): BreakdownRow[] {
  return [...rows].sort((left, right) => {
    const rankDiff =
      getOutcomeSortRank(left.key) - getOutcomeSortRank(right.key);
    if (rankDiff !== 0) return rankDiff;
    return left.key.localeCompare(right.key);
  });
}

/**
 * Sorts rows alphabetically while always pushing `(NOT SET)` to the end.
 */
export function sortRowsLexicographicallyWithNotSetLast(
  rows: BreakdownRow[],
): BreakdownRow[] {
  return [...rows].sort((left, right) => {
    const leftNotSet = isNotSetOutcome(left.key);
    const rightNotSet = isNotSetOutcome(right.key);
    if (leftNotSet && !rightNotSet) return 1;
    if (!leftNotSet && rightNotSet) return -1;
    return left.key.localeCompare(right.key);
  });
}

/**
 * Returns success-only count for an event when outcome breakdown exists.
 *
 * @remarks
 * If an event has no meaningful outcome split (only `(NOT SET)` or empty),
 * this falls back to the event total count.
 */
export function getSuccessCountFromEventWithFallback(
  event: CheckoutFlowEventParsed,
): number {
  const outcomeRowsExcludingNotSet = event.breakdown.outcome.filter(
    (row) => !isNotSetOutcome(row.outcome),
  );

  if (outcomeRowsExcludingNotSet.length === 0) {
    return event.count;
  }

  return outcomeRowsExcludingNotSet
    .filter((row) =>
      SUCCESS_EQUIVALENT_OUTCOMES.has(normalizeOutcomeValue(row.outcome)),
    )
    .reduce((sum, row) => sum + row.count, 0);
}
