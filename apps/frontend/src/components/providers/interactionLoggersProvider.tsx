'use client';

import { useGoogleAnalyticsInteractionLogger } from '@/hooks/useGoogleAnalyticsInteractionLogger';
import type {
  InteractionLoggingEventName,
  InteractionLoggingEventProperties,
} from '@/utils/interaction-logging/events';
import { type ReactNode, createContext, useCallback, useContext } from 'react';

/**
 * Context for providing interaction logging capabilities to components
 * Provides method for logging interaction events with our interaction loggers throughout the application
 */
type IInteractionLoggersContext = {
  logEventWithInteractionLoggers: (
    eventName: InteractionLoggingEventName,
    eventProperties?: InteractionLoggingEventProperties,
  ) => void;
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

  const logEventWithInteractionLoggers = useCallback(
    (
      eventName: InteractionLoggingEventName,
      eventProperties?: InteractionLoggingEventProperties,
    ) => {
      logEvent(eventName, eventProperties);
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
