import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { bareHost, isIndexableHost } from '@namefi-astra/common/host-policy';
import { config } from '@/lib/env';

function getEnvBaseOrigin() {
  return new URL(config.FIRST_PARTY_DEPLOYMENT_URL).origin;
}

// Per-host robots policy. The frontend Vercel project is bound to multiple
// hosts (namefi.io, www.namefi.io, astra.namefi.io, app.namefi.io, plus
// preview deployment URLs). Only the canonical apex hosts are indexable;
// everything else returns Disallow: / to keep Google off non-canonical
// surfaces. See packages/common/src/host-policy.ts for the allowlist.
// biome-ignore lint/style/noDefaultExport: Next.js metadata route API requires default export.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get('host');

  if (!isIndexableHost(host)) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  // Emit host / sitemap that match the requested host on the allowlist
  // (e.g., namefi.dev when served from namefi.dev) rather than always the
  // env's FIRST_PARTY_DEPLOYMENT_URL. Fall back to env when host is missing.
  const requestOrigin = host ? `https://${bareHost(host)}` : getEnvBaseOrigin();
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    host: requestOrigin,
    sitemap: `${requestOrigin}/sitemap.xml`,
  };
}
