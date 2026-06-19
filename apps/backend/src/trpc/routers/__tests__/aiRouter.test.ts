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
const dbSelectMock = vi.fn();
const dbUpdateMock = vi.fn();
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

vi.mock('#temporal/workflows/studio-generation.workflow', () => ({
  generateStudioAnimationWorkflow: vi.fn(),
  generateStudioLogoWorkflow: vi.fn(),
  generateStudioPosterWorkflow: vi.fn(),
}));

vi.mock('@namefi-astra/common/ai-generation-credits', async () => {
  const { z } = await import('zod');
  const aiGenerationCreditCostSchema = z.number().int().min(0).max(1_000);
  const aiGenerationModeCreditCostsSchema = z.object({
    default: aiGenerationCreditCostSchema.optional(),
    models: z.record(z.string(), aiGenerationCreditCostSchema).default({}),
  });
  const aiGenerationTypeCreditCostsSchema = z.object({
    default: aiGenerationCreditCostSchema.optional(),
    models: z.record(z.string(), aiGenerationCreditCostSchema).default({}),
    modes: z.record(z.string(), aiGenerationModeCreditCostsSchema).default({}),
  });

  function getAiGenerationCreditCost(params: {
    mode?: string;
    model?: string;
    type: 'animation' | 'logo' | 'marketing';
  }) {
    const costs = {
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
    } as const;
    const typeCosts = costs[params.type] as {
      default: number;
      models: Record<string, number>;
      modes?: Record<
        string,
        { default?: number; models: Record<string, number> }
      >;
    };
    const modeCosts =
      params.type === 'animation' && params.mode
        ? typeCosts.modes?.[params.mode]
        : undefined;

    if (modeCosts && params.model) {
      return modeCosts.models[params.model] ?? modeCosts.default;
    }

    if (params.model) {
      return typeCosts.models[params.model] ?? typeCosts.default;
    }

    return typeCosts.default;
  }

  return {
    aiGenerationCreditCostsSchema: z.object({
      default: aiGenerationCreditCostSchema,
      logo: aiGenerationTypeCreditCostsSchema,
      marketing: aiGenerationTypeCreditCostsSchema,
      animation: aiGenerationTypeCreditCostsSchema,
      leadgen: aiGenerationTypeCreditCostsSchema,
      leadgenOutreach: aiGenerationTypeCreditCostsSchema,
    }),
    getAiGenerationCreditCost,
    getAiTokenUsageCreditCost: vi.fn(() => 0),
    getLeadgenRunCreditEstimate: vi.fn(() => 0),
  };
});

vi.mock('@namefi-astra/db', () => ({
  db: {
    select: dbSelectMock,
    update: dbUpdateMock,
  },
}));

const mockColumn = (name: string) => ({ name });
const mockSqlToken = { as: vi.fn(() => ({})) };

