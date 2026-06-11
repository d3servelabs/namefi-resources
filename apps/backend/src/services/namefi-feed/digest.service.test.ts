import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderNamefiFeedSalesDigest } from './digest.service';

const mocks = vi.hoisted(() => ({
  buildAnimationSummary: vi.fn(),
  buildPicks: vi.fn(),
  dbSelect: vi.fn(),
  formatInsight: vi.fn(),
  generateInsight: vi.fn(),
  generateWordCloudImage: vi.fn(),
  loggerError: vi.fn(),
  loggerWarn: vi.fn(),
  temporalStart: vi.fn(),
  uploadDigestAnimationSourceImage: vi.fn(),
}));

vi.mock('@namefi-astra/ai', () => ({
  MAX_WORD_CLOUD_DOMAINS: 7,
  NAMEFI_FEED_SALES_DIGEST_ANIMATION_EXTERNAL_USER_ID: 'sales-digest',
  NAMEFI_FEED_SALES_DIGEST_ANIMATION_MODEL: 'bytedance/seedance-2.0',
  NAMEFI_FEED_SALES_DIGEST_ANIMATION_SHEET_MODEL: 'gpt-image-2',
  buildNamefiFeedSalesDigestAnimationSummary: mocks.buildAnimationSummary,
  buildNamefiFeedSalesDigestFormattedPicks: mocks.buildPicks,
  formatNamefiFeedSalesDigestInsight: mocks.formatInsight,
  generateNamefiFeedSalesDigestInsight: mocks.generateInsight,
  generateNamefiFeedSalesDigestWordCloudImage: mocks.generateWordCloudImage,
  uploadDigestAnimationSourceImage: mocks.uploadDigestAnimationSourceImage,
}));

vi.mock('@namefi-astra/db', () => ({
  db: {
    select: mocks.dbSelect,
  },
  namefiFeedListingsTable: {},
  salesDigestAnimationsTable: {},
  salesDigestRunsTable: {},
}));

vi.mock('@namefi-astra/storage', () => ({
  createS3Client: vi.fn(() => ({})),
}));

vi.mock('#lib/env', () => ({
  config: {
    AI_BUCKET_FOLDERS: {
      ANIMATIONS: 'animations',
    },
    AWS_REGION: 'us-east-1',
    CLOUD_FRONT_DOMAIN: 'cdn.example.test',
    STORAGE_BUCKET: 'namefi-test',
  },
  secrets: {
    AWS_ACCESS_KEY_ID: 'test-access-key',
    AWS_SECRET_ACCESS_KEY: 'test-secret-key',
  },
}));

vi.mock('#lib/logger', () => ({
  createLogger: vi.fn(() => ({
    error: mocks.loggerError,
    warn: mocks.loggerWarn,
  })),
}));

vi.mock('#temporal/client', () => ({
  temporalClient: {
    workflow: {
      start: mocks.temporalStart,
    },
  },
}));

vi.mock('#temporal/shared', () => ({
  TEMPORAL_QUEUES: {
    DEFAULT: 'default',
  },
}));

vi.mock('#temporal/workflows/public-digest-animation.workflow', () => ({
  generatePublicDigestAnimationWorkflow: vi.fn(),
}));

const entries = [
  {
    domain: 'alpha.com',
    askingPrice: '2500',
    askingCurrency: 'USD',
    purchaseUrl: 'https://example.test/alpha',
    logoUrl: null,
    createdAt: new Date('2026-06-10T16:00:00Z'),
    messageText: 'Alpha.com is listed for sale.',
    sellerUsername: 'seller',
    sellerDisplayName: 'Seller',
    sourceTweetUrl: 'https://x.com/seller/status/1',
  },
  {
    domain: 'bravo.io',
    askingPrice: '4800',
    askingCurrency: 'USD',
    purchaseUrl: 'https://example.test/bravo',
    logoUrl: null,
    createdAt: new Date('2026-06-10T16:10:00Z'),
    messageText: 'Bravo.io is listed for sale.',
    sellerUsername: 'seller',
    sellerDisplayName: 'Seller',
    sourceTweetUrl: 'https://x.com/seller/status/2',
  },
];

