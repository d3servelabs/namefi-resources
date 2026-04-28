import { ToolLoopAgent, Output } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { z } from 'zod';
import { secrets } from '../env';

const openai = createOpenAI({ apiKey: secrets.OPENAI_API_KEY });

const GOOGLE_DOH_ENDPOINT = 'https://dns.google/resolve';
const DEFAULT_MAX_PROMPT_DOMAINS = 5;
const DEFAULT_MAX_SUGGESTIONS = 5;
const DEFAULT_CANDIDATE_COUNT = 16;
const DEFAULT_DOH_TIMEOUT_MS = 4000;
const HTTP_PROTOCOL_REGEX = /^https?:\/\//;
const URL_PATH_SPLIT_REGEX = /[/?#]/;
const TRAILING_DOT_REGEX = /\.$/;

const suggestionPayloadSchema = z.object({
  suggestions: z.array(z.string()).min(1),
});

type SuggestionPayload = z.infer<typeof suggestionPayloadSchema>;

export type DreamDomainSuggestionLogLevel = 'debug' | 'info' | 'warn' | 'error';

export type DreamDomainSuggestionLog = (
  level: DreamDomainSuggestionLogLevel,
  message: string,
  meta?: Record<string, unknown>,
) => void;

export type DreamDomainSuggestionOptions = {
  ownedDomains: NamefiNormalizedDomain[];
  maxSuggestions?: number;
  candidateCount?: number;
  maxPromptDomains?: number;
  dohTimeoutMs?: number;
  onLog?: DreamDomainSuggestionLog;
};

export type DreamDomainSuggestionResult = {
  suggestions: NamefiNormalizedDomain[];
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

async function withRetries<T>(
  action: () => Promise<T>,
  {
    label,
    attempts = 3,
    baseDelayMs = 250,
    maxDelayMs = 2000,
    onLog,
  }: {
    label: string;
    attempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    onLog?: DreamDomainSuggestionLog;
  },
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      if (attempt >= attempts) {
        break;
      }
      const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      onLog?.('warn', 'Retrying suggestion step', {
        label,
        attempt,
        delay,
        error,
      });
      await sleep(delay);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed after ${attempts} attempts (${label})`);
}

function normalizeCandidate(candidate: string): string | null {
  const trimmed = candidate.trim().toLowerCase();
  if (!trimmed) return null;
  const withoutProtocol = trimmed.replace(HTTP_PROTOCOL_REGEX, '');
  const withoutPath = withoutProtocol.split(URL_PATH_SPLIT_REGEX)[0] ?? '';
  const withoutTrailingDot = withoutPath.replace(TRAILING_DOT_REGEX, '');
  return withoutTrailingDot || null;
}

function filterNormalizedDomains(names: string[]): NamefiNormalizedDomain[] {
  const result: NamefiNormalizedDomain[] = [];
  for (const name of names) {
    const parsed = namefiNormalizedDomainSchema.safeParse(name);
    if (parsed.success) {
      result.push(parsed.data);
    }
  }
  return result;
}

function createSuggestionAgent(candidateCount: number) {
  return new ToolLoopAgent({
    model: openai('gpt-4.1'),
    instructions: `You are a domain branding strategist.

Given one or more domains a user already owns, propose ${candidateCount} ranked new domain ideas they may want to secure.
For multiple owned domains, evaluate the whole set and return the strongest suggestions across those domains. Cover shared themes when they exist, and strong per-domain variants when the domains are unrelated.
For one owned domain, suggest close, useful alternatives for that domain.

Rules:
- Output JSON only.
- Each suggestion must be a full domain (sld.tld).
- Use lowercase letters, digits, and hyphens only.
- Avoid spaces, underscores, and punctuation.
- Do not include domains the user already owns.
- Prefer common TLDs (com, io, xyz, ai, co, net, org).
- Return the strongest suggestions first.

JSON shape:
{
  "suggestions": ["example.com", "example.io", ...]
}
`,
    output: Output.object({ schema: suggestionPayloadSchema }),
  });
}

export function buildDreamDomainSuggestionPrompt(
  ownedDomains: NamefiNormalizedDomain[],
  maxPromptDomains: number,
) {
  const safeMaxPromptDomains = Number.isFinite(maxPromptDomains)
    ? Math.max(1, Math.floor(maxPromptDomains))
    : 1;
  const promptDomains = ownedDomains.slice(0, safeMaxPromptDomains);
  return `Owned domains:\n${promptDomains.join('\n')}`;
}

async function fetchCandidateDomains({
  ownedDomains,
  candidateCount,
  maxPromptDomains,
  onLog,
}: {
  ownedDomains: NamefiNormalizedDomain[];
  candidateCount: number;
  maxPromptDomains: number;
  onLog?: DreamDomainSuggestionLog;
}): Promise<{
  payload: SuggestionPayload;
  candidates: NamefiNormalizedDomain[];
}> {
  const agent = createSuggestionAgent(candidateCount);

  const result = await agent.generate({
    prompt: buildDreamDomainSuggestionPrompt(ownedDomains, maxPromptDomains),
  });

  const payload = result.output;
  const normalized = payload.suggestions
    .map(normalizeCandidate)
    .filter((value): value is string => Boolean(value));
  const candidates = filterNormalizedDomains(normalized);

  if (candidates.length === 0) {
    onLog?.('warn', 'AI returned no usable suggestions', {
      rawCount: payload.suggestions.length,
    });
  }

  return { payload, candidates };
}

type DohAnswer = { data?: string };

type DohResponse = {
  Status?: number;
  Answer?: DohAnswer[];
};

async function checkAvailabilityWithGoogleDoh(
  domain: NamefiNormalizedDomain,
  dohTimeoutMs: number,
): Promise<boolean> {
  const url = new URL(GOOGLE_DOH_ENDPOINT);
  url.searchParams.set('name', domain);
  url.searchParams.set('type', 'NS');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), dohTimeoutMs);
  const response = await fetch(url, {
    headers: { accept: 'application/dns-json' },
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(`DoH request failed (${response.status})`);
  }

  const data = (await response.json()) as DohResponse;
  if (data.Status === 3) {
    return true;
  }

  if (data.Status === 0) {
    const answers = Array.isArray(data.Answer) ? data.Answer : [];
    return answers.length === 0;
  }

  throw new Error(`Unexpected DoH status: ${data.Status}`);
}

export async function generateDreamDomainSuggestions({
  ownedDomains,
  maxSuggestions = DEFAULT_MAX_SUGGESTIONS,
  candidateCount = DEFAULT_CANDIDATE_COUNT,
  maxPromptDomains = DEFAULT_MAX_PROMPT_DOMAINS,
  dohTimeoutMs = DEFAULT_DOH_TIMEOUT_MS,
  onLog,
}: DreamDomainSuggestionOptions): Promise<DreamDomainSuggestionResult> {
  if (ownedDomains.length === 0) {
    return { suggestions: [] };
  }

  const { candidates } = await withRetries(
    () =>
      fetchCandidateDomains({
        ownedDomains,
        candidateCount,
        maxPromptDomains,
        onLog,
      }),
    { label: 'ai-domain-suggestions', onLog },
  );

  const ownedDomainSet = new Set(ownedDomains);
  const filteredCandidates = Array.from(new Set(candidates)).filter(
    (candidate) => !ownedDomainSet.has(candidate),
  );

  if (filteredCandidates.length === 0) {
    return { suggestions: [] };
  }

  const suggestions: NamefiNormalizedDomain[] = [];

  // Availability tool (Google DNS-over-HTTPS)
  for (const candidate of filteredCandidates) {
    const available = await withRetries(
      () => checkAvailabilityWithGoogleDoh(candidate, dohTimeoutMs),
      { label: `doh:${candidate}`, attempts: 3, onLog },
    ).catch((error) => {
      onLog?.('warn', 'Availability check failed', { candidate, error });
      return false;
    });

    if (available) {
      suggestions.push(candidate);
    }

    if (suggestions.length >= maxSuggestions) {
      break;
    }
  }

  return { suggestions };
}
