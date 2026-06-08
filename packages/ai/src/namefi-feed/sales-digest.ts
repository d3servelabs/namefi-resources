import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  createOpenAI,
  type OpenAIResponsesProviderOptions,
} from '@ai-sdk/openai';
import { generateText, Output, ToolLoopAgent } from 'ai';
import sharp from 'sharp';
import { z } from 'zod';
import { secrets } from '../env';

const openai = createOpenAI({
  apiKey: secrets.OPENAI_API_KEY,
});

const DEFAULT_REASONING_EFFORT: OpenAIResponsesProviderOptions['reasoningEffort'] =
  'medium';
const IMAGE_GENERATION_TOOL = 'image_generation' as const;
const MIN_DAILY_TOP_PICKS = 4;
const MAX_THESIS_LENGTH = 260;
const MAX_TWEET_TAKE_LENGTH = 260;
const MAX_TWEET_POINT_LENGTH = 120;
const MAX_LISTINGS_FOR_PROMPT = 120;
const MAX_MESSAGE_SNIPPET_LENGTH = 180;
const MAX_TOP_TLDS = 12;
const MAX_TOP_PATTERNS = 12;
const MAX_WORD_CLOUD_DOMAINS = 12;
const DIGEST_SOURCE_LABEL = 'Namefi Feed';
const NAMEFI_FEED_URL = 'https://namefi.io/feed';
const PRIMARY_ACCENT_COLOR = '#0EA5E9';
const SECONDARY_ACCENT_COLOR = '#22C55E';
const DIGEST_IMAGE_WIDTH = 1536;
const DIGEST_IMAGE_HEIGHT = 1024;
const DIGEST_LOGO_SOURCE_WIDTH = 132;
const DIGEST_LOGO_SOURCE_HEIGHT = 43;
const DIGEST_LOGO_MAX_WIDTH = 320;
const DIGEST_LOGO_MIN_WIDTH = 180;
const DIGEST_LOGO_WIDTH_RATIO = 0.18;
const DIGEST_LOGO_MARGIN_RATIO = 0.04;
const DIGEST_LOGO_MIN_MARGIN = 24;
const DIGEST_LOGO_FILL = '#F8FAFC';
const IMAGE_DATA_URL_PATTERN =
  /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/;
const THESIS_PREFIX_PATTERN = /^thesis\s*[:-]\s*/i;
const NAMEFI_TAKE_PREFIX_PATTERN = /^namefi take\s*[:-]\s*/i;
const DIGEST_POINT_PREFIX_PATTERN = /^points?\s*[:-]\s*/i;
const LEADING_BULLET_PATTERN = /^[-*]\s*/;
const WORD_CLOUD_DOMAIN_PATTERN = /^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,}$/;
const WHITESPACE_PATTERN = /\s+/g;
const LOGOTYPE_FILL_PATTERN = /fill="[^"]*"/g;
const NON_ALNUM_PATTERN = /[^a-z0-9]/g;
const LETTERS_ONLY_PATTERN = /^[a-z]+$/;
const DIGITS_ONLY_PATTERN = /^\d+$/;
const THREE_LETTER_SLD_PATTERN = /^[a-z]{3}$/;
const HAS_LETTER_PATTERN = /[a-z]/;
const HAS_DIGIT_PATTERN = /[0-9]/;
const THESIS_WORD_PATTERN = /\bthesis\b\s*[:-]?/gi;
const TWEET_TAKE_COMPACT_PREFIX_PATTERN = /^tweettake\s*[:-]\s*/i;
const TWEET_TAKE_PREFIX_PATTERN = /^tweet take\s*[:-]\s*/i;
const DIGEST_CONTEXT_PATTERN =
  /\b(?:feed|dataset|digest|batch|thread|window)\b/i;
const OTHER_DOMAINS_PATTERN =
  /\b(?:other (?:domains|names|picks)|rest of the (?:feed|list|batch))\b/i;
const COMPARISON_PATTERN = /\b(?:compared to|compared with|versus|vs\.?)\b/i;
const TWEET_POINTS_PREFIX_PATTERN = /^tweetpoints?\s*[:-]\s*/i;
const ASK_COMMA_PATTERN = /,/g;
const ASK_USD_PATTERN = /([0-9]+(?:\.[0-9]+)?)\s*([kmb])?/i;
const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;
const REGEXP_SPECIAL_CHARS_PATTERN = /[.*+?^${}()|[\]\\]/g;

export const NAMEFI_FEED_SALES_DIGEST_WORD_CLOUD_IMAGE_MODEL = 'gpt-image-1.5';
export const NAMEFI_FEED_SALES_DIGEST_ANIMATION_MODEL =
  'bytedance/seedance-2.0';
export const NAMEFI_FEED_SALES_DIGEST_ANIMATION_SHEET_MODEL = 'gpt-image-2';
export const NAMEFI_FEED_SALES_DIGEST_ANIMATION_EXTERNAL_USER_ID =
  'sales-digest';

const salesDigestInsightSchema = z
  .object({
    topPicks: z
      .array(
        z
          .object({
            domain: z.string().min(3).max(253),
            thesis: z.string().min(8).max(MAX_THESIS_LENGTH),
            tweetTake: z.string().min(12).max(MAX_TWEET_TAKE_LENGTH),
            tweetPoints: z
              .array(z.string().min(8).max(MAX_TWEET_POINT_LENGTH))
              .length(2),
          })
          .strict(),
      )
      .min(1)
      .max(12),
  })
  .strict();

export type NamefiFeedSalesDigestInsight = z.infer<
  typeof salesDigestInsightSchema
>;

