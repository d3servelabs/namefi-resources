import { mailSecrets } from '../env';
import { CompactSign, compactVerify } from 'jose';
// biome-ignore lint/style/useImportType: required for react-email
import React from 'react';
import z from 'zod';

export const EmailAnalyticsPayloadSchema = z.discriminatedUnion('type', [
  z.object({
    nonce: z.string(),
    type: z.literal('order_ready_count_only'),
  }),
  // this one is not used but it's left here as an example
  z.object({
    type: z.literal('order_ready'),
    orderId: z.uuid(),
    userId: z.uuid(),
    emailAddress: z.email(),
    nonce: z.string(),
  }),
  // Generic per-campaign open tracking. Increments
  // `email_campaign_opens.open_count` keyed by `campaignKey` on each pixel hit.
  z.object({
    type: z.literal('campaign_email_open'),
    campaignKey: z.string().min(1),
    userEmail: z.email(),
    nonce: z.string(),
  }),
  // Per-link click tracking. The redirect endpoint decodes this token,
  // increments `email_campaign_clicks.click_count` keyed by
  // (campaignKey, groupIdentifier), then 302-redirects to `destinationUrl`.
  z.object({
    type: z.literal('campaign_link_click'),
    campaignKey: z.string().min(1),
    groupIdentifier: z.string().optional(),
    destinationUrl: z.url(),
    userEmail: z.email().optional(),
    nonce: z.string(),
  }),
]);

export type EmailAnalyticsPayload = z.infer<typeof EmailAnalyticsPayloadSchema>;

export type EmailTrackingInfo = {
  trackUrl: string;
  data: EmailAnalyticsPayload;
  issuedAt?: Date;
};

export type EmailAnalyticsUrlResult =
  | { url: string; error?: undefined }
  | { url: null; error: string };

export type EmailAnalyticsDecodeResult =
  | { data: EmailAnalyticsPayload; issuedAt?: Date; error?: undefined }
  | { data: null; error: string };

type JwtHeader = {
  alg: 'HS256';
  typ: 'JWT';
};

type EmailAnalyticsContextType = {
  trackingUrl: string | null;
  campaignKey: string | null;
};

const EmailAnalyticsContext = React.createContext<EmailAnalyticsContextType>({
  trackingUrl: null,
  campaignKey: null,
});

export function EmailTrackingProvider(props: {
  trackingUrl?: string | null;
  /**
   * Optional campaign identifier. When set, downstream renderers (e.g.
   * `NamefiEmailContainer`) emit a hidden `<meta>` marker so that
   * post-render passes (link rewriter, analytics agents) can associate
   * the email with this campaign without needing the value plumbed through
   * code separately. Mirrors the JWT payload's `campaignKey` field.
   */
  campaignKey?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <EmailAnalyticsContext.Provider
      value={{
        trackingUrl: props.trackingUrl ?? null,
        campaignKey: props.campaignKey ?? null,
      }}
    >
      {props.children}
    </EmailAnalyticsContext.Provider>
  );
}

export function useEmailTrackingUrl(trackingUrl?: string | null) {
  const context = React.useContext(EmailAnalyticsContext);
  if (!context) {
    return trackingUrl ?? null;
  }
  return trackingUrl ?? context.trackingUrl;
}

export function useEmailCampaignKey(campaignKey?: string | null) {
  const context = React.useContext(EmailAnalyticsContext);
  if (!context) {
    return campaignKey ?? null;
  }
  return campaignKey ?? context.campaignKey;
}

/**
 * Name of the meta tag emitted in rendered campaign emails. Both the
 * link-rewriter fallback and any external analytics agent that scans
 * delivered HTML can key off this name.
 */
export const EMAIL_CAMPAIGN_KEY_META_NAME = 'namefi-campaign-key';

