import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { config } from '@/lib/env';
import {
  PREVIEW_GATE_COOKIE_HASH,
  PREVIEW_GATE_COOKIE_MAX_AGE_SECONDS,
  PREVIEW_GATE_COOKIE_SALT,
  PREVIEW_GATE_SALT_BYTES,
} from './cookie';
import { previewGateHash } from './hash';
import { timingSafeEqual } from 'node:crypto';

function safePasswordEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

const NOT_FOUND_BODY = { error: 'not_found' } as const;

export async function handleUnlock(request: Request): Promise<Response> {
  if (config.TYPE === 'production') {
    return NextResponse.json(NOT_FOUND_BODY, { status: 404 });
  }

  const expected = process.env.FRONTEND_PREVIEW_GATE_PASSWORD ?? '';
  if (expected.length === 0) {
    return NextResponse.json(NOT_FOUND_BODY, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const submitted =
    typeof body === 'object' &&
    body !== null &&
    'password' in body &&
    typeof (body as { password: unknown }).password === 'string'
      ? (body as { password: string }).password
      : '';

  if (!safePasswordEqual(submitted, expected)) {
    return NextResponse.json({ error: 'invalid_password' }, { status: 401 });
  }

  const salt = randomBytes(PREVIEW_GATE_SALT_BYTES).toString('hex');
  const hash = previewGateHash(expected, salt);

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
  return response;
}
