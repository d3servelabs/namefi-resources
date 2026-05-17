import { describe, expect, it, vi } from 'vitest';
import {
  buildC15tShowConsentBannerHeaders,
  fetchC15tInitialBannerData,
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

  it('resolves initial measurement consent from stored consent before geo defaults', () => {
    expect(
      resolveInitialMeasurementConsent({
        consentCookieValue: 'c.necessary:1',
        initialBannerData: {
          showConsentBanner: false,
          jurisdiction: { code: 'NONE' },
        },
      }),
    ).toBe(false);

    expect(
      resolveInitialMeasurementConsent({
        consentCookieValue: 'c.necessary:1,c.measurement:1',
        initialBannerData: {
          showConsentBanner: true,
          jurisdiction: { code: 'GDPR' },
        },
      }),
    ).toBe(true);
  });

  it('auto-grants measurement only for no-banner c15t NONE jurisdiction', () => {
    expect(
      resolveInitialMeasurementConsent({
        initialBannerData: {
          showConsentBanner: false,
          jurisdiction: { code: 'NONE' },
        },
      }),
    ).toBe(true);

    expect(
      resolveInitialMeasurementConsent({
        initialBannerData: {
          showConsentBanner: false,
          jurisdiction: { code: 'GDPR' },
        },
      }),
    ).toBe(false);
  });

  it('builds c15t show-banner headers from proxy geo headers', () => {
    const headers = buildC15tShowConsentBannerHeaders(
      new Headers({
        'x-client-geo-location-region': 'US',
        'x-client-geo-location-region-subdivision': 'USCA',
        'accept-language': 'en-US,en;q=0.9',
      }),
    );

    expect(headers?.get('x-c15t-country')).toBe('US');
    expect(headers?.get('x-c15t-region')).toBe('USCA');
    expect(headers?.get('accept-language')).toBe('en-US,en;q=0.9');
  });

  it('fetches and validates initial c15t banner data', async () => {
    const fetcher = vi.fn(async () =>
      Response.json({
        showConsentBanner: false,
        jurisdiction: { code: 'NONE' },
      }),
    );

    await expect(
      fetchC15tInitialBannerData({
        backendUrl: 'https://api.example.test',
        requestHeaders: new Headers({
          'x-client-geo-location-region': 'US',
        }),
        fetcher,
      }),
    ).resolves.toEqual({
      showConsentBanner: false,
      jurisdiction: { code: 'NONE' },
    });

    expect(fetcher).toHaveBeenCalledWith(
      'https://api.example.test/c15t/show-consent-banner',
      expect.objectContaining({
        method: 'GET',
        cache: 'no-store',
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it('aborts initial c15t banner fetches after the configured timeout', async () => {
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

      const resultPromise = fetchC15tInitialBannerData({
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

  it('does not fetch initial c15t banner data without relevant request headers', async () => {
    const fetcher = vi.fn();

    await expect(
      fetchC15tInitialBannerData({
        backendUrl: 'https://api.example.test',
        requestHeaders: new Headers(),
        fetcher,
      }),
    ).resolves.toBeNull();

    expect(fetcher).not.toHaveBeenCalled();
  });

  it('ignores malformed initial c15t banner data', async () => {
    const fetcher = vi.fn(async () => Response.json({ jurisdiction: 'NONE' }));

    await expect(
      fetchC15tInitialBannerData({
        backendUrl: 'https://api.example.test',
        requestHeaders: new Headers({
          'x-client-geo-location-region': 'US',
        }),
        fetcher,
      }),
    ).resolves.toBeNull();
  });
});
