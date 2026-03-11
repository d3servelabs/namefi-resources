import { NextResponse } from 'next/server';
import { buildSitemapIndexXml } from '@/lib/sitemap';

const SITEMAP_CACHE_TTL_SECONDS = 3600;
export const revalidate = 3600;

export function GET() {
  const xml = buildSitemapIndexXml();

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `s-maxage=${SITEMAP_CACHE_TTL_SECONDS}, stale-while-revalidate`,
    },
  });
}
