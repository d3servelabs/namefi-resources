import type { MetadataRoute } from 'next';
import { config } from '@/lib/env';

function getBaseOrigin() {
  return new URL(config.FIRST_PARTY_DEPLOYMENT_URL).origin;
}

// biome-ignore lint/style/noDefaultExport: Next.js metadata route API requires default export.
export default function robots(): MetadataRoute.Robots {
  const baseOrigin = getBaseOrigin();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    host: baseOrigin,
    sitemap: `${baseOrigin}/sitemap.xml`,
  };
}
