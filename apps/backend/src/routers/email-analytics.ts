import { Hono } from 'hono';
import { createLogger } from '#lib/logger';
import { gaEventOrderFinishedEmailOpened } from '#lib/tracking/checkout';
import { getEmailTrackDataFromUrl } from '../mail/components/email-tracking';

const emailAnalyticsRouter = new Hono();
const logger = createLogger({ context: 'EMAIL_ANALYTICS' });

const pixel = Buffer.from(
  'R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
  'base64',
);

emailAnalyticsRouter.get('/analytics/open', async (c) => {
  const token = c.req.query('token') ?? '';
  const result = await getEmailTrackDataFromUrl(token);
  const userAgent = c.req.header('user-agent');

  if (result.data) {
    logger.trace({ data: result.data, userAgent }, 'Email opened');

    const trackingData = result.data as Record<string, unknown>;
    // const userId = getTrackingString(trackingData, ['userId', 'user_id']); // needs consent
    const orderId = getTrackingString(trackingData, ['orderId', 'order_id']);

    void gaEventOrderFinishedEmailOpened({
      // userId,
      orderId,
    });
  } else {
    logger.trace({ error: result.error, userAgent }, 'Email open log failed');
  }

  return c.body(pixel, 200, {
    'Content-Type': 'image/gif',
    'Content-Length': pixel.length.toString(),
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    Pragma: 'no-cache',
    Expires: '0',
  });
});

function getTrackingValue(
  data: Record<string, unknown>,
  keys: string[],
): unknown {
  for (const key of keys) {
    if (Object.hasOwn(data, key)) {
      return data[key];
    }
  }
  return undefined;
}

function toTrackingString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }
  return undefined;
}

function getTrackingString(
  data: Record<string, unknown>,
  keys: string[],
): string | undefined {
  return toTrackingString(getTrackingValue(data, keys));
}

export { emailAnalyticsRouter };
