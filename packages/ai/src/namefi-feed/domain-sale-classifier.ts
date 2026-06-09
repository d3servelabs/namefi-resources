import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { Agent, fetch as undiciFetch } from 'undici';
import { type OpenAIResponsesProviderOptions, openai } from '@ai-sdk/openai';
import { generateText, Output, stepCountIs, tool, zodSchema } from 'ai';
import { z } from 'zod';
import {
  isUnsafeResolvedAddress,
  isValidIpAddress,
} from './domain-sale-classifier-ip-safety';

const absoluteUrlSchema = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) => {
      try {
        const url = new URL(value);
        return isSafeHttpUrl(url);
      } catch {
        return false;
      }
    },
    {
      message: 'Invalid URL',
    },
  );

const detectedDomainSchema = z
  .object({
    domain: z.string().min(3),
    context: z.string().min(5),
    askingPrice: z.string().nullable(),
    askingCurrency: z.string().nullable(),
    purchaseUrl: absoluteUrlSchema.nullable(),
    seller: z.string().nullable(),
    confidence: z.enum(['high', 'medium', 'low']),
  })
  .strict();

export const namefiFeedDomainSaleOpportunitySchema = z
  .object({
    status: z.enum(['domain_sale_detected', 'uncertain']),
    reasoning: z.string().min(8),
    summary: z.string().nullable(),
    domains: z.array(detectedDomainSchema),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.status === 'domain_sale_detected' && value.domains.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['domains'],
        message: 'Detected domain-sale opportunities must include a domain.',
      });
    }
    if (value.status === 'uncertain' && value.domains.length > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['domains'],
        message: 'Uncertain opportunities must not include domains.',
      });
    }
  });

export type NamefiFeedDomainSaleOpportunity = z.infer<
  typeof namefiFeedDomainSaleOpportunitySchema
>;

export interface AnalyseNamefiFeedPostPayload {
  postText: string;
  authorUsername?: string | null;
  candidateUrls?: string[];
}

export interface AnalyseNamefiFeedPostOptions {
  reasoningEffort?: OpenAIResponsesProviderOptions['reasoningEffort'];
  maxToolCalls?: number;
}

const DEFAULT_REASONING_EFFORT: OpenAIResponsesProviderOptions['reasoningEffort'] =
  'medium';
const DEFAULT_MAX_TOOL_CALLS = 6;
const URL_UNFURL_TIMEOUT_MS = 7_000;
const URL_UNFURL_CACHE_TTL_MS = 30 * 60 * 1000;
const URL_UNFURL_ERROR_CACHE_TTL_MS = 5 * 60 * 1000;
const URL_UNFURL_CACHE_MAX_ENTRIES = 512;
const URL_UNFURL_CACHE_PRUNE_INTERVAL_MS = 60 * 1000;
const URL_UNFURL_MAX_HTML_BYTES = 512_000;
const URL_UNFURL_MAX_REDIRECTS = 5;

const urlUnfurlResultSchema = z
  .object({
    inputUrl: z.string(),
    finalUrl: z.string().nullable(),
    statusCode: z.number().int().nullable(),
    contentType: z.string().nullable(),
    title: z.string().nullable(),
    canonicalUrl: z.string().nullable(),
    ogUrl: z.string().nullable(),
    description: z.string().nullable(),
    error: z.string().nullable(),
  })
  .strict();

type UrlUnfurlResult = z.infer<typeof urlUnfurlResultSchema>;
type UnfurlFetchResponse = Awaited<ReturnType<typeof undiciFetch>>;
type DnsLookup = (
  hostname: string,
  options: { all: true; verbatim: true },
) => Promise<Array<{ address: string; family: number }>>;
type SafeResolvedAddress = { address: string; family: 4 | 6 };
type PinnedLookupCallback = (
  error: NodeJS.ErrnoException | null,
  address: string,
  family: number,
) => void;
type PinnedLookup = (
  hostname: string,
  options: unknown,
  callback: PinnedLookupCallback,
) => void;

const urlUnfurlCache = new Map<
  string,
  { value: UrlUnfurlResult; expiresAt: number }
>();
let lastUrlUnfurlCachePruneAt = 0;

