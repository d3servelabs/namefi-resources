'use client';

import { config } from '@/lib/env';
import {
  type InteractionLoggingEvent,
  InteractionLoggingEventName,
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

function transformEvent(event: InteractionLoggingEvent) {
  switch (event.name) {
    case InteractionLoggingEventName.PURCHASE:
      return {
        name: event.name,
        properties: {
          currency: 'USD', // required to be 3-letter ISO 4217 by GoogleAnalytics
          value: event.properties.amountInUsdCents / 100,
          items: [], // TODO(Luis): replace items with Item type from GoogleAnalytics
        },
      };
    default:
      return event;
  }
}

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
    (event: InteractionLoggingEvent) => {
      if (!enabled) {
        return;
      }

      const transformedEvent = transformEvent(event);
      sendGAEvent(
        'event',
        transformedEvent.name,
        transformedEvent.properties ?? {},
      );
    },
    [enabled],
  );

  return {
    enabled,
    logEvent,
  };
}
