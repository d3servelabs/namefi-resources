import { describe, expect, it, vi } from 'vitest';

vi.mock('../env', () => ({
  secrets: {
    OPENAI_API_KEY: 'test-openai-key',
    GEMINI_API_KEY: 'test-gemini-key',
  },
}));

const { marketingWorkflowInputSchema } = await import('./marketing-workflow');

describe('marketingWorkflowInputSchema', () => {
  it('requires a reference logo url', () => {
    const result = marketingWorkflowInputSchema.safeParse({
      domain: 'example.com',
      storage: {},
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.path.includes('referenceLogoUrl'),
        ),
      ).toBe(true);
    }
  });

  it('accepts a reference logo url', () => {
    expect(
      marketingWorkflowInputSchema.parse({
        domain: 'example.com',
        storage: {},
        referenceLogoUrl: 'https://cdn.test/logo.png',
      }),
    ).toMatchObject({
      domain: 'example.com',
      referenceLogoUrl: 'https://cdn.test/logo.png',
    });
  });
});
