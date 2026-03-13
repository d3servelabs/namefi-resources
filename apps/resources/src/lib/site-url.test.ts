import { afterEach, describe, expect, it } from 'vitest';
import { resolveBaseUrl } from '@/lib/site-url';

const ENV_KEYS = [
  'CANONICAL_SITE_URL',
  'FIRST_PARTY_DEPLOYMENT_URL',
  'NEXT_PUBLIC_FIRST_PARTY_DEPLOYMENT_URL',
  'NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL',
  'ENVIRONMENT',
  'NODE_ENV',
] as const;

const ORIGINAL_ENV = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
) as Record<(typeof ENV_KEYS)[number], string | undefined>;

function clearSiteUrlEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

function restoreSiteUrlEnv() {
  for (const key of ENV_KEYS) {
    const value = ORIGINAL_ENV[key];
    if (value === undefined) {
      delete process.env[key];
      continue;
    }
    process.env[key] = value;
  }
}

describe('resolveBaseUrl', () => {
  afterEach(() => {
    restoreSiteUrlEnv();
  });

  it('maps legacy production resources host to first-party origin', () => {
    clearSiteUrlEnv();
    process.env.CANONICAL_SITE_URL = 'https://r.namefi.io';
    expect(resolveBaseUrl()).toBe('https://namefi.io');
  });

  it('maps legacy first-party deployment host to first-party origin', () => {
    clearSiteUrlEnv();
    process.env.FIRST_PARTY_DEPLOYMENT_URL = 'https://r.namefi.io';
    expect(resolveBaseUrl()).toBe('https://namefi.io');
  });

  it('keeps first-party origin unchanged', () => {
    clearSiteUrlEnv();
    process.env.FIRST_PARTY_DEPLOYMENT_URL = 'https://namefi.io';
    expect(resolveBaseUrl()).toBe('https://namefi.io');
  });
});
