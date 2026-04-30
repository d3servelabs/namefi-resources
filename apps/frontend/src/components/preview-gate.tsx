import { cookies, headers } from 'next/headers';
import type { PropsWithChildren } from 'react';
import { config } from '@/lib/env';
import {
  PREVIEW_GATE_COOKIE_HASH,
  PREVIEW_GATE_COOKIE_SALT,
} from '@/lib/preview-gate/cookie';
import { previewGateHash, safeEqualHex } from '@/lib/preview-gate/hash';
import { PreviewGateForm } from './preview-gate-form';

const FALLBACK_UNOFFICIAL_TLDS: string[] = [
  'namefi',
  'test',
  'nfi',
  'nmfi',
  'uniswap',
  'aave',
  'maker',
]; //TODO: replace with request to backend
const PROTECTED_SUFFIXES = ['.astra.namefi.dev', '.poweredby.namefi.dev'];
const LOG_PREFIX = '[preview-gate/check]';

function getHostFromHeaders(h: Headers): string | null {
  const forwarded = h.get('x-forwarded-host');
  if (forwarded) return forwarded;
  return h.get('host');
}

function hostnameMatches(host: string, tlds: readonly string[] = []): boolean {
  const lower = host.toLowerCase().split(':')[0];
  return PROTECTED_SUFFIXES.some((suffix) =>
    tlds.some((tld) => lower === `${tld}${suffix}`),
  );
}

async function isUnlocked(): Promise<boolean> {
  console.log(LOG_PREFIX, 'enter', { configType: config.TYPE });

  if (config.TYPE === 'production') {
    console.log(LOG_PREFIX, 'production -> passthrough');
    return true;
  }

  const expected = process.env.FRONTEND_PREVIEW_GATE_PASSWORD ?? '';
  if (expected.length === 0) {
    console.log(
      LOG_PREFIX,
      'FRONTEND_PREVIEW_GATE_PASSWORD unset -> passthrough',
    );
    return true;
  }

  const headersList = await headers();
  const host = getHostFromHeaders(headersList);
  console.log(LOG_PREFIX, 'host', {
    host,
    xForwardedHost: headersList.get('x-forwarded-host'),
    rawHost: headersList.get('host'),
  });
  if (!host) {
    console.log(LOG_PREFIX, 'no host header -> passthrough');
    return true;
  }

  const matched = hostnameMatches(host, FALLBACK_UNOFFICIAL_TLDS);
  console.log(LOG_PREFIX, 'hostname match', {
    host,
    matched,
    suffixes: PROTECTED_SUFFIXES,
    tlds: FALLBACK_UNOFFICIAL_TLDS,
  });
  if (!matched) {
    console.log(
      LOG_PREFIX,
      'host does not match protected pattern -> passthrough',
    );
    return true;
  }

  const cookieStore = await cookies();
  const hash = cookieStore.get(PREVIEW_GATE_COOKIE_HASH)?.value;
  const salt = cookieStore.get(PREVIEW_GATE_COOKIE_SALT)?.value;
  console.log(LOG_PREFIX, 'cookies', {
    hashPresent: !!hash,
    saltPresent: !!salt,
    hashLength: hash?.length,
    saltLength: salt?.length,
  });
  if (!hash || !salt) {
    console.log(LOG_PREFIX, 'cookie missing -> locked');
    return false;
  }

  const expectedHash = previewGateHash(expected, salt);
  const ok = safeEqualHex(hash, expectedHash);
  console.log(LOG_PREFIX, 'hash compare', { ok });
  return ok;
}

export async function PreviewGate({ children }: PropsWithChildren) {
  const unlocked = await isUnlocked();
  console.log(LOG_PREFIX, 'render', {
    unlocked,
    rendering: unlocked ? 'children' : 'form',
  });
  if (unlocked) return <>{children}</>;
  return <PreviewGateForm />;
}
