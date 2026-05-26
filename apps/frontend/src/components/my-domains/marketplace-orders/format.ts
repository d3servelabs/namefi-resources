import { format } from 'date-fns';

/**
 * Year-9999 sentinel that the adapters return for orders with no on-chain
 * expiry. Show "Never expires" instead of a literal 9999-12-31.
 */
const NEVER_EXPIRY_YEAR = 9999;

/**
 * Format an order expiration timestamp for display.
 *   - far-future sentinel → "Never expires"
 *   - past timestamp → "Expired"
 *   - otherwise → "Expires yyyy-MM-dd HH:mm"
 */
export function formatExpiry(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  if (date.getUTCFullYear() >= NEVER_EXPIRY_YEAR) return 'Never expires';
  if (date.getTime() < Date.now()) return 'Expired';
  return `Expires ${format(date, 'yyyy-MM-dd HH:mm')}`;
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