export interface NamefiFeedSalesDigestEntry {
  domain: string;
  askingPrice: string | null;
  askingCurrency: string | null;
  purchaseUrl: string | null;
  logoUrl: string | null;
  createdAt: Date;
  messageText: string | null;
  sellerUsername: string | null;
  sellerDisplayName: string | null;
  sourceTweetUrl: string;
}

export interface NamefiFeedSalesDigestFormattedPick {
  domain: string;
  thesis: string;
  tweetTake?: string | null;
  tweetPoints?: string[] | null;
  sourceTweetUrl?: string | null;
  logoUrl?: string | null;
}

export interface NamefiFeedSalesDigestWordCloudPick {
  domain: string;
  thesis?: string | null;
}

export interface NamefiFeedSalesDigestWordCloudResult {
  imageDataUrl: string;
  prompt: string;
}

interface DomainFeatures {
  tld: string;
  sldLength: number;
  patternTags: string[];
}

interface PromptListing {
  domain: string;
  tld: string;
  sldLength: number;
  patternTags: string[];
  askingPriceRaw: string | null;
  askingCurrency: string | null;
  askingUsd: number | null;
  hasBuyNow: boolean;
  purchaseUrl: string | null;
  seller: string | null;
  sellerListingsInWindow: number;
  messageSnippet: string | null;
  sourceTweetUrl: string;
  listedAt: string;
}

export interface NamefiFeedSalesDigestPromptContext {
  runMeta: {
    startIso: string;
    endIso: string;
    generatedAtIso: string;
  };
  marketStats: {
    totalListings: number;
    uniqueDomains: number;
    sampledListings: number;
    omittedListings: number;
    pricedListings: number;
    buyNowListings: number;
    usdPricedListings: number;
    requiredTopPicks: number;
    medianAskUsd: number | null;
    topTlds: Array<{ tld: string; count: number }>;
    lengthBuckets: Array<{ label: string; count: number }>;
    topPatterns: Array<{ tag: string; count: number }>;
  };
  taxonomyHints: {
    liquidPatterns: string[];
    brandableSignals: string[];
    riskSignals: string[];
  };
  listings: PromptListing[];
}

export interface DigestLogoOverlayLayout {
  margin: number;
  logoWidth: number;
  logoHeight: number;
  logoLeft: number;
  logoTop: number;
}

interface SalesDigestWindowLabel {
  headline: string;
  short: string;
}

const aiDigestInstructions = `You are "Daily Domain Flip Digest Analyst".
Audience: professional domainers looking to acquire and flip domains.

Objective:
- Review the supplied domain listing records.
- Pick domains with strong near-term flip potential.

Rules:
- Use only the supplied listing details.
- Return at least ${MIN_DAILY_TOP_PICKS} top picks when ${MIN_DAILY_TOP_PICKS} or more valid listings are supplied; if fewer than ${MIN_DAILY_TOP_PICKS} listings are supplied, return every valid listing as a top pick.
- Do not make the selection revolve around one main domain while pushing the rest into "more listings"; choose separate domains for the top picks.
- Evaluate each domain as a standalone opportunity.
- Do not compare one domain to another in the prose.
- Do not mention the feed, dataset, digest, batch, window, list, thread, or other picks/domains.
- Do not invent comps, external sales, or market facts.
- Focus on liquidity, resale velocity, and realistic spread between ask and likely resale demand.
- Keep claims concise and evidence-based.
- For each top pick, provide:
  - "thesis": one short sentence for the shared digest.
  - "tweetTake": a denser, sharper follow-up take for an X thread.
  - "tweetPoints": exactly two short supporting points for an expanded X reply.
- "tweetTake" should be 1-2 tight sentences, more specific/opinionated than "thesis", but still grounded only in the supplied listing details.
- "tweetTake" must discuss only that domain's qualities, ask, and likely buyer demand.
- Each "tweetPoints" item should be short, concrete, and non-overlapping: one point about likely buyer/use-case pull, one point about liquidity, ask discipline, or flip angle.
- Write "tweetTake" so it reads naturally when shown as "<domain> - {analysis}" in a threaded X reply.
- Do not mention seller usernames, handles, or tell the reader to "see below".
- Output JSON only matching the schema exactly.
- Never include fields named "overpricedWatchlist" or "methodNotes".`;

const wordCloudInstructions = `You generate one polished word cloud image for a daily domain digest.
Always call the image_generation tool exactly once.
Prioritize typography legibility and clear hierarchy.
Use varied, tasteful font styles across different domains to create visual interest, while keeping every domain easy to read.
Treat the provided domain list as the only allowed text content in the image.
Keep each domain string exact; never alter, omit, reorder, or stylize characters in ways that could change the domain spelling.
Do not include logos, people, screenshots, UI mockups, brand marks, watermarks, signatures, or unrelated words/numbers.
You may add abstract, non-branded visual motifs inspired by the provided domains/cues while keeping domain words dominant and readable.`;

type WordCloudAgent = ReturnType<typeof createWordCloudAgent>;

let wordCloudAgent: WordCloudAgent | null = null;
let logotypeSvgPromise: Promise<string> | null = null;

