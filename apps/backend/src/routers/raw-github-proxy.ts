/**
 * Proxy for `raw.githubusercontent.com` that fixes the Content-Type.
 *
 * GitHub serves every raw response as `text/plain; charset=utf-8` with
 * `X-Content-Type-Options: nosniff`, which means modern browsers refuse to
 * apply `.css` files as stylesheets, parse `.json` as JSON, or treat `.js`
 * as a script module. This proxy streams the upstream bytes unchanged and
 * overrides the Content-Type based on the file extension.
 *
 * The route is unauthenticated and effectively a public CORS-friendly
 * mirror, so the allowlist is intentionally tight — only repos we ship UI
 * assets from belong here.
 */

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createLogger } from '#lib/logger';

const logger = createLogger({ context: 'RAW_GITHUB_PROXY' });

const RAW_GITHUB_HOST = 'raw.githubusercontent.com';

/** Mount path for this router. Exported so callers can build proxied URLs
 *  without having to keep the prefix in sync in two places. */
export const RAW_GITHUB_PROXY_MOUNT = `/proxy/${RAW_GITHUB_HOST}`;

const ALLOWED_REPOS: ReadonlySet<string> = new Set();

const EXT_TO_MIME: Record<string, string> = {
  css: 'text/css; charset=utf-8',
  js: 'application/javascript; charset=utf-8',
  mjs: 'application/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  map: 'application/json; charset=utf-8',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  txt: 'text/plain; charset=utf-8',
};

function mimeFromPath(pathname: string): string {
  const dot = pathname.lastIndexOf('.');
  if (dot < 0) return 'application/octet-stream';
  const ext = pathname.slice(dot + 1).toLowerCase();
  return EXT_TO_MIME[ext] ?? 'application/octet-stream';
}

export const rawGithubProxyRouter = new Hono();

rawGithubProxyRouter.get('/*', async (c) => {
  // The router is mounted at RAW_GITHUB_PROXY_MOUNT; everything after that
  // prefix is the upstream path (`<owner>/<repo>/<ref>/<file...>`).
  const prefix = `${RAW_GITHUB_PROXY_MOUNT}/`;
  if (!c.req.path.startsWith(prefix)) {
    throw new HTTPException(404, { message: 'Not found' });
  }
  const subPath = c.req.path.slice(prefix.length);

  const segments = subPath.split('/').filter(Boolean);
  if (segments.length < 3) {
    throw new HTTPException(400, {
      message: 'Path must include <owner>/<repo>/<file-path>',
    });
  }

  const repoKey = `${segments[0]}/${segments[1]}`;
  if (!ALLOWED_REPOS.has(repoKey)) {
    throw new HTTPException(403, { message: `Repo not allowed: ${repoKey}` });
  }

  const upstreamUrl = `https://${RAW_GITHUB_HOST}/${subPath}`;

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstreamUrl, { headers: { Accept: '*/*' } });
  } catch (error) {
    logger.warn(
      { error, upstreamUrl },
      'upstream raw.githubusercontent.com fetch threw',
    );
    throw new HTTPException(502, { message: 'Upstream fetch failed' });
  }

  if (!upstreamRes.ok) {
    logger.warn(
      { upstreamUrl, status: upstreamRes.status },
      'upstream raw.githubusercontent.com returned non-2xx',
    );
    return c.json(
      { error: 'Upstream returned non-success status' },
      upstreamRes.status === 404 ? 404 : 502,
    );
  }

  const body = await upstreamRes.arrayBuffer();
  const upstreamCacheControl = upstreamRes.headers.get('cache-control');

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': mimeFromPath(subPath),
      'Cache-Control': upstreamCacheControl ?? 'public, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*',
    },
  });
});
