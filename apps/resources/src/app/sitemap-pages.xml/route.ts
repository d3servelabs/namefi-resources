import { buildSitemapEntries, renderSitemapXml } from '@/lib/sitemap';
import { i18n } from '@/i18n-config';
import { resolveBaseUrl } from '@/lib/site-url';

// Pages sitemap — all non-video URLs. Watch detail pages live in
// /r/sitemap-videos.xml instead so they can carry Google's <video:video>
// metadata. The watch INDEX page (`/r/[lang]/watch`) is included here as a
// normal document.
//
// Every locale URL is announced (not just English) so each language version is
// independently discoverable and indexable — pages are self-canonical, and each
// entry carries hreflang alternates (+ x-default) mapping the language cluster.
export const revalidate = 3600;

export async function GET() {
  const baseUrl = resolveBaseUrl();
  const entries = await buildSitemapEntries(baseUrl, i18n.locales);
  const xml = renderSitemapXml(entries);
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