export async function generateNamefiFeedSalesDigestInsight({
  entries,
  windowStart,
  windowEnd,
  reasoningEffort = DEFAULT_REASONING_EFFORT,
}: {
  entries: ReadonlyArray<NamefiFeedSalesDigestEntry>;
  windowStart: Date;
  windowEnd: Date;
  reasoningEffort?: OpenAIResponsesProviderOptions['reasoningEffort'];
}): Promise<{
  insight: NamefiFeedSalesDigestInsight;
  context: NamefiFeedSalesDigestPromptContext;
}> {
  const context = buildSalesDigestPromptContext(
    entries,
    windowStart,
    windowEnd,
  );
  if (context.marketStats.requiredTopPicks < 1) {
    throw new Error(
      'Cannot generate a sales digest insight without at least one valid domain.',
    );
  }

  const result = await generateText({
    model: openai('gpt-5.4'),
    system: aiDigestInstructions,
    messages: [
      {
        role: 'user',
        content: `Domain listing context JSON:\n${JSON.stringify(context)}\n\nSelection requirement: return at least ${context.marketStats.requiredTopPicks} valid topPicks from the supplied listings.`,
      },
    ],
    providerOptions: {
      openai: {
        reasoningEffort,
        strictJsonSchema: true,
        store: false,
      } satisfies OpenAIResponsesProviderOptions,
    },
    output: Output.object({
      schema: salesDigestInsightSchema,
    }),
  });

  return {
    insight: normalizeSalesDigestInsight(result.output, context),
    context,
  };
}

export function formatNamefiFeedSalesDigestInsight(
  insight: NamefiFeedSalesDigestInsight,
  context: NamefiFeedSalesDigestPromptContext,
): string {
  const sourceTweetUrlByDomain = buildSourceTweetUrlByDomain(context);
  const topPickDomainCount = new Set(
    insight.topPicks.map((pick) => normalizeDigestDomain(pick.domain)),
  ).size;
  const remainingCount = Math.max(
    context.marketStats.uniqueDomains - topPickDomainCount,
    0,
  );

  return formatStructuredNamefiFeedSalesDigest({
    topPicks: insight.topPicks.map((pick) => ({
      domain: pick.domain,
      thesis: pick.thesis,
      tweetTake: pick.tweetTake,
      tweetPoints: pick.tweetPoints,
      sourceTweetUrl: sourceTweetUrlByDomain.get(pick.domain) ?? null,
    })),
    remainingCount,
    windowLabel: formatSalesDigestWindowLabel(context.runMeta),
  });
}

export function buildNamefiFeedSalesDigestFormattedPicks(
  insight: NamefiFeedSalesDigestInsight,
  context: NamefiFeedSalesDigestPromptContext,
): NamefiFeedSalesDigestFormattedPick[] {
  const sourceTweetUrlByDomain = buildSourceTweetUrlByDomain(context);
  return insight.topPicks.map((pick) => {
    const domain = normalizeDigestDomain(pick.domain);
    return {
      domain,
      thesis: pick.thesis,
      tweetTake: pick.tweetTake,
      tweetPoints: pick.tweetPoints,
      sourceTweetUrl: sourceTweetUrlByDomain.get(domain) ?? null,
    };
  });
}

export function formatStructuredNamefiFeedSalesDigest({
  topPicks,
  remainingCount,
  windowLabel = {
    headline: 'last 24 hours',
    short: '24h window',
  },
}: {
  topPicks: ReadonlyArray<NamefiFeedSalesDigestFormattedPick>;
  remainingCount: number;
  windowLabel?: SalesDigestWindowLabel;
}): string {
  const safeRemainingCount = Math.max(remainingCount, 0);
  const lines: string[] = [
    `Domains listed for sale on X in the ${windowLabel.headline} | ${DIGEST_SOURCE_LABEL}`,
    '',
    'Top picks',
  ];

  if (topPicks.length > 0) {
    lines.push(...topPicks.map(formatTopPickLine));
  } else {
    lines.push('- No listings were found in this digest window.');
  }

  lines.push('');
  const domainNoun = safeRemainingCount === 1 ? 'domain' : 'domains';
  lines.push(
    `More: ${safeRemainingCount} additional ${domainNoun} in this ${windowLabel.short}.`,
  );
  lines.push(`Reply with stronger names: ${NAMEFI_FEED_URL}`);

  return lines.join('\n');
}

export function normalizeNamefiFeedSalesDigestTake(
  domain: string,
  value: string,
): string {
  const normalized = stripLeadingDomainLabel(
    domain,
    value
      .replace(THESIS_PREFIX_PATTERN, '')
      .replace(NAMEFI_TAKE_PREFIX_PATTERN, '')
      .replace(WHITESPACE_PATTERN, ' ')
      .trim(),
  );

  return normalized || 'Worth a closer look.';
}

function formatSalesDigestWindowLabel(
  runMeta: NamefiFeedSalesDigestPromptContext['runMeta'],
): SalesDigestWindowLabel {
  const start = Date.parse(runMeta.startIso);
  const end = Date.parse(runMeta.endIso);
  const durationMs = end - start;
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return {
      headline: 'digest window',
      short: 'digest window',
    };
  }

  const durationHours = durationMs / (60 * 60 * 1000);
  if (Math.abs(durationHours - 24) < 0.01) {
    return {
      headline: 'last 24 hours',
      short: '24h window',
    };
  }

  const roundedHours = Math.round(durationHours);
  if (Math.abs(durationHours - roundedHours) < 0.01 && roundedHours < 48) {
    return {
      headline: `${roundedHours}-hour window`,
      short: `${roundedHours}h window`,
    };
  }

  const durationDays = durationHours / 24;
  const roundedDays = Math.round(durationDays);
  if (Math.abs(durationDays - roundedDays) < 0.01) {
    return {
      headline: `${roundedDays}-day window`,
      short: `${roundedDays}d window`,
    };
  }

  const roundedTenthDays = Math.round(durationDays * 10) / 10;
  return {
    headline: `${roundedTenthDays}-day window`,
    short: `${roundedTenthDays}d window`,
  };
}

export function normalizeNamefiFeedSalesDigestPoint(
  domain: string,
  value: string,
): string | null {
  const normalized = stripLeadingDomainLabel(
    domain,
    value
      .replace(DIGEST_POINT_PREFIX_PATTERN, '')
      .replace(LEADING_BULLET_PATTERN, '')
      .replace(WHITESPACE_PATTERN, ' ')
      .trim(),
  );

  return normalizeOptionalText(normalized);
}

