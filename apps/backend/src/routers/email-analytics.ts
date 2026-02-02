import { Hono } from 'hono';
import { createLogger } from '#lib/logger';
import { gaEventOrderFinishedEmailOpened } from '#lib/tracking/checkout';
import {
  EmailAnalyticsPayloadSchema,
  getEmailTrackDataFromUrl,
} from '../mail/components/email-tracking';
import z from 'zod';

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
    const parsed = EmailAnalyticsPayloadSchema.safeParse(trackingData);

    if (parsed.success) {
      switch (parsed.data.type) {
        case 'order_ready_count_only':
          await gaEventOrderFinishedEmailOpened({
            emailId: parsed.data.nonce,
          });
          break;
        case 'order_ready':
          await gaEventOrderFinishedEmailOpened({
            orderId: parsed.data.orderId,
            userId: parsed.data.userId,
            emailId: parsed.data.nonce,
          });
          break;
      }
    }
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

export { emailAnalyticsRouter };
