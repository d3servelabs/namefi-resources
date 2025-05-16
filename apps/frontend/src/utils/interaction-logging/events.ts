import type { CartItemSelect } from '@namefi-astra/db/types';

export enum InteractionLoggingEventName {
  // GoogleAnalytics-recommended events
  ADD_TO_CART = 'add_to_cart',
  BEGIN_CHECKOUT = 'begin_checkout',
  PURCHASE = 'purchase',
  SEARCH = 'search',
  SIGN_UP = 'sign_up',
}

export type InteractionLoggingCartItem = Pick<
  CartItemSelect,
  'amountInUSDCents' | 'normalizedDomainName'
>;

/*
 * Before adding a new event name, see if GoogleAnalytics has a recommended event that covers that need first.
 * Recommended events automatically update predefined dimensions and metrics, but must follow the format specified
 * in the docs. You may need to use the transformEvent inside useGoogleAnalytics to match this format.
 * https://support.google.com/analytics/answer/9267735?hl=en
 */
export type InteractionLoggingEvent =
  | AddToCartEvent
  | BeginCheckoutEvent
  | PurchaseEvent
  | SearchEvent;

export type AddToCartEvent = {
  name: InteractionLoggingEventName.ADD_TO_CART;
  properties: {
    cartItem: InteractionLoggingCartItem;
  };
};

export type BeginCheckoutEvent = {
  name: InteractionLoggingEventName.BEGIN_CHECKOUT;
  properties: {
    totalAmountInUsdCents?: number;
    cartItems?: InteractionLoggingCartItem[];
  };
};

export type PurchaseEvent = {
  name: InteractionLoggingEventName.PURCHASE;
  properties: {
    totalAmountInUsdCents: number;
    cartItems: InteractionLoggingCartItem[];
  };
};

export type SearchEvent = {
  name: InteractionLoggingEventName.SEARCH;
  properties: {
    search_term: string;
  };
};