export function normalizeWordCloudDomain(domain: string): string | null {
  const normalized = domain.trim().toLowerCase();
  if (normalized.length < 3 || normalized.length > 253) {
    return null;
  }

  return WORD_CLOUD_DOMAIN_PATTERN.test(normalized) ? normalized : null;
}

export function buildNamefiFeedSalesDigestWordCloudPrompt(
  picks: ReadonlyArray<NamefiFeedSalesDigestWordCloudPick>,
): string {
  const weightedDomains = picks
    .slice(0, MAX_WORD_CLOUD_DOMAINS)
    .map((pick, index) => {
      const weight = MAX_WORD_CLOUD_DOMAINS - index;
      const insightCue = pick.thesis?.trim();
      return `${pick.domain} | weight=${weight}${insightCue ? ` | cue=${insightCue}` : ''}`;
    });

  return [
    'Create a premium 1536x1024 landscape word cloud poster for a domain market digest.',
    'Style goal: creative, beautiful, editorial-quality composition with strong typography and clean negative space.',
    `Recommended palette: deep navy/charcoal background, high-contrast white text, and accents using ${PRIMARY_ACCENT_COLOR} + ${SECONDARY_ACCENT_COLOR}.`,
    'Visual motif direction: add subtle abstract shapes/textures/icons inspired by each domain cue (e.g., finance, robotics, travel, health) without showing any logos or branded marks.',
    '',
    'Domain words and priority (largest to smaller):',
    ...weightedDomains.map((line) => `- ${line}`),
    '',
    'Hard requirements:',
    '- Canvas: 1536x1024.',
    '- The ONLY text in the image must be the domain words listed above.',
    '- Keep exact domain spelling, including TLD, with no additions or substitutions.',
    '- Keep every domain fully legible and correctly spelled.',
    '- Preserve literal characters exactly (including dots and TLDs); never replace characters or merge words.',
    '- Use 3-6 distinct, complementary font styles across different domains; avoid using one font style for all domains.',
    '- Keep font choices readable: avoid highly decorative/script styles that make characters ambiguous.',
    '- Use clear size hierarchy by weight (first is largest) while avoiding overlap and edge clipping.',
    '- Keep the composition balanced: at least 8% padding on all edges and strong central focus.',
    '- Keep the bottom-right corner relatively uncluttered to preserve clear space for a logo overlay.',
    '- Use tasteful gradients, depth, and contrast to feel premium without visual clutter.',
    '- No photoreal scenes, no people, no copyrighted characters, no trademarked logos, no explicit/unsafe content.',
    '- Output one finished image only.',
  ].join('\n');
}

export function buildNamefiFeedSalesDigestAnimationSummary({
  picks,
  text,
}: {
  picks: ReadonlyArray<NamefiFeedSalesDigestWordCloudPick>;
  text?: string | null;
}): string {
  const digestText = text?.trim();
  const pickLines = picks
    .slice(0, MAX_WORD_CLOUD_DOMAINS)
    .map((pick, index) => {
      const thesis = pick.thesis?.trim();
      return thesis
        ? `${index + 1}. ${pick.domain}: ${thesis}`
        : `${index + 1}. ${pick.domain}`;
    });

  return [
    digestText ? `Digest copy:\n${digestText}` : null,
    pickLines.length > 0 ? `Top domains:\n${pickLines.join('\n')}` : null,
  ]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 2000);
}

export async function generateNamefiFeedSalesDigestWordCloudImage(
  picks: ReadonlyArray<NamefiFeedSalesDigestWordCloudPick>,
): Promise<NamefiFeedSalesDigestWordCloudResult | null> {
  const normalizedPicks = picks
    .map((pick) => ({
      domain: normalizeWordCloudDomain(pick.domain),
      thesis: pick.thesis?.trim() ?? null,
    }))
    .filter((pick): pick is { domain: string; thesis: string | null } =>
      Boolean(pick.domain),
    )
    .slice(0, MAX_WORD_CLOUD_DOMAINS);

  if (normalizedPicks.length === 0) {
    return null;
  }

  const prompt = buildNamefiFeedSalesDigestWordCloudPrompt(normalizedPicks);
  const result = await getWordCloudAgent().generate({
    messages: [
      {
        role: 'user',
        content: [{ type: 'text', text: prompt }],
      },
    ],
  });

  const toolResult = result.staticToolResults.find(
    (entry) => entry.toolName === IMAGE_GENERATION_TOOL,
  );
  const imageBase64 =
    typeof toolResult?.output?.result === 'string'
      ? toolResult.output.result.trim()
      : null;

  if (!imageBase64) {
    throw new Error('image_generation tool did not return image data.');
  }

  const generatedImageDataUrl = imageBase64.startsWith('data:image/')
    ? imageBase64
    : `data:image/png;base64,${imageBase64}`;
  const imageDataUrl = await overlayDigestLogoOnImageDataUrl(
    generatedImageDataUrl,
  );

  return {
    imageDataUrl,
    prompt,
  };
}

export async function overlayDigestLogoOnImageDataUrl(
  imageDataUrl: string,
): Promise<string> {
  const parsed = parseImageDataUrl(imageDataUrl);
  if (!parsed) {
    throw new Error('Generated digest image data URL is invalid.');
  }

  const image = sharp(parsed.bytes, {
    failOn: 'none',
  });
  const metadata = await image.metadata();
  const width = metadata.width ?? DIGEST_IMAGE_WIDTH;
  const height = metadata.height ?? DIGEST_IMAGE_HEIGHT;
  const layout = computeDigestLogoOverlayLayout(width, height);
  const logoPng = await buildDigestLogoPng(layout);

  const composited = await image
    .composite([
      {
        input: logoPng,
        left: layout.logoLeft,
        top: layout.logoTop,
      },
    ])
    .png({
      compressionLevel: 9,
    })
    .toBuffer();

  return `data:image/png;base64,${composited.toString('base64')}`;
}

