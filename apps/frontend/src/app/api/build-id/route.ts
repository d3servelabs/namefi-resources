import { config } from '@/lib/env';
import { FRONTEND_VERSION_INFO } from '@/lib/version-info';

// `config.DEPLOY_COMMIT_SHA` is inlined per build via `compiler.define`, so each
// deployment's copy of this handler returns its own build id. `force-dynamic`
// plus `no-store` keeps the response uncached, so a polling client always sees
// the build id of the deployment currently serving traffic and can detect when
// a newer one has rolled out.
export const dynamic = 'force-dynamic';

export function GET(): Response {
  return Response.json(
    {
      buildId: config.DEPLOY_COMMIT_SHA,
      appVersion: config.APP_VERSION,
      versionInfo: FRONTEND_VERSION_INFO,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  );
}
