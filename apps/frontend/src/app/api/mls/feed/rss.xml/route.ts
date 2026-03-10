import { NextResponse } from 'next/server';
import { config } from '@/lib/env';

const TRAILING_SLASHES_PATTERN = /\/+$/;

export const dynamic = 'force-dynamic';

export async function GET() {
  const upstreamUrl = buildUpstreamRssUrl();

  try {
    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      cache: 'no-store',
      headers: {
        Accept: 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8',
      },
    });

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch upstream MLS RSS feed.' },
        { status: 502 },
      );
    }

    const rssXml = await upstreamResponse.text();
    const cacheControl =
      upstreamResponse.headers.get('cache-control') ??
      'public, s-maxage=300, stale-while-revalidate=3600';

    return new NextResponse(rssXml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': cacheControl,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to load MLS RSS feed right now.' },
      { status: 502 },
    );
  }
}

function buildUpstreamRssUrl() {
  const upstreamUrl = new URL(config.MLS_PUBLIC_SALES_LISTINGS_URL);
  const normalizedPath = upstreamUrl.pathname.replace(
    TRAILING_SLASHES_PATTERN,
    '',
  );

  if (normalizedPath.endsWith('/rss.xml')) {
    upstreamUrl.pathname = normalizedPath;
    return upstreamUrl;
  }

  upstreamUrl.pathname = normalizedPath.endsWith('/listings')
    ? `${normalizedPath}/rss.xml`
    : `${normalizedPath}/listings/rss.xml`;

  return upstreamUrl;
}
