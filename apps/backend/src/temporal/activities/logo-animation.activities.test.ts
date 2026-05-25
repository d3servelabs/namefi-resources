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
const generateUrlFromStoragePathMock = vi.fn();
const temporalContextMock = {
  current: vi.fn(() => ({
    cancellationSignal: new AbortController().signal,
    heartbeat: vi.fn(),
  })),
};

vi.mock('#lib/logger', () => ({
  createLogger: () => mockLogger,
}));

vi.mock('@temporalio/activity', () => ({
  Context: temporalContextMock,
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
  generateUrlFromStoragePath: generateUrlFromStoragePathMock,
}));

vi.mock('@namefi-astra/ai', () => ({
  ANIMATION_MOTION_INTENSITY_IDS: ['subtle', 'balanced', 'bold'],
  ANIMATION_SOURCE_MODE_IDS: ['exact-frame', 'subject-reference'],
  CINEMATIC_ANIMATION_MODEL_IDS: [
    'veo-3.1-generate-preview',
    'veo-3.1-fast-generate-preview',
    'gemini-omni-flash',
  ],
  CINEMATIC_ANIMATION_MOTION_PRESET_IDS: ['let-ai-choose', 'orbital-reveal'],
  LOGO_STYLE_INPUT_IDS: ['let-ai-choose'],
  LOGO_TEXT_TREATMENT_INPUT_IDS: ['let-ai-choose'],
  LOGO_TYPE_INPUT_IDS: ['let-ai-choose'],
  LOGO_TYPOGRAPHY_INPUT_IDS: ['let-ai-choose'],
  LOOPED_ANIMATION_MODEL_IDS: [
    'bytedance/seedance-2.0',
    'bytedance/seedance-2.0-fast',
    'gemini-omni-flash',
    'bytedance/seedance-v1.5-pro',
    'bytedance/seedance-v1.0-pro',
  ],
  LOOPED_ANIMATION_MOTION_PRESET_IDS: ['let-ai-choose', 'light-sweep'],
  MARKETING_COLLATERAL_TYPE_INPUT_IDS: ['let_ai_choose'],
  runLogoWorkflow: vi.fn(),
  runMarketingWorkflow: vi.fn(),
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
    generateUrlFromStoragePathMock.mockReset();
    generateUrlFromStoragePathMock.mockReturnValue('https://cdn.test/logo.png');
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
        mode: 'cinematic',
        description: 'Make it cinematic',
        sourceMode: 'exact-frame',
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
        metadata: expect.objectContaining({
          animationFailure: expect.objectContaining({
            message: 'Reference logo logo-1 was not found',
            name: 'Error',
          }),
        }),
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

  it('passes looped animation inputs through to the workflow', async () => {
    const generation = {
      id: 'animation-2',
      type: 'animation',
      status: 'PENDING',
      isDeleted: false,
      startedAt: null,
      finishedAt: null,
      updatedAt: new Date('2026-03-25T00:00:00.000Z'),
      referenceGenerationId: 'logo-2',
      domain: 'brand.xyz',
      metadata: {},
      input: {
        type: 'animation',
        mode: 'looped',
        description: 'Keep it subtle',
        motionPreset: 'light-sweep',
        motionIntensity: 'subtle',
        model: 'bytedance/seedance-v1.5-pro',
      },
      output: {
        type: 'animation',
        thumbnailStoragePath: 'logos/logo-2.png',
        mimeType: 'video/mp4',
        model: 'bytedance/seedance-v1.5-pro',
      },
    };

    const referenceLogo = {
      id: 'logo-2',
      type: 'logo',
      isDeleted: false,
      output: {
        type: 'logo',
        storagePath: 'logos/logo-2.png',
      },
    };

    const selectWhereMock = vi
      .fn()
      .mockResolvedValueOnce([generation])
      .mockResolvedValueOnce([referenceLogo]);
    const selectFromMock = vi.fn(() => ({ where: selectWhereMock }));
    dbMock.select.mockImplementation(() => ({ from: selectFromMock }));

    const returningMock = vi
      .fn()
      .mockResolvedValueOnce([{ ...generation, status: 'PROCESSING' }])
      .mockResolvedValueOnce([]);
    const updateWhereMock = vi.fn(() => ({ returning: returningMock }));
    const updateSetMock = vi.fn(() => ({ where: updateWhereMock }));
    dbMock.update.mockImplementation(() => ({ set: updateSetMock }));

    runLogoAnimationWorkflowMock.mockResolvedValue({
      analysis: {
        mode: 'looped',
        brandAttributes: ['premium'],
        targetAudience: 'Founders',
        rationale: 'Looped polish',
        resolvedMotionPreset: 'light-sweep',
        direction: 'Keep it restrained.',
        model: 'gpt-5.2',
        tokenUsage: undefined,
      },
      prompt: 'Create a seamless loop.',
      video: {
        storagePath: 'animations/video.mp4',
        thumbnailStoragePath: 'animations/source.png',
        url: 'https://cdn.test/animations/video.mp4',
        thumbnailUrl: 'https://cdn.test/animations/source.png',
        model: 'bytedance/seedance-v1.5-pro',
        mimeType: 'video/mp4',
      },
      warnings: [],
      providerMetadata: {},
    });

    await expect(
      generateLogoAnimation({ generationId: generation.id }),
    ).resolves.toEqual({
      generationId: generation.id,
      status: 'SUCCEEDED',
    });

    expect(runLogoAnimationWorkflowMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'looped',
        domain: 'brand.xyz',
        motionPreset: 'light-sweep',
        motionIntensity: 'subtle',
        model: 'bytedance/seedance-v1.5-pro',
        referenceLogoUrl: 'https://cdn.test/logo.png',
      }),
      expect.any(Object),
    );
    expect(updateSetMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          animationMode: 'looped',
          resolvedMotionPreset: 'light-sweep',
        }),
        output: expect.objectContaining({
          model: 'bytedance/seedance-v1.5-pro',
        }),
        status: 'SUCCEEDED',
      }),
    );
  });

  it('passes sheet-guided animation inputs through and stores sheet metadata', async () => {
    const generation = {
      id: 'animation-3',
      type: 'animation',
      status: 'PENDING',
      isDeleted: false,
      startedAt: null,
      finishedAt: null,
      updatedAt: new Date('2026-03-25T00:00:00.000Z'),
      referenceGenerationId: 'logo-3',
      domain: 'brand.xyz',
      metadata: {},
      input: {
        type: 'animation',
        mode: 'sheet-guided',
        description: 'Make it logo-specific',
        model: 'bytedance/seedance-v1.5-pro',
        sheetModel: 'gpt-image-2',
      },
      output: {
        type: 'animation',
        thumbnailStoragePath: 'logos/logo-3.png',
        mimeType: 'video/mp4',
        model: 'bytedance/seedance-v1.5-pro',
      },
    };

    const referenceLogo = {
      id: 'logo-3',
      type: 'logo',
      isDeleted: false,
      output: {
        type: 'logo',
        storagePath: 'logos/logo-3.png',
      },
    };

    const selectWhereMock = vi
      .fn()
      .mockResolvedValueOnce([generation])
      .mockResolvedValueOnce([referenceLogo]);
    const selectFromMock = vi.fn(() => ({ where: selectWhereMock }));
    dbMock.select.mockImplementation(() => ({ from: selectFromMock }));

    const returningMock = vi
      .fn()
      .mockResolvedValueOnce([{ ...generation, status: 'PROCESSING' }])
      .mockResolvedValueOnce([]);
    const updateWhereMock = vi.fn(() => ({ returning: returningMock }));
    const updateSetMock = vi.fn(() => ({ where: updateWhereMock }));
    dbMock.update.mockImplementation(() => ({ set: updateSetMock }));

    runLogoAnimationWorkflowMock.mockResolvedValue({
      analysis: {
        mode: 'sheet-guided',
        brandAttributes: ['precise'],
        targetAudience: 'Founders',
        rationale: 'The mark has geometry worth tracing.',
        direction: 'Trace the mark and settle to the lockup.',
        model: 'gpt-5.2',
        tokenUsage: {
          inputTokens: 11,
          outputTokens: 13,
        },
        logoVisualSummary: 'A sharp symbol with a short wordmark.',
        animationConcept: 'Contour trace into a final lockup.',
        shapeNotes: ['Trace the symbol', 'Settle the wordmark'],
        stagePlan: [
          {
            label: 'Trace',
            timeRange: '0.0s-4.0s',
            visualState: 'Symbol line appears.',
            motionInstruction: 'Draw the outline.',
          },
          {
            label: 'Lockup',
            timeRange: '4.0s-8.0s',
            visualState: 'Logo resolves.',
            motionInstruction: 'Settle the final logo.',
          },
        ],
        sheetPrompt: 'Create the sheet.',
        videoPrompt: 'Follow the sheet.',
      },
      prompt: 'Create an 8-second sheet-guided logo animation.',
      video: {
        storagePath: 'animations/video.mp4',
        thumbnailStoragePath: 'animations/sheet.png',
        url: 'https://cdn.test/animations/video.mp4',
        thumbnailUrl: 'https://cdn.test/animations/sheet.png',
        model: 'bytedance/seedance-v1.5-pro',
        mimeType: 'video/mp4',
      },
      animationSheet: {
        storagePath: 'animations/sheet.png',
        url: 'https://cdn.test/animations/sheet.png',
        model: 'gpt-image-2',
        prompt: 'Create the sheet.',
        tokenUsage: {
          inputTokens: 17,
          outputTokens: 19,
        },
      },
      warnings: [],
      providerMetadata: {},
    });

    await expect(
      generateLogoAnimation({ generationId: generation.id }),
    ).resolves.toEqual({
      generationId: generation.id,
      status: 'SUCCEEDED',
    });

    expect(runLogoAnimationWorkflowMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'sheet-guided',
        domain: 'brand.xyz',
        model: 'bytedance/seedance-v1.5-pro',
        sheetModel: 'gpt-image-2',
        referenceLogoUrl: 'https://cdn.test/logo.png',
      }),
      expect.any(Object),
    );
    expect(updateSetMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          animationMode: 'sheet-guided',
          animationConcept: 'Contour trace into a final lockup.',
          animationSheetPrompt: 'Create the sheet.',
          animationSheetStoragePath: 'animations/sheet.png',
          animationSheetUrl: 'https://cdn.test/animations/sheet.png',
          sheetModel: 'gpt-image-2',
        }),
        output: expect.objectContaining({
          thumbnailStoragePath: 'animations/sheet.png',
          model: 'bytedance/seedance-v1.5-pro',
        }),
        tokenUsage: [
          {
            model: 'gpt-5.2',
            inputTokens: 11,
            outputTokens: 13,
          },
          {
            model: 'gpt-image-2',
            inputTokens: 17,
            outputTokens: 19,
          },
        ],
        status: 'SUCCEEDED',
      }),
    );
    expect(updateSetMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        metadata: expect.not.objectContaining({
          resolvedMotionPreset: expect.anything(),
        }),
      }),
    );
  });
});
