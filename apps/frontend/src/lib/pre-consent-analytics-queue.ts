'use client';

type GtagEventFn = (
  command: 'event',
  name: string,
  properties?: Record<string, unknown>,
) => void;

export type QueuedPreConsentAnalyticsEvent = {
  name: string;
  properties?: Record<string, unknown>;
  queuedAt: number;
};

export type PreConsentAnalyticsQueueAction = 'flush' | 'discard' | 'preserve';

export const MAX_PRE_CONSENT_ANALYTICS_EVENTS = 50;
export const MAX_PRE_CONSENT_ANALYTICS_EVENT_AGE_MS = 30_000;

type PreConsentAnalyticsWindow = typeof window & {
  namefiPreConsentAnalyticsQueue?: QueuedPreConsentAnalyticsEvent[];
  namefiQueuePreConsentAnalyticsEvent?: (
    name: string,
    properties?: Record<string, unknown>,
  ) => void;
  namefiFlushPreConsentAnalyticsQueue?: () => void;
  namefiDiscardPreConsentAnalyticsQueue?: () => void;
  gtag?: GtagEventFn;
};

function getAnalyticsWindow(): PreConsentAnalyticsWindow | null {
  const w = (globalThis as unknown as { window?: PreConsentAnalyticsWindow })
    .window;
  return w ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function getQueue(w: PreConsentAnalyticsWindow) {
  if (!Array.isArray(w.namefiPreConsentAnalyticsQueue)) {
    w.namefiPreConsentAnalyticsQueue = [];
  }
  return w.namefiPreConsentAnalyticsQueue;
}

function isFresh(entry: { queuedAt?: unknown }, now = Date.now()) {
  return (
    typeof entry.queuedAt === 'number' &&
    now - entry.queuedAt <= MAX_PRE_CONSENT_ANALYTICS_EVENT_AGE_MS
  );
}

function compactFreshQueue(w: PreConsentAnalyticsWindow, now = Date.now()) {
  const queue = getQueue(w);
  const fresh = queue.filter((entry) => isFresh(entry, now));
  if (fresh.length !== queue.length) {
    w.namefiPreConsentAnalyticsQueue = fresh;
    return fresh;
  }
  return queue;
}

function pushPreConsentAnalyticsEvent(
  w: PreConsentAnalyticsWindow,
  name: string,
  properties?: Record<string, unknown>,
) {
  const queue = compactFreshQueue(w);
  if (queue.length >= MAX_PRE_CONSENT_ANALYTICS_EVENTS) return;
  queue.push({
    name,
    properties,
    queuedAt: Date.now(),
  });
}

export function resolvePreConsentAnalyticsQueueAction({
  hasMeasurement,
  hasConsentDecision,
}: {
  hasMeasurement: boolean;
  hasConsentDecision: boolean;
}): PreConsentAnalyticsQueueAction {
  if (hasMeasurement) return 'flush';
  if (hasConsentDecision) return 'discard';
  return 'preserve';
}

export function shouldQueuePreConsentAnalyticsEvent({
  isLoadingConsentInfo,
  hasMeasurement,
  hasConsentDecision,
  hasResolvedBootstrapConsent,
}: {
  isLoadingConsentInfo: boolean;
  hasMeasurement: boolean;
  hasConsentDecision: boolean;
  hasResolvedBootstrapConsent?: boolean;
}) {
  if (hasResolvedBootstrapConsent === true) return false;
  if (isLoadingConsentInfo) return true;
  return !hasMeasurement && !hasConsentDecision;
}

export function installPreConsentAnalyticsQueue() {
  const w = getAnalyticsWindow();
  if (!w) return;

  getQueue(w);
  w.namefiQueuePreConsentAnalyticsEvent ??= (name, properties) => {
    pushPreConsentAnalyticsEvent(w, name, properties);
  };
  w.namefiFlushPreConsentAnalyticsQueue ??= () => {
    flushPreConsentAnalyticsQueue();
  };
  w.namefiDiscardPreConsentAnalyticsQueue ??= () => {
    discardPreConsentAnalyticsQueue();
  };
}

export function queuePreConsentAnalyticsEvent(
  name: string,
  properties?: Record<string, unknown>,
) {
  const w = getAnalyticsWindow();
  if (!w) return;

  installPreConsentAnalyticsQueue();
  pushPreConsentAnalyticsEvent(w, name, properties);
}

export function flushPreConsentAnalyticsQueue(send?: GtagEventFn) {
  const w = getAnalyticsWindow();
  if (!w) return;

  installPreConsentAnalyticsQueue();
  const queued = getQueue(w);
  w.namefiPreConsentAnalyticsQueue = [];

  const gtag = send ?? w.gtag;
  if (typeof gtag !== 'function') return;

  const now = Date.now();
  for (const entry of queued) {
    if (!isFresh(entry, now) || typeof entry.name !== 'string') continue;
    gtag(
      'event',
      entry.name,
      isRecord(entry.properties) ? entry.properties : {},
    );
  }
}

export function discardPreConsentAnalyticsQueue() {
  const w = getAnalyticsWindow();
  if (!w) return;
  w.namefiPreConsentAnalyticsQueue = [];
}
