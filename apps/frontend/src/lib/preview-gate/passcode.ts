import { timingSafeEqual } from 'node:crypto';

export const PROTECTED_SUFFIXES = [
  '.astra.namefi.dev',
  '.poweredby.namefi.dev',
];

export function getTldFromHost(host: string | null | undefined): string | null {
  if (!host) return null;
  const lower = host.toLowerCase().split(':')[0];
  for (const suffix of PROTECTED_SUFFIXES) {
    if (lower.endsWith(suffix)) {
      const prefix = lower.slice(0, -suffix.length);
      if (prefix.length > 0 && !prefix.includes('.')) return prefix;
    }
  }
  return null;
}

function getCustomPasscodeForTld(tld: string | null): string | null {
  if (!tld) return null;
  const json = process.env.FRONTEND_PREVIEW_GATE_PASSCODES;
  if (!json) return null;
  try {
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed === 'object' && parsed !== null) {
      const candidate = (parsed as Record<string, unknown>)[tld];
      if (typeof candidate === 'string' && candidate.length > 0) {
        return candidate;
      }
    }
  } catch {
    // Malformed JSON — treat as no override.
  }
  return null;
}

function getMasterPasscode(): string | null {
  const value = process.env.FRONTEND_PREVIEW_GATE_PASSWORD ?? '';
  return value.length > 0 ? value : null;
}

/**
 * Passcodes accepted for a given TLD. The master passcode (if configured)
 * always opens every TLD; the per-TLD entry from FRONTEND_PREVIEW_GATE_PASSCODES
 * is an additional accepted code for that TLD only. Falls through to just the
 * master when no per-TLD override exists, and to an empty array when neither
 * is configured (gate is then disabled for that TLD).
 */
export function getValidPasscodesForTld(tld: string | null): string[] {
  const passcodes: string[] = [];
  const custom = getCustomPasscodeForTld(tld);
  if (custom) passcodes.push(custom);
  const master = getMasterPasscode();
  if (master && master !== custom) passcodes.push(master);
  return passcodes;
}

export function safePasscodeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function findMatchingPasscode(
  submitted: string,
  candidates: readonly string[],
): string | null {
  let matched: string | null = null;
  // Walk every candidate so the comparison time doesn't depend on which
  // passcode (or none) matches.
  for (const candidate of candidates) {
    if (safePasscodeEqual(submitted, candidate)) {
      matched = candidate;
    }
  }
  return matched;
}
