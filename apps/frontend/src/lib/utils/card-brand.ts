export type CardBrand =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'discover'
  | 'diners'
  | 'jcb'
  | 'unionpay'
  | string;
export type CardStyle =
  | 'brand-dark'
  | 'brand-light'
  | 'gradient'
  | 'transparent'
  | 'gray-dark'
  | 'gray-light';

/**
 * Maps Stripe card brands to normalized brand names
 */
export function normalizeCardBrand(brand: string): CardBrand {
  const brandMap: Record<string, CardBrand> = {
    visa: 'visa',
    mastercard: 'mastercard',
    american_express: 'amex',
    amex: 'amex',
    discover: 'discover',
    diners_club: 'diners',
    diners: 'diners',
    jcb: 'jcb',
    unionpay: 'unionpay',
  };

  return brandMap[brand.toLowerCase()] || 'visa';
}

/**
 * Determines the card style based on the brand
 */
export function getCardStyleByBrand(brand: string): CardStyle {
  const normalizedBrand = normalizeCardBrand(brand);

  const styleMap: Record<CardBrand, CardStyle> = {
    visa: 'brand-dark',
    mastercard: 'gradient',
    amex: 'brand-light',
    discover: 'gradient',
    diners: 'gray-dark',
    jcb: 'brand-light',
    unionpay: 'gradient',
  };

  return styleMap[normalizedBrand] || 'brand-dark';
}

/**
 * Formats a partial card number for display
 * @param last4 - The last 4 digits of the card
 * @returns Formatted card number like "**** **** **** 1234"
 */
export function formatCardNumber(last4: string): string {
  return `**** **** **** ${last4}`;
}

/**
 * Formats the expiration date for display
 * @param month - Expiration month (1-12)
 * @param year - Expiration year (2-digit or 4-digit)
 * @returns Formatted expiration like "03/25"
 */
export function formatCardExpiration(
  month: number | string,
  year: number | string,
): string {
  const monthStr = month.toString().padStart(2, '0');
  const yearStr = year.toString().slice(-2);
  return `${monthStr}/${yearStr}`;
}

/**
 * Gets a display name for the card brand
 */
export function getCardBrandDisplayName(brand: string): string {
  const displayNames: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
    diners: 'Diners Club',
    jcb: 'JCB',
    unionpay: 'UnionPay',
  };

  const normalizedBrand = normalizeCardBrand(brand);
  return displayNames[normalizedBrand] || 'Credit Card';
}
