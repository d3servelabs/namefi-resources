import { randomBytes, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { config } from '@/lib/env';
import {
  PREVIEW_GATE_COOKIE_HASH,
  PREVIEW_GATE_COOKIE_MAX_AGE_SECONDS,
  PREVIEW_GATE_COOKIE_SALT,
  PREVIEW_GATE_SALT_BYTES,
} from './cookie';
import { previewGateHash } from './hash';

const LOG_PREFIX = '[preview-gate/unlock]';

function safePasswordEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

const NOT_FOUND_BODY = { error: 'not_found' } as const;

export async function handleUnlock(request: Request): Promise<Response> {
  console.log(LOG_PREFIX, 'POST received', { configType: config.TYPE });

  if (config.TYPE === 'production') {
    console.log(LOG_PREFIX, 'production -> 404');
    return NextResponse.json(NOT_FOUND_BODY, { status: 404 });
  }

  const expected = process.env.FRONTEND_PREVIEW_GATE_PASSWORD ?? '';
  if (expected.length === 0) {
    console.log(LOG_PREFIX, 'FRONTEND_PREVIEW_GATE_PASSWORD unset -> 404');
    return NextResponse.json(NOT_FOUND_BODY, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (err) {
    console.log(LOG_PREFIX, 'invalid body', { err: String(err) });
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const submitted =
    typeof body === 'object' &&
    body !== null &&
    'password' in body &&
    typeof (body as { password: unknown }).password === 'string'
      ? (body as { password: string }).password
      : '';

  console.log(LOG_PREFIX, 'compare', {
    submittedLength: submitted.length,
    expectedLength: expected.length,
  });

  if (!safePasswordEqual(submitted, expected)) {
    console.log(LOG_PREFIX, 'password mismatch -> 401');
    return NextResponse.json({ error: 'invalid_password' }, { status: 401 });
  }

  const salt = randomBytes(PREVIEW_GATE_SALT_BYTES).toString('hex');
  const hash = previewGateHash(expected, salt);
  console.log(LOG_PREFIX, 'password matched, issuing cookies', {
    saltLength: salt.length,
    hashLength: hash.length,
    secure: config.TYPE !== 'local',
  });

  const response = NextResponse.json({ ok: true });
  const cookieOpts = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: config.TYPE !== 'local',
    maxAge: PREVIEW_GATE_COOKIE_MAX_AGE_SECONDS,
    path: '/',
  };
  response.cookies.set({
    name: PREVIEW_GATE_COOKIE_HASH,
    value: hash,
    ...cookieOpts,
  });
  response.cookies.set({
    name: PREVIEW_GATE_COOKIE_SALT,
    value: salt,
    ...cookieOpts,
  });
  console.log(LOG_PREFIX, 'cookies set, returning 200');
  return response;
}