export async function buildEmailAnalyticsUrl(
  trackingInfo: EmailTrackingInfo,
): Promise<EmailAnalyticsUrlResult> {
  const secret = mailSecrets.EMAIL_TRACKING_JWT_SECRET;
  if (!secret) {
    return {
      url: null,
      error: 'EMAIL_TRACKING_JWT_SECRET is not configured',
    };
  }

  const baseUrl = coerceToUrl(trackingInfo.trackUrl);
  if (!baseUrl) {
    return { url: null, error: 'Invalid tracking URL' };
  }

  const issuedAt = trackingInfo.issuedAt ?? new Date();
  const payload: EmailAnalyticsJwtPayload = {
    data: trackingInfo.data,
    iat: Math.floor(issuedAt.getTime() / 1000),
  };
  let token: string;
  try {
    token = await signJwt(payload, secret);
  } catch (error) {
    return {
      url: null,
      error: error instanceof Error ? error.message : 'Unable to sign token',
    };
  }
  baseUrl.searchParams.set('id', 'email-open');
  baseUrl.searchParams.set('token', token);

  return { url: baseUrl.toString() };
}

export async function getEmailTrackDataFromUrl(
  urlOrToken: string,
): Promise<EmailAnalyticsDecodeResult> {
  const secret = mailSecrets.EMAIL_TRACKING_JWT_SECRET;
  if (!secret) {
    return {
      data: null,
      error: 'EMAIL_TRACKING_JWT_SECRET is not configured',
    };
  }

  const token = extractToken(urlOrToken);
  if (!token) {
    return { data: null, error: 'Missing tracking token' };
  }

  try {
    const { payload, protectedHeader } = await verifyJwt(token, secret);
    if (!protectedHeader || protectedHeader.alg !== 'HS256') {
      return { data: null, error: 'Invalid tracking token' };
    }

    const parsedPayload = safeJsonParse<EmailAnalyticsJwtPayload>(
      new TextDecoder().decode(payload),
    );
    if (!parsedPayload || typeof parsedPayload !== 'object') {
      return { data: null, error: 'Invalid tracking payload' };
    }

    if (!parsedPayload.data || typeof parsedPayload.data !== 'object') {
      return { data: null, error: 'Invalid tracking payload' };
    }

    return {
      data: parsedPayload.data,
      issuedAt: Number.isFinite(parsedPayload.iat)
        ? new Date(parsedPayload.iat * 1000)
        : undefined,
    };
  } catch (error) {
    return { data: null, error: 'Invalid tracking token' };
  }
}

export function EmailTrackingPixel({
  trackingUrl,
  id = 'analytics',
}: {
  trackingUrl: string;
  id?: string;
}) {
  return (
    <img
      src={trackingUrl}
      id={id}
      width="1"
      height="1"
      alt="namefi"
      style={{
        display: 'block',
        maxHeight: '0px',
        maxWidth: '0px',
        overflow: 'hidden',
      }}
    />
  );
}

export function withEmailTracking<T extends object>(
  Component: React.ComponentType<T>,
): React.ComponentType<T & { trackingUrl?: string | null }> {
  function WrappedComponent(props: T & { trackingUrl?: string | null }) {
    const { trackingUrl, ...rest } = props;
    return (
      <EmailTrackingProvider trackingUrl={trackingUrl ?? null}>
        <Component {...(rest as T)} />
      </EmailTrackingProvider>
    );
  }

  WrappedComponent.displayName = `withEmailTracking(${Component.displayName || Component.name || 'Component'})`;
  return WrappedComponent;
}

type EmailAnalyticsJwtPayload = {
  data: EmailAnalyticsPayload;
  iat: number;
};

const jwtHeader: JwtHeader = {
  alg: 'HS256',
  typ: 'JWT',
};

async function signJwt(payload: EmailAnalyticsJwtPayload, secret: string) {
  const encoder = new TextEncoder();
  return await new CompactSign(encoder.encode(JSON.stringify(payload)))
    .setProtectedHeader(jwtHeader)
    .sign(encoder.encode(secret));
}

async function verifyJwt(token: string, secret: string) {
  const encoder = new TextEncoder();
  return await compactVerify(token, encoder.encode(secret));
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function extractToken(urlOrToken: string) {
  const trimmed = urlOrToken.trim();
  if (!trimmed) {
    return null;
  }
  const urlParser = z.url();
  const parsedUrl = urlParser.safeParse(trimmed);

  if (parsedUrl.success) {
    try {
      const url = new URL(parsedUrl.data);
      const queryToken = url.searchParams.get('token');
      if (queryToken) {
        return queryToken;
      }
    } catch {
      return null;
    }
  }
  return urlOrToken;
}

function coerceToUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    try {
      return new URL(`https://${value}`);
    } catch {
      return null;
    }
  }
}
