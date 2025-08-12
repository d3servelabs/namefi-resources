import type { CartItemSelect } from '@namefi-astra/db/types';

export enum InteractionLoggingEventName {
  // GoogleAnalytics-recommended events
  AddToCart = 'add_to_cart',
  BeginCheckout = 'begin_checkout',
  Purchase = 'purchase',
  RemoveFromCart = 'remove_from_cart',
  Search = 'search',
  SignUp = 'sign_up',

  // Checkout Events
  SubmitOrderFailure = 'submit_order_failure',

  // Hunt Events
  Vote = 'vote',
  ShareDialogOpened = 'share_dialog_opened',
  ShareCompleted = 'share_completed',
  ShareConversion = 'share_conversion', // vote from shared link
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
  | RemoveFromCartEvent
  | SearchEvent
  | SubmitOrderFailureEvent
  | VoteEvent
  | ShareDialogOpenedEvent
  | ShareCompletedEvent
  | ShareConversionEvent;

export type AddToCartEvent = {
  name: InteractionLoggingEventName.AddToCart;
  properties: {
    cartItem: InteractionLoggingCartItem;
  };
};

export type BeginCheckoutEvent = {
  name: InteractionLoggingEventName.BeginCheckout;
  properties: {
    totalAmountInUsdCents?: number;
    cartItems?: InteractionLoggingCartItem[];
  };
};

export type PurchaseEvent = {
  name: InteractionLoggingEventName.Purchase;
  properties: {
    totalAmountInUsdCents: number;
    cartItems: InteractionLoggingCartItem[];
  };
};

export type RemoveFromCartEvent = {
  name: InteractionLoggingEventName.RemoveFromCart;
  properties: {
    cartItem: InteractionLoggingCartItem;
  };
};

export type SearchEvent = {
  name: InteractionLoggingEventName.Search;
  properties: {
    search_term: string;
  };
};

export type SubmitOrderFailureEvent = {
  name: InteractionLoggingEventName.SubmitOrderFailure;
  properties: {
    totalAmountInUsdCents: number;
    cartItems: InteractionLoggingCartItem[];
  };
};

export type VoteEvent = {
  name: InteractionLoggingEventName.Vote;
  properties: {
    domainName: string;
    action: 'add' | 'remove' | 'attempt_unauthenticated';
  };
};

export type ShareDialogOpenedEvent = {
  name: InteractionLoggingEventName.ShareDialogOpened;
  properties: {
    domainName: string;
    campaignKey?: string;
    trigger: 'vote_success' | 'manual';
  };
};

export type ShareCompletedEvent = {
  name: InteractionLoggingEventName.ShareCompleted;
  properties: {
    domainName: string;
    campaignKey?: string;
    sharedUrl: string;
    postUrl: string;
  };
};

export type ShareConversionEvent = {
  name: InteractionLoggingEventName.ShareConversion;
  properties: {
    domainName: string;
    campaignKey?: string;
    referrerUrl?: string;
  };
};
