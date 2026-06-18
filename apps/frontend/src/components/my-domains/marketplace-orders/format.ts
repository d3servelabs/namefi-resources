import { format } from 'date-fns';
import { useTranslations } from 'next-intl';

/**
 * Year-9999 sentinel that the adapters return for orders with no on-chain
 * expiry. Show "Never expires" instead of a literal 9999-12-31.
 */
const NEVER_EXPIRY_YEAR = 9999;

/**
 * Locale-agnostic descriptor of an order expiration timestamp. The consuming
 * component maps this to a translated label (see the `marketplaceExpiry`
 * namespace). `datetime` is the ISO `yyyy-MM-dd HH:mm` string — kept ISO and
 * not localized per the app's date-formatting convention. `raw` is the
 * original input, surfaced verbatim when the timestamp is unparseable.
 */
export type ExpiryDescriptor =
  | { kind: 'raw'; raw: string }
  | { kind: 'never' }
  | { kind: 'expired' }
  | { kind: 'expires'; datetime: string };

/**
 * Compute an {@link ExpiryDescriptor} for an order expiration timestamp.
 * Presentation (translation) is deferred to the caller via {@link useExpiryLabel}.
 *   - far-future sentinel → `never`
 *   - past timestamp → `expired`
 *   - otherwise → `expires` with an ISO `yyyy-MM-dd HH:mm` datetime
 */
export function getExpiry(iso: string): ExpiryDescriptor {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { kind: 'raw', raw: iso };
  if (date.getUTCFullYear() >= NEVER_EXPIRY_YEAR) return { kind: 'never' };
  if (date.getTime() < Date.now()) return { kind: 'expired' };
  return { kind: 'expires', datetime: format(date, 'yyyy-MM-dd HH:mm') };
}

/**
 * Hook returning a formatter that maps an order expiration timestamp to its
 * translated label via {@link getExpiry} + the `marketplaceExpiry` namespace.
 */
export function useExpiryLabel() {
  const t = useTranslations('domains');
  return (iso: string): string => {
    const expiry = getExpiry(iso);
    switch (expiry.kind) {
      case 'raw':
        return expiry.raw;
      case 'never':
        return t('marketplaceExpiry.neverExpires');
      case 'expired':
        return t('marketplaceExpiry.expired');
      case 'expires':
        return t('marketplaceExpiry.expires', { datetime: expiry.datetime });
    }
  };
}

/** `0xabcd…1234` — truncates EVM addresses for compact display. */
export function shortAddress(address: string): string {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** `0xabcd…1234 #0x1234…5678` — truncates a (contract, tokenId) tuple. */
export function shortToken(address: string, tokenId: string): string {
  return `${shortAddress(address)} #${shortAddress(tokenId)}`;
}
