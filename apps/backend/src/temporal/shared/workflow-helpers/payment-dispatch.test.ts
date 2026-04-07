import { describe, expect, it } from 'vitest';
import { sortByProviderPriority } from './payment-dispatch';

describe('sortByProviderPriority', () => {
  it('sorts string items according to the given priority order', () => {
    const items = [
      'STRIPE',
      'MPP',
      'NFSC_ETHEREUM_SEPOLIA',
      'NFSC_BASE',
      'NFSC_ETHEREUM',
      'X402',
    ];
    const priority = [
      'MPP',
      'NFSC_ETHEREUM_SEPOLIA',
      'NFSC_BASE',
      'NFSC_ETHEREUM',
      'STRIPE',
      'X402',
    ] as const;

    const result = sortByProviderPriority(items, (x) => x, priority);

    expect(result).toEqual([
      'MPP',
      'NFSC_ETHEREUM_SEPOLIA',
      'NFSC_BASE',
      'NFSC_ETHEREUM',
      'STRIPE',
      'X402',
    ]);
  });

  it('places unknown providers at the end', () => {
    const items = ['UNKNOWN', 'STRIPE', 'MPP'];
    const priority = ['STRIPE', 'MPP'] as const;

    const result = sortByProviderPriority(items, (x) => x, priority);

    expect(result).toEqual(['STRIPE', 'MPP', 'UNKNOWN']);
  });

  it('uses DEFAULT_PAYMENT_PRIORITY when no priority is given', () => {
    const items = ['X402', 'STRIPE'];

    const result = sortByProviderPriority(items, (x) => x);

    expect(result).toEqual(['STRIPE', 'X402']);
  });
});