export function computeDigestLogoOverlayLayout(
  width: number,
  height: number,
): DigestLogoOverlayLayout {
  if (!Number.isFinite(width) || width <= 0) {
    throw new Error(`Invalid image width for logo overlay: ${width}`);
  }
  if (!Number.isFinite(height) || height <= 0) {
    throw new Error(`Invalid image height for logo overlay: ${height}`);
  }

  const margin = Math.max(
    Math.round(Math.min(width, height) * DIGEST_LOGO_MARGIN_RATIO),
    DIGEST_LOGO_MIN_MARGIN,
  );
  const logoWidth = clamp(
    Math.round(width * DIGEST_LOGO_WIDTH_RATIO),
    DIGEST_LOGO_MIN_WIDTH,
    DIGEST_LOGO_MAX_WIDTH,
  );
  const logoHeight = Math.max(
    Math.round(
      (logoWidth / DIGEST_LOGO_SOURCE_WIDTH) * DIGEST_LOGO_SOURCE_HEIGHT,
    ),
    1,
  );
  const logoLeft = Math.max(width - margin - logoWidth, 0);
  const logoTop = Math.max(height - margin - logoHeight, 0);

  return {
    margin,
    logoWidth,
    logoHeight,
    logoLeft,
    logoTop,
  };
}

export function normalizeSalesDigestInsight(
  insight: NamefiFeedSalesDigestInsight,
  context: NamefiFeedSalesDigestPromptContext,
): NamefiFeedSalesDigestInsight {
  const allowedDomains = new Set(
    context.listings
      .map((listing) => listing.domain.trim().toLowerCase())
      .filter(Boolean),
  );
  const seenDomains = new Set<string>();

  const topPicks = insight.topPicks
    .map((pick) => ({
      domain: pick.domain.trim().toLowerCase(),
      thesis: normalizeThesis(pick.thesis),
      tweetTake: normalizeTweetTake(pick.tweetTake),
      tweetPoints: normalizeTweetPoints(pick.tweetPoints),
    }))
    .filter((pick) => allowedDomains.has(pick.domain))
    .filter((pick) => {
      if (seenDomains.has(pick.domain)) {
        return false;
      }
      seenDomains.add(pick.domain);
      return true;
    })
    .slice(0, 12);

  const requiredTopPicks = context.marketStats.requiredTopPicks;
  for (const pick of buildSupplementalTopPicks(topPicks, context)) {
    topPicks.push(pick);
    if (topPicks.length >= requiredTopPicks) {
      break;
    }
  }

  if (topPicks.length < 1) {
    throw new Error('Digest insight returned too few valid top picks.');
  }

  return {
    topPicks,
  };
}

