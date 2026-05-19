import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

// biome-ignore lint/style/noDefaultExport: Next.js metadata route API requires default export.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host =
    headersList.get('x-forwarded-host') ??
    headersList.get('host') ??
    'park.namefi.io';
  const proto = headersList.get('x-forwarded-proto') ?? 'https';
  const baseUrl = `${proto}://${host}`;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: withProtocol(`${baseUrl}/sitemap.xml`),
  };
}

function withProtocol(url: string): string {
  return url.startsWith('http://') || url.startsWith('https://')
    ? url
    : `https://${url}`;
}