export async function analyseNamefiFeedPostForDomainSale(
  payload: AnalyseNamefiFeedPostPayload,
  options?: AnalyseNamefiFeedPostOptions,
): Promise<NamefiFeedDomainSaleOpportunity> {
  const reasoningEffort = options?.reasoningEffort ?? DEFAULT_REASONING_EFFORT;
  const maxToolCalls = Math.max(
    1,
    options?.maxToolCalls ?? DEFAULT_MAX_TOOL_CALLS,
  );
  const candidateUrls = Array.from(
    new Set(payload.candidateUrls?.map((url) => url.trim()).filter(Boolean)),
  ).slice(0, 8);
  const transcriptSections = [] as string[];

  if (payload.authorUsername?.trim()) {
    transcriptSections.push(
      `Author: @${payload.authorUsername.trim().replace(/^@/, '')}`,
    );
  }
  if (candidateUrls.length > 0) {
    transcriptSections.push(`Candidate URLs:\n- ${candidateUrls.join('\n- ')}`);
  }
  transcriptSections.push(`Post:\n${payload.postText}`);

  const result = await generateText({
    model: openai(reasoningEffort === 'low' ? 'gpt-5.4-mini' : 'gpt-5.5'),
    system: DOMAIN_SALE_CLASSIFIER_INSTRUCTIONS,
    messages: [
      {
        role: 'user',
        content: transcriptSections.join('\n\n'),
      },
    ],
    tools: {
      unfurlUrl: tool({
        description:
          'Resolve a URL and return metadata for deciding whether it is a domain purchase/listing/contact page.',
        inputSchema: zodSchema(
          z.object({
            url: z.string().min(1),
          }),
        ),
        execute: async ({ url }: { url: string }) => unfurlUrl(url),
      }),
    },
    stopWhen: stepCountIs(maxToolCalls + 1),
    providerOptions: {
      openai: {
        reasoningEffort,
        maxToolCalls,
        strictJsonSchema: true,
        store: false,
      } satisfies OpenAIResponsesProviderOptions,
    },
    output: Output.object({
      schema: namefiFeedDomainSaleOpportunitySchema,
    }),
  });

  return result.output;
}

const DOMAIN_SALE_CLASSIFIER_INSTRUCTIONS = `You are the Namefi Feed domain sale classifier.

Goal:
- Decide whether a public post currently advertises one or more domain names for sale.
- Extract every sale-positive domain and the listing details needed for a public domain sales feed.
- If the post does not clearly advertise a current sale, return status "uncertain" and an empty domains array.

Criteria for "domain_sale_detected":
- The post clearly states a domain is for sale, taking offers, available to buy, in auction, buy-it-now, brokered, or seeking buyer leads.
- When multiple domains appear, include only the domains with credible current sale wording.
- Treat historical sale language such as "sold", "sold for", "already sold", or "no longer available" as negative unless the same domain is explicitly listed again.
- Never transfer sale status from one domain to another; evaluate each domain from its own surrounding words.

Extraction standards:
- Extract normalized domains without schemes, paths, punctuation, or a leading "www.".
- Extract askingPrice as the price amount or offer terms only. Do not include currency symbols, currency names, or 3-letter currency codes in askingPrice when askingCurrency is populated.
- Return askingCurrency as a 3-letter ISO 4217 code such as USD, EUR, GBP, JPY, or INR. Use null when unclear; do not guess from locale or seller identity.
- Extract purchaseUrl only when the post or linked metadata provides a direct place to buy, make an offer, or contact a seller/broker for that domain.
- If candidate URLs are provided, call the unfurlUrl tool for likely purchase or listing links before deciding purchaseUrl.
- Use the author as seller only when the post or account context supports it; otherwise use null.
- Confidence should be high for explicit listings, medium for implied but specific sale intent, and low for weak/ambiguous evidence.
- Output valid JSON following the schema exactly.`;

