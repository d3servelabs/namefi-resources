'use client';

import { useGoogleAnalyticsInteractionLogger } from '@/hooks/use-analytics';
import { usePerfFlagSync } from '@/hooks/use-perf-flag';
import type { InteractionLoggingEvent } from '@/lib/analytics-events';
import { recordPerfOnce } from '@/lib/perf/marks';
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
} from 'react';

/**
 * Context for providing interaction logging capabilities to components
 * Provides method for logging interaction events with our interaction loggers throughout the application
 */
type IInteractionLoggersContext = {
  logEventWithInteractionLoggers: (event: InteractionLoggingEvent) => void;
};

const InteractionLoggersContext = createContext<
  IInteractionLoggersContext | undefined
>(undefined);

export function useInteractionLoggers() {
  const context = useContext(InteractionLoggersContext);

  if (context === undefined) {
    throw new Error(
      'useInteractionLoggers must be used within an InteractionLoggersProvider',
    );
  }

  return context;
}

type InteractionLoggersProviderProps = {
  children: ReactNode;
};

export function InteractionLoggersProvider({
  children,
}: InteractionLoggersProviderProps) {
  const { logEvent } = useGoogleAnalyticsInteractionLogger();

  // Sync the ?perf=1 teammate flag and stamp the app-shell hydration milestone.
  // This provider mounts high in the tree, so its first commit is a good proxy
  // for "the shell became interactive".
  usePerfFlagSync();
  useEffect(() => {
    recordPerfOnce('app.hydrate');
  }, []);

  const logEventWithInteractionLoggers = useCallback(
    (event: InteractionLoggingEvent) => {
      logEvent(event);
    },
    [logEvent],
  );

  return (
    <InteractionLoggersContext.Provider
      value={{ logEventWithInteractionLoggers }}
    >
      {children}
    </InteractionLoggersContext.Provider>
  );
}
