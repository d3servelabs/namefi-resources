import { beforeAll, describe, expect, it } from 'vitest';

type SkipAuthModule = typeof import('./skip-auth');

let skipAuth: SkipAuthModule;

beforeAll(async () => {
  process.env.LOADED_CONFIG = JSON.stringify({
    TYPE: 'local',
    BACKEND_URL: 'http://localhost:3000',
    RESOURCES_URL: 'http://localhost:3002',
    DOCS_URL: 'http://localhost:3003',
    FIRST_PARTY_DEPLOYMENT_URL: 'http://localhost:3001',
    GA_MEASUREMENT_ID: 'G-TEST',
    PRIVY_APP_ID: 'test-privy-app-id',
    STRIPE_PUBLISHABLE_KEY: 'pk_test',
  });
  skipAuth = await import('./skip-auth');
});

describe('isSkipAuthAllowedEnvironment', () => {
  it('preserves the frontend skip-auth environment gate', () => {
    expect(skipAuth.isSkipAuthAllowedEnvironment('local')).toBe(true);
    expect(skipAuth.isSkipAuthAllowedEnvironment('development')).toBe(true);
    expect(skipAuth.isSkipAuthAllowedEnvironment('preview')).toBe(true);
    expect(skipAuth.isSkipAuthAllowedEnvironment('production')).toBe(false);
    expect(skipAuth.isSkipAuthAllowedEnvironment('custom')).toBe(false);
  });
});
