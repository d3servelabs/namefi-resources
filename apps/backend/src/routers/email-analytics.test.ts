import { beforeEach, describe, expect, it, vi } from 'vitest';

const orderId = '550e8400-e29b-41d4-a716-446655440000';
const userId = '550e8400-e29b-41d4-a716-446655440001';

const gaMocks = {
  gaEventOrderFinishedEmailOpened: vi.fn(),
};

vi.mock('#lib/tracking/checkout', () => ({
  gaEventOrderFinishedEmailOpened: gaMocks.gaEventOrderFinishedEmailOpened,
}));

const { buildEmailAnalyticsUrl } = await import(
  '../mail/components/email-tracking'
);
const { buildOrderReadyEmailOpenTrackingInput, emailAnalyticsRouter } =
  await import('./email-analytics');

async function buildOrderReadyOpenUrl(nonce = 'email-open-1') {
  const result = await buildEmailAnalyticsUrl({
    trackUrl: 'http://localhost/analytics/open',
    data: {
      type: 'order_ready',
      orderId,
      userId,
      emailAddress: 'user@example.com',
      nonce,
    },
  });

  if (!result.url) {
    throw new Error(result.error);
  }

  return result.url;
}

describe('emailAnalyticsRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gaMocks.gaEventOrderFinishedEmailOpened.mockResolvedValue(undefined);
  });

  it('tracks order-ready email opens with signed order metadata', async () => {
    const response = await emailAnalyticsRouter.request(
      await buildOrderReadyOpenUrl('email-open-1'),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/gif');
    expect(gaMocks.gaEventOrderFinishedEmailOpened).toHaveBeenCalledWith({
      orderId,
      userId,
      emailId: 'email-open-1',
    });
  });

  it('still returns the tracking pixel when GA email-open tracking fails', async () => {
    gaMocks.gaEventOrderFinishedEmailOpened.mockRejectedValueOnce(
      new Error('GA unavailable'),
    );

    const response = await emailAnalyticsRouter.request(
      await buildOrderReadyOpenUrl('email-open-2'),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/gif');
    expect(gaMocks.gaEventOrderFinishedEmailOpened).toHaveBeenCalledWith({
      orderId,
      userId,
      emailId: 'email-open-2',
    });
  });

  it('tracks count-only order-ready email opens', async () => {
    const result = await buildEmailAnalyticsUrl({
      trackUrl: 'http://localhost/analytics/open',
      data: {
        type: 'order_ready_count_only',
        nonce: 'email-open-count-only',
      },
    });

    if (!result.url) {
      throw new Error(result.error);
    }

    const response = await emailAnalyticsRouter.request(result.url);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/gif');
    expect(gaMocks.gaEventOrderFinishedEmailOpened).toHaveBeenCalledWith({
      emailId: 'email-open-count-only',
    });
  });
});

describe('buildOrderReadyEmailOpenTrackingInput', () => {
  it('uses signed token user metadata', () => {
    expect(
      buildOrderReadyEmailOpenTrackingInput({
        type: 'order_ready',
        orderId,
        userId,
        emailAddress: 'user@example.com',
        nonce: 'email-open-1',
      }),
    ).toEqual({
      orderId,
      userId,
      emailId: 'email-open-1',
    });
  });
});
