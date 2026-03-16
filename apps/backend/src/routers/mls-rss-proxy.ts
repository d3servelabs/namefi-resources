import { Hono } from 'hono';
import { config } from '#lib/env';

const TRAILING_SLASHES_PATTERN = /\/+$/;

const mlsRssProxyRouter = new Hono();

mlsRssProxyRouter.get('/', async (c) => {
  const upstreamUrl = buildUpstreamRssUrl();

  try {
    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      cache: 'no-store',
      headers: {
        Accept: 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8',
      },
    });

    if (!upstreamResponse.ok) {
      return c.json({ error: 'Failed to fetch upstream MLS RSS feed.' }, 502);
    }

    const rssXml = await upstreamResponse.text();
    const cacheControl =
      upstreamResponse.headers.get('cache-control') ??
      'public, s-maxage=300, stale-while-revalidate=3600';

    c.header('Content-Type', 'application/rss+xml; charset=utf-8');
    c.header('Cache-Control', cacheControl);
    c.header('X-Content-Type-Options', 'nosniff');
    return c.body(rssXml, 200);
  } catch {
    return c.json({ error: 'Unable to load MLS RSS feed right now.' }, 502);
  }
});

function buildUpstreamRssUrl() {
  const upstreamUrl = new URL(config.MLS_PUBLIC_SALES_LISTINGS_URL);
  const normalizedPath = upstreamUrl.pathname.replace(
    TRAILING_SLASHES_PATTERN,
    '',
  );

  upstreamUrl.pathname = normalizedPath.endsWith('/listings')
    ? `${normalizedPath}/rss.xml`
    : `${normalizedPath}/listings/rss.xml`;

  return upstreamUrl;
}

export { mlsRssProxyRouter };
