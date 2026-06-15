import { config } from '@/lib/env';
import { getRegisteredAuthToken } from '@/lib/auth-token-supplier';
import { isSkipAuthActiveInBrowser } from '@/lib/skip-auth';
import {
  BROWSER_FINGERPRINT_HEADER,
  C15T_MEASUREMENT_CONSENT_HEADER,
  GA_CLIENT_ID_HEADER,
  GA_SESSION_ID_HEADER,
  normalizeGaClientId,
  normalizeGaSessionId,
  parseGaClientIdFromCookieValue,
  parseGaSessionIdFromCookieValue,
} from '@namefi-astra/common/google-analytics';
import {
  PRIVY_ID_TOKEN_COOKIE_NAME,
  PRIVY_ID_TOKEN_HEADER,
} from '@namefi-astra/common/auth-session';

const GA_MEASUREMENT_ID_PREFIX_REGEX = /^G-/;

export const TRPC_INCLUDE_PRIVY_ID_TOKEN_CONTEXT_KEY = 'includePrivyIdToken';

type TrpcOperationLike = {
  context?: Record<string, unknown>;
};

export type TrpcHeaderSource = {
  op?: TrpcOperationLike;
  opList?: readonly TrpcOperationLike[];
};

type MeasurementConsentHeader = 'granted' | 'denied' | null;

type TrpcRequestHeaderDependencies = {
  getAuthToken: () => Promise<string | null>;
  getPrivyIdToken: () => Promise<string | null>;
  getBrowserFingerprint: () => Promise<string | null>;
  getGoogleAnalyticsClientId: () => Promise<string | null>;
  getGoogleAnalyticsSessionId: () => Promise<string | null>;
  getMeasurementConsentHeader: () => MeasurementConsentHeader;
  isSkipAuthActive?: () => boolean;
};

export function shouldIncludePrivyIdTokenHeaders(
  source: TrpcHeaderSource | undefined,
): boolean {
  const operations = source?.opList ?? (source?.op ? [source.op] : []);
  return operations.some(
    (operation) =>
      operation.context?.[TRPC_INCLUDE_PRIVY_ID_TOKEN_CONTEXT_KEY] === true,
  );
}

export async function getTrpcRequestHeaders(
  source?: TrpcHeaderSource,
): Promise<Record<string, string>> {
  const includePrivyIdToken = shouldIncludePrivyIdTokenHeaders(source);
  return getTrpcRequestHeadersWithDependencies(
    {
      includeAuthToken: true,
      includeClientSignals: true,
      includePrivyIdToken,
    },
    browserHeaderDependencies,
  );
}

export async function getAuthOnlyTrpcRequestHeaders(): Promise<
  Record<string, string>
> {
  return getTrpcRequestHeadersWithDependencies(
    {
      includeAuthToken: true,
      includeClientSignals: false,
      includePrivyIdToken: false,
    },
    browserHeaderDependencies,
  );
}

export async function getTrpcRequestHeadersWithDependencies(
  options: {
    includeAuthToken: boolean;
    includeClientSignals: boolean;
    includePrivyIdToken: boolean;
  },
  dependencies: TrpcRequestHeaderDependencies,
): Promise<Record<string, string>> {
  const measurementConsentHeader = dependencies.getMeasurementConsentHeader();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const isSkipAuthActive =
    dependencies.isSkipAuthActive?.() ?? isSkipAuthActiveInBrowser();
  if (isSkipAuthActive) {
    headers['X-Skip-Auth'] = '1';
    if (measurementConsentHeader) {
      headers[C15T_MEASUREMENT_CONSENT_HEADER] = measurementConsentHeader;
    }
    return headers;
  }

  const [token, fingerprint, gaClientId, gaSessionId] =
    options.includeClientSignals
      ? await Promise.all([
          dependencies.getAuthToken(),
          dependencies.getBrowserFingerprint(),
          dependencies.getGoogleAnalyticsClientId(),
          dependencies.getGoogleAnalyticsSessionId(),
        ])
      : options.includeAuthToken
        ? [await dependencies.getAuthToken(), null, null, null]
        : [null, null, null, null];
  const privyIdToken =
    token && options.includePrivyIdToken
      ? await dependencies.getPrivyIdToken()
      : null;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (privyIdToken) {
    headers[PRIVY_ID_TOKEN_HEADER] = privyIdToken;
  }
  if (measurementConsentHeader) {
    headers[C15T_MEASUREMENT_CONSENT_HEADER] = measurementConsentHeader;
  }
  if (fingerprint) headers[BROWSER_FINGERPRINT_HEADER] = fingerprint;
  if (gaClientId) headers[GA_CLIENT_ID_HEADER] = gaClientId;
  if (gaSessionId) headers[GA_SESSION_ID_HEADER] = gaSessionId;
  return headers;
}

async function getAuthHeaderToken(): Promise<string | null> {
  return getRegisteredAuthToken().catch(() => null);
}

