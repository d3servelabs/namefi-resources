import { secrets } from '#lib/env';
import { CompactSign, compactVerify } from 'jose';
// biome-ignore lint/style/useImportType: required for react-email
import React from 'react';
import z from 'zod';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type EmailTrackingData = Record<string, JsonValue>;

export type EmailTrackingInfo = {
  trackUrl: string;
  data: EmailTrackingData;
  issuedAt?: Date;
};

export type EmailTrackingUrlResult =
  | { url: string; error?: undefined }
  | { url: null; error: string };

export type EmailTrackingDecodeResult =
  | { data: EmailTrackingData; issuedAt?: Date; error?: undefined }
  | { data: null; error: string };

type JwtHeader = {
  alg: 'HS256';
  typ: 'JWT';
};

type EmailTrackingContextType = {
  trackingUrl: string | null;
};

const EmailTrackingContext = React.createContext<EmailTrackingContextType>({
  trackingUrl: null,
});

export function EmailTrackingProvider(props: {
  trackingUrl?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <EmailTrackingContext.Provider
      value={{ trackingUrl: props.trackingUrl ?? null }}
    >
      {props.children}
    </EmailTrackingContext.Provider>
  );
}

export function useEmailTrackingUrl(trackingUrl?: string | null) {
  const context = React.useContext(EmailTrackingContext);
  if (!context) {
    return trackingUrl ?? null;
  }
  return trackingUrl ?? context.trackingUrl;
}

export async function buildEmailTrackUrl(
  trackingInfo: EmailTrackingInfo,
): Promise<EmailTrackingUrlResult> {
  const secret = secrets.EMAIL_TRACKING_JWT_SECRET;
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
  const payload: EmailTrackingPayload = {
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

  baseUrl.searchParams.set('token', token);

  return { url: baseUrl.toString() };
}

export async function getEmailTrackDataFromUrl(
  urlOrToken: string,
): Promise<EmailTrackingDecodeResult> {
  const secret = secrets.EMAIL_TRACKING_JWT_SECRET;
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

    const parsedPayload = safeJsonParse<EmailTrackingPayload>(
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

export function EmailTrackingPixel({ trackingUrl }: { trackingUrl: string }) {
  return <img src={trackingUrl} width="1" height="1" alt="" />;
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

type EmailTrackingPayload = {
  data: EmailTrackingData;
  iat: number;
};

const jwtHeader: JwtHeader = {
  alg: 'HS256',
  typ: 'JWT',
};

async function signJwt(payload: EmailTrackingPayload, secret: string) {
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
