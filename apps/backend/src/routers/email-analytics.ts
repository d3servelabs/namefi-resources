import { Hono } from 'hono';
import { createLogger } from '#lib/logger';
import { gaEventOrderFinishedEmailOpened } from '#lib/tracking/checkout';
import {
  db,
  emailCampaignClicksTable,
  emailCampaignOpensTable,
} from '@namefi-astra/db';
import { sql } from 'drizzle-orm';
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
    const trackingData = result.data as Record<string, unknown>;
    const parsed = EmailAnalyticsPayloadSchema.safeParse(trackingData);

    // Trace log: minimal, non-PII fields only (no `userEmail`, no full payload).
    logger.trace(
      {
        type: parsed.success ? parsed.data.type : 'unknown',
        userAgent,
      },
      'Email opened',
    );

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
        case 'campaign_email_open':
          // Isolate counter-write failures: the pixel response must always
          // succeed regardless of database availability.
          try {
            await db
              .insert(emailCampaignOpensTable)
              .values({
                campaignKey: parsed.data.campaignKey,
                openCount: 1,
              })
              .onConflictDoUpdate({
                target: emailCampaignOpensTable.campaignKey,
                set: {
                  openCount: sql`${emailCampaignOpensTable.openCount} + 1`,
                  updatedAt: new Date(),
                },
              });
          } catch (error) {
            logger.warn(
              { error, campaignKey: parsed.data.campaignKey },
              'Failed to increment campaign email open count',
            );
          }
          logger.trace(
            {
              campaignKey: parsed.data.campaignKey,
              userAgent,
            },
            'Campaign email opened',
          );
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

emailAnalyticsRouter.get('/analytics/click', async (c) => {
  const token = c.req.query('token') ?? '';
  const result = await getEmailTrackDataFromUrl(token);
  const userAgent = c.req.header('user-agent');

  if (!result.data) {
    logger.trace(
      { error: result.error, userAgent },
      'Email click tracking failed',
    );
    return c.text('Invalid tracking link', 400);
  }

  const parsed = EmailAnalyticsPayloadSchema.safeParse(
    result.data as Record<string, unknown>,
  );
  if (!parsed.success || parsed.data.type !== 'campaign_link_click') {
    logger.trace(
      {
        type: parsed.success ? parsed.data.type : 'unknown',
        userAgent,
      },
      'Email click token is not a link-click payload',
    );
    return c.text('Invalid tracking link', 400);
  }

  let destination: URL;
  try {
    destination = new URL(parsed.data.destinationUrl);
  } catch {
    return c.text('Invalid destination', 400);
  }
  if (destination.protocol !== 'http:' && destination.protocol !== 'https:') {
    return c.text('Invalid destination', 400);
  }

  // Identify the click row by the explicit group identifier if provided;
  // otherwise fall back to `${hostname}${pathname}` of the destination so
  // distinct links within the same campaign aggregate separately even when
  // the template author didn't tag them with `@TrackLink(...)`. Query string
  // and hash are intentionally excluded so URL parameter variants (e.g.
  // utm tags) collapse into one row.
  const groupIdentifier =
    parsed.data.groupIdentifier?.trim() ||
    `${destination.hostname}${destination.pathname}`;

  try {
    await db
      .insert(emailCampaignClicksTable)
      .values({
        campaignKey: parsed.data.campaignKey,
        groupIdentifier,
        clickCount: 1,
      })
      .onConflictDoUpdate({
        target: [
          emailCampaignClicksTable.campaignKey,
          emailCampaignClicksTable.groupIdentifier,
        ],
        set: {
          clickCount: sql`${emailCampaignClicksTable.clickCount} + 1`,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    // Don't penalize the recipient if the counter write fails — still redirect.
    logger.warn(
      {
        error,
        campaignKey: parsed.data.campaignKey,
        groupIdentifier,
      },
      'Failed to increment campaign link click count',
    );
  }

  logger.trace(
    {
      campaignKey: parsed.data.campaignKey,
      groupIdentifier,
      userAgent,
    },
    'Campaign link clicked',
  );

  const response = c.redirect(destination.toString(), 302);
  response.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, max-age=0',
  );
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
});

export { emailAnalyticsRouter };
