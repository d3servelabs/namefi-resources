import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkflowNotFoundError } from '@temporalio/common';

const mockLogger = {
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};

const describeMock = vi.fn();
const startMock = vi.fn();

const procedureBuilder = {
  input: vi.fn(() => procedureBuilder),
  mutation: vi.fn(() => procedureBuilder),
  output: vi.fn(() => procedureBuilder),
  query: vi.fn(() => procedureBuilder),
};

vi.mock('#lib/logger', () => ({
  createLogger: () => mockLogger,
}));

vi.mock('#lib/env', () => ({
  config: {
    AI_BUCKET_FOLDERS: {
      LOGOS: 'logos',
      SOCIAL: 'social',
      ANIMATIONS: 'animations',
    },
    CLOUD_FRONT_DOMAIN: 'cdn.test',
    MAX_AI_GENERATIONS_PER_USER_PER_MONTH: 25,
    STORAGE_BUCKET: 'test-bucket',
    AWS_REGION: 'us-east-1',
  },
  secrets: {
    AWS_ACCESS_KEY_ID: 'test-access-key',
    AWS_SECRET_ACCESS_KEY: 'test-secret-key',
  },
}));

vi.mock('#temporal/client', () => ({
  temporalClient: {
    workflow: {
      start: startMock,
      getHandle: vi.fn(() => ({
        describe: describeMock,
      })),
    },
  },
}));

vi.mock('#temporal/shared', () => ({
  TEMPORAL_QUEUES: {
    DEFAULT: 'default',
  },
}));

vi.mock('#temporal/workflows/logo-animation.workflow', () => ({
  generateLogoAnimationWorkflow: vi.fn(),
}));

vi.mock('@namefi-astra/db', () => ({
  db: {},
}));

vi.mock('@namefi-astra/db/schema', () => ({
  aiGenerationsTable: {},
  internalAiGenerationsTable: {},
}));

vi.mock('@namefi-astra/ai', () => ({
  ANIMATION_MOTION_INTENSITY_IDS: ['subtle', 'balanced', 'bold'],
  ANIMATION_SOURCE_MODE_IDS: ['exact-frame', 'subject-reference'],
  CINEMATIC_ANIMATION_MODEL_IDS: [
    'veo-3.1-generate-preview',
    'veo-3.1-fast-generate-preview',
  ],
  CINEMATIC_ANIMATION_MOTION_PRESET_IDS: ['let-ai-choose', 'orbital-reveal'],
  LOGO_STYLE_INPUT_IDS: ['let-ai-choose'],
  LOGO_TEXT_TREATMENT_INPUT_IDS: ['let-ai-choose'],
  LOGO_TYPE_INPUT_IDS: ['let-ai-choose'],
  LOGO_TYPOGRAPHY_INPUT_IDS: ['let-ai-choose'],
  LOOPED_ANIMATION_MODEL_IDS: [
    'bytedance/seedance-2.0',
    'bytedance/seedance-2.0-fast',
    'bytedance/seedance-v1.5-pro',
    'bytedance/seedance-v1.0-pro',
  ],
  LOOPED_ANIMATION_MOTION_PRESET_IDS: ['let-ai-choose', 'light-sweep'],
  MARKETING_COLLATERAL_TYPE_INPUT_IDS: ['let_ai_choose'],
  runLogoWorkflow: vi.fn(),
  runMarketingWorkflow: vi.fn(),
}));

vi.mock('@namefi-astra/storage', () => ({
  createS3Client: vi.fn(() => ({})),
  generateUrlFromStoragePath: vi.fn(),
}));

vi.mock('../../base', () => ({
  createTRPCRouter: (router: unknown) => router,
  protectedProcedure: procedureBuilder,
  publicProcedure: procedureBuilder,
}));

const {
  generateAnimationInputSchema,
  getAnimationStartStateAfterError,
  startLogoAnimationWorkflowWithRecovery,
} = await import('../aiRouter');

describe('getAnimationStartStateAfterError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    describeMock.mockReset();
    startMock.mockReset();
  });

  it('treats a workflow as started when describe succeeds after an initial not-found race', async () => {
    describeMock
      .mockRejectedValueOnce(
        new WorkflowNotFoundError('Workflow not found', 'wid-1', undefined),
      )
      .mockResolvedValueOnce({});

    await expect(getAnimationStartStateAfterError('wid-1')).resolves.toBe(
      'started',
    );
    expect(describeMock).toHaveBeenCalledTimes(2);
  });

  it('returns not-found after two not-found checks', async () => {
    describeMock.mockRejectedValue(
      new WorkflowNotFoundError('Workflow not found', 'wid-2', undefined),
    );

    await expect(getAnimationStartStateAfterError('wid-2')).resolves.toBe(
      'not-found',
    );
    expect(describeMock).toHaveBeenCalledTimes(2);
  });

  it('returns unknown for unexpected describe errors', async () => {
    const describeError = new Error('temporal unavailable');
    describeMock.mockRejectedValue(describeError);

    await expect(getAnimationStartStateAfterError('wid-3')).resolves.toBe(
      'unknown',
    );

    expect(mockLogger.warn).toHaveBeenCalledWith(
      { attempt: 1, error: describeError, workflowId: 'wid-3' },
      'Unable to verify animation workflow existence after start failure',
    );
  });
});

describe('startLogoAnimationWorkflowWithRecovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    describeMock.mockReset();
    startMock.mockReset();
  });

  it('retries start with USE_EXISTING after an initial start failure', async () => {
    const startError = new Error('connection dropped');

    startMock.mockRejectedValueOnce(startError).mockResolvedValueOnce({});

    await expect(
      startLogoAnimationWorkflowWithRecovery({
        generationId: 'generation-1',
        workflowId: 'logo-animation-generation-1',
      }),
    ).resolves.toEqual({ state: 'started' });

    expect(startMock).toHaveBeenNthCalledWith(
      1,
      expect.any(Function),
      expect.objectContaining({
        workflowId: 'logo-animation-generation-1',
        workflowIdConflictPolicy: 'FAIL',
      }),
    );
    expect(startMock).toHaveBeenNthCalledWith(
      2,
      expect.any(Function),
      expect.objectContaining({
        workflowId: 'logo-animation-generation-1',
        workflowIdConflictPolicy: 'USE_EXISTING',
      }),
    );
    expect(mockLogger.warn).toHaveBeenCalledWith(
      {
        error: startError,
        generationId: 'generation-1',
        workflowId: 'logo-animation-generation-1',
      },
      'Animation workflow start failed; retrying with workflow reconciliation',
    );
  });

  it('returns unknown when recovery still cannot confirm workflow existence', async () => {
    const startError = new Error('connection dropped');
    const retryError = new Error('temporal unavailable');

    startMock
      .mockRejectedValueOnce(startError)
      .mockRejectedValueOnce(retryError)
      .mockRejectedValueOnce(retryError);
    describeMock.mockRejectedValue(retryError);

    await expect(
      startLogoAnimationWorkflowWithRecovery({
        generationId: 'generation-2',
        workflowId: 'logo-animation-generation-2',
      }),
    ).resolves.toEqual({ error: startError, state: 'unknown' });

    expect(startMock).toHaveBeenCalledTimes(3);
    expect(describeMock).toHaveBeenCalledTimes(2);
  });
});

describe('generateAnimationInputSchema', () => {
  it('accepts cinematic animation inputs', () => {
    expect(
      generateAnimationInputSchema.parse({
        mode: 'cinematic',
        domain: 'example.com',
        referenceLogoGenerationId: 'logo-1',
        sourceMode: 'subject-reference',
        motionPreset: 'orbital-reveal',
        model: 'veo-3.1-generate-preview',
      }),
    ).toEqual(
      expect.objectContaining({
        mode: 'cinematic',
        sourceMode: 'subject-reference',
      }),
    );
  });

  it('accepts looped animation inputs', () => {
    expect(
      generateAnimationInputSchema.parse({
        mode: 'looped',
        domain: 'example.com',
        referenceLogoGenerationId: 'logo-1',
        motionPreset: 'light-sweep',
        motionIntensity: 'subtle',
        model: 'bytedance/seedance-v1.5-pro',
      }),
    ).toEqual(
      expect.objectContaining({
        mode: 'looped',
        motionIntensity: 'subtle',
      }),
    );
  });

  it('accepts sheet-guided animation inputs with GPT Image 2', () => {
    expect(
      generateAnimationInputSchema.parse({
        mode: 'sheet-guided',
        domain: 'example.com',
        referenceLogoGenerationId: 'logo-1',
        model: 'bytedance/seedance-2.0',
      }),
    ).toEqual(
      expect.objectContaining({
        mode: 'sheet-guided',
        model: 'bytedance/seedance-2.0',
        sheetModel: 'gpt-image-2',
      }),
    );
  });

  it('rejects cross-mode field combinations', () => {
    expect(() =>
      generateAnimationInputSchema.parse({
        mode: 'looped',
        domain: 'example.com',
        referenceLogoGenerationId: 'logo-1',
        motionPreset: 'light-sweep',
        motionIntensity: 'subtle',
        model: 'veo-3.1-generate-preview',
      }),
    ).toThrow();

    expect(() =>
      generateAnimationInputSchema.parse({
        mode: 'cinematic',
        domain: 'example.com',
        referenceLogoGenerationId: 'logo-1',
        sourceMode: 'exact-frame',
        motionPreset: 'orbital-reveal',
        motionIntensity: 'subtle',
        model: 'veo-3.1-generate-preview',
      }),
    ).toThrow();

    expect(() =>
      generateAnimationInputSchema.parse({
        mode: 'sheet-guided',
        domain: 'example.com',
        referenceLogoGenerationId: 'logo-1',
        motionPreset: 'orbital-reveal',
        model: 'bytedance/seedance-2.0',
      }),
    ).toThrow();
  });
});
