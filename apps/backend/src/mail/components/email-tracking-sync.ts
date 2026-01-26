import { createHmac, timingSafeEqual } from 'node:crypto';
import type { EmailTrackingData } from './email-tracking';

type EmailTrackingSyncPayload = {
  data: EmailTrackingData;
  iat: number;
};

type JwtHeader = {
  alg: 'HS256';
  typ: 'JWT';
};

const jwtHeader: JwtHeader = {
  alg: 'HS256',
  typ: 'JWT',
};

export function signEmailTrackingTokenSync(
  payload: EmailTrackingSyncPayload,
  secret: string,
) {
  const encodedHeader = base64UrlEncode(JSON.stringify(jwtHeader));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac('sha256', secret)
    .update(unsignedToken)
    .digest('base64url');
  return `${unsignedToken}.${signature}`;
}

export function verifyEmailTrackingTokenSync(
  token: string,
  secret: string,
): EmailTrackingSyncPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = createHmac('sha256', secret)
    .update(unsignedToken)
    .digest('base64url');

  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  const header = safeJsonParse<JwtHeader>(base64UrlDecode(encodedHeader));
  if (!header || header.alg !== 'HS256') {
    return null;
  }

  const payload = safeJsonParse<EmailTrackingSyncPayload>(
    base64UrlDecode(encodedPayload),
  );
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  return payload;
}

function safeEqual(value: string, expected: string) {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  if (valueBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return timingSafeEqual(valueBuffer, expectedBuffer);
}

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf-8');
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}