// Lazy-loaded, cached browser fingerprint. The visitorId is a stable hash of
// hardware/software signals that lets the backend recognize a returning
// browser even when the user is on a brand-new IP / location. We dynamically
// import FingerprintJS so the library stays out of the first-paint bundle, and
// cache the resolved id in a module-level promise so every later enriched tRPC
// request reuses the same value. On failure, backend treats the missing header
// as "no signal."
let fingerprintPromise: Promise<string | null> | null = null;
async function getBrowserFingerprint(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!fingerprintPromise) {
    fingerprintPromise = (async () => {
      try {
        const FingerprintJs = await import('@fingerprintjs/fingerprintjs');
        const fp = await FingerprintJs.load();
        const result = await fp.get();
        return result.visitorId;
      } catch {
        return null;
      }
    })();
  }
  return fingerprintPromise;
}

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const cookie = document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`));

  const cookieValue = cookie?.split('=').slice(1).join('=');
  if (!cookieValue) return null;

  try {
    return decodeURIComponent(cookieValue);
  } catch {
    return null;
  }
}

function parseGaClientIdFromCookie(): string | null {
  return parseGaClientIdFromCookieValue(getCookieValue('_ga'));
}

function parseGaSessionIdFromCookie(): string | null {
  if (!config.GA_MEASUREMENT_ID) return null;

  const measurementIdSuffix = config.GA_MEASUREMENT_ID.replace(
    GA_MEASUREMENT_ID_PREFIX_REGEX,
    '',
  );
  return parseGaSessionIdFromCookieValue(
    getCookieValue(`_ga_${measurementIdSuffix}`),
  );
}

let cachedGaClientId: string | null = null;
let gaClientIdPromise: Promise<string | null> | null = null;
let cachedGaSessionId: string | null = null;
let gaSessionIdPromise: Promise<string | null> | null = null;
function hasGoogleAnalyticsMeasurementConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return getGoogleAnalyticsMeasurementConsentHeaderValue() === 'granted';
}

function getGoogleAnalyticsMeasurementConsentHeaderValue():
  | 'granted'
  | 'denied'
  | null {
  if (typeof window === 'undefined') return null;
  const measurementConsent = (
    window as typeof window & { namefiMeasurementConsent?: boolean }
  ).namefiMeasurementConsent;

  if (measurementConsent === true) return 'granted';
  if (measurementConsent === false) return 'denied';
  return null;
}

async function getGoogleAnalyticsClientId(): Promise<string | null> {
  if (typeof window === 'undefined' || !config.GA_MEASUREMENT_ID) return null;
  if (!hasGoogleAnalyticsMeasurementConsent()) {
    cachedGaClientId = null;
    return null;
  }
  if (cachedGaClientId) return cachedGaClientId;

  const cookieClientId = parseGaClientIdFromCookie();
  if (cookieClientId) {
    cachedGaClientId = cookieClientId;
    return cookieClientId;
  }

  if (!gaClientIdPromise) {
    gaClientIdPromise = new Promise<string | null>((resolve) => {
      let settled = false;
      const finish = (clientId: string | null) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(fallbackTimer);
        const resolvedClientId = hasGoogleAnalyticsMeasurementConsent()
          ? clientId
          : null;
        cachedGaClientId = resolvedClientId;
        resolve(resolvedClientId);
      };

      const fallbackTimer = window.setTimeout(() => {
        finish(parseGaClientIdFromCookie());
      }, 250);

      const gtag = window.gtag;
      if (!gtag) {
        finish(parseGaClientIdFromCookie());
        return;
      }

      gtag('get', config.GA_MEASUREMENT_ID, 'client_id', (clientId: unknown) =>
        finish(
          typeof clientId === 'string'
            ? (normalizeGaClientId(clientId) ?? parseGaClientIdFromCookie())
            : parseGaClientIdFromCookie(),
        ),
      );
    }).finally(() => {
      gaClientIdPromise = null;
    });
  }

  return gaClientIdPromise;
}

async function getGoogleAnalyticsSessionId(): Promise<string | null> {
  if (typeof window === 'undefined' || !config.GA_MEASUREMENT_ID) return null;
  if (!hasGoogleAnalyticsMeasurementConsent()) {
    cachedGaSessionId = null;
    gaSessionIdPromise = null;
    return null;
  }

  const cookieSessionId = parseGaSessionIdFromCookie();
  if (cookieSessionId) {
    cachedGaSessionId = cookieSessionId;
    return cookieSessionId;
  }
  if (cachedGaSessionId) return cachedGaSessionId;

  if (!gaSessionIdPromise) {
    gaSessionIdPromise = new Promise<string | null>((resolve) => {
      let settled = false;
      const finish = (sessionId: string | null) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(fallbackTimer);
        const resolvedSessionId = hasGoogleAnalyticsMeasurementConsent()
          ? normalizeGaSessionId(sessionId)
          : null;
        cachedGaSessionId = resolvedSessionId;
        resolve(resolvedSessionId);
      };

      const fallbackTimer = window.setTimeout(() => {
        finish(parseGaSessionIdFromCookie());
      }, 250);

      const gtag = window.gtag;
      if (!gtag) {
        finish(parseGaSessionIdFromCookie());
        return;
      }

      gtag(
        'get',
        config.GA_MEASUREMENT_ID,
        'session_id',
        (sessionId: unknown) =>
          finish(
            typeof sessionId === 'string' || typeof sessionId === 'number'
              ? (normalizeGaSessionId(sessionId) ??
                  parseGaSessionIdFromCookie())
              : parseGaSessionIdFromCookie(),
          ),
      );
    }).finally(() => {
      gaSessionIdPromise = null;
    });
  }

  return gaSessionIdPromise;
}

const browserHeaderDependencies: TrpcRequestHeaderDependencies = {
  getAuthToken: getAuthHeaderToken,
  getPrivyIdToken: () =>
    Promise.resolve(getCookieValue(PRIVY_ID_TOKEN_COOKIE_NAME)),
  getBrowserFingerprint,
  getGoogleAnalyticsClientId,
  getGoogleAnalyticsSessionId,
  getMeasurementConsentHeader: getGoogleAnalyticsMeasurementConsentHeaderValue,
  isSkipAuthActive: isSkipAuthActiveInBrowser,
};
