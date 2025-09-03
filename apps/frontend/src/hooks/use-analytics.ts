'use client';

import {
  type InteractionLoggingCartItem,
  type InteractionLoggingEvent,
  InteractionLoggingEventName,
} from '@/lib/analytics-events';
import { useCallback } from 'react';

// From Google Analytics documentation
type Item = { item_name: string; item_id: string; price: number };

function interactionLoggingCartItemToGoogleAnalyticsItem(
  cartItem: InteractionLoggingCartItem,
): Item {
  return {
    item_id: cartItem.normalizedDomainName,
    item_name: cartItem.normalizedDomainName,
    price: cartItem.amountInUSDCents / 100,
  } satisfies Item;
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
    case InteractionLoggingEventName.ShareDialogOpened: {
      const { domainName, campaignKey, trigger } = event.properties;
      return {
        name: event.name,
        properties: {
          domain_name: domainName,
          campaign_key: campaignKey,
          trigger,
        },
      };
    }
    case InteractionLoggingEventName.ShareIntent: {
      const { domainName, campaignKey, sharedUrl, trigger } = event.properties;
      return {
        name: event.name,
        properties: {
          domain_name: domainName,
          campaign_key: campaignKey,
          shared_url: sharedUrl,
          trigger,
        },
      };
    }
    case InteractionLoggingEventName.ShareRecorded: {
      const { domainName, campaignKey, sharedUrl, postUrl } = event.properties;
      return {
        name: event.name,
        properties: {
          domain_name: domainName,
          campaign_key: campaignKey,
          shared_url: sharedUrl,
          post_url: postUrl,
        },
      };
    }
    default:
      return event;
  }
}

export function useGoogleAnalyticsInteractionLogger() {
  const logEvent = useCallback((event: InteractionLoggingEvent) => {
    const transformedEvent = transformEvent(event);
    if (typeof window === 'undefined') return;
    window.gtag?.('event', transformedEvent.name, transformedEvent.properties);
  }, []);

  return {
    logEvent,
  };
}
