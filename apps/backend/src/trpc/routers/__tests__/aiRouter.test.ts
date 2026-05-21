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
const generateUrlFromStoragePathMock = vi.fn(
  (storagePath: string, cloudfrontDomain: string) =>
    `https://${cloudfrontDomain}/${storagePath}`,
);

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
    AI_GENERATION_CREDIT_COSTS: {
      default: 1,
      logo: {
        default: 1,
        models: {
          'gpt-image-2': 2,
        },
      },
      marketing: {
        default: 1,
        models: {
          'gpt-image-2': 2,
        },
      },
      animation: {
        default: 3,
        models: {
          'veo-3.1-generate-preview': 8,
          'veo-3.1-fast-generate-preview': 4,
          'bytedance/seedance-2.0': 3,
          'bytedance/seedance-2.0-fast': 2,
          'bytedance/seedance-v1.0-pro': 3,
          'bytedance/seedance-v1.5-pro': 3,
        },
        modes: {
          'sheet-guided': {
            default: 7,
            models: {
              'bytedance/seedance-2.0': 7,
              'bytedance/seedance-2.0-fast': 6,
            },
          },
        },
      },
    },
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
  generateUrlFromStoragePath: generateUrlFromStoragePathMock,
}));

vi.mock('../../base', () => ({
  createTRPCRouter: (router: unknown) => router,
  protectedProcedure: procedureBuilder,
  publicProcedure: procedureBuilder,
}));

const {
  generateAnimationInputSchema,
  getAiGenerationCreditCost,
  getAiGenerationCreditCostForRow,
  getAnimationStartStateAfterError,
  startLogoAnimationWorkflowWithRecovery,
} = await import('../aiRouter');
const { resolveLogoReferenceDetails } = await import(
  '../ai-generation-references'
);

function expectTRPCErrorCode(action: () => unknown, code: string) {
  try {
    action();
  } catch (error) {
    expect(error).toMatchObject({ code });
    return;
  }

  throw new Error(`Expected TRPC error code ${code}`);
}

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
  it('requires a non-empty reference logo generation id', () => {
    expect(() =>
      generateAnimationInputSchema.parse({
        mode: 'looped',
        domain: 'example.com',
        referenceLogoGenerationId: '',
        model: 'bytedance/seedance-2.0',
      }),
    ).toThrow();
  });

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

describe('resolveLogoReferenceDetails', () => {
  beforeEach(() => {
    generateUrlFromStoragePathMock.mockClear();
  });

  it('rejects a missing or non-owned reference logo', () => {
    expectTRPCErrorCode(
      () =>
        resolveLogoReferenceDetails({
          domain: 'example.com',
          referenceLogoGeneration: undefined,
        }),
      'NOT_FOUND',
    );
  });

  it('rejects a reference that is not a logo output', () => {
    expectTRPCErrorCode(
      () =>
        resolveLogoReferenceDetails({
          domain: 'example.com',
          referenceLogoGeneration: {
            id: 'generation-1',
            domain: 'example.com',
            output: { type: 'marketing', storagePath: 'posters/poster.png' },
          } as any,
        }),
      'NOT_FOUND',
    );
  });

  it('rejects a reference logo for a different domain', () => {
    expectTRPCErrorCode(
      () =>
        resolveLogoReferenceDetails({
          domain: 'example.com',
          referenceLogoGeneration: {
            id: 'logo-1',
            domain: 'other.com',
            output: { type: 'logo', storagePath: 'logos/logo.png' },
          } as any,
        }),
      'BAD_REQUEST',
    );
  });

  it('returns a concrete public URL for a valid owned logo reference', () => {
    const result = resolveLogoReferenceDetails({
      domain: 'example.com',
      referenceLogoGeneration: {
        id: 'logo-1',
        domain: 'example.com',
        output: { type: 'logo', storagePath: 'logos/logo.png' },
      } as any,
    });

    expect(generateUrlFromStoragePathMock).toHaveBeenCalledWith(
      'logos/logo.png',
      'cdn.test',
    );
    expect(result.referenceLogoPublicUrl).toBe(
      'https://cdn.test/logos/logo.png',
    );
    expect(result.referenceLogoGeneration.id).toBe('logo-1');
  });
});

describe('AI generation credit costs', () => {
  it('resolves model-specific costs for logo, poster, and animation generations', () => {
    expect(
      getAiGenerationCreditCost({ type: 'logo', model: 'gpt-image-2' }),
    ).toBe(2);
    expect(
      getAiGenerationCreditCost({ type: 'marketing', model: 'gpt-image-2' }),
    ).toBe(2);
    expect(
      getAiGenerationCreditCost({
        type: 'animation',
        mode: 'looped',
        model: 'bytedance/seedance-2.0',
      }),
    ).toBe(3);
    expect(
      getAiGenerationCreditCost({
        type: 'animation',
        mode: 'looped',
        model: 'bytedance/seedance-2.0-fast',
      }),
    ).toBe(2);
    expect(
      getAiGenerationCreditCost({
        type: 'animation',
        mode: 'cinematic',
        model: 'veo-3.1-generate-preview',
      }),
    ).toBe(8);
  });

  it('falls back to the type default for unknown or historical generation models', () => {
    expect(
      getAiGenerationCreditCost({ type: 'logo', model: 'gpt-image-1' }),
    ).toBe(1);
    expect(getAiGenerationCreditCost({ type: 'marketing' })).toBe(1);
    expect(getAiGenerationCreditCost({ type: 'animation' })).toBe(3);
  });

  it('uses mode-specific animation costs when configured', () => {
    expect(
      getAiGenerationCreditCost({
        type: 'animation',
        mode: 'sheet-guided',
        model: 'bytedance/seedance-2.0',
      }),
    ).toBe(7);
    expect(
      getAiGenerationCreditCost({
        type: 'animation',
        mode: 'sheet-guided',
        model: 'bytedance/seedance-2.0-fast',
      }),
    ).toBe(6);
  });

  it('uses persisted output model metadata when scoring existing rows', () => {
    expect(
      getAiGenerationCreditCostForRow({
        type: 'logo',
        input: {
          type: 'logo',
          logoType: 'let-ai-choose',
          logoStyle: 'let-ai-choose',
          imageModel: 'gpt-image-1',
        },
        output: {
          type: 'logo',
          storagePath: 'logos/example.png',
          imageModel: 'gpt-image-2',
        },
      }),
    ).toBe(2);

    expect(
      getAiGenerationCreditCostForRow({
        type: 'animation',
        input: {
          type: 'animation',
          mode: 'looped',
          motionIntensity: 'subtle',
          motionPreset: 'light-sweep',
          model: 'bytedance/seedance-2.0-fast',
        },
        output: {
          type: 'animation',
          thumbnailStoragePath: 'animations/thumb.png',
          mimeType: 'video/mp4',
          model: 'bytedance/seedance-2.0-fast',
        },
      }),
    ).toBe(2);

    expect(
      getAiGenerationCreditCostForRow({
        type: 'animation',
        input: {
          type: 'animation',
          mode: 'sheet-guided',
          model: 'bytedance/seedance-2.0',
        },
        output: {
          type: 'animation',
          thumbnailStoragePath: 'animations/thumb.png',
          mimeType: 'video/mp4',
          model: 'bytedance/seedance-2.0',
        },
      }),
    ).toBe(7);
  });
});
