import { describe, expect, it } from 'vitest';

describe('email links base url mapping', () => {
  it('maps every environment to the expected origin', async () => {
    process.env.ENVIRONMENT = 'test';
    process.env.EMAIL_TRACKING_JWT_SECRET = 'test-secret';

    const { baseUrlByEnvironment, getBaseUrlForEnvironment } = await import(
      './email-links'
    );

    const expectedByEnvironment = {
      production: 'https://namefi.io',
      development: 'https://namefi.dev',
      local: 'http://localhost:5050',
      test: 'http://localhost:5050',
      custom: 'https://namefi.io',
      preview: 'https://namefi.io',
    } as const;

    for (const [environment, expected] of Object.entries(
      expectedByEnvironment,
    ) as Array<[keyof typeof expectedByEnvironment, string]>) {
      expect(baseUrlByEnvironment[environment]).toBe(expected);
      expect(getBaseUrlForEnvironment(environment)).toBe(expected);
    }
  });
});
