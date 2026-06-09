import { namefiFeedListingsTable } from '@namefi-astra/db';
import { gt, isNull, or, type SQL } from 'drizzle-orm';

export function getActiveNamefiFeedListingWhereClauses(
  activeAt: Date = new Date(),
): SQL[] {
  const notExpired = or(
    isNull(namefiFeedListingsTable.expiresAt),
    gt(namefiFeedListingsTable.expiresAt, activeAt),
  );

  if (!notExpired) {
    throw new Error('Failed to build Namefi feed listing expiry predicate.');
  }

  return [
    isNull(namefiFeedListingsTable.suppressedAt),
    isNull(namefiFeedListingsTable.endedAt),
    notExpired,
  ];
}

export function isNamefiFeedListingActive(input: {
  suppressedAt?: Date | string | null;
  endedAt?: Date | string | null;
  expiresAt?: Date | string | null;
  activeAt?: Date;
}) {
  if (input.suppressedAt || input.endedAt) {
    return false;
  }

  const activeAtMs = input.activeAt?.getTime() ?? Date.now();
  const expiresAtMs =
    input.expiresAt instanceof Date
      ? input.expiresAt.getTime()
      : input.expiresAt
        ? Date.parse(input.expiresAt)
        : null;

  return expiresAtMs === null || expiresAtMs > activeAtMs;
}
