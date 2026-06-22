import { describe, expect, it } from 'vitest';
import { type BuyErrorMessages, toBuyErrorMessage } from './fulfill-error';

const MESSAGES: BuyErrorMessages = {
  fallback: 'Purchase failed. Please try again.',
  rateLimited:
    'OpenSea is briefly rate-limiting requests. Please try again in a moment.',
};

describe('toBuyErrorMessage', () => {
  it('returns the soft fallback for user-initiated aborts', () => {
    for (const message of [
      'User rejected the request',
      'MetaMask Tx Signature: User denied transaction signature',
      'User rejected',
      'Wallet connection was cancelled.',
    ]) {
      expect(toBuyErrorMessage(new Error(message), MESSAGES)).toBe(
        MESSAGES.fallback,
      );
    }
  });

  it('does NOT mask a real failure that merely contains "denied"', () => {
    // The previous bare-"denied" regex hid these behind the generic line.
    expect(
      toBuyErrorMessage(
        new Error('execution reverted: permission denied'),
        MESSAGES,
      ),
    ).toMatch(/permission denied/);
  });

  it('maps OpenSea key / rate-limit failures to the retry message', () => {
    for (const message of [
      'Server Error: Missing an API Key, which is required for this request.',
      'Server Error (429): Too Many Requests',
      'You are being rate limited',
    ]) {
      expect(toBuyErrorMessage(new Error(message), MESSAGES)).toBe(
        MESSAGES.rateLimited,
      );
    }
  });

  it('surfaces the real reason for other failures', () => {
    // This is the bug that shipped: the real error must not be masked.
    expect(
      toBuyErrorMessage(
        new Error(
          'OpenSea fulfillment_data returned an unexpected input_data shape',
        ),
        MESSAGES,
      ),
    ).toMatch(/unexpected input_data/);
    expect(
      toBuyErrorMessage(new Error('insufficient funds for gas'), MESSAGES),
    ).toMatch(/insufficient funds/);
  });

  it('falls back when the message is empty', () => {
    expect(toBuyErrorMessage(new Error(''), MESSAGES)).toBe(MESSAGES.fallback);
    expect(toBuyErrorMessage('', MESSAGES)).toBe(MESSAGES.fallback);
  });

  it('truncates very long messages to keep the toast readable', () => {
    const out = toBuyErrorMessage(new Error('x'.repeat(500)), MESSAGES);
    expect(out.length).toBeLessThanOrEqual(201);
    expect(out.endsWith('…')).toBe(true);
  });

  it('stringifies non-Error throwables', () => {
    expect(toBuyErrorMessage('boom', MESSAGES)).toBe('boom');
  });
});