function buildSalesDigestPromptContext(
  entries: ReadonlyArray<NamefiFeedSalesDigestEntry>,
  windowStart: Date,
  windowEnd: Date,
): NamefiFeedSalesDigestPromptContext {
  const sellerCounts = countSellerListings(entries);
  const analyzed = entries.map((entry) => {
    const domain = entry.domain.trim().toLowerCase();
    const features = extractDomainFeatures(domain);
    const normalizedCurrency = normalizeCurrencyCode(entry.askingCurrency);
    const askingUsd = parseAskUsd(entry.askingPrice, normalizedCurrency);
    const seller =
      normalizeOptionalText(entry.sellerUsername) ??
      normalizeOptionalText(entry.sellerDisplayName);
    const sellerKey = seller ? seller.toLowerCase() : null;
    return {
      domain,
      features,
      askingPriceRaw: normalizeOptionalText(entry.askingPrice),
      askingCurrency: normalizedCurrency,
      askingUsd,
      purchaseUrl: normalizeOptionalText(entry.purchaseUrl),
      hasBuyNow: Boolean(normalizeOptionalText(entry.purchaseUrl)),
      seller,
      sellerListingsInWindow: sellerKey
        ? (sellerCounts.get(sellerKey) ?? 1)
        : 1,
      messageSnippet: compactText(entry.messageText),
      sourceTweetUrl: entry.sourceTweetUrl,
      listedAt: entry.createdAt.toISOString(),
    };
  });

  const scoredForPrompt = analyzed
    .map((entry) => ({
      ...entry,
      contextScore: scorePromptPriority(entry),
    }))
    // Equal scores prefer fresher listings, then domain name for stable output.
    .sort(
      (a, b) =>
        b.contextScore - a.contextScore ||
        b.listedAt.localeCompare(a.listedAt) ||
        a.domain.localeCompare(b.domain),
    );

  const listings = scoredForPrompt.slice(0, MAX_LISTINGS_FOR_PROMPT).map(
    (entry): PromptListing => ({
      domain: entry.domain,
      tld: entry.features.tld,
      sldLength: entry.features.sldLength,
      patternTags: entry.features.patternTags,
      askingPriceRaw: entry.askingPriceRaw,
      askingCurrency: entry.askingCurrency,
      askingUsd: entry.askingUsd,
      hasBuyNow: entry.hasBuyNow,
      purchaseUrl: entry.purchaseUrl,
      seller: entry.seller,
      sellerListingsInWindow: entry.sellerListingsInWindow,
      messageSnippet: entry.messageSnippet,
      sourceTweetUrl: entry.sourceTweetUrl,
      listedAt: entry.listedAt,
    }),
  );
  const distinctValidDomainCount = new Set(
    listings.map((listing) => listing.domain.trim().toLowerCase()),
  ).size;
  const uniqueDomainCount = new Set(analyzed.map((entry) => entry.domain)).size;

  const pricedListings = analyzed.filter(
    (entry) => entry.askingPriceRaw,
  ).length;
  const buyNowListings = analyzed.filter((entry) => entry.hasBuyNow).length;
  const usdAsks = analyzed
    .map((entry) => entry.askingUsd)
    .filter((value): value is number => Number.isFinite(value));

  const tldCounts = buildCountList(analyzed.map((entry) => entry.features.tld))
    .slice(0, MAX_TOP_TLDS)
    .map(([tld, count]) => ({ tld, count }));

  const patternCounts = buildCountList(
    analyzed.flatMap((entry) => entry.features.patternTags),
  )
    .slice(0, MAX_TOP_PATTERNS)
    .map(([tag, count]) => ({ tag, count }));

  const lengthBuckets = [
    {
      label: 'len<=4',
      count: analyzed.filter((entry) => entry.features.sldLength <= 4).length,
    },
    {
      label: 'len5-8',
      count: analyzed.filter(
        (entry) =>
          entry.features.sldLength >= 5 && entry.features.sldLength <= 8,
      ).length,
    },
    {
      label: 'len9-12',
      count: analyzed.filter(
        (entry) =>
          entry.features.sldLength >= 9 && entry.features.sldLength <= 12,
      ).length,
    },
    {
      label: 'len13+',
      count: analyzed.filter((entry) => entry.features.sldLength >= 13).length,
    },
  ];

  return {
    runMeta: {
      startIso: windowStart.toISOString(),
      endIso: windowEnd.toISOString(),
      generatedAtIso: new Date().toISOString(),
    },
    marketStats: {
      totalListings: entries.length,
      uniqueDomains: uniqueDomainCount,
      sampledListings: listings.length,
      omittedListings: Math.max(0, entries.length - listings.length),
      pricedListings,
      buyNowListings,
      usdPricedListings: usdAsks.length,
      requiredTopPicks: Math.min(MIN_DAILY_TOP_PICKS, distinctValidDomainCount),
      medianAskUsd: computeMedian(usdAsks),
      topTlds: tldCounts,
      lengthBuckets,
      topPatterns: patternCounts,
    },
    taxonomyHints: {
      liquidPatterns: ['3-letter', '3-digit', '4-digit', 'very-short'],
      brandableSignals: ['letters-only', 'no-hyphen', 'len-5-8'],
      riskSignals: ['hyphenated', 'alphanumeric', 'len-13-plus'],
    },
    listings,
  };
}

function buildSupplementalTopPicks(
  existingPicks: ReadonlyArray<{ domain: string }>,
  context: NamefiFeedSalesDigestPromptContext,
): NamefiFeedSalesDigestInsight['topPicks'] {
  if (existingPicks.length >= context.marketStats.requiredTopPicks) {
    return [];
  }

  const seenDomains = new Set(existingPicks.map((pick) => pick.domain));
  const supplementalPicks: NamefiFeedSalesDigestInsight['topPicks'] = [];

  for (const listing of context.listings) {
    const domain = listing.domain.trim().toLowerCase();
    if (!domain || seenDomains.has(domain)) {
      continue;
    }

    seenDomains.add(domain);
    supplementalPicks.push(buildSupplementalTopPick(listing));

    if (
      existingPicks.length + supplementalPicks.length >=
      context.marketStats.requiredTopPicks
    ) {
      break;
    }
  }

  return supplementalPicks;
}

function buildSupplementalTopPick(
  listing: PromptListing,
): NamefiFeedSalesDigestInsight['topPicks'][number] {
  const descriptor = describeListingPattern(listing);
  const pricingCue = describeListingPrice(listing);
  const liquidityCue = listing.hasBuyNow
    ? 'and a direct buy-now path'
    : 'and enough detail for quick review';
  const rawCopy = `${descriptor} ${pricingCue} ${liquidityCue}.`;
  const thesis = clampInsightCopy(normalizeThesis(rawCopy), MAX_THESIS_LENGTH);
  const tweetTake = clampInsightCopy(
    normalizeTweetTake(rawCopy),
    MAX_TWEET_TAKE_LENGTH,
  );

  return {
    domain: listing.domain.trim().toLowerCase(),
    thesis,
    tweetTake,
    tweetPoints: buildSupplementalTweetPoints(listing),
  };
}

function buildSupplementalTweetPoints(listing: PromptListing): string[] {
  const descriptor = describeListingPattern(listing);
  const pricingCue = describeListingPrice(listing);
  const accessCue = listing.hasBuyNow
    ? 'Direct buy-now availability supports faster execution.'
    : 'Listing detail is enough for quick follow-up diligence.';

  return [
    clampInsightCopy(
      normalizeTweetTake(`${descriptor} gives buyers a clear category signal.`),
      MAX_TWEET_POINT_LENGTH,
    ),
    clampInsightCopy(
      normalizeTweetTake(`${pricingCue}; ${accessCue}`),
      MAX_TWEET_POINT_LENGTH,
    ),
  ];
}

function getWordCloudAgent(): WordCloudAgent {
  if (!wordCloudAgent) {
    wordCloudAgent = createWordCloudAgent();
  }
  return wordCloudAgent;
}

