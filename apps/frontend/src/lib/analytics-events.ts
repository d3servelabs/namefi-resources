import type { CartItemSelect } from '@namefi-astra/common/contract/entity-schemas';

export enum InteractionLoggingEventName {
  // GoogleAnalytics-recommended events
  AddToCart = 'add_to_cart',
  BeginCheckout = 'begin_checkout',
  Purchase = 'purchase',
  RemoveFromCart = 'remove_from_cart',
  SignUp = 'sign_up',

  // Checkout Events
  SubmitOrderFailure = 'submit_order_failure',

  // Hunt Events
  Vote = 'vote',
  ShareDialogOpened = 'share_dialog_opened',
  ShareIntent = 'share_intent',
  ShareRecorded = 'share_recorded',
  PromoClick = 'promo_click',

  // My Domains Events
  MyDomainsListForSaleClicked = 'my_domains_list_for_sale_clicked',

  // Marketplace Events
  MarketplaceListingCreated = 'marketplace_listing_created',
  MarketplaceListingCancelled = 'marketplace_listing_cancelled',
}

export type InteractionLoggingCartItem = Pick<
  CartItemSelect,
  'amountInUSDCents' | 'normalizedDomainName'
>;

// Base event structure
type BaseEvent<
  TName extends InteractionLoggingEventName,
  TProps = undefined,
  TAug = undefined,
> = {
  name: TName;
  properties: TProps;
  augmentation?: TAug;
};

export type InteractionLoggingEvent =
  | BaseEvent<
      InteractionLoggingEventName.AddToCart,
      { cartItem: InteractionLoggingCartItem }
    >
  | BaseEvent<
      InteractionLoggingEventName.RemoveFromCart,
      { cartItem: InteractionLoggingCartItem }
    >
  | BaseEvent<
      InteractionLoggingEventName.BeginCheckout,
      {
        totalAmountInUsdCents?: number;
        cartItems?: InteractionLoggingCartItem[];
      }
    >
  | BaseEvent<
      InteractionLoggingEventName.Purchase,
      {
        transactionId: string;
        totalAmountInUsdCents: number;
        cartItems: InteractionLoggingCartItem[];
      }
    >
  | BaseEvent<
      InteractionLoggingEventName.SubmitOrderFailure,
      {
        transactionId?: string;
        totalAmountInUsdCents: number;
        cartItems: InteractionLoggingCartItem[];
      }
    >
  | BaseEvent<
      InteractionLoggingEventName.Vote,
      {
        domainName: string;
        action: 'add' | 'remove' | 'attempt_unauthenticated';
      },
      {
        had_unauth_vote_attempt: boolean;
        attempt_domains: string[];
      }
    >
  | BaseEvent<
      InteractionLoggingEventName.ShareDialogOpened,
      {
        domainName: string;
        campaignKey?: string;
        featureKey?: string;
        trigger: 'vote_success' | 'manual';
      }
    >
  | BaseEvent<
      InteractionLoggingEventName.ShareIntent,
      {
        domainName: string;
        campaignKey?: string;
        featureKey?: string;
        trigger: 'tweet_button' | 'copy_button';
        sharedUrl: string;
      }
    >
  | BaseEvent<
      InteractionLoggingEventName.ShareRecorded,
      {
        domainName: string;
        campaignKey?: string;
        featureKey?: string;
        sharedUrl: string;
        postUrl: string;
      }
    >
  | BaseEvent<
      InteractionLoggingEventName.MyDomainsListForSaleClicked,
      { domainName: string; tableKind: 'active' | 'inactive' }
    >
  | BaseEvent<
      InteractionLoggingEventName.MarketplaceListingCreated,
      {
        domainName: string;
        marketplaceId: string;
        chainId: number;
        priceWei: string;
        currencySymbol: string;
      }
    >
  | BaseEvent<
      InteractionLoggingEventName.MarketplaceListingCancelled,
      {
        domainName: string;
        marketplaceId: string;
        chainId: number;
      }
    >
  | BaseEvent<
      InteractionLoggingEventName.PromoClick,
      {
        id: string;
        target_url: string;
      }
    >;

// Event with only name and augmentation (no properties)
export type InteractionLoggingEventAugmentation = Pick<
  InteractionLoggingEvent,
  'name' | 'augmentation'
>;

// Extract augmentation type for a specific event name
export type AugmentationFor<T extends InteractionLoggingEventName> =
  Extract<InteractionLoggingEvent, { name: T }> extends {
    augmentation?: infer A;
  }
    ? A
    : never;

// Extract partial event (name + augmentation) for a specific event name
export type PartialEventFor<T extends InteractionLoggingEventName> = Extract<
  InteractionLoggingEventAugmentation,
  { name: T }
>;
