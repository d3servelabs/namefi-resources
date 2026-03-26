import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockLogger = {
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};
const dbMock = {
  select: vi.fn(),
  update: vi.fn(),
};
const runLogoAnimationWorkflowMock = vi.fn();

vi.mock('#lib/logger', () => ({
  createLogger: () => mockLogger,
}));

vi.mock('#lib/env', () => ({
  config: {
    AI_BUCKET_FOLDERS: {
      ANIMATIONS: 'animations',
    },
    AWS_REGION: 'us-east-1',
    CLOUD_FRONT_DOMAIN: 'cdn.test',
    STORAGE_BUCKET: 'test-bucket',
  },
  secrets: {
    AWS_ACCESS_KEY_ID: 'test-access-key',
    AWS_SECRET_ACCESS_KEY: 'test-secret-key',
  },
}));

vi.mock('@namefi-astra/db', () => ({
  aiGenerationsTable: {},
  db: dbMock,
}));

vi.mock('@namefi-astra/storage', () => ({
  createS3Client: vi.fn(() => ({})),
  generateUrlFromStoragePath: vi.fn(),
}));

vi.mock('@namefi-astra/ai', () => ({
  runLogoAnimationWorkflow: runLogoAnimationWorkflowMock,
}));

const { generateLogoAnimation, heartbeatWhile } = await import(
  './logo-animation.activities'
);

describe('heartbeatWhile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('aborts the in-flight operation when the activity is cancelled', async () => {
    const cancellationController = new AbortController();
    let operationSignal: AbortSignal | undefined;

    const promise = heartbeatWhile(
      (signal) => {
        operationSignal = signal;

        return new Promise((_resolve, reject) => {
          signal.addEventListener(
            'abort',
            () => {
              reject(new Error('operation-aborted'));
            },
            { once: true },
          );
        });
      },
      { stage: 'test' },
      1_000,
      {
        cancellationSignal: cancellationController.signal,
        heartbeat: vi.fn(),
      },
    );

    cancellationController.abort('cancelled');

    await expect(promise).rejects.toThrow('activity-cancelled');
    expect(operationSignal?.aborted).toBe(true);
  });

  it('fails fast when heartbeating fails and does not start the operation', async () => {
    const heartbeatError = new Error('heartbeat-failed');
    const operation = vi.fn();

    await expect(
      heartbeatWhile(operation, { stage: 'test' }, 1_000, {
        cancellationSignal: new AbortController().signal,
        heartbeat: vi.fn(() => {
          throw heartbeatError;
        }),
      }),
    ).rejects.toThrow('heartbeat-failed');

    expect(operation).not.toHaveBeenCalled();
    expect(mockLogger.debug).toHaveBeenCalledWith(
      { details: { stage: 'test' }, error: heartbeatError },
      'Animation activity heartbeat failed; aborting in-flight work',
    );
  });
});

describe('generateLogoAnimation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.select.mockReset();
    dbMock.update.mockReset();
    runLogoAnimationWorkflowMock.mockReset();
  });

  it('fails the claimed animation when the reference logo is missing before pickup', async () => {
    const generation = {
      id: 'animation-1',
      type: 'animation',
      status: 'PENDING',
      isDeleted: false,
      startedAt: null,
      finishedAt: null,
      updatedAt: new Date('2026-03-25T00:00:00.000Z'),
      referenceGenerationId: 'logo-1',
      domain: 'brand.xyz',
      metadata: null,
      input: {
        type: 'animation',
        description: 'Make it cinematic',
        motionPreset: 'let-ai-choose',
        model: 'veo-3.1-generate-preview',
      },
      output: {
        type: 'animation',
        thumbnailStoragePath: 'logos/logo-1.png',
        mimeType: 'video/mp4',
        model: 'veo-3.1-generate-preview',
      },
    };

    const whereGeneration = vi
      .fn()
      .mockResolvedValueOnce([generation])
      .mockResolvedValueOnce([]);
    const fromGeneration = vi.fn(() => ({ where: whereGeneration }));
    dbMock.select.mockImplementation(() => ({ from: fromGeneration }));

    const returningMock = vi
      .fn()
      .mockResolvedValueOnce([{ ...generation, status: 'PROCESSING' }])
      .mockResolvedValueOnce([]);
    const updateWhereMock = vi.fn(() => ({ returning: returningMock }));
    const updateSetMock = vi.fn(() => ({ where: updateWhereMock }));
    dbMock.update.mockImplementation(() => ({ set: updateSetMock }));

    await expect(
      generateLogoAnimation({ generationId: generation.id }),
    ).rejects.toThrow('Reference logo logo-1 was not found');

    expect(runLogoAnimationWorkflowMock).not.toHaveBeenCalled();
    expect(updateSetMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        errorMessage: null,
        status: 'PROCESSING',
      }),
    );
    expect(updateSetMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        errorMessage: 'Reference logo logo-1 was not found',
        status: 'FAILED',
      }),
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      {
        error: expect.any(Error),
        generationId: generation.id,
      },
      'Logo animation generation failed',
    );
  });
});
