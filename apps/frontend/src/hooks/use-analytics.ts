'use client';

import { config } from '@/lib/env';
import {
  type InteractionLoggingCartItem,
  type InteractionLoggingEvent,
  InteractionLoggingEventName,
} from '@/lib/analytics-events';
import { sendGAEvent } from '@next/third-parties/google';
import {
  useHasServiceConsent,
  useIsInitialized,
} from '@s-group/react-usercentrics';
import { useCallback, useMemo } from 'react';
import { useOrigin } from '@/components/providers/origin';

const GA_MEASUREMENT_ID = config.GA_MEASUREMENT_ID;
const USER_CENTRICS_GOOGLE_ANALYTICS_SERVICE_ID =
  config.USER_CENTRICS_GOOGLE_ANALYTICS_SERVICE_ID;

// From Google Analytics documentation
type Item = { item_name: string; item_id: string; price: number };

function interactionLoggingCartItemToGoogleAnalyticsItem(
  cartItem: InteractionLoggingCartItem,
): Item {
  return {
    item_id: cartItem.normalizedDomainName,
    item_name: cartItem.normalizedDomainName,
    price: cartItem.amountInUSDCents / 100,
  } as Item;
}

function transformEvent(event: InteractionLoggingEvent) {
  switch (event.name) {
    case InteractionLoggingEventName.AddToCart: // fallthrough
    case InteractionLoggingEventName.RemoveFromCart: {
      const { cartItem } = event.properties;
      return {
        name: event.name,
        properties: {
          currency: 'USD', // required to be 3-letter ISO 4217 by GoogleAnalytics
          value: cartItem.amountInUSDCents / 100,
          items: [interactionLoggingCartItemToGoogleAnalyticsItem(cartItem)],
        },
      };
    }
    case InteractionLoggingEventName.BeginCheckout: {
      const { cartItems, totalAmountInUsdCents } = event.properties;
      return {
        name: event.name,
        properties: {
          currency: 'USD', // required to be 3-letter ISO 4217 by GoogleAnalytics
          value:
            totalAmountInUsdCents === undefined
              ? undefined
              : totalAmountInUsdCents / 100,
          items: cartItems?.map((cartItem: InteractionLoggingCartItem) =>
            interactionLoggingCartItemToGoogleAnalyticsItem(cartItem),
          ),
        },
      };
    }
    case InteractionLoggingEventName.Purchase: // fallthrough
    case InteractionLoggingEventName.SubmitOrderFailure: {
      const { cartItems, totalAmountInUsdCents } = event.properties;
      return {
        name: event.name,
        properties: {
          currency: 'USD', // required to be 3-letter ISO 4217 by GoogleAnalytics
          value: totalAmountInUsdCents / 100,
          items: cartItems.map((cartItem: InteractionLoggingCartItem) =>
            interactionLoggingCartItemToGoogleAnalyticsItem(cartItem),
          ),
        },
      };
    }
    case InteractionLoggingEventName.Vote: {
      const { domainName, action } = event.properties;
      return {
        name: event.name,
        properties: {
          action,
          domain_name: domainName,
        },
      };
    }
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
  const originInfo = useOrigin();

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

      // Add origin information to all events
      const eventProperties = {
        ...transformedEvent.properties,
        // Custom dimensions for origin tracking
        origin_type: originInfo.isFirstPartyOrigin
          ? 'first_party'
          : 'third_party',
        origin_domain: originInfo.thirdPartyHostname || 'astra',
      };

      sendGAEvent('event', transformedEvent.name, eventProperties);
    },
    [enabled, originInfo],
  );

  return {
    enabled,
    logEvent,
  };
}
