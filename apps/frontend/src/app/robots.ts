import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { bareHost, isIndexableHost } from '@namefi-astra/common/host-policy';
import { config } from '@/lib/env';

function getEnvBaseOrigin() {
  return new URL(config.FIRST_PARTY_DEPLOYMENT_URL).origin;
}

// AI / generative-engine crawler user agents. Listed explicitly so the
// indexability decision for GEO surfaces (ChatGPT, Claude, Gemini, Perplexity,
// Common Crawl) is intentional and reviewable, not implicit via the `*` rule.
const AI_BOT_USER_AGENTS = [
  'GPTBot',
  'ClaudeBot',
  'Google-Extended',
  'PerplexityBot',
  'CCBot',
] as const;

// Per-host robots policy. The frontend Vercel project is bound to multiple
// hosts (namefi.io, www.namefi.io, astra.namefi.io, app.namefi.io, plus
// preview deployment URLs). Only the canonical apex hosts are indexable;
// everything else returns Disallow: / to keep Google off non-canonical
// surfaces. See packages/common/src/host-policy.ts for the allowlist.
// biome-ignore lint/style/noDefaultExport: Next.js metadata route API requires default export.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get('host');

  if (!isIndexableHost(host)) {
    // `userAgent: '*'` already covers AI bots; no extra rules needed.
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  // Emit host / sitemap that match the requested host on the allowlist
  // (e.g., namefi.dev when served from namefi.dev) rather than always the
  // env's FIRST_PARTY_DEPLOYMENT_URL. Fall back to env when host is missing.
  const requestOrigin = host ? `https://${bareHost(host)}` : getEnvBaseOrigin();
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      ...AI_BOT_USER_AGENTS.map((userAgent) => ({ userAgent, allow: '/' })),
    ],
    host: requestOrigin,
    sitemap: `${requestOrigin}/sitemap.xml`,
  };
}