describe('renderNamefiFeedSalesDigest', () => {
  beforeEach(() => {
    mocks.buildAnimationSummary.mockReturnValue('Daily digest animation');
    mocks.buildPicks.mockReturnValue([
      {
        domain: 'alpha.com',
        thesis: 'Short .com name with a clear startup brand read.',
        tweetTake: 'Short .com name with a clear startup brand read.',
        tweetPoints: ['Concise and memorable.', 'Broad buyer universe.'],
        sourceTweetUrl: 'https://x.com/seller/status/1',
      },
      {
        domain: 'bravo.io',
        thesis: 'Punchy .io that fits developer tooling.',
        tweetTake: 'Punchy .io that fits developer tooling.',
        tweetPoints: ['Strong tech fit.', 'Easy to say.'],
        sourceTweetUrl: 'https://x.com/seller/status/2',
      },
    ]);
    mocks.dbSelect.mockImplementation(() => {
      throw new Error('database is not available in this test');
    });
    mocks.formatInsight.mockReturnValue(
      'Daily Namefi Feed sales digest summary.',
    );
    mocks.generateInsight.mockResolvedValue({
      context: {},
      insight: {},
    });
    mocks.generateWordCloudImage.mockResolvedValue({
      imageDataUrl: 'data:image/png;base64,dGVzdA==',
      prompt: 'word cloud prompt',
    });
    mocks.temporalStart.mockRejectedValue(
      new Error('animation service unavailable'),
    );
    mocks.uploadDigestAnimationSourceImage.mockResolvedValue({
      mimeType: 'image/png',
      storagePath: 'animations/source.png',
      url: 'https://cdn.example.test/animations/source.png',
    });
  });

  it('retries word cloud image generation before using the required image', async () => {
    mocks.generateWordCloudImage
      .mockRejectedValueOnce(new Error('temporary OpenAI image error'))
      .mockResolvedValueOnce({
        imageDataUrl: 'data:image/png;base64,dGVzdA==',
        prompt: 'word cloud prompt',
      });

    const render = await renderNamefiFeedSalesDigest({
      bounds: {
        start: new Date('2026-06-09T18:00:00Z'),
        end: new Date('2026-06-10T18:00:00Z'),
      },
      entries,
      includeAnimation: false,
      includeImage: true,
    });

    expect(render.imageDataUrl).toBe('data:image/png;base64,dGVzdA==');
    expect(mocks.generateWordCloudImage).toHaveBeenCalledTimes(2);
    expect(mocks.loggerWarn).toHaveBeenCalledWith(
      expect.objectContaining({ attempt: 1, maxAttempts: 2 }),
      'Failed to generate sales digest word cloud image',
    );
  });

  it('uses the generated image as a fallback when animation generation fails', async () => {
    const render = await renderNamefiFeedSalesDigest({
      bounds: {
        start: new Date('2026-06-09T18:00:00Z'),
        end: new Date('2026-06-10T18:00:00Z'),
      },
      entries,
      includeAnimation: true,
      includeImage: true,
    });

    expect(render.imageDataUrl).toBe('data:image/png;base64,dGVzdA==');
    expect(render.animation).toBeNull();
    expect(mocks.temporalStart).toHaveBeenCalledTimes(1);
  });

  it('surfaces the word cloud image error instead of the generic media assertion', async () => {
    mocks.generateWordCloudImage.mockRejectedValue(
      new Error('OpenAI hosted image tool returned no result'),
    );

    await expect(
      renderNamefiFeedSalesDigest({
        bounds: {
          start: new Date('2026-06-09T18:00:00Z'),
          end: new Date('2026-06-10T18:00:00Z'),
        },
        entries,
        includeAnimation: true,
        includeImage: true,
      }),
    ).rejects.toThrow(
      'Namefi Feed sales digest word cloud image generation failed after 2 attempts: OpenAI hosted image tool returned no result',
    );
    expect(mocks.generateWordCloudImage).toHaveBeenCalledTimes(2);
  });
});
