import { buildSitemapEntries, renderSitemapXml } from '@/lib/sitemap';
import { resolveBaseUrl } from '@/lib/site-url';

// Pages sitemap — all non-video URLs. Watch detail pages live in
// /r/sitemap-videos.xml instead so they can carry Google's <video:video>
// metadata. The watch INDEX page (`/r/[lang]/watch`) is included here as a
// normal document.
//
// Only English is announced (same policy as before the split) to consolidate
// crawl budget; hreflang alternates on each page surface other locales.
export const revalidate = 3600;

export async function GET() {
  const baseUrl = resolveBaseUrl();
  const entries = await buildSitemapEntries(baseUrl, ['en']);
  const xml = renderSitemapXml(entries);
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
