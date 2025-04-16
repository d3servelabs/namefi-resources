export type InteractionLoggingEventProperties = Record<
  string,
  Record<string, string>
>;

export enum InteractionLoggingEventName {
  // CHECKOUT EVENTS
  TEST_EVENT = 'test-event',
}
