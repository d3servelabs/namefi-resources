'use client';

import {
  type InteractionLoggingCartItem,
  type InteractionLoggingEvent,
  InteractionLoggingEventName,
} from '@/lib/analytics-events';
import { useCallback } from 'react';
import { usePreAuthSignals } from '@/components/providers/pre-auth-signals';

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

type TransformedEvent = {
  name: InteractionLoggingEventName;
  properties: Record<string, unknown>;
};

function transformEvent(event: InteractionLoggingEvent): TransformedEvent {
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
    case InteractionLoggingEventName.SubmitOrderFailure: {
      const { cartItems, totalAmountInUsdCents, transactionId } =
        event.properties;
      return {
        name: event.name,
        properties: {
          ...(transactionId ? { transaction_id: transactionId } : {}),
          currency: 'USD', // required to be 3-letter ISO 4217 by GoogleAnalytics
          value: totalAmountInUsdCents / 100,
          items: cartItems.map((cartItem: InteractionLoggingCartItem) =>
            interactionLoggingCartItemToGoogleAnalyticsItem(cartItem),
          ),
        },
      };
    }
    case InteractionLoggingEventName.Vote: {
      const {
        properties: { domainName, action },
        augmentation: { had_unauth_vote_attempt, attempt_domains } = {},
      } = event;
      return {
        name: event.name,
        properties: {
          action,
          domain_name: domainName,
          had_unauth_vote_attempt,
          attempt_domains,
        },
      };
    }
    case InteractionLoggingEventName.ShareDialogOpened: {
      const { domainName, campaignKey, featureKey, trigger } = event.properties;
      return {
        name: event.name,
        properties: {
          domain_name: domainName,
          campaign_key: campaignKey,
          feature_key: featureKey,
          trigger,
        },
      };
    }
    case InteractionLoggingEventName.ShareIntent: {
      const { domainName, campaignKey, featureKey, sharedUrl, trigger } =
        event.properties;
      return {
        name: event.name,
        properties: {
          domain_name: domainName,
          campaign_key: campaignKey,
          feature_key: featureKey,
          shared_url: sharedUrl,
          trigger,
        },
      };
    }
    case InteractionLoggingEventName.ShareRecorded: {
      const { domainName, campaignKey, featureKey, sharedUrl, postUrl } =
        event.properties;
      return {
        name: event.name,
        properties: {
          domain_name: domainName,
          campaign_key: campaignKey,
          feature_key: featureKey,
          shared_url: sharedUrl,
          post_url: postUrl,
        },
      };
    }
    case InteractionLoggingEventName.MyDomainsListForSaleClicked: {
      const { domainName, tableKind } = event.properties;
      return {
        name: event.name,
        properties: {
          domain_name: domainName,
          table_kind: tableKind,
        },
      };
    }
    case InteractionLoggingEventName.LanguageChanged: {
      const { fromLocale, toLocale, source } = event.properties;
      return {
        name: event.name,
        properties: {
          from_locale: fromLocale,
          to_locale: toLocale,
          source,
        },
      };
    }
    default: {
      return event;
    }
  }
}

export function useGoogleAnalyticsInteractionLogger() {
  const { consumeAugmentation } = usePreAuthSignals();

  const logEvent = useCallback(
    (event: InteractionLoggingEvent) => {
      if (typeof window === 'undefined') return;

      // Try to get augmentation for this event
      const partialEvent = consumeAugmentation(event.name);

      const eventWithAugmentation = {
        ...event,
        ...(partialEvent?.augmentation
          ? {
              augmentation: {
                ...event.augmentation,
                ...partialEvent.augmentation,
              },
            }
          : {}),
      } as InteractionLoggingEvent;

      // Transform to GA format
      const transformedEvent = transformEvent(eventWithAugmentation);

      window.gtag?.(
        'event',
        transformedEvent.name,
        transformedEvent.properties,
      );
    },
    [consumeAugmentation],
  );

  return {
    logEvent,
  };
}
