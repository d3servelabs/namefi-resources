import { describe, expect, it, vi } from 'vitest';
import {
  buildGoogleAnalyticsBootstrapScript,
  buildC15tInitHeaders,
  fetchC15tInitData,
  getC15tMeasurementConsentState,
  mergeC15tMeasurementConsentStates,
  normalizeGaClientId,
  normalizeGaSessionId,
  parseC15tMeasurementConsentHeader,
  parseC15tConsentCookie,
  parseGaClientIdFromCookieValue,
  parseGaSessionIdFromCookieValue,
  resolveInitialMeasurementConsent,
} from './google-analytics';

describe('google analytics helpers', () => {
  it('accepts a raw GA client id', () => {
    expect(normalizeGaClientId('123.456')).toBe('123.456');
  });

  it('extracts a GA client id from the _ga cookie value', () => {
    expect(parseGaClientIdFromCookieValue('GA1.1.123.456')).toBe('123.456');
  });

  it('rejects invalid GA client ids', () => {
    expect(normalizeGaClientId('0.456')).toBeNull();
    expect(normalizeGaClientId('123')).toBeNull();
    expect(normalizeGaClientId('abc.def')).toBeNull();
    expect(parseGaClientIdFromCookieValue('GA1.1.bad.456')).toBeNull();
  });

  it('extracts a GA4 GS2 session id from the session cookie value', () => {
    expect(
      parseGaSessionIdFromCookieValue(
        'GS2.1.s1716012345$o1$g0$t1716012399$j0$l0$h123',
      ),
    ).toBe('1716012345');
  });

  it('extracts a legacy GA4 session id from the session cookie value', () => {
    expect(
      parseGaSessionIdFromCookieValue('GS1.1.1716012345.1.1.1716012399.0.0.0'),
    ).toBe('1716012345');
  });

  it('normalizes raw session ids and rejects unsafe values', () => {
    expect(normalizeGaSessionId('1716012345')).toBe('1716012345');
    expect(normalizeGaSessionId('0')).toBeNull();
    expect(normalizeGaSessionId('1.5')).toBeNull();
    expect(normalizeGaSessionId('999999999999999999999')).toBeNull();
  });

  it('parses compact c15t consent cookies', () => {
    expect(
      parseC15tConsentCookie('c.necessary:1,c.measurement:1,i.t:1716012345')
        ?.consents.measurement,
    ).toBe(true);
    expect(
      parseC15tConsentCookie('c.necessary:1,i.t:1716012345')?.consents
        .measurement,
    ).toBe(false);
  });

  it('resolves c15t measurement consent state from compact cookies', () => {
    expect(
      getC15tMeasurementConsentState(
        'c.necessary:1,c.measurement:1,i.t:1716012345',
      ),
    ).toBe('granted');
    expect(getC15tMeasurementConsentState('c.necessary:1')).toBe('denied');
    expect(getC15tMeasurementConsentState(undefined)).toBe('unknown');
  });

  it('parses and merges c15t measurement consent header state', () => {
    expect(parseC15tMeasurementConsentHeader('granted')).toBe('granted');
    expect(parseC15tMeasurementConsentHeader(' denied ')).toBe('denied');
    expect(parseC15tMeasurementConsentHeader('unknown')).toBe('unknown');

    expect(mergeC15tMeasurementConsentStates('unknown', 'granted')).toBe(
      'granted',
    );
    expect(mergeC15tMeasurementConsentStates('granted', 'denied')).toBe(
      'denied',
    );
    expect(mergeC15tMeasurementConsentStates('unknown', 'unknown')).toBe(
      'unknown',
    );
  });

  it('resolves initial measurement consent from stored consent before policy defaults', () => {
    expect(
      resolveInitialMeasurementConsent({
        consentCookieValue: 'c.necessary:1',
        initData: {
          jurisdiction: 'NONE',
          policy: { model: 'none', ui: { mode: 'none' } },
        },
      }),
    ).toBe(false);

    expect(
      resolveInitialMeasurementConsent({
        consentCookieValue: 'c.necessary:1,c.measurement:1',
        initData: {
          jurisdiction: 'GDPR',
          policy: { model: 'opt-in', ui: { mode: 'banner' } },
        },
      }),
    ).toBe(true);
  });

  it('auto-grants measurement for permissive c15t runtime policies', () => {
    expect(
      resolveInitialMeasurementConsent({
        initData: {
          jurisdiction: 'NONE',
          policy: { model: 'none', ui: { mode: 'none' } },
        },
      }),
    ).toBe(true);

    expect(
      resolveInitialMeasurementConsent({
        initData: {
          jurisdiction: 'CCPA',
          policy: { model: 'opt-out', ui: { mode: 'none' } },
        },
      }),
    ).toBe(true);

    expect(
      resolveInitialMeasurementConsent({
        initData: {
          jurisdiction: 'CCPA',
          policy: { model: 'opt-out', ui: { mode: 'none' } },
        },
        requestHasGlobalPrivacyControl: true,
      }),
    ).toBe(false);

    expect(
      resolveInitialMeasurementConsent({
        initData: {
          jurisdiction: 'GDPR',
          policy: { model: 'opt-in', ui: { mode: 'banner' } },
        },
      }),
    ).toBe(false);
  });

  it('builds c15t init headers from proxy geo headers', () => {
    const headers = buildC15tInitHeaders(
      new Headers({
        'x-client-geo-location-region': 'US',
        'x-client-geo-location-region-subdivision': 'USCA',
        'accept-language': 'en-US,en;q=0.9',
        'sec-gpc': '1',
      }),
    );

    expect(headers?.get('x-c15t-country')).toBe('US');
    expect(headers?.get('x-c15t-region')).toBe('USCA');
    expect(headers?.get('accept-language')).toBe('en-US,en;q=0.9');
    expect(headers?.get('sec-gpc')).toBe('1');
  });

  it('fetches and validates initial c15t init data', async () => {
    const fetcher = vi.fn(async () =>
      Response.json({
        jurisdiction: 'NONE',
        policy: { model: 'none', ui: { mode: 'none' } },
      }),
    );

    await expect(
      fetchC15tInitData({
        backendUrl: 'https://api.example.test',
        requestHeaders: new Headers({
          'x-client-geo-location-region': 'US',
        }),
        fetcher,
      }),
    ).resolves.toEqual({
      jurisdiction: 'NONE',
      policy: { model: 'none', ui: { mode: 'none' } },
    });

    expect(fetcher).toHaveBeenCalledWith(
      'https://api.example.test/c15t/init',
      expect.objectContaining({
        method: 'GET',
        cache: 'no-store',
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it('aborts initial c15t init fetches after the configured timeout', async () => {
    vi.useFakeTimers();
    try {
      const onError = vi.fn();
      const fetcher = vi.fn(
        (_url: RequestInfo | URL, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              reject(new DOMException('aborted', 'AbortError'));
            });
          }),
      ) as typeof fetch;

      const resultPromise = fetchC15tInitData({
        backendUrl: 'https://api.example.test',
        requestHeaders: new Headers({
          'x-client-geo-location-region': 'US',
        }),
        fetcher,
        timeoutMs: 10,
        onError,
      });

      await vi.advanceTimersByTimeAsync(10);

      await expect(resultPromise).resolves.toBeNull();
      expect(onError).toHaveBeenCalledWith(expect.any(DOMException));
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not fetch initial c15t init data without relevant request headers', async () => {
    const fetcher = vi.fn();

    await expect(
      fetchC15tInitData({
        backendUrl: 'https://api.example.test',
        requestHeaders: new Headers(),
        fetcher,
      }),
    ).resolves.toBeNull();

    expect(fetcher).not.toHaveBeenCalled();
  });

  it('ignores malformed initial c15t init data', async () => {
    const fetcher = vi.fn(async () => Response.json({ jurisdiction: 123 }));

    await expect(
      fetchC15tInitData({
        backendUrl: 'https://api.example.test',
        requestHeaders: new Headers({
          'x-client-geo-location-region': 'US',
        }),
        fetcher,
      }),
    ).resolves.toBeNull();
  });

  it('updates GA consent from c15t prefetch for grant-by-default policies', async () => {
    const script = buildGoogleAnalyticsBootstrapScript({
      measurementId: 'G-TEST',
      measurementGranted: false,
      originType: 'first_party',
      originDomain: 'namefi.test',
      debugMode: false,
      exposeMeasurementConsent: true,
      c15tPrefetchBackendUrl: '/api/c15t',
    });
    const windowMock = createGoogleAnalyticsWindowMock({
      gpc: false,
      initData: {
        jurisdiction: 'NONE',
        policy: { model: 'none', ui: { mode: 'none' } },
      },
    });

    runGoogleAnalyticsBootstrapScript(script, windowMock);
    await Promise.resolve();

    expect(windowMock.namefiMeasurementConsent).toBe(true);
    expect(getGoogleAnalyticsCalls(windowMock)).toContainEqual([
      'consent',
      'update',
      expect.objectContaining({ analytics_storage: 'granted' }),
    ]);
  });

  it('installs the pre-consent analytics queue in the bootstrap script', () => {
    const script = buildGoogleAnalyticsBootstrapScript({
      measurementId: 'G-TEST',
      measurementGranted: false,
      originType: 'first_party',
      originDomain: 'namefi.test',
      debugMode: false,
      exposeMeasurementConsent: true,
    });
    const windowMock = createGoogleAnalyticsWindowMock({
      gpc: false,
      initData: {
        jurisdiction: 'NONE',
        policy: { model: 'none', ui: { mode: 'none' } },
      },
    });

    runGoogleAnalyticsBootstrapScript(script, windowMock);
    windowMock.namefiQueuePreConsentAnalyticsEvent?.('add_to_cart', {
      value: 12,
    });
    windowMock.namefiFlushPreConsentAnalyticsQueue?.();

    expect(getGoogleAnalyticsCalls(windowMock)).toContainEqual([
      'event',
      'add_to_cart',
      { value: 12 },
    ]);
  });

  it('flushes queued analytics events when c15t prefetch grants measurement', async () => {
    const script = buildGoogleAnalyticsBootstrapScript({
      measurementId: 'G-TEST',
      measurementGranted: false,
      originType: 'first_party',
      originDomain: 'namefi.test',
      debugMode: false,
      exposeMeasurementConsent: true,
      c15tPrefetchBackendUrl: '/api/c15t',
    });
    const windowMock = createGoogleAnalyticsWindowMock({
      gpc: false,
      initData: {
        jurisdiction: 'NONE',
        policy: { model: 'none', ui: { mode: 'none' } },
      },
    });

    runGoogleAnalyticsBootstrapScript(script, windowMock);
    windowMock.namefiQueuePreConsentAnalyticsEvent?.('begin_checkout', {
      value: 20,
    });
    await Promise.resolve();

    expect(getGoogleAnalyticsCalls(windowMock)).toContainEqual([
      'event',
      'begin_checkout',
      { value: 20 },
    ]);
    expect(windowMock.namefiPreConsentAnalyticsQueue).toEqual([]);
  });

  it('keeps GA denied when c15t prefetch reports Global Privacy Control', async () => {
    const script = buildGoogleAnalyticsBootstrapScript({
      measurementId: 'G-TEST',
      measurementGranted: false,
      originType: 'first_party',
      originDomain: 'namefi.test',
      debugMode: false,
      exposeMeasurementConsent: true,
      c15tPrefetchBackendUrl: '/api/c15t',
    });
    const windowMock = createGoogleAnalyticsWindowMock({
      gpc: true,
      initData: {
        jurisdiction: 'CCPA',
        policy: { model: 'opt-out', ui: { mode: 'none' } },
      },
    });

    runGoogleAnalyticsBootstrapScript(script, windowMock);
    await Promise.resolve();

    expect(windowMock.namefiMeasurementConsent).toBe(false);
    expect(
      getGoogleAnalyticsCalls(windowMock).some(
        ([command, action]) => command === 'consent' && action === 'update',
      ),
    ).toBe(false);
  });
});

type GoogleAnalyticsWindowMock = {
  location: { origin: string };
  dataLayer: IArguments[];
  namefiMeasurementConsent?: boolean;
  namefiPreConsentAnalyticsQueue?: Array<{
    name: string;
    properties: Record<string, unknown>;
    queuedAt: number;
  }>;
  namefiQueuePreConsentAnalyticsEvent?: (
    name: string,
    properties?: Record<string, unknown>,
  ) => void;
  namefiFlushPreConsentAnalyticsQueue?: () => void;
  namefiDiscardPreConsentAnalyticsQueue?: () => void;
  __c15tInitialDataPromises: Record<
    string,
    {
      promise: Promise<{
        init: {
          jurisdiction: string;
          policy: { model: 'none' | 'opt-out'; ui: { mode: 'none' } };
        };
        metadata: { requestContext: { gpc: boolean } };
      }>;
      requestContext: { backendURL: string; gpc: boolean };
    }
  >;
};

function createGoogleAnalyticsWindowMock({
  gpc,
  initData,
}: {
  gpc: boolean;
  initData: {
    jurisdiction: string;
    policy: { model: 'none' | 'opt-out'; ui: { mode: 'none' } };
  };
}): GoogleAnalyticsWindowMock {
  return {
    location: { origin: 'https://namefi.test' },
    dataLayer: [],
    __c15tInitialDataPromises: {
      'prefetch-key': {
        requestContext: {
          backendURL: 'https://namefi.test/api/c15t',
          gpc,
        },
        promise: Promise.resolve({
          init: initData,
          metadata: { requestContext: { gpc } },
        }),
      },
    },
  };
}

function runGoogleAnalyticsBootstrapScript(
  script: string,
  windowMock: GoogleAnalyticsWindowMock,
) {
  const runScript = new Function('window', 'setTimeout', script);
  runScript(windowMock, (callback: () => void) => callback());
}

function getGoogleAnalyticsCalls(windowMock: GoogleAnalyticsWindowMock) {
  return windowMock.dataLayer.map((entry) => Array.from(entry));
}
