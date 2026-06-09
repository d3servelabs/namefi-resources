import { describe, expect, it } from 'vitest';
import {
  deriveMarketplaceCancellationDate,
  deriveMarketplaceCancellationSeller,
} from './marketplace-lifecycle.service';

describe('Namefi marketplace listing lifecycle', () => {
  it('uses server time for cancellations when the client clock is behind', () => {
    const now = new Date('2026-06-09T06:00:00.000Z');

    const cancelledAt = deriveMarketplaceCancellationDate({
      clientCancelledAt: '2026-06-01T06:00:00.000Z',
      now,
    });

    expect(cancelledAt).toEqual(now);
    expect(cancelledAt).not.toBe(now);
  });

  it('uses server time for cancellations when the client clock is ahead', () => {
    const now = new Date('2026-06-09T06:00:00.000Z');

    const cancelledAt = deriveMarketplaceCancellationDate({
      clientCancelledAt: '2026-06-20T06:00:00.000Z',
      now,
    });

    expect(cancelledAt).toEqual(now);
  });

  it('uses the resolved owner as cancellation seller metadata', () => {
    const seller = deriveMarketplaceCancellationSeller(
      '0xABCDEF1234567890abcdef1234567890ABCDEF12',
    );

    expect(seller).toEqual({
      externalAuthorId: '0xabcdef1234567890abcdef1234567890abcdef12',
      displayName: '0xABCD...EF12',
    });
  });
});
