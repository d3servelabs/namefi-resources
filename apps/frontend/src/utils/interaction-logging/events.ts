export enum InteractionLoggingEventName {
  // GoogleAnalytics-recommended events
  PURCHASE = 'purchase',
  SEARCH = 'search',
  SIGN_UP = 'sign-up',
}

/*
 * Before adding a new event name, see if GoogleAnalytics has a recommended event that covers that need first.
 * Recommended events automatically update predefined dimensions and metrics, but must follow the format specified
 * in the docs. You may need to use the transformEvent inside useGoogleAnalytics to match this format.
 * https://support.google.com/analytics/answer/9267735?hl=en
 */
export type InteractionLoggingEvent = PurchaseEvent;

export type PurchaseEvent = {
  name: InteractionLoggingEventName.PURCHASE;
  properties: {
    amountInUsdCents: number;
  };
};
