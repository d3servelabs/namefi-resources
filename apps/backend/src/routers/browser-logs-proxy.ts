import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createLogger } from '#lib/logger';
import { isHostnameAllowed } from '#lib/hostname-validation';
import { config } from '#lib/env';
import { getPoweredByNamefi3PHostnames } from '#lib/namefi-registry';

const browserLogsProxyRouter = new Hono();
const logger = createLogger({ context: 'BROWSER_LOGS_PROXY' });

const DATADOG_LOGS_INTAKE_HOST = 'browser-intake-us5-datadoghq.com';
const DATADOG_LOGS_INTAKE_PATH = '/api/v2/logs';

const getAllowedHostnames = async (): Promise<string[]> => [
  ...config.NAMEFI_FIRST_PARTY_HOSTNAMES,
  ...(await getPoweredByNamefi3PHostnames()),
];

const resolveAllowedOrigin = async (
  origin: string | null | undefined,
): Promise<string | null> => {
  if (!origin) {
    return null;
  }

  if (config.ALLOW_ALL_ORIGINS) {
    return origin;
  }

  try {
    const parsedOrigin = new URL(origin);
    if (!config.ALLOW_HTTP && parsedOrigin.protocol !== 'https:') {
      return null;
    }

    const allowedHostnames = await getAllowedHostnames();

    if (isHostnameAllowed(parsedOrigin.hostname, allowedHostnames)) {
      return origin;
    }
    return null;
  } catch (error) {
    logger.warn({ error, origin }, 'Failed to parse origin header');
    return null;
  }
};

browserLogsProxyRouter.use(
  '*',
  cors({
    origin: resolveAllowedOrigin,
    allowMethods: ['POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Content-Encoding'],
    credentials: false,
    maxAge: 600,
  }),
);

browserLogsProxyRouter.post('/', async (c) => {
  const origin = c.req.header('origin');
  const allowedOrigin = await resolveAllowedOrigin(origin);
  if (!allowedOrigin) {
    return c.json({ error: 'Origin not allowed' }, 403);
  }

  const ddForward = c.req.query('ddforward');
  if (!ddForward) {
    return c.json({ error: 'Missing ddforward query parameter' }, 400);
  }

  let intakeUrl: URL;
  try {
    intakeUrl = new URL(ddForward, `https://${DATADOG_LOGS_INTAKE_HOST}`);
  } catch {
    return c.json({ error: 'Invalid ddforward query parameter' }, 400);
  }

  if (
    intakeUrl.protocol !== 'https:' ||
    intakeUrl.hostname !== DATADOG_LOGS_INTAKE_HOST ||
    intakeUrl.pathname !== DATADOG_LOGS_INTAKE_PATH
  ) {
    return c.json({ error: 'Unsupported Datadog forward target' }, 400);
  }

  const headers = new Headers();
  const contentType = c.req.header('content-type');
  const contentEncoding = c.req.header('content-encoding');
  const forwardedFor = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();

  if (contentType) {
    headers.set('content-type', contentType);
  }
  if (contentEncoding) {
    headers.set('content-encoding', contentEncoding);
  }
  if (forwardedFor) {
    headers.set('x-forwarded-for', forwardedFor);
  }

  try {
    const body = await c.req.raw.arrayBuffer();
    const intakeResponse = await fetch(intakeUrl.toString(), {
      method: 'POST',
      headers,
      body,
    });

    if (!intakeResponse.ok) {
      logger.warn(
        {
          status: intakeResponse.status,
          statusText: intakeResponse.statusText,
        },
        'Datadog browser logs intake returned non-success status',
      );
    }

    return new Response(null, { status: intakeResponse.status });
  } catch (error) {
    logger.error(
      { error },
      'Failed to proxy browser logs payload to Datadog intake',
    );
    return c.json({ error: 'Failed to proxy logs payload' }, 502);
  }
});

export { browserLogsProxyRouter };
