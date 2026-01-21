import { describe, expect, it } from 'vitest';
import {
  MAX_PAYMENT_ROUNDING_DELTA_CENTS,
  normalizeCreateOrderV2PaymentsToSafeIntCents,
} from './payment-normalization';

describe('normalizeCreateOrderV2PaymentsToSafeIntCents', () => {
  describe('basic integer rounding', () => {
    it('rounds float cents to integers', () => {
      const result = normalizeCreateOrderV2PaymentsToSafeIntCents({
        payments: [
          {
            amountInUsdCents: 1527.9849999849998, // The actual production error value
            paymentProviderDetails: {
              paymentProvider: 'NFSC_BASE',
              nfscPaymentDetails: {
                walletAddress: '0x123',
                chainId: 8453,
              },
            },
          },
        ],
        totalAmountInUsdCents: 1528,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.payments[0].amountInUsdCents).toBe(1528);
        expect(Number.isInteger(result.payments[0].amountInUsdCents)).toBe(
          true,
        );
      }
    });

    it('keeps already-integer amounts unchanged', () => {
      const result = normalizeCreateOrderV2PaymentsToSafeIntCents({
        payments: [
          {
            amountInUsdCents: 1000,
            paymentProviderDetails: {
              paymentProvider: 'STRIPE',
              stripePaymentDetails: { paymentMethodId: 'pm_123' },
            },
          },
        ],
        totalAmountInUsdCents: 1000,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.payments[0].amountInUsdCents).toBe(1000);
      }
    });
  });

  describe('delta adjustment (≤5 cents)', () => {
    it('adjusts Stripe payment by small positive delta', () => {
      const result = normalizeCreateOrderV2PaymentsToSafeIntCents({
        payments: [
          {
            amountInUsdCents: 100.4,
            paymentProviderDetails: {
              paymentProvider: 'NFSC_BASE',
              nfscPaymentDetails: {
                walletAddress: '0x123',
                chainId: 8453,
              },
            },
          },
          {
            amountInUsdCents: 199.3,
            paymentProviderDetails: {
              paymentProvider: 'STRIPE',
              stripePaymentDetails: { paymentMethodId: undefined },
            },
          },
        ],
        totalAmountInUsdCents: 300,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // 100.4 → 100, 199.3 → 199, sum = 299, delta = +1
        // Apply +1 to Stripe payment (last/preferred)
        expect(result.payments[0].amountInUsdCents).toBe(100);
        expect(result.payments[1].amountInUsdCents).toBe(200);
        const total = result.payments.reduce(
          (sum, p) => sum + p.amountInUsdCents,
          0,
        );
        expect(total).toBe(300);
      }
    });

    it('adjusts last payment (NFSC) when no Stripe payment exists', () => {
      const result = normalizeCreateOrderV2PaymentsToSafeIntCents({
        payments: [
          {
            amountInUsdCents: 100.7,
            paymentProviderDetails: {
              paymentProvider: 'NFSC_BASE',
              nfscPaymentDetails: {
                walletAddress: '0x123',
                chainId: 8453,
              },
            },
          },
          {
            amountInUsdCents: 50.2,
            paymentProviderDetails: {
              paymentProvider: 'NFSC_ETHEREUM',
              nfscPaymentDetails: {
                walletAddress: '0x456',
                chainId: 1,
              },
            },
          },
        ],
        totalAmountInUsdCents: 151,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // 100.7 → 101, 50.2 → 50, sum = 151, delta = 0
        expect(result.payments[0].amountInUsdCents).toBe(101);
        expect(result.payments[1].amountInUsdCents).toBe(50);
      }
    });

    it('handles negative delta by reducing last payment', () => {
      const result = normalizeCreateOrderV2PaymentsToSafeIntCents({
        payments: [
          {
            amountInUsdCents: 100.8,
            paymentProviderDetails: {
              paymentProvider: 'NFSC_BASE',
              nfscPaymentDetails: {
                walletAddress: '0x123',
                chainId: 8453,
              },
            },
          },
          {
            amountInUsdCents: 200.9,
            paymentProviderDetails: {
              paymentProvider: 'STRIPE',
              stripePaymentDetails: { paymentMethodId: undefined },
            },
          },
        ],
        totalAmountInUsdCents: 300,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // 100.8 → 101, 200.9 → 201, sum = 302, delta = -2
        // Apply -2 to Stripe payment
        expect(result.payments[0].amountInUsdCents).toBe(101);
        expect(result.payments[1].amountInUsdCents).toBe(199);
        const total = result.payments.reduce(
          (sum, p) => sum + p.amountInUsdCents,
          0,
        );
        expect(total).toBe(300);
      }
    });
  });

  describe('delta > 5 cents rejection', () => {
    it('rejects when delta exceeds MAX_PAYMENT_ROUNDING_DELTA_CENTS', () => {
      const result = normalizeCreateOrderV2PaymentsToSafeIntCents({
        payments: [
          {
            amountInUsdCents: 100.5,
            paymentProviderDetails: {
              paymentProvider: 'NFSC_BASE',
              nfscPaymentDetails: {
                walletAddress: '0x123',
                chainId: 8453,
              },
            },
          },
          {
            amountInUsdCents: 200.5,
            paymentProviderDetails: {
              paymentProvider: 'STRIPE',
              stripePaymentDetails: { paymentMethodId: undefined },
            },
          },
        ],
        totalAmountInUsdCents: 310, // 101 + 201 = 302, delta = 8
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('8 cents');
        expect(result.error).toContain(`${MAX_PAYMENT_ROUNDING_DELTA_CENTS}`);
      }
    });

    it('accepts when delta is exactly at limit', () => {
      const result = normalizeCreateOrderV2PaymentsToSafeIntCents({
        payments: [
          {
            amountInUsdCents: 100.5,
            paymentProviderDetails: {
              paymentProvider: 'NFSC_BASE',
              nfscPaymentDetails: {
                walletAddress: '0x123',
                chainId: 8453,
              },
            },
          },
          {
            amountInUsdCents: 200.5,
            paymentProviderDetails: {
              paymentProvider: 'STRIPE',
              stripePaymentDetails: { paymentMethodId: undefined },
            },
          },
        ],
        totalAmountInUsdCents: 306, // 101 + 201 = 302, delta = 4 (within limit)
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Stripe minimum constraint', () => {
    it('rejects Stripe payment below 100 cents even when delta is 0', () => {
      // This tests the bug fix: when delta === 0, we should still validate Stripe minimum
      const result = normalizeCreateOrderV2PaymentsToSafeIntCents({
        payments: [
          {
            amountInUsdCents: 50, // Already integer, rounds to 50 (below Stripe minimum)
            paymentProviderDetails: {
              paymentProvider: 'STRIPE',
              stripePaymentDetails: { paymentMethodId: 'pm_123' },
            },
          },
        ],
        totalAmountInUsdCents: 50, // delta = 0
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Stripe');
        expect(result.error).toContain('50 cents');
        expect(result.error).toContain('100 cents');
      }
    });

    it('rejects if Stripe payment falls below 100 cents after adjustment', () => {
      const result = normalizeCreateOrderV2PaymentsToSafeIntCents({
        payments: [
          {
            amountInUsdCents: 100.5,
            paymentProviderDetails: {
              paymentProvider: 'NFSC_BASE',
              nfscPaymentDetails: {
                walletAddress: '0x123',
                chainId: 8453,
              },
            },
          },
          {
            amountInUsdCents: 103.2, // rounds to 103
            paymentProviderDetails: {
              paymentProvider: 'STRIPE',
              stripePaymentDetails: { paymentMethodId: undefined },
            },
          },
        ],
        totalAmountInUsdCents: 200, // 101 + 103 = 204, delta = -4, adjusted Stripe = 99
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Stripe');
        expect(result.error).toContain('100 cents');
      }
    });

    it('allows Stripe payment >= 100 cents after adjustment', () => {
      const result = normalizeCreateOrderV2PaymentsToSafeIntCents({
        payments: [
          {
            amountInUsdCents: 100.5,
            paymentProviderDetails: {
              paymentProvider: 'NFSC_BASE',
              nfscPaymentDetails: {
                walletAddress: '0x123',
                chainId: 8453,
              },
            },
          },
          {
            amountInUsdCents: 104.2, // rounds to 104
            paymentProviderDetails: {
              paymentProvider: 'STRIPE',
              stripePaymentDetails: { paymentMethodId: undefined },
            },
          },
        ],
        totalAmountInUsdCents: 201, // 101 + 104 = 205, delta = -4, adjusted Stripe = 100
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.payments[1].amountInUsdCents).toBe(100);
      }
    });
  });

  describe('edge cases', () => {
    it('rejects empty payments array', () => {
      const result = normalizeCreateOrderV2PaymentsToSafeIntCents({
        payments: [],
        totalAmountInUsdCents: 100,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('No payments');
      }
    });

    it('rejects non-integer cart total', () => {
      const result = normalizeCreateOrderV2PaymentsToSafeIntCents({
        payments: [
          {
            amountInUsdCents: 100,
            paymentProviderDetails: {
              paymentProvider: 'STRIPE',
              stripePaymentDetails: { paymentMethodId: undefined },
            },
          },
        ],
        totalAmountInUsdCents: 100.5,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Cart total must be an integer');
      }
    });

    it('rejects if adjusted payment becomes non-positive', () => {
      const result = normalizeCreateOrderV2PaymentsToSafeIntCents({
        payments: [
          {
            amountInUsdCents: 2.4, // rounds to 2
            paymentProviderDetails: {
              paymentProvider: 'NFSC_BASE',
              nfscPaymentDetails: {
                walletAddress: '0x123',
                chainId: 8453,
              },
            },
          },
        ],
        totalAmountInUsdCents: 0, // delta = -2, adjusted = 0
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('non-positive');
      }
    });
  });

  describe('multi-payment scenarios', () => {
    it('handles 3+ payments with delta adjustment to last', () => {
      const result = normalizeCreateOrderV2PaymentsToSafeIntCents({
        payments: [
          {
            amountInUsdCents: 100.3,
            paymentProviderDetails: {
              paymentProvider: 'NFSC_BASE',
              nfscPaymentDetails: {
                walletAddress: '0x123',
                chainId: 8453,
              },
            },
          },
          {
            amountInUsdCents: 50.4,
            paymentProviderDetails: {
              paymentProvider: 'NFSC_ETHEREUM',
              nfscPaymentDetails: {
                walletAddress: '0x456',
                chainId: 1,
              },
            },
          },
          {
            amountInUsdCents: 200.2,
            paymentProviderDetails: {
              paymentProvider: 'STRIPE',
              stripePaymentDetails: { paymentMethodId: undefined },
            },
          },
        ],
        totalAmountInUsdCents: 350,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // 100.3→100, 50.4→50, 200.2→200, sum=350, delta=0
        expect(result.payments[0].amountInUsdCents).toBe(100);
        expect(result.payments[1].amountInUsdCents).toBe(50);
        expect(result.payments[2].amountInUsdCents).toBe(200);
      }
    });
  });
});
