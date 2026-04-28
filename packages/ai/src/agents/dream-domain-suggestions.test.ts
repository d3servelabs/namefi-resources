import { describe, expect, it, vi } from 'vitest';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';

const createOpenAIMock = vi.fn(() => vi.fn(() => 'mock-model'));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: createOpenAIMock,
}));

vi.mock('ai', () => ({
  Output: {
    object: vi.fn((value) => value),
  },
  ToolLoopAgent: vi.fn(),
}));

vi.mock('../env', () => ({
  secrets: {
    OPENAI_API_KEY: 'test-openai-key',
  },
}));

const { buildDreamDomainSuggestionPrompt } = await import(
  './dream-domain-suggestions'
);

const domain = (value: string) => namefiNormalizedDomainSchema.parse(value);

describe('buildDreamDomainSuggestionPrompt', () => {
  it('includes multiple owned domains so suggestions can rank across the set', () => {
    expect(
      buildDreamDomainSuggestionPrompt(
        [domain('brightlabs.com'), domain('brightlabs.io'), domain('acme.ai')],
        5,
      ),
    ).toBe('Owned domains:\nbrightlabs.com\nbrightlabs.io\nacme.ai');
  });

  it('keeps the single-domain prompt shape generic', () => {
    expect(
      buildDreamDomainSuggestionPrompt([domain('brightlabs.com')], 5),
    ).toBe('Owned domains:\nbrightlabs.com');
  });

  it('caps prompt domains without dropping earlier ranked domains', () => {
    expect(
      buildDreamDomainSuggestionPrompt(
        [
          domain('one.com'),
          domain('two.com'),
          domain('three.com'),
          domain('four.com'),
        ],
        2,
      ),
    ).toBe('Owned domains:\none.com\ntwo.com');
  });

  it('keeps at least one owned domain when the prompt limit is invalid', () => {
    expect(
      buildDreamDomainSuggestionPrompt(
        [domain('one.com'), domain('two.com')],
        0,
      ),
    ).toBe('Owned domains:\none.com');
    expect(
      buildDreamDomainSuggestionPrompt(
        [domain('one.com'), domain('two.com')],
        -1,
      ),
    ).toBe('Owned domains:\none.com');
    expect(
      buildDreamDomainSuggestionPrompt(
        [domain('one.com'), domain('two.com')],
        Number.NaN,
      ),
    ).toBe('Owned domains:\none.com');
  });
});
