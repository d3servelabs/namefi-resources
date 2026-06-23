import {
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  isPast,
} from 'date-fns';
import { toUnicodeDomainName } from '@namefi-astra/registrars/data/validations';

export const DEFAULT_DOMAIN_LIST_PAGE_SIZE = 500;

/** Render a punycode domain as unicode; fall back to the input on decode error. */
export function safeToUnicode(domain: string): string {
  try {
    return toUnicodeDomainName(domain);
  } catch {
    return domain;
  }
}

export function truncateWalletAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getRenewalPriceUsdPerYearForDomain(
  normalizedDomainName: string | null | undefined,
  renewalPriceUsdPerYearByTld: Map<string, number | null>,
) {
  const domainName = normalizedDomainName ?? '';
  const tld = domainName.split('.').pop()?.toLowerCase() ?? '';
  return tld === '' ? null : (renewalPriceUsdPerYearByTld.get(tld) ?? null);
}

/**
 * Build a `tld -> renewalPriceUsdPerYear` lookup from the registry's
 * `getTldPricingTable` rows. Pairs with {@link getRenewalPriceUsdPerYearForDomain}
 * to resolve a single domain's per-year renewal price. The defensive
 * non-iterable guard mirrors a real failure mode seen when the query data is
 * mid-flight.
 */
export function buildRenewalPriceUsdPerYearByTld(
  tldPricing:
    | ReadonlyArray<{
        tld?: string | null;
        renewalPriceUsdPerYear?: number | null;
      }>
    | undefined
    | null,
): Map<string, number | null> {
  const map = new Map<string, number | null>();
  if (!tldPricing || typeof tldPricing[Symbol.iterator] !== 'function') {
    return map;
  }
  for (const row of tldPricing) {
    if (!row?.tld) continue;
    map.set(String(row.tld).toLowerCase(), row.renewalPriceUsdPerYear ?? null);
  }
  return map;
}

/**
 * Locale-agnostic descriptor of the remaining time until expiration. The
 * consuming component maps this to a translated, locale-formatted label (see
 * the `timeLeft` namespace in `messages/<locale>/domains.json`):
 *   - `none`         → no/invalid date (render "-")
 *   - `expired`      → already past
 *   - `days`         → less than a month left ("Xd")
 *   - `months`/`monthsPlus` → less than a year left ("Xm" / "Xm+")
 *   - `years`/`yearsPlus`   → a year or more left ("Xy" / "Xy+")
 */
export type TimeLeft =
  | { kind: 'none' }
  | { kind: 'expired' }
  | { kind: 'days'; count: number }
  | { kind: 'months'; count: number }
  | { kind: 'monthsPlus'; count: number }
  | { kind: 'years'; count: number }
  | { kind: 'yearsPlus'; count: number };

/**
 * Compute remaining time until expiration as a {@link TimeLeft} descriptor.
 * Presentation (translation + locale formatting) is deferred to the caller.
 */
export function getTimeLeft(
  expirationDate: string | Date | null | undefined,
): TimeLeft {
  if (!expirationDate) return { kind: 'none' };

  const expiry = new Date(expirationDate);
  if (Number.isNaN(expiry.getTime())) return { kind: 'none' };

  const now = new Date();
  if (isPast(expiry)) return { kind: 'expired' };

  const daysLeft = differenceInDays(expiry, now);
  const monthsLeft = differenceInMonths(expiry, now);
  const yearsLeft = differenceInYears(expiry, now);

  if (monthsLeft < 1) {
    return { kind: 'days', count: daysLeft };
  }

  if (monthsLeft < 12) {
    const extraDays = daysLeft - monthsLeft * 30;
    return extraDays > 0
      ? { kind: 'monthsPlus', count: monthsLeft }
      : { kind: 'months', count: monthsLeft };
  }

  const extraMonths = monthsLeft - yearsLeft * 12;
  return extraMonths > 0
    ? { kind: 'yearsPlus', count: yearsLeft }
    : { kind: 'years', count: yearsLeft };
}

/**
 * Format expiration date as ISO yyyy-MM-dd (UTC). Using UTC avoids a
 * timezone-shift bug where a UTC-midnight date would render as the previous
 * day for users in western timezones.
 */
export function formatExpirationDateISO(
  expirationDate: string | Date | null | undefined,
): string {
  if (!expirationDate) return '-';

  const expiry = new Date(expirationDate);
  if (Number.isNaN(expiry.getTime())) return '-';

  return expiry.toISOString().slice(0, 10);
}

export function isDomainPossiblyRenewable(
  expirationDate?: Date | string | null,
) {
  if (!expirationDate) return false;
  const expiry = new Date(expirationDate);
  if (Number.isNaN(expiry.getTime())) return false;
  return expiry > new Date();
}

/**
 * Promotional fixed renewal price ($5.00) for partner TLDs:
 * .0x.city, .defi.build, .astra.namefi.io.
 *
 * TODO: https://app.clickup.com/t/9009140026/NFI-5260 — move to backend-driven
 * pricing so this list isn't hardcoded on the frontend.
 */
export function getCustomRenewalPrice(domainName: string) {
  if (
    domainName.endsWith('.0x.city') ||
    domainName.endsWith('.defi.build') ||
    domainName.endsWith('.astra.namefi.io')
  ) {
    return 5.0;
  }
  return null;
}

/**
 * Groups domains into per-(chain, wallet) batches for `watchBulkNamefiNftInWallet`,
 * which adds NFTs one wallet and one chain at a time. Domains missing a chain id,
 * owner address, or token id are skipped.
 */
export function groupDomainsForWalletWatch(
  domains: Array<{
    chainId?: number | null;
    ownerAddress?: string | null;
    tokenId?: bigint | number | null;
  }>,
): Array<{ chainId: number; walletAddress: string; tokenIds: string[] }> {
  const groups = new Map<
    string,
    { chainId: number; walletAddress: string; tokenIds: string[] }
  >();
  for (const { chainId, ownerAddress, tokenId } of domains) {
    if (chainId == null || !ownerAddress || tokenId == null) {
      continue;
    }
    const key = `${chainId}:${ownerAddress.toLowerCase()}`;
    const existing = groups.get(key);
    if (existing) {
      existing.tokenIds.push(tokenId.toString());
    } else {
      groups.set(key, {
        chainId,
        walletAddress: ownerAddress,
        tokenIds: [tokenId.toString()],
      });
    }
  }
  return Array.from(groups.values());
}
