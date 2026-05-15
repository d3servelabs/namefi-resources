import { describe, expect, it } from 'vitest';
import { ordersContract } from './orders-contract';

// All-zero address: a trivially valid checksummed wallet address (no letters
// to case-check), accepted by `checksumWalletAddressSchema`.
const VALID_WALLET = '0x0000000000000000000000000000000000000000';

const stripePayment = (amountInUsdCents: number) => ({
  amountInUsdCents,
  paymentProviderDetails: {
    paymentProvider: 'STRIPE' as const,
    stripePaymentDetails: {},
  },
  paymentMetadata: { confirmationTokenId: 'ctoken_test' },
});

const buyNfscInput = ordersContract.buyNfsc.input;

describe('buyNfsc contract input schema', () => {
  it('accepts a valid Stripe-paid NFSC top-up', () => {
    const result = buyNfscInput.safeParse({
      amountInUsdCents: 2500,
      payments: [stripePayment(2500)],
      recipient: { recipientWalletAddress: VALID_WALLET, nfscChainId: 8453 },
    });
    expect(result.success).toBe(true);
  });

  it('rejects an NFSC payment provider — NFSC top-up cannot be paid with NFSC', () => {
    const result = buyNfscInput.safeParse({
      amountInUsdCents: 2500,
      payments: [
        {
          amountInUsdCents: 2500,
          paymentProviderDetails: {
            paymentProvider: 'NFSC_BASE',
            nfscPaymentDetails: {
              walletAddress: VALID_WALLET,
              chainId: 8453,
            },
          },
        },
      ],
      recipient: { recipientWalletAddress: VALID_WALLET, nfscChainId: 8453 },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes('NFSC top-up cannot be paid with NFSC'),
        ),
      ).toBe(true);
    }
  });

  it('rejects a chain id that is not allowed for NFSC top-up', () => {
    const result = buyNfscInput.safeParse({
      amountInUsdCents: 2500,
      payments: [stripePayment(2500)],
      recipient: { recipientWalletAddress: VALID_WALLET, nfscChainId: 999999 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-positive top-up amount', () => {
    const result = buyNfscInput.safeParse({
      amountInUsdCents: 0,
      payments: [stripePayment(2500)],
      recipient: { recipientWalletAddress: VALID_WALLET, nfscChainId: 8453 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a Stripe payment below the $1.00 minimum', () => {
    const result = buyNfscInput.safeParse({
      amountInUsdCents: 50,
      payments: [stripePayment(50)],
      recipient: { recipientWalletAddress: VALID_WALLET, nfscChainId: 8453 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid recipient wallet address', () => {
    const result = buyNfscInput.safeParse({
      amountInUsdCents: 2500,
      payments: [stripePayment(2500)],
      recipient: {
        recipientWalletAddress: 'not-an-address',
        nfscChainId: 8453,
      },
    });
    expect(result.success).toBe(false);
  });
});
