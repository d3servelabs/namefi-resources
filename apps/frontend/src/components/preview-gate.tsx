import { cookies, headers } from 'next/headers';
import type { PropsWithChildren } from 'react';
import { config } from '@/lib/env';
import {
  PREVIEW_GATE_COOKIE_HASH,
  PREVIEW_GATE_COOKIE_SALT,
} from '@/lib/preview-gate/cookie';
import { previewGateHash, safeEqualHex } from '@/lib/preview-gate/hash';
import {
  getTldFromHost,
  getValidPasscodesForTld,
} from '@/lib/preview-gate/passcode';
import { PreviewGateForm } from './preview-gate-form';

const FALLBACK_UNOFFICIAL_TLDS: string[] = [
  'namefi',
  'test',
  'nfi',
  'nmfi',
  'uniswap',
  'aave',
  'maker',
  'lido',
  'dydx',
  'lifi',
  'curve',
  'compound',
  'arb',
]; //TODO: replace with request to backend
const LOG_PREFIX = '[preview-gate/check]';

function getHostFromHeaders(h: Headers): string | null {
  const forwarded = h.get('x-forwarded-host');
  if (forwarded) return forwarded;
  return h.get('host');
}

async function isUnlocked(): Promise<boolean> {
  // console.log(LOG_PREFIX, 'enter', { configType: config.TYPE });

  if (config.TYPE === 'production') {
    console.log(LOG_PREFIX, 'production -> passthrough');
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

  const tld = getTldFromHost(host);
  const protectedTld = tld != null && FALLBACK_UNOFFICIAL_TLDS.includes(tld);
  console.log(LOG_PREFIX, 'tld lookup', {
    host,
    tld,
    protectedTld,
    knownTlds: FALLBACK_UNOFFICIAL_TLDS,
  });
  if (!protectedTld) {
    console.log(LOG_PREFIX, 'host not in protected TLD list -> passthrough');
    return true;
  }

  const validPasscodes = getValidPasscodesForTld(tld);
  console.log(LOG_PREFIX, 'valid passcodes', {
    tld,
    count: validPasscodes.length,
  });
  if (validPasscodes.length === 0) {
    console.log(
      LOG_PREFIX,
      'no master or per-tld passcode configured -> passthrough',
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

  // Cookie was issued from one of the valid passcodes; the hash matches if any
  // current passcode reproduces it. (Walk all candidates so the comparison
  // doesn't short-circuit and leak which one matched.)
  let ok = false;
  for (const passcode of validPasscodes) {
    if (safeEqualHex(hash, previewGateHash(passcode, salt))) {
      ok = true;
    }
  }
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
