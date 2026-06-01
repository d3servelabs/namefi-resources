import { Hono } from 'hono';
import { config } from '#lib/env';
import { getPublicNamefiFeedListings } from '../services/namefi-feed/listings.service';
import { buildNamefiFeedRssXml } from '../services/namefi-feed/rss';

const mlsRssProxyRouter = new Hono();

mlsRssProxyRouter.get('/', async (c) => {
  try {
    const feedUrl = new URL(c.req.url).toString();
    const page = await getPublicNamefiFeedListings({
      limit: 50,
    });
    const rssXml = buildNamefiFeedRssXml({
      rows: page.rows,
      feedUrl,
      siteUrl: config.APP_URL,
    });

    c.header('Content-Type', 'application/rss+xml; charset=utf-8');
    c.header(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=3600',
    );
    c.header('X-Content-Type-Options', 'nosniff');
    return c.body(rssXml, 200);
  } catch {
    return c.json({ error: 'Unable to load MLS RSS feed right now.' }, 502);
  }
});

export { mlsRssProxyRouter };
