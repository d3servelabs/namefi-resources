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
// idle time, and startup/runtime errors are covered by the capture shims below.

const DATADOG_SERVICE = 'namefi-astra-frontend';
const DATADOG_SITE = 'us5.datadoghq.com';
const REDACTED = 'REDACTED';
const SENSITIVE_QUERY_KEY_PATTERN =
  /(token|secret|pass(word)?|api[_-]?key|session|jwt|auth|code|state)/i;
const OPAQUE_SCRIPT_ERROR_MESSAGE_PATTERN =
  /^(?:uncaught\s+)?"?script error\.?"?$/i;
const OPAQUE_SCRIPT_ERROR_STACK_PATTERN =
  /^Error:\s*Script error\.?\n\s+at undefined @\s*$/i;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object';

const getNestedString = (record: Record<string, unknown>, path: string[]) => {
  let current: unknown = record;
  for (const segment of path) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[segment];
  }
  return typeof current === 'string' ? current : undefined;
};

const isOpaqueScriptErrorMessage = (value: unknown) =>
  typeof value === 'string' &&
  OPAQUE_SCRIPT_ERROR_MESSAGE_PATTERN.test(value.trim());

const isOpaqueScriptErrorStack = (value: unknown) =>
  typeof value === 'string' &&
  OPAQUE_SCRIPT_ERROR_STACK_PATTERN.test(value.trim());

const isOpaqueScriptErrorLog = (event: Record<string, unknown>) => {
  const message = getNestedString(event, ['message']);
  const errorMessage = getNestedString(event, ['error', 'message']);
  const stack = getNestedString(event, ['error', 'stack']);
  return (
    (isOpaqueScriptErrorMessage(message) ||
      isOpaqueScriptErrorMessage(errorMessage)) &&
    (!stack || isOpaqueScriptErrorStack(stack))
  );
};

const tagOpaqueScriptErrorLog = (event: Record<string, unknown>) => {
  if (!isOpaqueScriptErrorLog(event)) {
    return;
  }

  event.opaque_script_error = true;
  event.source_map_symbolication = 'not_possible_opaque_script_error';
};

const isOpaqueScriptErrorEvent = (event: ErrorEvent) => {
  const stack = event.error instanceof Error ? event.error.stack : undefined;
  return (
    isOpaqueScriptErrorMessage(event.message) &&
    (!event.filename || !stack || isOpaqueScriptErrorStack(stack))
  );
};

const createErrorFromUnknown = (
  value: unknown,
  fallbackMessage: string,
): Error => {
  if (value instanceof Error) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    return new Error(value);
  }

  if (value == null) {
    return new Error(fallbackMessage);
  }

  try {
    const serialized = JSON.stringify(value);
    return new Error(
      serialized && serialized !== '{}' ? serialized : String(value),
    );
  } catch {
    return new Error(String(value));
  }
};

const buildErrorEventContext = (
  event: ErrorEvent,
  captureMechanism: string,
): Record<string, unknown> => ({
  capture_mechanism: captureMechanism,
  ...(event.filename ? { filename: redactUrlQueryParams(event.filename) } : {}),
  ...(event.lineno ? { lineno: event.lineno } : {}),
  ...(event.colno ? { colno: event.colno } : {}),
});

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
  tagOpaqueScriptErrorLog(eventRecord);
  return true;
};

type DatadogLogs = typeof import('@datadog/browser-logs')['datadogLogs'];

let datadogLogsPromise: Promise<DatadogLogs | null> | null = null;

// Deferring init means SDK-side forwarding is not active during the window
// between this module being evaluated and the SDK finishing its idle load. Buffer
// uncaught errors, unhandled rejections, and `console.error` / `console.info`
// with near-zero-cost shims, then replay them once the SDK initializes.
type BufferedStartupLog =
  | {
      kind: 'error';
      message: string;
      context: Record<string, unknown>;
      error: Error;
    }
  | {
      kind: 'opaque-script-error';
      message: string;
      context: Record<string, unknown>;
    }
  | { kind: 'console-error'; message: string; error?: Error }
  | { kind: 'console-info'; message: string };

// Bound the buffer so a pre-init log/error storm (or a never-resolving SDK load)
// can never grow memory without limit.
const MAX_BUFFERED_STARTUP_LOGS = 50;

let bufferedStartupLogs: BufferedStartupLog[] = [];
let detachStartupCapture: (() => void) | null = null;
let detachRuntimeErrorCapture: (() => void) | null = null;

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

function findFirstErrorArg(args: unknown[]) {
  return args.find((arg): arg is Error => arg instanceof Error);
}

