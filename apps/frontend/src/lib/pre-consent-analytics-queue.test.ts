import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  discardPreConsentAnalyticsQueue,
  flushPreConsentAnalyticsQueue,
  installPreConsentAnalyticsQueue,
  MAX_PRE_CONSENT_ANALYTICS_EVENTS,
  MAX_PRE_CONSENT_ANALYTICS_EVENT_AGE_MS,
  queuePreConsentAnalyticsEvent,
  resolvePreConsentAnalyticsQueueAction,
  shouldQueuePreConsentAnalyticsEvent,
} from './pre-consent-analytics-queue';

let now = 1_000;

beforeEach(() => {
  now = 1_000;
  vi.spyOn(Date, 'now').mockImplementation(() => now);
  (globalThis as unknown as { window: unknown }).window = {};
});

afterEach(() => {
  vi.restoreAllMocks();
  (globalThis as unknown as { window?: unknown }).window = undefined;
});

function getQueue() {
  return (
    globalThis as unknown as {
      window: { namefiPreConsentAnalyticsQueue?: unknown[] };
    }
  ).window.namefiPreConsentAnalyticsQueue;
}

describe('pre-consent analytics queue', () => {
  it('buffers analytics events until consent is granted', () => {
    queuePreConsentAnalyticsEvent('add_to_cart', { value: 12 });

    expect(getQueue()).toEqual([
      { name: 'add_to_cart', properties: { value: 12 }, queuedAt: 1_000 },
    ]);
  });

  it('flushes fresh events through the provided analytics sender', () => {
    const send = vi.fn();
    queuePreConsentAnalyticsEvent('add_to_cart', { value: 12 });
    queuePreConsentAnalyticsEvent('begin_checkout', { value: 20 });

    flushPreConsentAnalyticsQueue(send);

    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenNthCalledWith(1, 'event', 'add_to_cart', {
      value: 12,
    });
    expect(send).toHaveBeenNthCalledWith(2, 'event', 'begin_checkout', {
      value: 20,
    });
    expect(getQueue()).toEqual([]);
  });

  it('discards queued events when consent is denied', () => {
    queuePreConsentAnalyticsEvent('add_to_cart', { value: 12 });

    discardPreConsentAnalyticsQueue();

    expect(getQueue()).toEqual([]);
  });

  it('preserves queued events while measurement consent is still pending', () => {
    expect(
      resolvePreConsentAnalyticsQueueAction({
        hasMeasurement: false,
        hasConsentDecision: false,
      }),
    ).toBe('preserve');
  });

  it('discards queued events after an explicit measurement denial', () => {
    expect(
      resolvePreConsentAnalyticsQueueAction({
        hasMeasurement: false,
        hasConsentDecision: true,
      }),
    ).toBe('discard');
  });

  it('flushes queued events when measurement is granted', () => {
    expect(
      resolvePreConsentAnalyticsQueueAction({
        hasMeasurement: true,
        hasConsentDecision: true,
      }),
    ).toBe('flush');
  });

  it('queues events while consent info is loading unless bootstrap already granted measurement', () => {
    expect(
      shouldQueuePreConsentAnalyticsEvent({
        isLoadingConsentInfo: true,
        hasMeasurement: false,
        hasConsentDecision: false,
        hasResolvedBootstrapConsent: false,
      }),
    ).toBe(true);

    expect(
      shouldQueuePreConsentAnalyticsEvent({
        isLoadingConsentInfo: true,
        hasMeasurement: false,
        hasConsentDecision: false,
        hasResolvedBootstrapConsent: true,
      }),
    ).toBe(false);
  });

  it('keeps queuing during the loaded banner pending period', () => {
    expect(
      shouldQueuePreConsentAnalyticsEvent({
        isLoadingConsentInfo: false,
        hasMeasurement: false,
        hasConsentDecision: false,
      }),
    ).toBe(true);
  });

  it('does not queue after measurement is explicitly denied', () => {
    expect(
      shouldQueuePreConsentAnalyticsEvent({
        isLoadingConsentInfo: false,
        hasMeasurement: false,
        hasConsentDecision: true,
      }),
    ).toBe(false);
  });

  it('caps the buffer so it cannot grow unbounded', () => {
    for (let i = 0; i < MAX_PRE_CONSENT_ANALYTICS_EVENTS + 10; i += 1) {
      queuePreConsentAnalyticsEvent('promo_click', { index: i });
    }

    expect(getQueue()).toHaveLength(MAX_PRE_CONSENT_ANALYTICS_EVENTS);
  });

  it('drops stale events instead of replaying old pre-consent activity', () => {
    const send = vi.fn();
    queuePreConsentAnalyticsEvent('add_to_cart', { value: 12 });
    now += MAX_PRE_CONSENT_ANALYTICS_EVENT_AGE_MS + 1;

    flushPreConsentAnalyticsQueue(send);

    expect(send).not.toHaveBeenCalled();
    expect(getQueue()).toEqual([]);
  });

  it('installs the vanilla global helpers used by the bootstrap script', () => {
    installPreConsentAnalyticsQueue();
    const w = (
      globalThis as unknown as {
        window: {
          namefiQueuePreConsentAnalyticsEvent: (
            name: string,
            properties?: Record<string, unknown>,
          ) => void;
          namefiFlushPreConsentAnalyticsQueue: () => void;
          gtag: ReturnType<typeof vi.fn>;
        };
      }
    ).window;
    w.gtag = vi.fn();

    w.namefiQueuePreConsentAnalyticsEvent('language_changed', {
      source: 'header',
    });
    w.namefiFlushPreConsentAnalyticsQueue();

    expect(w.gtag).toHaveBeenCalledWith('event', 'language_changed', {
      source: 'header',
    });
  });
});
