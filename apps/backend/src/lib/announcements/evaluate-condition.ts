import type {
  AnnouncementCondition,
  ConditionOperator,
  PriceOperand,
  TldPriceKind,
} from '@namefi-astra/common/announcements-condition';
import type { TldPricingInfo } from '#lib/namefi-registry';

const LEADING_DOTS_REGEX = /^\.+/;

/**
 * Normalize a TLD for comparison: strip leading dot(s) and lowercase.
 * Applied to both the condition's `tld` and the pricing-table key so the
 * match is robust regardless of which format the registrar layer uses
 * (e.g. ".com" vs "com").
 */
export function normalizeTld(tld: string): string {
  return tld.trim().replace(LEADING_DOTS_REGEX, '').toLowerCase();
}

function pickPrice(
  info: TldPricingInfo,
  priceKind: TldPriceKind,
): number | null {
  switch (priceKind) {
    case 'registration':
      return info.registrationPriceUsdPerYear;
    case 'renewal':
      return info.renewalPriceUsdPerYear;
    case 'transfer':
      return info.transferPriceUsdPerYear;
    default: {
      const _exhaustive: never = priceKind;
      return _exhaustive;
    }
  }
}

// Operands are USD/year floats (often resolved from live pricing), so `eq`
// uses a small tolerance rather than strict `===`, which would rarely hold
// against floating-point representation.
const PRICE_EQUALITY_EPSILON = 1e-9;

function compare(
  left: number,
  operator: ConditionOperator,
  right: number,
): boolean {
  switch (operator) {
    case 'eq':
      return Math.abs(left - right) < PRICE_EQUALITY_EPSILON;
    case 'lt':
      return left < right;
    case 'lte':
      return left <= right;
    case 'gt':
      return left > right;
    case 'gte':
      return left >= right;
    default: {
      const _exhaustive: never = operator;
      return _exhaustive;
    }
  }
}

/**
 * Resolve a price operand to a USD/year number, or `null` if it can't be
 * resolved (unknown TLD, or no price for the chosen `priceKind`). Literal
 * operands resolve without touching the pricing table.
 */
async function resolveOperand(
  operand: PriceOperand,
  deps: { getPricingTable: () => Promise<TldPricingInfo[]> },
): Promise<number | null> {
  switch (operand.kind) {
    case 'literal':
      return operand.amountUsd;
    case 'tld': {
      const target = normalizeTld(operand.tld);
      const table = await deps.getPricingTable();
      const info = table.find((row) => normalizeTld(row.tld) === target);
      if (!info) return null;
      return pickPrice(info, operand.priceKind);
    }
    default: {
      const _exhaustive: never = operand;
      return _exhaustive;
    }
  }
}

/**
 * Evaluate whether an announcement's condition currently holds.
 *
 * A `null` condition always applies. For `PRICE_COMPARE`, both operands are
 * resolved to USD/year amounts and compared as `left <operator> right`. If
 * either operand can't be resolved, the condition evaluates to `false` — we
 * never show on missing pricing data.
 *
 * The caller supplies a memoized `getPricingTable` so multiple announcements
 * in one request share a single pricing fetch.
 */
export async function evaluateAnnouncementCondition(
  condition: AnnouncementCondition | null | undefined,
  deps: { getPricingTable: () => Promise<TldPricingInfo[]> },
): Promise<boolean> {
  if (!condition) return true;

  switch (condition.type) {
    case 'PRICE_COMPARE': {
      const [left, right] = await Promise.all([
        resolveOperand(condition.left, deps),
        resolveOperand(condition.right, deps),
      ]);
      if (left === null || right === null) return false;
      return compare(left, condition.operator, right);
    }
    default: {
      const _exhaustive: never = condition.type;
      return false;
    }
  }
}

const OPERATOR_SYMBOLS: Record<ConditionOperator, string> = {
  eq: '=',
  lt: '<',
  lte: '≤',
  gt: '>',
  gte: '≥',
};

/** Human-readable rendering of an operand and its resolved value (for debug). */
function describeOperand(
  operand: PriceOperand,
  resolved: number | null,
): string {
  if (operand.kind === 'literal') return `$${operand.amountUsd}`;
  const label = `.${normalizeTld(operand.tld)} ${operand.priceKind}`;
  return resolved === null ? `${label} (no price)` : `${label} ($${resolved})`;
}

/**
 * Like `evaluateAnnouncementCondition`, but also returns a human-readable
 * explanation of how the condition resolved — used by the admin table to
 * surface a check/X and a tooltip for debugging.
 */
export async function evaluateConditionWithDetail(
  condition: AnnouncementCondition | null | undefined,
  deps: { getPricingTable: () => Promise<TldPricingInfo[]> },
): Promise<{ met: boolean; detail: string }> {
  if (!condition) return { met: true, detail: 'No condition — always shows' };

  switch (condition.type) {
    case 'PRICE_COMPARE': {
      const [left, right] = await Promise.all([
        resolveOperand(condition.left, deps),
        resolveOperand(condition.right, deps),
      ]);
      const expr = `${describeOperand(condition.left, left)} ${OPERATOR_SYMBOLS[condition.operator]} ${describeOperand(condition.right, right)}`;
      if (left === null || right === null) {
        return { met: false, detail: `${expr} — price unavailable` };
      }
      return { met: compare(left, condition.operator, right), detail: expr };
    }
    default: {
      const _exhaustive: never = condition.type;
      return { met: false, detail: 'Unknown condition type' };
    }
  }
}