function captureStartupLogsUntilReady() {
  if (typeof window === 'undefined' || detachStartupCapture) {
    return;
  }

  const push = (entry: BufferedStartupLog) => {
    if (bufferedStartupLogs.length >= MAX_BUFFERED_STARTUP_LOGS) return;
    bufferedStartupLogs.push(entry);
  };
  const pushConsoleLog = (
    kind: 'console-error' | 'console-info',
    args: unknown[],
  ) => {
    if (bufferedStartupLogs.length >= MAX_BUFFERED_STARTUP_LOGS) return;
    const message = formatConsoleArgs(args);
    if (kind === 'console-error') {
      const error = findFirstErrorArg(args);
      push({
        kind,
        message,
        ...(error ? { error } : {}),
      });
    } else {
      push({ kind, message });
    }
  };

  const handleError = (event: ErrorEvent) => {
    if (isOpaqueScriptErrorEvent(event)) {
      push({
        kind: 'opaque-script-error',
        message: 'Uncaught "Script error." before Datadog init',
        context: {
          ...buildErrorEventContext(event, 'window.error'),
          opaque_script_error: true,
          source_map_symbolication: 'not_possible_opaque_script_error',
        },
      });
      return;
    }

    push({
      kind: 'error',
      message: 'Uncaught error before Datadog init',
      context: {
        ...buildErrorEventContext(event, 'window.error'),
        runtime_error_capture: 'startup_logger_replay',
      },
      error: createErrorFromUnknown(
        event.error,
        event.message || 'Uncaught error',
      ),
    });
  };
  const handleRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    push({
      kind: 'error',
      message: 'Unhandled promise rejection before Datadog init',
      context: {
        capture_mechanism: 'window.unhandledrejection',
        runtime_error_capture: 'startup_logger_replay',
        ...(reason instanceof Error
          ? {}
          : { nonErrorRejection: true, reasonType: typeof reason }),
      },
      error: createErrorFromUnknown(reason, 'Unhandled promise rejection'),
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
    pushConsoleLog('console-error', args);
    originalConsoleError(...args);
  };
  console.info = (...args: unknown[]) => {
    pushConsoleLog('console-info', args);
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
    } else if (entry.kind === 'opaque-script-error') {
      datadogLogs.logger.error(entry.message, entry.context);
    } else if (entry.kind === 'console-error') {
      datadogLogs.logger.error(
        entry.message,
        { capture_mechanism: 'console.error' },
        entry.error,
      );
    } else {
      datadogLogs.logger.info(entry.message, {
        capture_mechanism: 'console.info',
      });
    }
  }
}

function startRuntimeErrorCapture(datadogLogs: DatadogLogs) {
  if (typeof window === 'undefined' || detachRuntimeErrorCapture) {
    return;
  }

  const handleError = (event: ErrorEvent) => {
    if (isOpaqueScriptErrorEvent(event)) {
      // Keep Datadog's source-origin event for opaque script errors. It cannot
      // be symbolicated, but its volume and timing are still useful signal.
      return;
    }

    datadogLogs.logger.error(
      'Uncaught runtime error',
      {
        ...buildErrorEventContext(event, 'window.error'),
        duplicates_sdk_forwarded_error: true,
        runtime_error_capture: 'logger_error_object',
      },
      createErrorFromUnknown(event.error, event.message || 'Uncaught error'),
    );
  };

  const handleRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    datadogLogs.logger.error(
      'Unhandled promise rejection',
      {
        capture_mechanism: 'window.unhandledrejection',
        duplicates_sdk_forwarded_error: true,
        runtime_error_capture: 'logger_error_object',
        ...(reason instanceof Error
          ? {}
          : { nonErrorRejection: true, reasonType: typeof reason }),
      },
      createErrorFromUnknown(reason, 'Unhandled promise rejection'),
    );
  };

  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleRejection);

  detachRuntimeErrorCapture = () => {
    window.removeEventListener('error', handleError);
    window.removeEventListener('unhandledrejection', handleRejection);
    detachRuntimeErrorCapture = null;
  };
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
        // Keep Datadog's native source/network forwarding. The runtime listener
        // adds tagged companion logger events with original Error objects.
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
      // Replay startup errors through the logger path, then use the same path
      // for runtime errors so Datadog receives the original Error object.
      startRuntimeErrorCapture(datadogLogs);
      flushStartupCapture(datadogLogs);
      flushPerfBuffer(datadogLogs);
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

// Perf measures (`@/lib/perf`) must NOT eagerly init Datadog: forcing the SDK
// import/init pulls it onto the exact hydration/interaction window they measure,
// biasing `sidebar.activate` / `signin.*` on sampled sessions. Instead buffer
// them and flush once the (already idle-scheduled) init — or any error-triggered
// load — completes. The values were captured at measure time, so a delayed flush
// reports the same numbers.
const MAX_BUFFERED_PERF_LOGS = 100;
let bufferedPerfLogs: Array<{
  message: string;
  context: Record<string, unknown>;
}> = [];
let readyDatadogLogs: DatadogLogs | null = null;

function flushPerfBuffer(datadogLogs: DatadogLogs) {
  readyDatadogLogs = datadogLogs;
  const buffered = bufferedPerfLogs;
  bufferedPerfLogs = [];
  for (const entry of buffered) {
    datadogLogs.logger.info(entry.message, entry.context);
  }
}

/**
 * Record a perf measure (`@/lib/perf`) for Datadog WITHOUT forcing an eager SDK
 * load. If init has already completed, log immediately; otherwise buffer
 * (bounded) until the idle-scheduled init drains it — so sampled instrumentation
 * never competes with the first-paint/hydration work it is measuring.
 * Synchronous and fire-and-forget.
 */
export function logDatadogPerf(
  message: string,
  context: Record<string, unknown>,
) {
  try {
    if (readyDatadogLogs) {
      readyDatadogLogs.logger.info(message, context);
      return;
    }
    if (bufferedPerfLogs.length < MAX_BUFFERED_PERF_LOGS) {
      bufferedPerfLogs.push({ message, context });
    }
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
