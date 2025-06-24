export const formatAmountInUSD = (amount: number, inCents = false): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(inCents ? amount / 100 : amount);

export const formatNumberWithAbbreviations = (num: number | string): string => {
  const n = typeof num === 'string' ? Number.parseInt(num, 10) : num;
  if (Number.isNaN(n)) {
    return String(num);
  }
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  }
  return n.toString();
};
