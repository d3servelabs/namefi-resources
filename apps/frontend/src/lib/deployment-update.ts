/**
 * "Reload after new deployment" detection.
 *
 * Every frontend build inlines its own deploy commit SHA into both the client
 * bundle (`config.DEPLOY_COMMIT_SHA`) and the `/api/build-id` route handler,
 * via `compiler.define` in next.config.mjs. A running client therefore knows
 * the build id it was served with and can poll `/api/build-id` to learn the
 * build id of the deployment currently serving traffic. When the two differ a
 * newer deployment has rolled out and the client should reload to pick it up.
 *
 * App Router adaptation of the Pages Router solution in
 * https://github.com/vercel/next.js/issues/5652#issuecomment-906925942
 * (poll a build-id endpoint, hard-reload when it changes).
 */

/**
 * Sentinel the config schema falls back to when no deploy SHA is available
 * (local dev, or CI env var missing). Treated as "unknown" so the feature stays
 * inert outside real deployments.
 */
export const UNKNOWN_BUILD_ID = 'unknown';

/** Endpoint exposing the build id of the deployment that serves the request. */
export const BUILD_ID_ENDPOINT = '/api/build-id';

/**
 * How often to re-check the serving deployment's build id while the tab is
 * visible. Window-focus/reconnect refetches catch the common "user returns to a
 * long-open tab" case instantly; this interval is the backstop for a tab that
 * stays focused but idle.
 */
export const POLL_INTERVAL_MS = 5 * 60 * 1000;

/** Seconds counted down in the toast before the page reloads automatically. */
export const RELOAD_COUNTDOWN_SECONDS = 10;

/** Stable Sonner id so the update toast is shown at most once at a time. */
export const UPDATE_TOAST_ID = 'deployment-update';

export type BuildIdResponse = {
  buildId: string;
  appVersion?: string;
};

/**
 * A build id is "known" only when it is a non-empty value other than the
 * `unknown` sentinel. Unknown ids never trigger a reload, so local dev (where
 * the SHA is `unknown`) and misconfigured envs are safe no-ops.
 */
export function isKnownBuildId(
  value: string | undefined | null,
): value is string {
  return (
    typeof value === 'string' && value.length > 0 && value !== UNKNOWN_BUILD_ID
  );
}

/**
 * True when the running bundle's build id and the serving deployment's build id
 * are both known and differ — i.e. a newer deployment is live while the user is
 * still on an older one.
 */
export function shouldPromptReload(
  currentBuildId: string | undefined | null,
  latestBuildId: string | undefined | null,
): boolean {
  return (
    isKnownBuildId(currentBuildId) &&
    isKnownBuildId(latestBuildId) &&
    currentBuildId !== latestBuildId
  );
}

/** Fetches the serving deployment's build id, bypassing all caches. */
export async function fetchBuildId(signal?: AbortSignal): Promise<string> {
  const response = await fetch(BUILD_ID_ENDPOINT, {
    cache: 'no-store',
    headers: { accept: 'application/json' },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch build id: ${response.status}`);
  }
  const data = (await response.json()) as BuildIdResponse;
  return data.buildId;
}
