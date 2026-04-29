import { cookies, headers } from 'next/headers';
import type { PropsWithChildren } from 'react';
import { config } from '@/lib/env';
import { FALLBACK_UNOFFICIAL_TLDS } from '@/components/providers/unofficial-tlds';
import {
  PREVIEW_GATE_COOKIE_HASH,
  PREVIEW_GATE_COOKIE_SALT,
} from '@/lib/preview-gate/cookie';
import { previewGateHash, safeEqualHex } from '@/lib/preview-gate/hash';
import { PreviewGateForm } from './preview-gate-form';

const PROTECTED_SUFFIXES = ['.astra.namefi.dev', '.poweredby.namefi.dev'];

function getHostFromHeaders(h: Headers): string | null {
  const forwarded = h.get('x-forwarded-host');
  if (forwarded) return forwarded;
  return h.get('host');
}

function hostnameMatches(host: string, tlds: readonly string[]): boolean {
  const lower = host.toLowerCase().split(':')[0];
  return PROTECTED_SUFFIXES.some((suffix) =>
    tlds.some((tld) => lower === `${tld}${suffix}`),
  );
}

async function isUnlocked(): Promise<boolean> {
  if (config.TYPE === 'production') return true;

  const expected = process.env.FRONTEND_PREVIEW_GATE_PASSWORD ?? '';
  if (expected.length === 0) return true;

  const headersList = await headers();
  const host = getHostFromHeaders(headersList);
  if (!host || !hostnameMatches(host, FALLBACK_UNOFFICIAL_TLDS)) {
    return true;
  }

  const cookieStore = await cookies();
  const hash = cookieStore.get(PREVIEW_GATE_COOKIE_HASH)?.value;
  const salt = cookieStore.get(PREVIEW_GATE_COOKIE_SALT)?.value;
  if (!hash || !salt) return false;

  return safeEqualHex(hash, previewGateHash(expected, salt));
}

export async function PreviewGate({ children }: PropsWithChildren) {
  if (await isUnlocked()) return <>{children}</>;
  return <PreviewGateForm />;
}
