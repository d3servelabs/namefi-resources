import { renderSitemapIndexXml } from '@/lib/sitemap';
import { resolveBaseUrl } from '@/lib/site-url';
import { getWatchVideos } from '@/lib/watch';

// Sitemap index — points search engines at the per-section sitemaps. Replaces
// the previous monolithic /r/sitemap.xml so the video sitemap can declare
// Google's <video:video> schema, which the standard sitemap shape can't carry.
//
// Cached on Vercel for an hour; both child sitemaps revalidate independently.
export const revalidate = 3600;

export async function GET() {
  const baseUrl = resolveBaseUrl();
  let latestVideoDate: Date | undefined;
  try {
    const videos = await getWatchVideos();
    for (const video of videos) {
      if (!latestVideoDate || video.publishedAt > latestVideoDate) {
        latestVideoDate = video.publishedAt;
      }
    }
  } catch {
    // Non-fatal: index still references both children even if YouTube errors.
  }
  const xml = renderSitemapIndexXml(
    [`${baseUrl}/r/sitemap-pages.xml`, `${baseUrl}/r/sitemap-videos.xml`],
    latestVideoDate,
  );
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
