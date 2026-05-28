/**
 * Admin endpoint that streams a chain-of-trust diagram (SVG or HTML)
 * for a stored DNSSEC analysis. Auth: matches the existing diagnostic-route
 * convention (`x-namefi-key` / `?key=` checked against `secrets.API_AUTH_KEY`),
 * same as `apps/backend/src/routers/log-level.ts`.
 *
 *   GET /v1/dnsviz/analysis/:analysisId/graph?type=svg|html
 *
 *   `type` is the preferred query param; `format` is accepted as an alias
 *   for backwards compatibility.
 *
 * The audit artifact persists in the `dnsviz_analyses` jsonb column; this
 * route renders a temporary graph from that stored JSON.
 */

import { Readable } from 'node:stream';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { db as database } from '@namefi-astra/db';
import { dnsvizAnalysesTable } from '@namefi-astra/db/schema';
import { secrets } from '#lib/env';
import { createLogger } from '#lib/logger';
import { validateApiKey } from '#lib/validate-api-key';
import {
  dnsvizGraphContentType,
  runDnsvizGraphBuffered,
  runDnsvizGraphStream,
  type DnsvizGraphType,
} from '#lib/dnsviz';

const logger = createLogger({ context: 'DNSVIZ_ROUTER' });

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const dnsvizRouter = new Hono();

dnsvizRouter.get('/analysis/:analysisId/graph', async (c) => {
  const key = c.req.header('x-namefi-key') ?? c.req.query('key');
  if (!validateApiKey(key, secrets.API_AUTH_KEY)) {
    logger.warn('Unauthorized request to /v1/dnsviz/analysis/:id/graph');
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const analysisId = c.req.param('analysisId');
  if (!analysisId || !UUID_RE.test(analysisId)) {
    return c.json({ error: 'Invalid analysisId (must be a UUID)' }, 400);
  }

  // Accept both `type` (preferred) and `format` (back-compat alias).
  const rawType = (
    c.req.query('type') ??
    c.req.query('format') ??
    'svg'
  ).toLowerCase();
  if (rawType !== 'svg' && rawType !== 'html') {
    return c.json(
      {
        error: 'Unsupported type. Use ?type=svg or ?type=html',
      },
      400,
    );
  }
  const type: DnsvizGraphType = rawType;

  const [row] = await database
    .select({
      normalizedDomainName: dnsvizAnalysesTable.normalizedDomainName,
      status: dnsvizAnalysesTable.status,
      probeData: dnsvizAnalysesTable.probeData,
    })
    .from(dnsvizAnalysesTable)
    .where(eq(dnsvizAnalysesTable.id, analysisId))
    .limit(1);

  if (!row || row.probeData == null) {
    return c.json({ error: 'Analysis not found or has no probe data' }, 404);
  }

  const headers: HeadersInit = {
    'content-type': dnsvizGraphContentType(type),
    'cache-control': 'private, max-age=300',
    'content-disposition': `inline; filename="${row.normalizedDomainName}.${type}"`,
    'x-dnsviz-status': row.status,
  };

  if (type === 'html') {
    const buffer = await runDnsvizGraphBuffered(row.probeData, type);
    return new Response(buffer.toString('utf8'), { status: 200, headers });
  }

  const nodeStream = runDnsvizGraphStream(row.probeData, type);
  // Hono's Response accepts a Web ReadableStream; convert from Node stream.
  const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream;
  return new Response(webStream, { status: 200, headers });
});
