export const formatAmountInUSD = (amount: number, inCents = false): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(inCents ? amount / 100 : amount);
