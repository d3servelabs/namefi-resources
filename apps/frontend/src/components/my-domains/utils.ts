import {
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  isPast,
} from 'date-fns';
import { toUnicodeDomainName } from '@namefi-astra/registrars/lib/data/validations';

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
 * Format remaining time until expiration.
 * Returns: "Xd" if less than 30 days, "Xm+" if less than 12 months,
 * "Xy+" if more than a year.
 */
export function formatTimeLeft(
  expirationDate: string | Date | null | undefined,
): string {
  if (!expirationDate) return '-';

  const expiry = new Date(expirationDate);
  if (Number.isNaN(expiry.getTime())) return '-';

  const now = new Date();
  if (isPast(expiry)) return 'Expired';

  const daysLeft = differenceInDays(expiry, now);
  const monthsLeft = differenceInMonths(expiry, now);
  const yearsLeft = differenceInYears(expiry, now);

  if (monthsLeft < 1) {
    return `${daysLeft}d`;
  }

  if (monthsLeft < 12) {
    const extraDays = daysLeft - monthsLeft * 30;
    return extraDays > 0 ? `${monthsLeft}m+` : `${monthsLeft}m`;
  }

  const extraMonths = monthsLeft - yearsLeft * 12;
  return extraMonths > 0 ? `${yearsLeft}y+` : `${yearsLeft}y`;
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