vi.mock('@namefi-astra/db/schema', () => ({
  aiCreditAwardsTable: {
    amountCredits: mockColumn('ai_credit_awards.amount_credits'),
    expiresAt: mockColumn('ai_credit_awards.expires_at'),
    userId: mockColumn('ai_credit_awards.user_id'),
  },
  aiGenerationsTable: {
    createdAt: mockColumn('ai_generations.created_at'),
    domain: mockColumn('ai_generations.domain'),
    id: mockColumn('ai_generations.id'),
    input: mockColumn('ai_generations.input'),
    isDeleted: mockColumn('ai_generations.is_deleted'),
    metadata: mockColumn('ai_generations.metadata'),
    output: mockColumn('ai_generations.output'),
    status: mockColumn('ai_generations.status'),
    type: mockColumn('ai_generations.type'),
    updatedAt: mockColumn('ai_generations.updated_at'),
    userId: mockColumn('ai_generations.user_id'),
  },
  internalAiGenerationsTable: {
    createdAt: mockColumn('internal_ai_generations.created_at'),
    domain: mockColumn('internal_ai_generations.domain'),
  },
  leadgenEventsTable: {
    createdAt: mockColumn('leadgen_events.created_at'),
    eventType: mockColumn('leadgen_events.event_type'),
    payload: mockColumn('leadgen_events.payload'),
    runId: mockColumn('leadgen_events.run_id'),
  },
  leadgenRunsTable: {
    createdAt: mockColumn('leadgen_runs.created_at'),
    id: mockColumn('leadgen_runs.id'),
    metadata: mockColumn('leadgen_runs.metadata'),
    reasoningEffort: mockColumn('leadgen_runs.reasoning_effort'),
    status: mockColumn('leadgen_runs.status'),
    tokenUsage: mockColumn('leadgen_runs.token_usage'),
    userId: mockColumn('leadgen_runs.user_id'),
  },
}));

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...conditions: unknown[]) => ({ conditions, type: 'and' })),
  count: vi.fn(() => mockSqlToken),
  desc: vi.fn((column: unknown) => ({ column, type: 'desc' })),
  eq: vi.fn((left: unknown, right: unknown) => ({ left, right, type: 'eq' })),
  inArray: vi.fn((left: unknown, values: unknown[]) => ({
    left,
    type: 'inArray',
    values,
  })),
  max: vi.fn(() => mockSqlToken),
  ne: vi.fn((left: unknown, right: unknown) => ({ left, right, type: 'ne' })),
  sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
    strings,
    type: 'sql',
    values,
  })),
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
  getLeadgenPrimaryResearchModel: vi.fn(() => 'gpt-5-mini'),
  runLogoWorkflow: vi.fn(),
  runMarketingWorkflow: vi.fn(),
}));

vi.mock('@namefi-astra/storage', () => ({
  createS3Client: vi.fn(() => ({})),
  generateUrlFromStoragePath: generateUrlFromStoragePathMock,
}));

vi.mock('@namefi-astra/utils', async () => {
  const { z } = await import('zod');

  return {
    namefiNormalizedDomainSchema: z.string(),
  };
});

vi.mock('../../base', () => ({
  createTRPCRouter: (router: unknown) => router,
  protectedProcedure: procedureBuilder,
  publicProcedure: procedureBuilder,
}));

const {
  canViewFullAiGenerationRecord,
  generateAnimationInputSchema,
  getAiGenerationCreditCost,
  getAiGenerationCreditCostForRow,
  getAnimationStartStateAfterError,
  getActiveAiCreditAwardCredits,
  getUserGenerationCreditUsage,
  isPublicAiGenerationVisible,
  mapAiGenerationRecordForViewer,
  startAiGenerationWorkflowWithRecovery,
  startLogoAnimationWorkflowWithRecovery,
} = await import('../aiRouter');
const { resolveLogoReferenceDetails } = await import(
  '../ai-generation-references'
);

type TestAiGenerationRow = Parameters<typeof mapAiGenerationRecordForViewer>[0];

type SelectResult = unknown[] | Promise<unknown[]>;

function createSelectBuilder(result: SelectResult) {
  const where = vi.fn(() => result);
  const innerJoin = vi.fn(() => ({ where }));
  const from = vi.fn(() => ({ innerJoin, where }));

  return { from };
}

function queueDbSelectResults(...results: SelectResult[]) {
  const queuedResults = [...results];
  dbSelectMock.mockImplementation(() => {
    const result = queuedResults.shift();
    if (!result) {
      throw new Error('Unexpected db.select call');
    }
    return createSelectBuilder(result);
  });
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((innerResolve) => {
    resolve = innerResolve;
  });
  return { promise, resolve };
}

function createLogoGenerationRows(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    input: { type: 'logo' },
    output: { storagePath: `logos/${index}.png`, type: 'logo' },
    type: 'logo',
  }));
}