function createWordCloudAgent() {
  return new ToolLoopAgent({
    model: openai('gpt-4.1'),
    instructions: wordCloudInstructions,
    tools: {
      [IMAGE_GENERATION_TOOL]: openai.tools.imageGeneration({
        model: NAMEFI_FEED_SALES_DIGEST_WORD_CLOUD_IMAGE_MODEL,
        size: '1536x1024',
        quality: 'medium',
        background: 'opaque',
        outputFormat: 'png',
        outputCompression: 100,
      }),
    },
    toolChoice: {
      type: 'tool',
      toolName: IMAGE_GENERATION_TOOL,
    },
  });
}

async function buildDigestLogoPng(
  layout: DigestLogoOverlayLayout,
): Promise<Buffer> {
  const logoSvg = await getNamefiLogotypeSvg();
  return sharp(Buffer.from(logoSvg), {
    density: 240,
    failOn: 'none',
  })
    .resize({
      width: layout.logoWidth,
      height: layout.logoHeight,
      fit: 'contain',
    })
    .png()
    .toBuffer();
}

async function getNamefiLogotypeSvg(): Promise<string> {
  if (!logotypeSvgPromise) {
    logotypeSvgPromise = readFirstExistingTextFile([
      path.join(process.cwd(), 'apps', 'frontend', 'public', 'logotype.svg'),
      path.join(process.cwd(), '..', 'frontend', 'public', 'logotype.svg'),
      path.join(
        process.cwd(),
        '..',
        '..',
        'apps',
        'frontend',
        'public',
        'logotype.svg',
      ),
      path.join(process.cwd(), 'public', 'logotype.svg'),
    ])
      .then((svg) =>
        svg.replace(LOGOTYPE_FILL_PATTERN, `fill="${DIGEST_LOGO_FILL}"`),
      )
      .catch((error) => {
        logotypeSvgPromise = null;
        throw error;
      });
  }

  return logotypeSvgPromise;
}