async function unfurlUrl(url: string): Promise<UrlUnfurlResult> {
  const normalizedInput = normalizeUrl(url);
  if (!normalizedInput) {
    return {
      inputUrl: url,
      finalUrl: null,
      statusCode: null,
      contentType: null,
      title: null,
      canonicalUrl: null,
      ogUrl: null,
      description: null,
      error: 'invalid_url',
    };
  }

  const cacheKey = buildUnfurlCacheKey(normalizedInput);
  const now = Date.now();
  pruneUrlUnfurlCache(now);
  const cached = urlUnfurlCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), URL_UNFURL_TIMEOUT_MS);
  let closeResponse: (() => Promise<void>) | null = null;

  try {
    const {
      response,
      finalUrl: fetchedUrl,
      close,
    } = await fetchSafeUnfurlUrl(normalizedInput, controller.signal);
    closeResponse = close;
    const contentType = response.headers.get('content-type')?.trim() ?? null;
    const body = contentType?.toLowerCase().includes('text/html')
      ? await readLimitedText(response, URL_UNFURL_MAX_HTML_BYTES)
      : await cancelResponseBodyAndReturnEmptyText(response);
    const finalUrl = normalizeUrl(fetchedUrl);
    const value: UrlUnfurlResult = {
      inputUrl: normalizedInput,
      finalUrl,
      statusCode: response.status,
      contentType,
      title: extractHtmlTagContent(body, 'title'),
      canonicalUrl: resolveRelativeUrl(
        findMetaOrLinkValue(body, {
          tag: 'link',
          attrName: 'rel',
          attrValue: 'canonical',
          targetAttr: 'href',
        }),
        finalUrl,
      ),
      ogUrl: resolveRelativeUrl(
        findMetaOrLinkValue(body, {
          tag: 'meta',
          attrName: 'property',
          attrValue: 'og:url',
          targetAttr: 'content',
        }),
        finalUrl,
      ),
      description: findMetaOrLinkValue(body, {
        tag: 'meta',
        attrName: 'name',
        attrValue: 'description',
        targetAttr: 'content',
      }),
      error: null,
    };

    setUrlUnfurlCache(cacheKey, value, now + URL_UNFURL_CACHE_TTL_MS);

    return value;
  } catch (error) {
    const value: UrlUnfurlResult = {
      inputUrl: normalizedInput,
      finalUrl: null,
      statusCode: null,
      contentType: null,
      title: null,
      canonicalUrl: null,
      ogUrl: null,
      description: null,
      error:
        error instanceof Error ? error.message || error.name : 'unfurl_failed',
    };

    setUrlUnfurlCache(cacheKey, value, now + URL_UNFURL_ERROR_CACHE_TTL_MS);
    return value;
  } finally {
    await closeResponse?.().catch(() => undefined);
    clearTimeout(timeout);
  }
}

function buildUnfurlCacheKey(url: string): string {
  return `namefi-feed:unfurl:${createHash('sha256').update(url).digest('hex')}`;
}

function setUrlUnfurlCache(
  cacheKey: string,
  value: UrlUnfurlResult,
  expiresAt: number,
) {
  if (
    urlUnfurlCache.size >= URL_UNFURL_CACHE_MAX_ENTRIES &&
    !urlUnfurlCache.has(cacheKey)
  ) {
    const oldestKey = urlUnfurlCache.keys().next().value;
    if (oldestKey) {
      urlUnfurlCache.delete(oldestKey);
    }
  }
  urlUnfurlCache.set(cacheKey, { value, expiresAt });
}

function pruneUrlUnfurlCache(now: number) {
  if (now - lastUrlUnfurlCachePruneAt < URL_UNFURL_CACHE_PRUNE_INTERVAL_MS) {
    return;
  }
  lastUrlUnfurlCachePruneAt = now;
  for (const [cacheKey, cached] of urlUnfurlCache.entries()) {
    if (cached.expiresAt <= now) {
      urlUnfurlCache.delete(cacheKey);
    }
  }
}

function normalizeUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    return null;
  }

  try {
    const normalized = /^[a-z]+:\/\//i.test(trimmed)
      ? new URL(trimmed)
      : new URL(`https://${trimmed}`);
    if (!isSafeHttpUrl(normalized)) {
      return null;
    }
    return normalized.toString();
  } catch {
    return null;
  }
}

async function fetchSafeUnfurlUrl(
  inputUrl: string,
  signal: AbortSignal,
): Promise<{
  response: UnfurlFetchResponse;
  finalUrl: string;
  close: () => Promise<void>;
}> {
  let currentUrl = inputUrl;

  for (
    let redirectCount = 0;
    redirectCount <= URL_UNFURL_MAX_REDIRECTS;
    redirectCount += 1
  ) {
    const parsed = new URL(currentUrl);
    if (!isSafeHttpUrl(parsed)) {
      throw new Error('unsafe_url');
    }
    const resolvedAddress = await resolveSafeUnfurlHostname(parsed);
    const dispatcher = createPinnedUnfurlDispatcher(parsed, resolvedAddress);

    const response = await undiciFetch(parsed, {
      dispatcher,
      method: 'GET',
      redirect: 'manual',
      signal,
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent':
          'Mozilla/5.0 (compatible; NamefiSalesScanner/1.0; +https://namefi.io)',
      },
    }).catch(async (error) => {
      await dispatcher.close().catch(() => undefined);
      throw error;
    });

    if (response.status < 300 || response.status >= 400) {
      return {
        response,
        finalUrl: parsed.toString(),
        close: async () => {
          await dispatcher.close();
        },
      };
    }

    const location = response.headers.get('location');
    if (!location) {
      return {
        response,
        finalUrl: parsed.toString(),
        close: async () => {
          await dispatcher.close();
        },
      };
    }

    await response.body?.cancel().catch(() => undefined);
    await dispatcher.close().catch(() => undefined);
    currentUrl = new URL(location, parsed).toString();
  }

  throw new Error('too_many_redirects');
}

