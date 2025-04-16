'use client';

import { config } from '@/lib/env';
import type {
  InteractionLoggingEventName,
  InteractionLoggingEventProperties,
} from '@/utils/interaction-logging/events';
import { sendGAEvent } from '@next/third-parties/google';
import {
  useHasServiceConsent,
  useIsInitialized,
} from '@s-group/react-usercentrics';
import { useCallback, useMemo } from 'react';

const GA_MEASUREMENT_ID = config.GA_MEASUREMENT_ID;
const USER_CENTRICS_GOOGLE_ANALYTICS_SERVICE_ID =
  config.USER_CENTRICS_GOOGLE_ANALYTICS_SERVICE_ID;

// hook that calls GoogleAnalytics event logging function if analytics cookie consent is given
export function useGoogleAnalyticsInteractionLogger() {
  const usercentricsInitialized = useIsInitialized();
  const googleAnalyticsConsentGiven = useHasServiceConsent(
    USER_CENTRICS_GOOGLE_ANALYTICS_SERVICE_ID,
  );

  const enabled = useMemo(() => {
    return (
      GA_MEASUREMENT_ID &&
      usercentricsInitialized &&
      googleAnalyticsConsentGiven
    );
  }, [googleAnalyticsConsentGiven, usercentricsInitialized]);

  const logEvent = useCallback(
    (
      eventName: InteractionLoggingEventName,
      eventProperties?: InteractionLoggingEventProperties,
    ) => {
      if (!enabled) {
        return;
      }

      sendGAEvent('event', eventName, eventProperties ?? {});
    },
    [enabled],
  );

  return {
    enabled,
    logEvent,
  };
}
