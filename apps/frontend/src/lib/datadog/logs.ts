import { config } from '@/lib/env';
import type { LogsEvent } from '@datadog/browser-logs';

// Shared, lazily-loaded Datadog browser-logs client.
//
// `@datadog/browser-logs` is ~50KB and was previously imported eagerly (and
// `init()`-ed synchronously at module scope) from the tRPC provider and the
// React error-boundary helper that the always-mounted sidebar pulls in. That
// forced the SDK onto the homepage's hydration critical path, delaying
// time-to-interactive for the app shell (sidebar, search, sign-in).
//
// Everything now routes through this module, which imports the SDK on demand and
// initializes it once on idle (off the critical path). Observability is
// unchanged functionally; only the *timing* of initialization moves to browser
// idle time, and the startup window is covered by the capture shims below.

const DATADOG_SERVICE = 'namefi-astra-frontend';
const DATADOG_SITE = 'us5.datadoghq.com';
const REDACTED = 'REDACTED';
const SENSITIVE_QUERY_KEY_PATTERN =
  /(token|secret|pass(word)?|api[_-]?key|session|jwt|auth|code|state)/i;

const redactUrlQueryParams = (value: string) => {
  if (!value || !value.includes('?')) {
    return value;
  }

  try {
    const origin =
      typeof location === 'undefined'
        ? 'https://namefi.invalid'
        : location.origin;
    const parsed = new URL(value, origin);
    let changed = false;

    for (const [key] of parsed.searchParams) {
      if (SENSITIVE_QUERY_KEY_PATTERN.test(key)) {
        parsed.searchParams.set(key, REDACTED);
        changed = true;
      }
    }

    if (!changed) {
      return value;
    }

    const isAbsoluteHttpUrl = /^https?:\/\//i.test(value);
    if (isAbsoluteHttpUrl) {
      return parsed.toString();
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return value;
  }
};

const redactEventUrlFields = (event: Record<string, unknown>) => {
  const redactField = (path: string[]) => {
    let current = event;
    for (const segment of path.slice(0, -1)) {
      const next = current[segment];
      if (!next || typeof next !== 'object') {
        return;
      }
      current = next as Record<string, unknown>;
    }

    const last = path[path.length - 1];
    const currentValue = current[last];
    if (typeof currentValue === 'string') {
      current[last] = redactUrlQueryParams(currentValue);
    }
  };

  redactField(['view', 'url']);
  redactField(['view', 'referrer']);
  redactField(['resource', 'url']);
  redactField(['http', 'url']);
  redactField(['error', 'resource', 'url']);
};

const beforeSendLogs = (event: LogsEvent) => {
  const eventRecord = event as Record<string, unknown>;
  redactEventUrlFields(eventRecord);
  return true;
};

type DatadogLogs = typeof import('@datadog/browser-logs')['datadogLogs'];

let datadogLogsPromise: Promise<DatadogLogs | null> | null = null;

// Deferring init means `forwardErrorsToLogs` / `forwardConsoleLogs` (which only
// attach their global handlers inside `datadogLogs.init()`) are not active during
// the window between this module being evaluated and the SDK finishing its idle
// load. To preserve parity with the previous eager init, mirror that capture for
// the startup window: buffer uncaught errors, unhandled rejections, and
// `console.error` / `console.info` with near-zero-cost shims, then replay them
// once the SDK initializes and hand off to Datadog's own handlers.
type BufferedStartupLog =
  | {
      kind: 'error';
      message: string;
      context: Record<string, unknown>;
      error: Error;
    }
  | { kind: 'console-error' | 'console-info'; message: string };

// Bound the buffer so a pre-init log/error storm (or a never-resolving SDK load)
// can never grow memory without limit.
const MAX_BUFFERED_STARTUP_LOGS = 50;

let bufferedStartupLogs: BufferedStartupLog[] = [];
let detachStartupCapture: (() => void) | null = null;

function formatConsoleArgs(args: unknown[]): string {
  return args
    .map((arg) => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(' ');
}

function captureStartupLogsUntilReady() {
  if (typeof window === 'undefined' || detachStartupCapture) {
    return;
  }

  const push = (entry: BufferedStartupLog) => {
    if (bufferedStartupLogs.length >= MAX_BUFFERED_STARTUP_LOGS) return;
    bufferedStartupLogs.push(entry);
  };

  const handleError = (event: ErrorEvent) => {
    push({
      kind: 'error',
      message: 'Uncaught error before Datadog init',
      context: { source: 'window.error', filename: event.filename },
      error:
        event.error instanceof Error
          ? event.error
          : new Error(event.message || 'Uncaught error'),
    });
  };
  const handleRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    push({
      kind: 'error',
      message: 'Unhandled promise rejection before Datadog init',
      context: { source: 'window.unhandledrejection' },
      error: reason instanceof Error ? reason : new Error(String(reason)),
    });
  };

  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleRejection);

  // Mirror `forwardConsoleLogs: ['error', 'info']` for the pre-init window. The
  // shims still delegate to the originals (the dev console is unaffected), and
  // `detachStartupCapture` restores them BEFORE `datadogLogs.init()` runs, so the
  // SDK instruments a pristine console rather than wrapping our shim.
  const originalConsoleError = console.error;
  const originalConsoleInfo = console.info;
  console.error = (...args: unknown[]) => {
    push({ kind: 'console-error', message: formatConsoleArgs(args) });
    originalConsoleError(...args);
  };
  console.info = (...args: unknown[]) => {
    push({ kind: 'console-info', message: formatConsoleArgs(args) });
    originalConsoleInfo(...args);
  };

  detachStartupCapture = () => {
    window.removeEventListener('error', handleError);
    window.removeEventListener('unhandledrejection', handleRejection);
    console.error = originalConsoleError;
    console.info = originalConsoleInfo;
    detachStartupCapture = null;
  };
}