function createAiGenerationRow(
  overrides: Partial<TestAiGenerationRow> = {},
): TestAiGenerationRow {
  const now = new Date('2026-01-02T03:04:05.000Z');

  return {
    createdAt: now,
    domain: 'example.com',
    errorMessage: null,
    featured: false,
    finishedAt: now,
    id: 'generation-1',
    input: {
      type: 'animation',
      mode: 'sheet-guided',
      description: 'private customer animation prompt',
      model: 'bytedance/seedance-2.0',
    },
    isDeleted: false,
    metadata: {
      animationSheetPrompt: 'private sheet prompt',
      animationSheetUrl: 'https://cdn.test/animations/sheet.png',
      providerMetadata: { requestId: 'provider-secret' },
      prompt: 'private rendered video prompt',
      resolvedMotionPreset: 'light-sweep',
      sheetModel: 'gpt-image-2',
      videoPrompt: 'private video prompt',
      workflowStartState: 'CONFIRMED',
    },
    output: {
      type: 'animation',
      storagePath: 'animations/output.mp4',
      thumbnailStoragePath: 'animations/thumb.png',
      mimeType: 'video/mp4',
      model: 'bytedance/seedance-2.0',
    },
    referenceGenerationId: 'logo-generation-1',
    startedAt: now,
    status: 'SUCCEEDED',
    tokenUsage: [
      {
        inputTokens: 123,
        model: 'secret-token-model',
        outputTokens: 456,
      },
    ],
    type: 'animation',
    updatedAt: now,
    userId: 'user-1',
    ...overrides,
  } as TestAiGenerationRow;
}

function expectTRPCErrorCode(action: () => unknown, code: string) {
  try {
    action();
  } catch (error) {
    expect(error).toMatchObject({ code });
    return;
  }

  throw new Error(`Expected TRPC error code ${code}`);
}

describe('getActiveAiCreditAwardCredits', () => {
  beforeEach(() => {
    dbSelectMock.mockReset();
    dbUpdateMock.mockReset();
  });

  it('returns zero when the aggregate query has no row', async () => {
    queueDbSelectResults([]);

    await expect(getActiveAiCreditAwardCredits('user-1')).resolves.toBe(0);
  });

  it('returns the summed credits for active awards', async () => {
    queueDbSelectResults([{ credits: 15 }]);

    await expect(getActiveAiCreditAwardCredits('user-1')).resolves.toBe(15);
  });

  it('returns zero when expired awards are excluded by the query', async () => {
    queueDbSelectResults([{ credits: 0 }]);

    await expect(getActiveAiCreditAwardCredits('user-1')).resolves.toBe(0);
  });

  it('returns only active credits for mixed active and expired awards', async () => {
    queueDbSelectResults([{ credits: 7 }]);

    await expect(getActiveAiCreditAwardCredits('user-1')).resolves.toBe(7);
  });

  it('sums active awards regardless of which admin granted them', async () => {
    queueDbSelectResults([{ credits: 18 }]);

    await expect(getActiveAiCreditAwardCredits('user-1')).resolves.toBe(18);
  });
});

describe('awarded credits integration', () => {
  beforeEach(() => {
    dbSelectMock.mockReset();
    dbUpdateMock.mockReset();
  });

  it('adds awarded credits to the monthly limit and remaining balance', async () => {
    queueDbSelectResults(
      [], // pending unconfirmed animations to reconcile
      [{ credits: 10 }],
      createLogoGenerationRows(26),
      [],
      [],
    );

    await expect(getUserGenerationCreditUsage('user-1')).resolves.toMatchObject(
      {
        awardedCredits: 10,
        baseMaxCredits: 25,
        currentCredits: 26,
        hasReachedLimit: false,
        maxCredits: 35,
        remainingCredits: 9,
      },
    );
  });

  it('starts the awarded-credit lookup before current usage has finished', async () => {
    const pendingAnimations = createDeferred<unknown[]>();
    const awardedCredits = createDeferred<unknown[]>();

    queueDbSelectResults(
      pendingAnimations.promise,
      awardedCredits.promise,
      createLogoGenerationRows(25),
      [],
      [],
    );

    const usagePromise = getUserGenerationCreditUsage('user-1');

    expect(dbSelectMock).toHaveBeenCalledTimes(2);

    pendingAnimations.resolve([]);
    awardedCredits.resolve([{ credits: 10 }]);

    await expect(usagePromise).resolves.toMatchObject({
      awardedCredits: 10,
      currentCredits: 25,
      maxCredits: 35,
      remainingCredits: 10,
    });
    expect(dbSelectMock).toHaveBeenCalledTimes(5);
  });
});

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
      'Unable to verify AI generation workflow existence after start failure',
    );
  });
});

