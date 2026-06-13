import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const generateText = vi.fn();
  const outputObject = vi.fn((value) => ({ kind: 'object-output', ...value }));
  const outputArray = vi.fn((value) => ({ kind: 'array-output', ...value }));
  const stepCountIs = vi.fn((count: number) => ({
    count,
    kind: 'step-count',
  }));
  const webSearch = vi.fn(() => ({ kind: 'web-search-tool' }));
  const openai = Object.assign(
    vi.fn((modelId: string) => ({ modelId, provider: 'openai' })),
    {
      tools: { webSearch },
    },
  );

  return {
    generateText,
    openai,
    outputArray,
    outputObject,
    stepCountIs,
    webSearch,
  };
});

vi.mock('@ai-sdk/openai', () => ({
  openai: mocks.openai,
}));

vi.mock('ai', () => ({
  generateText: mocks.generateText,
  Output: {
    array: mocks.outputArray,
    object: mocks.outputObject,
  },
  stepCountIs: mocks.stepCountIs,
  ToolLoopAgent: vi.fn(),
}));

const { generateLeadgenContacts, generateLeadgenDomainThesisProfile } =
  await import('./agents');

const domainProfile = {
  evidenceStandards: ['Company naming and upgrade evidence are required.'],
  searchDirections: [
    {
      recipe: 'domain_weakness_check',
      intent: 'Find companies with weaker current domains.',
    },
  ],
  traits: [],
  theses: [
    {
      title: 'Brand upgrade',
      confidence: 0.8,
      discoveryRecipes: ['domain_weakness_check'],
      requiredEvidence: ['Company with weaker current domain'],
      seedQueries: ['brand upgrade official company'],
    },
  ],
  cautions: [],
  seedQueries: ['brand official company'],
};

function usage(inputTokens: number, outputTokens: number) {
  return {
    inputTokens,
    inputTokenDetails: {
      cacheReadTokens: undefined,
      cacheWriteTokens: undefined,
      noCacheTokens: undefined,
    },
    outputTokens,
    outputTokenDetails: {
      reasoningTokens: undefined,
      textTokens: outputTokens,
    },
    totalTokens: inputTokens + outputTokens,
  };
}

describe('leadgen agents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('separates domain profile web search from structured extraction', async () => {
    mocks.generateText
      .mockResolvedValueOnce({
        text: 'Research brief with source-backed buyer angles.',
        totalUsage: usage(10, 20),
      })
      .mockResolvedValueOnce({
        output: domainProfile,
        totalUsage: usage(30, 40),
      });

    const result = await generateLeadgenDomainThesisProfile('seller.example', {
      maxToolCalls: 2,
      maxTheses: 5,
      reasoningEffort: 'high',
    });

    expect(result.totalUsage.inputTokens).toBe(40);
    expect(result.totalUsage.outputTokens).toBe(60);
    expect(mocks.webSearch).toHaveBeenCalledTimes(1);
    expect(mocks.outputObject).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.stringContaining('buyer-thesis profile'),
        name: 'LeadgenDomainThesisProfile',
      }),
    );

    const researchCall = mocks.generateText.mock.calls[0]?.[0];
    expect(researchCall).toEqual(
      expect.objectContaining({
        toolChoice: { type: 'tool', toolName: 'webSearch' },
      }),
    );
    expect(researchCall.output).toBeUndefined();
    expect(researchCall.providerOptions.openai).toEqual(
      expect.objectContaining({
        maxToolCalls: 2,
        reasoningEffort: 'medium',
        store: false,
        strictJsonSchema: true,
      }),
    );

    const extractionCall = mocks.generateText.mock.calls[1]?.[0];
    expect(extractionCall.tools).toBeUndefined();
    expect(extractionCall.toolChoice).toBeUndefined();
    expect(extractionCall.messages[0].content).toContain('Research brief');
    expect(extractionCall.providerOptions.openai).toEqual(
      expect.objectContaining({
        reasoningEffort: 'medium',
        store: false,
        strictJsonSchema: true,
      }),
    );
    expect(extractionCall.providerOptions.openai.maxToolCalls).toBeUndefined();
  });

  it('clamps forced web-search budgets before configuring the domain profile call', async () => {
    mocks.generateText
      .mockResolvedValueOnce({
        text: 'Research brief.',
        totalUsage: usage(10, 20),
      })
      .mockResolvedValueOnce({
        output: domainProfile,
        totalUsage: usage(30, 40),
      });

    await generateLeadgenDomainThesisProfile('seller.example', {
      maxToolCalls: 0,
      reasoningEffort: 'low',
    });

    const call = mocks.generateText.mock.calls[0]?.[0];
    expect(call.providerOptions.openai.maxToolCalls).toBe(1);
  });

  it('combines domain profile token usage when usage detail buckets are missing', async () => {
    mocks.generateText
      .mockResolvedValueOnce({
        text: 'Research brief.',
        totalUsage: {
          inputTokens: 10,
          outputTokens: 20,
          totalTokens: 30,
        },
      })
      .mockResolvedValueOnce({
        output: domainProfile,
        totalUsage: {
          inputTokens: 30,
          outputTokens: 40,
          totalTokens: 70,
        },
      });

    const result = await generateLeadgenDomainThesisProfile('seller.example', {
      reasoningEffort: 'medium',
    });

    expect(result.totalUsage.inputTokens).toBe(40);
    expect(result.totalUsage.outputTokens).toBe(60);
    expect(result.totalUsage.totalTokens).toBe(100);
    expect(result.totalUsage.inputTokenDetails.noCacheTokens).toBeUndefined();
    expect(result.totalUsage.outputTokenDetails.textTokens).toBeUndefined();
  });

  it('budgets an extra AI SDK step for contact structured output after web search', async () => {
    mocks.generateText.mockResolvedValueOnce({
      output: [{ contacts: [], domain: 'buyer.example', notes: null }],
    });

    await generateLeadgenContacts([{ domain: 'buyer.example' }], {
      reasoningEffort: 'medium',
    });

    expect(mocks.stepCountIs).toHaveBeenCalledWith(7);
    expect(mocks.outputArray).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.stringContaining('outreach contacts'),
        name: 'LeadgenContactResults',
      }),
    );

    const call = mocks.generateText.mock.calls[0]?.[0];
    expect(call).toEqual(
      expect.objectContaining({
        stopWhen: { count: 7, kind: 'step-count' },
        toolChoice: { type: 'tool', toolName: 'webSearch' },
      }),
    );
    expect(call.providerOptions.openai).toEqual(
      expect.objectContaining({
        maxToolCalls: 6,
        reasoningEffort: 'medium',
        store: false,
        strictJsonSchema: true,
      }),
    );
  });
});
