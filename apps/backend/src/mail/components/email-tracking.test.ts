import { describe, expect, it } from 'vitest';
import { EmailAnalyticsPayloadSchema } from './email-tracking';

const orderId = '550e8400-e29b-41d4-a716-446655440000';
const userId = '550e8400-e29b-41d4-a716-446655440001';

describe('EmailAnalyticsPayloadSchema', () => {
  it('accepts order-ready count-only tracking', () => {
    expect(
      EmailAnalyticsPayloadSchema.safeParse({
        type: 'order_ready_count_only',
        nonce: 'email-open-1',
      }).success,
    ).toBe(true);
  });

  it('accepts order-ready tokens with user and email context', () => {
    expect(
      EmailAnalyticsPayloadSchema.safeParse({
        type: 'order_ready',
        orderId,
        userId,
        emailAddress: 'user@example.com',
        nonce: 'email-open-1',
      }).success,
    ).toBe(true);
  });

  it('rejects order-ready open tracking without user context', () => {
    expect(
      EmailAnalyticsPayloadSchema.safeParse({
        type: 'order_ready',
        orderId,
        nonce: 'email-open-1',
      }).success,
    ).toBe(false);
  });
});