describe('startAiGenerationWorkflowWithRecovery', () => {
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
        generationType: 'animation',
        generationId: 'generation-1',
        workflowId: 'logo-animation-generation-1',
      },
      'AI generation workflow start failed; retrying with workflow reconciliation',
    );
  });

  it('can start a logo generation workflow through the shared helper', async () => {
    startMock.mockResolvedValueOnce({});

    await expect(
      startAiGenerationWorkflowWithRecovery({
        generationId: 'generation-3',
        generationType: 'logo',
        workflowId: 'logo-generation-generation-3',
      }),
    ).resolves.toEqual({ state: 'started' });

    expect(startMock).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        workflowId: 'logo-generation-generation-3',
        workflowIdConflictPolicy: 'FAIL',
      }),
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
            status: 'SUCCEEDED',
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
        status: 'SUCCEEDED',
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

  it('rejects a logo reference that is not ready', () => {
    expectTRPCErrorCode(
      () =>
        resolveLogoReferenceDetails({
          domain: 'example.com',
          referenceLogoGeneration: {
            id: 'logo-1',
            domain: 'example.com',
            status: 'PENDING',
            output: { type: 'logo', storagePath: '' },
          } as any,
        }),
      'NOT_FOUND',
    );
  });
});

describe('AI generation detail visibility', () => {
  beforeEach(() => {
    generateUrlFromStoragePathMock.mockClear();
  });

  it('returns full generation records to the owning user', () => {
    const generation = createAiGenerationRow();

    const result = mapAiGenerationRecordForViewer(generation, 'user-1');

    expect(canViewFullAiGenerationRecord(generation, 'user-1')).toBe(true);
    expect(result.userId).toBe('user-1');
    expect(result.input).toEqual(generation.input);
    expect(result.tokenUsage).toEqual(generation.tokenUsage);
    expect(result.metadata).toMatchObject({
      prompt: 'private rendered video prompt',
      providerMetadata: { requestId: 'provider-secret' },
      videoPrompt: 'private video prompt',
    });
    expect(result.thumbnailUrl).toBe('https://cdn.test/animations/thumb.png');
  });

  it('redacts owner, prompt, token, and internal metadata fields for public and non-owner callers', () => {
    const generation = createAiGenerationRow();

    for (const viewerUserId of [null, 'user-2']) {
      const result = mapAiGenerationRecordForViewer(generation, viewerUserId);

      expect(canViewFullAiGenerationRecord(generation, viewerUserId)).toBe(
        false,
      );
      expect(result).not.toHaveProperty('input');
      expect(result).not.toHaveProperty('isDeleted');
      expect(result).not.toHaveProperty('tokenUsage');
      expect(result).not.toHaveProperty('userId');
      expect(result.metadata).toEqual({
        animationSheetUrl: 'https://cdn.test/animations/sheet.png',
        resolvedMotionPreset: 'light-sweep',
        sheetModel: 'gpt-image-2',
      });
      expect(result.url).toBe('https://cdn.test/animations/output.mp4');
      expect(result.thumbnailUrl).toBe('https://cdn.test/animations/thumb.png');
      expect(JSON.stringify(result)).not.toContain('private');
      expect(JSON.stringify(result)).not.toContain('provider-secret');
      expect(JSON.stringify(result)).not.toContain('user-1');
    }
  });

  it('only exposes non-deleted successful generations publicly', () => {
    expect(isPublicAiGenerationVisible(createAiGenerationRow())).toBe(true);
    expect(
      isPublicAiGenerationVisible(createAiGenerationRow({ status: 'PENDING' })),
    ).toBe(false);
    expect(
      isPublicAiGenerationVisible(
        createAiGenerationRow({ status: 'PROCESSING' }),
      ),
    ).toBe(false);
    expect(
      isPublicAiGenerationVisible(createAiGenerationRow({ status: 'FAILED' })),
    ).toBe(false);
    expect(
      isPublicAiGenerationVisible(createAiGenerationRow({ isDeleted: true })),
    ).toBe(false);
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
