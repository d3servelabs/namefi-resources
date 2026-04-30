import { randomBytes } from 'node:crypto';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { config } from '@/lib/env';
import {
  PREVIEW_GATE_COOKIE_HASH,
  PREVIEW_GATE_COOKIE_MAX_AGE_SECONDS,
  PREVIEW_GATE_COOKIE_SALT,
  PREVIEW_GATE_SALT_BYTES,
} from './cookie';
import { previewGateHash } from './hash';
import {
  findMatchingPasscode,
  getTldFromHost,
  getValidPasscodesForTld,
} from './passcode';

const LOG_PREFIX = '[preview-gate/access]';
const ACCESS_CODE_QUERY_PARAM = 'code';

function getHostFromHeaders(h: Headers): string | null {
  const forwarded = h.get('x-forwarded-host');
  if (forwarded) return forwarded;
  return h.get('host');
}

export async function handleAccess(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const redirectUrl = new URL('/', request.url);
  const submitted = requestUrl.searchParams.get(ACCESS_CODE_QUERY_PARAM) ?? '';
  console.log(LOG_PREFIX, 'GET received', {
    configType: config.TYPE,
    codeLength: submitted.length,
    redirectTo: redirectUrl.toString(),
  });

  if (config.TYPE === 'production') {
    console.log(LOG_PREFIX, 'production -> 404');
    return new Response(null, { status: 404 });
  }

  const headersList = await headers();
  const host = getHostFromHeaders(headersList);
  const tld = getTldFromHost(host);
  const validPasscodes = getValidPasscodesForTld(tld);
  console.log(LOG_PREFIX, 'context', {
    host,
    tld,
    validPasscodeCount: validPasscodes.length,
  });

  const matched =
    validPasscodes.length === 0 || submitted.length === 0
      ? null
      : findMatchingPasscode(submitted, validPasscodes);
  if (matched == null) {
    console.log(LOG_PREFIX, 'mismatch -> redirect without unlock', {
      hadCandidates: validPasscodes.length > 0,
      hadCode: submitted.length > 0,
    });
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const salt = randomBytes(PREVIEW_GATE_SALT_BYTES).toString('hex');
  const hash = previewGateHash(matched, salt);
  console.log(LOG_PREFIX, 'match, issuing cookies', {
    saltLength: salt.length,
    hashLength: hash.length,
  });

  const response = NextResponse.redirect(redirectUrl, { status: 303 });
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
  console.log(LOG_PREFIX, 'cookies set, redirecting');
  return response;
}