async function readFirstExistingTextFile(paths: string[]): Promise<string> {
  let lastError: unknown = null;
  for (const candidate of paths) {
    try {
      return await readFile(candidate, 'utf8');
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `Could not find Namefi logotype SVG for sales digest image overlay. ${lastError instanceof Error ? lastError.message : ''}`.trim(),
  );
}

function formatTopPickLine(pick: NamefiFeedSalesDigestFormattedPick): string {
  const sourceTweetUrl = normalizeOptionalText(pick.sourceTweetUrl);
  const sourceSuffix = sourceTweetUrl ? ` | Source: ${sourceTweetUrl}` : '';
  return `- ${pick.domain}: ${pick.thesis}${sourceSuffix}`;
}

function buildSourceTweetUrlByDomain(
  context: NamefiFeedSalesDigestPromptContext,
): Map<string, string> {
  const sourceTweetUrlByDomain = new Map<string, string>();

  for (const listing of context.listings) {
    const domain = normalizeDigestDomain(listing.domain);

    if (sourceTweetUrlByDomain.has(domain)) {
      continue;
    }

    const sourceTweetUrl = normalizeOptionalText(listing.sourceTweetUrl);
    if (!sourceTweetUrl) {
      continue;
    }

    sourceTweetUrlByDomain.set(domain, sourceTweetUrl);
  }

  return sourceTweetUrlByDomain;
}

function normalizeDigestDomain(value: string): string {
  return value.trim().toLowerCase();
}

function clampInsightCopy(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

function describeListingPattern(listing: PromptListing): string {
  const tld = listing.tld ? `.${listing.tld}` : 'domain';

  if (listing.patternTags.includes('3-letter')) {
    return `Three-letter ${tld} name`;
  }
  if (listing.patternTags.includes('3-digit')) {
    return `Three-digit ${tld} name`;
  }
  if (listing.patternTags.includes('4-digit')) {
    return `Four-digit ${tld} name`;
  }
  if (listing.patternTags.includes('very-short')) {
    return `Very short ${tld} name`;
  }
  if (listing.patternTags.includes('letters-only')) {
    return `Letters-only ${tld} brandable`;
  }
  if (listing.patternTags.includes('hyphenated')) {
    return `Hyphenated ${tld} name`;
  }

  return `${tld} name`;
}

function describeListingPrice(listing: PromptListing): string {
  if (listing.askingUsd !== null) {
    return `priced at ${formatUsd(listing.askingUsd)}`;
  }

  if (listing.askingPriceRaw) {
    return `with a stated ${listing.askingPriceRaw} ask`;
  }

  return 'without a parsed ask';
}

function scorePromptPriority(entry: {
  askingPriceRaw: string | null;
  askingUsd: number | null;
  hasBuyNow: boolean;
  features: DomainFeatures;
  messageSnippet: string | null;
}): number {
  let score = 0;

  if (entry.askingUsd !== null) {
    score += 4;
  } else if (entry.askingPriceRaw) {
    score += 2;
  }

  if (entry.hasBuyNow) {
    score += 2;
  }
  if (entry.features.patternTags.includes('very-short')) {
    score += 2;
  }
  if (entry.features.patternTags.includes('3-letter')) {
    score += 2;
  }
  if (entry.features.patternTags.includes('3-digit')) {
    score += 2;
  }
  if (entry.features.patternTags.includes('letters-only')) {
    score += 1;
  }
  if (entry.features.patternTags.includes('no-hyphen')) {
    score += 1;
  }
  if (entry.messageSnippet) {
    score += 1;
  }

  return score;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Mirrors the migrated digest domain feature taxonomy.
function extractDomainFeatures(domain: string): DomainFeatures {
  const parts = domain.split('.');
  const tld = parts[parts.length - 1] ?? '';
  const sld = parts.length > 1 ? parts[parts.length - 2] : domain;
  const normalizedSld = sld.toLowerCase();
  const sldLength = normalizedSld.length;
  const alnum = normalizedSld.replace(NON_ALNUM_PATTERN, '');
  const tags = new Set<string>();

  if (sldLength <= 4) {
    tags.add('very-short');
  }
  if (sldLength >= 5 && sldLength <= 8) {
    tags.add('len-5-8');
  }
  if (sldLength >= 13) {
    tags.add('len-13-plus');
  }
  if (LETTERS_ONLY_PATTERN.test(normalizedSld)) {
    tags.add('letters-only');
  }
  if (DIGITS_ONLY_PATTERN.test(normalizedSld)) {
    tags.add('digits-only');
    if (sldLength === 3) {
      tags.add('3-digit');
    }
    if (sldLength === 4) {
      tags.add('4-digit');
    }
  }
  if (THREE_LETTER_SLD_PATTERN.test(normalizedSld)) {
    tags.add('3-letter');
  }
  if (normalizedSld.includes('-')) {
    tags.add('hyphenated');
  } else {
    tags.add('no-hyphen');
  }
  if (
    HAS_LETTER_PATTERN.test(normalizedSld) &&
    HAS_DIGIT_PATTERN.test(normalizedSld)
  ) {
    tags.add('alphanumeric');
  }
  if (alnum.length >= 3 && alnum === reverseString(alnum)) {
    tags.add('palindrome');
  }

  return {
    tld,
    sldLength,
    patternTags: Array.from(tags).sort(),
  };
}

function countSellerListings(
  entries: ReadonlyArray<NamefiFeedSalesDigestEntry>,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const seller =
      normalizeOptionalText(entry.sellerUsername) ??
      normalizeOptionalText(entry.sellerDisplayName);
    if (!seller) {
      continue;
    }
    const key = seller.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function compactText(value: string | null): string | null {
  const normalized = normalizeOptionalText(value);
  if (!normalized) {
    return null;
  }
  if (normalized.length <= MAX_MESSAGE_SNIPPET_LENGTH) {
    return normalized;
  }
  return `${normalized.slice(0, MAX_MESSAGE_SNIPPET_LENGTH - 3).trimEnd()}...`;
}

function normalizeThesis(value: string): string {
  const stripped = value
    .replace(THESIS_PREFIX_PATTERN, '')
    .replace(THESIS_WORD_PATTERN, '')
    .replace(WHITESPACE_PATTERN, ' ')
    .trim();
  return stripped.length > 0 ? stripped : 'No summary available.';
}

function normalizeTweetTake(value: string): string {
  const stripped = value
    .replace(TWEET_TAKE_COMPACT_PREFIX_PATTERN, '')
    .replace(TWEET_TAKE_PREFIX_PATTERN, '')
    .replace(NAMEFI_TAKE_PREFIX_PATTERN, '')
    .replace(WHITESPACE_PATTERN, ' ')
    .trim();

  if (
    DIGEST_CONTEXT_PATTERN.test(stripped) ||
    OTHER_DOMAINS_PATTERN.test(stripped) ||
    COMPARISON_PATTERN.test(stripped)
  ) {
    return 'Worth a closer look.';
  }

  return stripped.length > 0 ? stripped : 'Worth a closer look.';
}

function normalizeTweetPoints(values: ReadonlyArray<string>): string[] {
  return values
    .map((value) =>
      normalizeTweetTake(
        value
          .replace(TWEET_POINTS_PREFIX_PATTERN, '')
          .replace(DIGEST_POINT_PREFIX_PATTERN, '')
          .replace(LEADING_BULLET_PATTERN, ''),
      ),
    )
    .filter((value) => value !== 'Worth a closer look.')
    .slice(0, 2);
}

function parseAskUsd(
  askingPrice: string | null,
  askingCurrency: string | null,
): number | null {
  if (!askingPrice || askingCurrency !== 'USD') {
    return null;
  }

  const normalized = askingPrice
    .trim()
    .toLowerCase()
    .replace(ASK_COMMA_PATTERN, '');
  if (!normalized) {
    return null;
  }

  const match = normalized.match(ASK_USD_PATTERN);
  if (!match) {
    return null;
  }

  const base = Number.parseFloat(match[1] ?? '');
  if (!Number.isFinite(base)) {
    return null;
  }

  const suffix = (match[2] ?? '').toLowerCase();
  const multiplier =
    suffix === 'k'
      ? 1_000
      : suffix === 'm'
        ? 1_000_000
        : suffix === 'b'
          ? 1_000_000_000
          : 1;

  return Math.round(base * multiplier);
}

function normalizeCurrencyCode(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) {
    return null;
  }
  if (normalized === '$' || normalized === 'US$') {
    return 'USD';
  }
  return CURRENCY_CODE_PATTERN.test(normalized)
    ? normalized
    : normalized.slice(0, 12);
}

function buildCountList(values: string[]): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return Array.from(counts.entries()).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );
}

function computeMedian(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2);
  }
  return sorted[mid] ?? null;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function stripLeadingDomainLabel(domain: string, value: string): string {
  const escapedDomain = escapeRegExp(domain.trim().toLowerCase());
  const leadingDomainPattern = new RegExp(
    `^(?:(?:https?:\\/\\/)?(?:www\\.)?${escapedDomain}\\/?)(?:\\s*[-:|]\\s*|\\s+)`,
    'i',
  );

  return value.replace(leadingDomainPattern, '').trim();
}

function escapeRegExp(value: string): string {
  return value.replace(REGEXP_SPECIAL_CHARS_PATTERN, '\\$&');
}

function parseImageDataUrl(value: string): { bytes: Buffer } | null {
  const match = value.match(IMAGE_DATA_URL_PATTERN);
  if (!match?.[1] || !match[2]) {
    return null;
  }

  return {
    bytes: Buffer.from(match[2], 'base64'),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function reverseString(value: string): string {
  return value.split('').reverse().join('');
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}
