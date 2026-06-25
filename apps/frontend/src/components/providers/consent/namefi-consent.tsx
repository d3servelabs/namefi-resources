'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

/**
 * Lightweight, eager consent context that the app reads instead of c15t's
 * `useConsentManager` directly. This is the key to keeping the heavy
 * `@c15t` SDK (~200KB) OFF the homepage hydration critical path: every
 * consumer (footer, GA gating, feedback) reads THIS cheap context, while the
 * real c15t loads on idle (`DeferredC15t`) and feeds its state back here via
 * `_setSnapshot`.
 *
 * Until the real c15t loads, consumers see `isLoadingConsentInfo: true` and
 * `measurement: false` — i.e. analytics stay gated (correct: nothing fires
 * before consent is known), just resolved a beat later. Recovering the events
 * dropped in that window is tracked in issue #4892.
 */
export const NAMEFI_OPEN_CONSENT_EVENT = 'namefi:open-consent';

// If the user opens the consent dialog before the idle-loaded c15t runtime has
// mounted its event listener, the dispatched event has no listener and is
// dropped. Remember the request in a module flag so the runtime can honor it on
// mount instead of silently swallowing the click.
let pendingConsentOpen = false;

function dispatchOpenConsent() {
  pendingConsentOpen = true;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(NAMEFI_OPEN_CONSENT_EVENT));
  }
}

/** Consumed once by the idle c15t runtime on mount to honor an early open. */
export function consumePendingConsentOpen(): boolean {
  const pending = pendingConsentOpen;
  pendingConsentOpen = false;
  return pending;
}

export type ConsentSnapshot = {
  consents: { measurement: boolean; necessary: boolean };
  isLoadingConsentInfo: boolean;
};

type NamefiConsentValue = ConsentSnapshot & {
  /** Open the consent dialog (dispatches an event the idle c15t zone handles). */
  openConsentDialog: () => void;
  /** Internal: the idle-loaded real c15t pushes its live state here. */
  _setSnapshot: (snapshot: ConsentSnapshot) => void;
};

const DEFAULT_SNAPSHOT: ConsentSnapshot = {
  consents: { measurement: false, necessary: true },
  isLoadingConsentInfo: true,
};

// Fail-closed fallback used when a consumer renders without a provider —
// Storybook stories, unit tests, or any subtree (e.g. the footer) mounted
// outside the app shell. measurement:false + isLoadingConsentInfo:true keeps
// analytics correctly gated; openConsentDialog still dispatches the event
// (harmless with no listener). The real app always wraps NamefiConsentProvider,
// so this only applies off the app shell — better than crashing the whole tree.
const FALLBACK_VALUE: NamefiConsentValue = {
  ...DEFAULT_SNAPSHOT,
  openConsentDialog: dispatchOpenConsent,
  _setSnapshot: () => {},
};

const NamefiConsentContext = createContext<NamefiConsentValue | null>(null);

export function NamefiConsentProvider({ children }: PropsWithChildren) {
  const [snapshot, setSnapshot] = useState<ConsentSnapshot>(DEFAULT_SNAPSHOT);

  const openConsentDialog = useCallback(() => {
    dispatchOpenConsent();
  }, []);

  const value = useMemo<NamefiConsentValue>(
    () => ({ ...snapshot, openConsentDialog, _setSnapshot: setSnapshot }),
    [snapshot, openConsentDialog],
  );

  return (
    <NamefiConsentContext.Provider value={value}>
      {children}
    </NamefiConsentContext.Provider>
  );
}

export function useNamefiConsent(): NamefiConsentValue {
  // Tolerate a missing provider with a fail-closed fallback (see FALLBACK_VALUE)
  // so rendering a consumer off the app shell (stories/tests) never crashes the
  // tree. The real app always provides NamefiConsentProvider.
  return useContext(NamefiConsentContext) ?? FALLBACK_VALUE;
}
