import { Hono } from 'hono';
import { mlsFeedSourceFilterSchema } from '@namefi-astra/common/contract/mls-contract';
import { config } from '#lib/env';
import { getPublicNamefiFeedListings } from '../services/namefi-feed/listings.service';
import { buildNamefiFeedRssXml } from '../services/namefi-feed/rss';

const mlsRssProxyRouter = new Hono();

mlsRssProxyRouter.get('/', async (c) => {
  try {
    const url = new URL(c.req.url);
    const parsedSource = mlsFeedSourceFilterSchema
      .nullish()
      .safeParse(url.searchParams.get('source'));
    const page = await getPublicNamefiFeedListings({
      limit: 50,
      source: parsedSource.success ? parsedSource.data : null,
    });
    const rssXml = buildNamefiFeedRssXml({
      rows: page.rows,
      feedUrl: url.toString(),
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
