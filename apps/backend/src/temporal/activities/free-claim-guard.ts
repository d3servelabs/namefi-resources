import type { FreeClaimSelect } from '@namefi-astra/db';
import {
  type DomainAvailabilityInfo,
  getDomainPricingForOperation,
} from '@namefi-astra/common/domain-availability';
import { computeChargesInUsdOrThrow } from '@namefi-astra/registrars/data/multi-year-pricing';
import { z } from 'zod';

/**
 * Pure premium / max-price guard logic for free claims.
 *
 * Kept free of DB / registrar / Temporal imports so it can be unit-tested in
 * isolation (the registrar import chain crashes isolated test imports). The
 * activity that fetches live domain data lives in `free-claim.activities.ts`.
 */

/**
 * Per-claim free-claim policy, stored server-side in `freeClaimsTable.metadata`.
 * Never sourced from client input. Absent/malformed metadata falls back to the
 * safe defaults: premium domains blocked, no price cap.
 */
export const freeClaimPolicySchema = z.object({
  allowPremium: z.boolean().default(false),
  /** Max 1-year registration price (USD whole dollars) allowed for a free claim. */
  maxPrice: z.number().positive().optional(),
});

export type FreeClaimPolicy = z.infer<typeof freeClaimPolicySchema>;

/**
 * Reads the per-claim guard policy from a claim's jsonb `metadata`. Unknown
 * keys (e.g. gift metadata) are stripped; malformed/absent metadata falls back
 * to defaults (block premium, no cap).
 */
export function getFreeClaimPolicy(
  claim: Pick<FreeClaimSelect, 'metadata'>,
): FreeClaimPolicy {
  const parsed = freeClaimPolicySchema.safeParse(claim.metadata ?? {});
  return parsed.success ? parsed.data : { allowPremium: false };
}

export type DomainClaimGuardInfo = {
  isPremium: boolean;
  /** 1-year registration price in USD, or null when it can't be determined. */
  registrationPriceUsd: number | null;
};

/** Tokenized reasons so callers (router) can map them to specific HTTP codes. */
export const CLAIM_GUARD_REASONS = {
  PREMIUM_NOT_ALLOWED: 'PREMIUM_NOT_ALLOWED',
  MAX_PRICE_EXCEEDED: 'MAX_PRICE_EXCEEDED',
} as const;

/**
 * Pure guard decision (no DB/Temporal) — unit-testable. Blocks premium domains
 * unless the policy allows them, and blocks domains whose price exceeds the cap
 * (an unknown price under a cap is conservatively blocked).
 */
export function evaluateClaimGuard(
  policy: FreeClaimPolicy,
  info: DomainClaimGuardInfo,
): { ok: true } | { ok: false; reason: string } {
  if (info.isPremium && !policy.allowPremium) {
    return {
      ok: false,
      reason: `${CLAIM_GUARD_REASONS.PREMIUM_NOT_ALLOWED}: This domain is premium and not eligible for a free claim`,
    };
  }
  if (policy.maxPrice != null) {
    if (
      info.registrationPriceUsd == null ||
      info.registrationPriceUsd > policy.maxPrice
    ) {
      return {
        ok: false,
        reason: `${CLAIM_GUARD_REASONS.MAX_PRICE_EXCEEDED}: Domain price exceeds the free-claim limit of $${policy.maxPrice}`,
      };
    }
  }
  return { ok: true };
}

/**
 * Derives the free-claim guard inputs (premium flag + 1-year registration price)
 * from an already-fetched {@link DomainAvailabilityInfo}. Pure and never throws —
 * a missing/invalid price becomes `null` (which the guard treats conservatively
 * when a cap is set). Lets callers reuse a single batch `getDomainListInfo`.
 */
export function deriveClaimGuardInfo(
  info: DomainAvailabilityInfo | undefined,
): DomainClaimGuardInfo {
  if (!info) {
    return { isPremium: false, registrationPriceUsd: null };
  }

  const registrationPricing = getDomainPricingForOperation(info, 'REGISTER');
  let registrationPriceUsd: number | null = null;
  try {
    if (registrationPricing) {
      registrationPriceUsd = computeChargesInUsdOrThrow(registrationPricing, 1);
    }
  } catch {
    registrationPriceUsd = null;
  }

  return {
    isPremium: info.isPremium === true,
    registrationPriceUsd,
  };
}
