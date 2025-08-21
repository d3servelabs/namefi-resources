'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type PropsWithChildren,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';

type SetParentDomainHandler = (domain: string | undefined) => void;
type FocusSearchInputHandler = () => void;
type SearchModeValue = 'REGISTER' | 'IMPORT';
type SetSearchModeHandler = (mode: SearchModeValue) => void;

type FreeMintsGuidanceContextValue = {
  setParentDomain: SetParentDomainHandler;
  focusSearchInput: FocusSearchInputHandler;
  registerSetParentDomain: (handler: SetParentDomainHandler) => void;
  registerFocusSearchInput: (handler: FocusSearchInputHandler) => void;
  registerSetSearchMode: (handler: SetSearchModeHandler) => void;
  setPendingFreeMintsSearch: (parentDomain: string) => void;
  consumePendingFreeMintsSearch: () => string | undefined;
  startFreeMintsSearchGuidance: (parentDomain: string) => void;
  registerFreeMintsGuidanceStarter: (
    handler: (parentDomain: string) => void,
  ) => void;
  unregisterFreeMintsGuidanceStarter: () => void;
  startCampaignSearch: (parentDomain: string) => void;
};

const FreeMintsGuidanceContext = createContext<
  FreeMintsGuidanceContextValue | undefined
>(undefined);

export function FreeMintsGuidanceProvider({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const parentDomainSetterRef = useRef<SetParentDomainHandler | undefined>(
    undefined,
  );
  const focusSearchInputRef = useRef<FocusSearchInputHandler | undefined>(
    undefined,
  );
  const setSearchModeRef = useRef<SetSearchModeHandler | undefined>(undefined);
  const pendingParentDomainRef = useRef<string | undefined>(undefined);
  const guidanceStarterRef = useRef<
    ((parentDomain: string) => void) | undefined
  >(undefined);
  const pendingFocusRef = useRef<boolean>(false);

  const registerSetParentDomain = useCallback(
    (handler: SetParentDomainHandler) => {
      parentDomainSetterRef.current = handler;
    },
    [],
  );

  const registerFocusSearchInput = useCallback(
    (handler: FocusSearchInputHandler) => {
      focusSearchInputRef.current = handler;
      // Check if there's a pending focus request
      if (pendingFocusRef.current) {
        setTimeout(() => handler(), 0);
        pendingFocusRef.current = false;
      }
    },
    [],
  );

  const registerSetSearchMode = useCallback((handler: SetSearchModeHandler) => {
    setSearchModeRef.current = handler;
  }, []);

  const setParentDomain = useCallback<SetParentDomainHandler>((domain) => {
    parentDomainSetterRef.current?.(domain);
  }, []);

  const focusSearchInput = useCallback<FocusSearchInputHandler>(() => {
    const handler = focusSearchInputRef.current;
    if (!handler) {
      // Set pending flag instead of returning
      pendingFocusRef.current = true;
      return;
    }
    // Clear the flag since we're executing immediately
    pendingFocusRef.current = false;
    setTimeout(() => handler(), 0);
  }, []);

  const setPendingFreeMintsSearch = useCallback((parentDomain: string) => {
    pendingParentDomainRef.current = parentDomain;
  }, []);

  const consumePendingFreeMintsSearch = useCallback(() => {
    const pd = pendingParentDomainRef.current;
    pendingParentDomainRef.current = undefined;
    return pd;
  }, []);

  const startFreeMintsSearchGuidance = useCallback(
    (parentDomain: string) => {
      setParentDomain(parentDomain);
      setSearchModeRef.current?.('REGISTER');
      focusSearchInput();
      guidanceStarterRef.current?.(parentDomain);
    },
    [focusSearchInput, setParentDomain],
  );

  const registerFreeMintsGuidanceStarter = useCallback(
    (handler: (parentDomain: string) => void) => {
      guidanceStarterRef.current = handler;
    },
    [],
  );

  const unregisterFreeMintsGuidanceStarter = useCallback(() => {
    guidanceStarterRef.current = undefined;
  }, []);

  const startCampaignSearch = useCallback(
    (parentDomain: string) => {
      const isRoot = pathname === '/' || pathname === '';
      if (isRoot) {
        startFreeMintsSearchGuidance(parentDomain);
      } else {
        setPendingFreeMintsSearch(parentDomain);
        router.push('/');
      }
    },
    [pathname, router, setPendingFreeMintsSearch, startFreeMintsSearchGuidance],
  );

  const value = useMemo<FreeMintsGuidanceContextValue>(
    () => ({
      setParentDomain,
      focusSearchInput,
      registerSetParentDomain,
      registerFocusSearchInput,
      registerSetSearchMode,
      setPendingFreeMintsSearch,
      consumePendingFreeMintsSearch,
      startFreeMintsSearchGuidance,
      registerFreeMintsGuidanceStarter,
      unregisterFreeMintsGuidanceStarter,
      startCampaignSearch,
    }),
    [
      setParentDomain,
      focusSearchInput,
      registerSetParentDomain,
      registerFocusSearchInput,
      registerSetSearchMode,
      setPendingFreeMintsSearch,
      consumePendingFreeMintsSearch,
      startFreeMintsSearchGuidance,
      registerFreeMintsGuidanceStarter,
      unregisterFreeMintsGuidanceStarter,
      startCampaignSearch,
    ],
  );

  return (
    <FreeMintsGuidanceContext.Provider value={value}>
      {children}
    </FreeMintsGuidanceContext.Provider>
  );
}

export function useFreeMintsGuidance() {
  const ctx = useContext(FreeMintsGuidanceContext);

  if (!ctx) {
    throw new Error(
      'useFreeMintsGuidance must be used within a FreeMintsGuidanceProvider',
    );
  }

  return {
    ...ctx,
  };
}
