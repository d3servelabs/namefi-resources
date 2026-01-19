import { secrets } from '#lib/env';
import { createLogger } from '#lib/logger';
import type {
  BackendAnalyticsEventName,
  BackendAnalyticsEventParams,
} from '#lib/analytics-events';

const logger = createLogger({ module: 'ga4-measurement' });

const GA4_MEASUREMENT_ENDPOINT = 'https://www.google-analytics.com/mp/collect';
const GA4_DEBUG_ENDPOINT = 'https://www.google-analytics.com/debug/mp/collect';

export type GA4Event<
  EventName extends BackendAnalyticsEventName = BackendAnalyticsEventName,
> = {
  name: EventName;
  params?: BackendAnalyticsEventParams<EventName>;
};

export type GA4UserPropertyValue = string | number | boolean;

export type GA4UserProperties = Record<
  string,
  GA4UserPropertyValue | null | undefined
>;

export type SendGA4EventsInput = {
  events: GA4Event[];
  clientId?: string;
  userId?: string;
  userProperties?: GA4UserProperties;
  timestampMicros?: number;
  debug?: boolean;
};

type GA4Payload = {
  // biome-ignore lint/style/useNamingConvention: GA4 Measurement Protocol field.
  client_id?: string;
  // biome-ignore lint/style/useNamingConvention: GA4 Measurement Protocol field.
  user_id?: string;
  events: Array<{
    name: string;
    params?: Record<string, unknown>;
  }>;
  // biome-ignore lint/style/useNamingConvention: GA4 Measurement Protocol field.
  user_properties?: Record<string, { value: GA4UserPropertyValue }>;
  // biome-ignore lint/style/useNamingConvention: GA4 Measurement Protocol field.
  timestamp_micros?: number;
};

type GA4DebugResponse = {
  validationMessages?: Array<{
    fieldPath?: string;
    description?: string;
  }>;
};

function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;
}

function buildUserProperties(
  userProperties?: GA4UserProperties,
): GA4Payload['user_properties'] | undefined {
  if (!userProperties) return undefined;

  const entries = Object.entries(userProperties).filter(
    ([, value]) => value !== undefined && value !== null,
  );

  if (!entries.length) return undefined;

  return Object.fromEntries(
    entries.map(([key, value]) => [
      key,
      { value: value as GA4UserPropertyValue },
    ]),
  );
}

function buildEvent(event: GA4Event): GA4Payload['events'][number] {
  const params = event.params ? stripUndefined(event.params) : undefined;
  return stripUndefined({
    name: event.name,
    params: params && Object.keys(params).length > 0 ? params : undefined,
  });
}

function buildRequestUrl(debug = false): string {
  const measurementId = secrets.GA_MEASUREMENT_ID;
  const apiSecret = secrets.GA_MEASUREMENT_API_SECRET;

  if (!measurementId || !apiSecret) {
    throw new Error(
      'GA Measurement Protocol is not configured. Set GA_MEASUREMENT_ID and GA_MEASUREMENT_API_SECRET.',
    );
  }

  const url = new URL(debug ? GA4_DEBUG_ENDPOINT : GA4_MEASUREMENT_ENDPOINT);
  url.searchParams.set('measurement_id', measurementId);
  url.searchParams.set('api_secret', apiSecret);
  return url.toString();
}

export async function sendGA4Events({
  events,
  clientId,
  userId,
  userProperties,
  timestampMicros,
  debug,
}: SendGA4EventsInput): Promise<void> {
  if (!events.length) {
    throw new Error('GA4 event payload must include at least one event.');
  }

  if (!clientId && !userId) {
    throw new Error(
      'GA4 Measurement Protocol requires clientId or userId to be provided.',
    );
  }

  const payload: GA4Payload = stripUndefined({
    client_id: clientId,
    user_id: userId,
    events: events.map(buildEvent),
    user_properties: buildUserProperties(userProperties),
    timestamp_micros: timestampMicros,
  });

  const response = await fetch(buildRequestUrl(debug), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(
      {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      },
      'GA4 Measurement Protocol request failed',
    );
    throw new Error(
      `GA4 Measurement Protocol error: ${response.status} ${response.statusText}`,
    );
  }

  if (debug) {
    const debugResponse = (await response.json()) as GA4DebugResponse;
    if (debugResponse?.validationMessages?.length) {
      logger.warn(
        { validationMessages: debugResponse.validationMessages },
        'GA4 Measurement Protocol validation warnings',
      );
    }
  }
}

export async function sendGA4Event({
  event,
  ...rest
}: Omit<SendGA4EventsInput, 'events'> & {
  event: GA4Event;
}): Promise<void> {
  await sendGA4Events({ ...rest, events: [event] });
}