function isSafeHttpUrl(url: URL): boolean {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return false;
  }
  return !isUnsafeUnfurlHostname(url.hostname);
}

function isUnsafeUnfurlHostname(hostname: string): boolean {
  const normalized = hostname
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '');
  if (
    !normalized ||
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local') ||
    normalized.endsWith('.internal')
  ) {
    return true;
  }

  if (isValidIpAddress(normalized)) {
    return isUnsafeResolvedAddress(normalized);
  }

  return false;
}

async function resolveSafeUnfurlHostname(
  url: URL,
  dnsLookup: DnsLookup = lookup,
): Promise<SafeResolvedAddress> {
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  if (isValidIpAddress(hostname)) {
    if (isUnsafeResolvedAddress(hostname)) {
      throw new Error('unsafe_url');
    }
    return {
      address: hostname,
      family: hostname.includes(':') ? 6 : 4,
    };
  }

  const records = await dnsLookup(hostname, {
    all: true,
    verbatim: true,
  });
  if (records.length === 0) {
    throw new Error('unresolved_url');
  }
  if (records.some((record) => isUnsafeResolvedAddress(record.address))) {
    throw new Error('unsafe_url');
  }
  const [record] = records;
  if (!record || (record.family !== 4 && record.family !== 6)) {
    throw new Error('unresolved_url');
  }
  return { address: record.address, family: record.family };
}

function createPinnedUnfurlDispatcher(
  url: URL,
  resolvedAddress: SafeResolvedAddress,
): Agent {
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  return new Agent({
    connect: {
      lookup: createPinnedLookup(hostname, resolvedAddress),
      servername: hostname,
    },
  });
}

function createPinnedLookup(
  expectedHostname: string,
  resolvedAddress: SafeResolvedAddress,
): PinnedLookup {
  return (hostname, _options, callback) => {
    if (hostname !== expectedHostname) {
      const error = new Error(
        'unexpected_lookup_hostname',
      ) as NodeJS.ErrnoException;
      error.code = 'ERR_UNEXPECTED_LOOKUP_HOSTNAME';
      callback(error, '', 0);
      return;
    }

    callback(null, resolvedAddress.address, resolvedAddress.family);
  };
}

async function readLimitedText(
  response: UnfurlFetchResponse,
  maxBytes: number,
): Promise<string> {
  if (!response.body) {
    return (await response.text()).slice(0, maxBytes);
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytesRead = 0;

  try {
    while (bytesRead < maxBytes) {
      const { done, value } = await reader.read();
      if (done || !value) {
        break;
      }

      const remainingBytes = maxBytes - bytesRead;
      const chunk =
        value.byteLength > remainingBytes
          ? value.slice(0, remainingBytes)
          : value;
      chunks.push(chunk);
      bytesRead += chunk.byteLength;

      if (value.byteLength > remainingBytes) {
        await reader.cancel();
        break;
      }
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(bytesRead);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(body);
}

async function cancelResponseBodyAndReturnEmptyText(
  response: UnfurlFetchResponse,
): Promise<string> {
  await response.body?.cancel().catch(() => undefined);
  return '';
}

function extractHtmlTagContent(html: string, tag: 'title'): string | null {
  if (!html) {
    return null;
  }

  const match = html.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'));
  return match?.[1]?.trim() || null;
}

function findMetaOrLinkValue(
  html: string,
  options: {
    tag: 'meta' | 'link';
    attrName: string;
    attrValue: string;
    targetAttr: 'content' | 'href';
  },
): string | null {
  if (!html) {
    return null;
  }

  const tagPattern = new RegExp(
    `<${options.tag}[^>]*${options.attrName}=["']${escapeRegExp(options.attrValue)}["'][^>]*>`,
    'i',
  );
  const tagMatch = html.match(tagPattern)?.[0];
  if (!tagMatch) {
    return null;
  }

  const targetPattern = new RegExp(
    `${options.targetAttr}=["']([^"']+)["']`,
    'i',
  );
  return tagMatch.match(targetPattern)?.[1]?.trim() || null;
}

function resolveRelativeUrl(
  candidate: string | null,
  baseUrl: string | null,
): string | null {
  if (!candidate) {
    return null;
  }

  try {
    const resolved = baseUrl ? new URL(candidate, baseUrl) : new URL(candidate);
    return normalizeUrl(resolved.toString());
  } catch {
    return normalizeUrl(candidate);
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const __namefiFeedDomainSaleClassifierInternals = {
  createPinnedLookup,
  normalizeUrl,
  resolveRelativeUrl,
  resolveSafeUnfurlHostname,
};
