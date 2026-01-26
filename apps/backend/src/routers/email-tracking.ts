import { Hono } from 'hono';
import { createLogger } from '#lib/logger';
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
    logger.info({ data: result.data, userAgent }, 'Email opened');
  } else {
    logger.warn({ error: result.error, userAgent }, 'Email tracking failed');
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