/** Restore the shims/listeners and discard anything buffered (no replay). */
function discardStartupCapture() {
  detachStartupCapture?.();
  bufferedStartupLogs = [];
}

/** Restore the shims/listeners, then replay everything buffered into Datadog. */
function flushStartupCapture(datadogLogs: DatadogLogs) {
  detachStartupCapture?.();
  const buffered = bufferedStartupLogs;
  bufferedStartupLogs = [];
  for (const entry of buffered) {
    if (entry.kind === 'error') {
      datadogLogs.logger.error(entry.message, entry.context, entry.error);
    } else if (entry.kind === 'console-error') {
      datadogLogs.logger.error(entry.message, { source: 'console.error' });
    } else {
      datadogLogs.logger.info(entry.message, { source: 'console.info' });
    }
  }
}

/**
 * Lazily import and initialize `@datadog/browser-logs` exactly once. Resolves to
 * `null` when no client token is configured or the dynamic import fails, so
 * callers can no-op safely. Subsequent calls reuse the in-flight/settled promise.
 */
function loadDatadogLogs(): Promise<DatadogLogs | null> {
  datadogLogsPromise ??= (async () => {
    const clientToken = config.DATADOG_LOGS_CLIENT_TOKEN;
    if (!clientToken) {
      // Nothing will consume the buffer; restore shims and drop it.
      discardStartupCapture();
      return null;
    }

    try {
      const { datadogLogs } = await import('@datadog/browser-logs');
      // Restore the console/listeners BEFORE init so Datadog instruments a
      // pristine console instead of wrapping our startup shims.
      detachStartupCapture?.();
      datadogLogs.init({
        clientToken,
        site: DATADOG_SITE,
        service: DATADOG_SERVICE,
        env: process.env.VERCEL_TARGET_ENV?.trim(),
        version: config.DEPLOY_COMMIT_SHA,
        proxy: `${config.BACKEND_URL}/client-events`,
        silentMultipleInit: true,
        forwardErrorsToLogs: true,
        forwardConsoleLogs: ['error', 'info'],
        sessionSampleRate: config.DATADOG_LOGS_SESSION_SAMPLE_RATE,
        beforeSend: beforeSendLogs,
      });
      datadogLogs.setGlobalContextProperty('appVersion', config.APP_VERSION);
      datadogLogs.setGlobalContextProperty(
        'deployCommitSha',
        config.DEPLOY_COMMIT_SHA,
      );
      // Replay anything captured before init; Datadog's own handlers cover the
      // rest of the session.
      flushStartupCapture(datadogLogs);
      return datadogLogs;
    } catch {
      // SDK failed to load/init: the startup window is effectively over, so
      // restore the shims and drop the buffer (otherwise every later log would
      // accumulate forever). Reset the promise so a later call can retry.
      discardStartupCapture();
      datadogLogsPromise = null;
      return null;
    }
  })();

  return datadogLogsPromise;
}

/**
 * Schedule Datadog logs initialization during browser idle time so the SDK never
 * competes with first-paint/hydration work. No-op on the server.
 */
function scheduleDatadogIdleLoad() {
  if (typeof window === 'undefined') {
    return;
  }

  const start = () => {
    void loadDatadogLogs();
  };

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(start, { timeout: 3000 });
  } else {
    // No requestIdleCallback (older Safari): a ~1ms timeout would fire right
    // after the current task and pull init back toward the hydration hot path,
    // so use a real delay that keeps the SDK off the critical path.
    window.setTimeout(start, 2000);
  }
}

/**
 * Log an error to Datadog, lazily loading (and initializing, if needed) the SDK.
 * Fire-and-forget friendly: callers may `void` the returned promise.
 */
export async function logDatadogError(
  message: string,
  context: Record<string, unknown>,
  error: Error,
) {
  try {
    const datadogLogs = await loadDatadogLogs();
    datadogLogs?.logger.error(message, context, error);
  } catch {
    // Never let observability failures surface to fire-and-forget callers.
  }
}

// Wire everything up at module-evaluation time. This module is in the eager
// client bundle (imported by the tRPC provider and the React error-boundary
// helper), so this runs during client bundle evaluation — before React commits
// passive effects. Doing it here, rather than from a component's useEffect,
// means:
//   1. the cheap capture shims are live from the earliest possible moment, and
//   2. the (deferred, idle) SDK load is scheduled even if hydration aborts
//      before effects run, so a pre-effect crash still flushes the buffer.
// The heavy `@datadog/browser-logs` import itself still happens later, on idle.
captureStartupLogsUntilReady();
scheduleDatadogIdleLoad();
