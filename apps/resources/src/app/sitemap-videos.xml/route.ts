import { renderVideoSitemapXml } from '@/lib/sitemap';
import { resolveBaseUrl } from '@/lib/site-url';
import { getWatchVideos } from '@/lib/watch';

// Video sitemap — one <url> per watch detail page, each carrying a
// <video:video> block with thumbnail, title, description, embed URL,
// duration, and publication_date. Google Video Search uses this schema to
// surface our videos with rich previews.
//
// Only English URLs are announced (same policy as the pages sitemap); the
// detail page itself declares hreflang alternates for non-English locales.
export const revalidate = 3600;

export async function GET() {
  const baseUrl = resolveBaseUrl();
  let videos: Awaited<ReturnType<typeof getWatchVideos>> = [];
  try {
    videos = await getWatchVideos();
  } catch (error) {
    // Empty video sitemap is still valid XML; failing the route would
    // surface as a 500 to search crawlers, which is worse. Log so the
    // failure is visible in Vercel function logs.
    console.error('[sitemap-videos] Failed to fetch watch videos:', error);
  }
  const xml = renderVideoSitemapXml(baseUrl, videos);
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
