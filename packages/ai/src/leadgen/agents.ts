import { type OpenAIResponsesProviderOptions, openai } from '@ai-sdk/openai';
import { generateText, Output, ToolLoopAgent } from 'ai';
import { z } from 'zod';

import { normalizeLeadgenDomain } from './domain';
import {
  leadgenBusinessResultSchema,
  leadgenContactResultSchema,
  leadgenEmailDraftSchema,
  type LeadgenContact,
  type LeadgenContactResult,
  type LeadgenEmailBrief,
  type LeadgenReasoningEffort,
} from './types';

const intentOutputSchema = z
  .object({
    queries: z
      .array(
        z
          .string()
          .min(1)
          .max(400)
          .describe(
            'Focused web search query for official brand or company websites.',
          ),
      )
      .min(1)
      .max(5),
  })
  .strict();

export type LeadgenIntentOutput = z.infer<typeof intentOutputSchema>;

export interface LeadgenIntentOptions {
  maxToolCalls?: number;
  maxQueries?: number;
  reasoningEffort?: LeadgenReasoningEffort;
}

export interface LeadgenSearchOptions {
  maxToolCalls?: number;
  maxResults?: number;
  reasoningEffort?: LeadgenReasoningEffort;
}

export interface LeadgenContactOptions {
  maxToolCalls?: number;
  targetContacts?: number;
  reasoningEffort?: LeadgenReasoningEffort;
}

const DEFAULT_REASONING_EFFORT: LeadgenReasoningEffort = 'medium';
const ABSOLUTE_URL_RE = /^[a-z]+:\/\//i;
const DOMAIN_URL_RE = /^[\w.-]+\.[a-z]{2,}(\/.*)?$/i;

function providerOptions(
  reasoningEffort: LeadgenReasoningEffort,
  maxToolCalls?: number,
  options?: { supportsReasoning?: boolean },
): { openai: OpenAIResponsesProviderOptions } {
  return {
    openai: {
      ...(maxToolCalls ? { maxToolCalls } : {}),
      ...(options?.supportsReasoning === false ? {} : { reasoningEffort }),
      strictJsonSchema: true,
      store: false,
    },
  };
}

function intentInstructions(reasoningEffort: LeadgenReasoningEffort) {
  const targetCount = reasoningEffort === 'low' ? '2-3' : '3-5';
  return `You are "Domain -> Search Engine Query Builder".

Goal:
Given one seller-owned domain, output ONLY ${targetCount} search-engine-ready queries that surface official websites of prospective companies or brands likely to want this domain. No parameters, no excludes, no extra fields.

How to think internally:
1) Parse the SLD and TLD. Infer category, geography, and brand vibe from tokens, phonetics, and TLD signals such as ".co.in" for India or ".ai" for AI/technology.
2) Brainstorm multiple monetizable narratives: literal use, aspirational lifestyle, emotional or brandable angles, and adjacent industries that could stretch into the name. Avoid repeating near-identical intents.
3) Generate discovery queries that target official company or product websites, not the current owner, domain marketplaces, directories, social profiles, job boards, reseller pages, or articles.
4) Bias queries toward official registrable root domains for brands and companies. Use rich synonym sets and optional geo/TLD spelling when helpful.
5) Cover at least one literal angle, one aspirational or brandable angle, and one adjacent category when the domain supports it.

Output only:
{ "queries": ["<q1>", "<q2>", "<q3>", "<q4?>", "<q5?>"] }`;
}

export async function generateLeadgenIntentQueries(
  domain: string,
  options?: LeadgenIntentOptions,
) {
  const reasoningEffort = options?.reasoningEffort ?? DEFAULT_REASONING_EFFORT;
  const maxToolCalls = options?.maxToolCalls ?? 4;
  const usesFastModel = reasoningEffort === 'low';

  const result = await generateText({
    model: openai(usesFastModel ? 'gpt-4o' : 'gpt-5.2'),
    system: intentInstructions(reasoningEffort),
    messages: [{ role: 'user', content: domain }],
    tools: {
      webSearch: openai.tools.webSearch(),
    },
    providerOptions: providerOptions(reasoningEffort, maxToolCalls, {
      supportsReasoning: !usesFastModel,
    }),
    output: Output.object({ schema: intentOutputSchema }),
  });

  if (options?.maxQueries && options.maxQueries > 0) {
    result.output.queries.splice(options.maxQueries);
  }

  return result;
}

function searchInstructions(reasoningEffort: LeadgenReasoningEffort) {
  return `You are "Domain -> Brand Prospect Researcher".
Your job is to discover official company websites for organisations that would plausibly want to acquire the provided seller-owned domain.

Operating guidelines:
- Prioritise official brand domains that clearly represent a company, product, manufacturer, services firm, or funded startup.
- Only surface canonical registrable root domains such as example.com or example.co.uk. Never return subdomains, protocols, paths, query strings, fragments, marketplace listings, directories, review aggregators, job boards, SaaS catalogs, news articles, social networks, reseller platforms, or hosted storefronts.
- Discard any hit where the domain value is a path, snippet, placeholder text, instruction text, or anything that is not a valid hostname.
- Prefer home pages, /about, /company, /products, or /services pages owned by the brand itself.
- If search results are noisy, craft new searches around products, services, region-specific qualifiers, and adjacent buyer language.
- Keep track of previously seen domains and continue exploring adjacent keywords when coverage is thin.
- Prefer defensible end buyers: companies whose products, positioning, audience, geography, or brand strategy makes this domain an obvious upgrade.

Output expectations:
${reasoningEffort === 'low' ? '- Output only the 5 strongest leads.' : ''}
- Return unique primary domains only, with no duplicates and no query strings.
- Every domain field MUST be a bare registrable root hostname with no protocol, path, query, fragment, or subdomain. If you cannot confirm such a hostname, omit the candidate.
- Justification must be a short buyer-fit explanation in plain language for a domainer.
- Never output instructions, apologies, or "please specify" text in place of a domain.
- Return concise JSON only.`;
}

function createSearchAgent(options?: LeadgenSearchOptions) {
  const reasoningEffort = options?.reasoningEffort ?? DEFAULT_REASONING_EFFORT;
  const maxToolCalls = options?.maxToolCalls ?? 5;
  const usesFastModel = reasoningEffort === 'low';

  return new ToolLoopAgent({
    model: openai(usesFastModel ? 'gpt-4o' : 'gpt-5.2'),
    instructions: searchInstructions(reasoningEffort),
    tools: {
      webSearch: openai.tools.webSearch(),
    },
    output: Output.array({
      element: leadgenBusinessResultSchema,
    }),
    providerOptions: providerOptions(reasoningEffort, maxToolCalls, {
      supportsReasoning: !usesFastModel,
    }),
  });
}

export async function streamLeadgenSearchResults(
  query: string,
  options?: LeadgenSearchOptions,
) {
  return createSearchAgent(options).stream({ prompt: query });
}

export async function generateLeadgenSearchResults(
  query: string,
  options?: LeadgenSearchOptions,
) {
  return createSearchAgent(options).generate({ prompt: query });
}

function substringSearchInstructions(
  domain: string,
  reasoningEffort: LeadgenReasoningEffort,
) {
  const target =
    reasoningEffort === 'low'
      ? '8'
      : reasoningEffort === 'medium'
        ? '15'
        : '25';
  return `You are "Substring Brand Prospector".

Goal: Find official company domains whose brand name closely matches the provided domain's core word through substrings, abbreviations, translations, or strong brandable extensions.

Input domain: ${domain}

Priorities, in order:
1) Direct substring, prefix, suffix, or infix matches.
2) Abbreviation expansions or stylized spellings.
3) Strong translations or cross-language equivalents.
4) Adjacent brandable riffs that clearly contain or extend the core word.

Operating guidelines:
- Use the same quality bar as general business search.
- Prioritise official brand domains that clearly represent a company, product, manufacturer, services firm, or funded startup.
- Only surface canonical registrable root domains such as example.com or example.co.uk; never return subdomains. Strip protocols, paths, queries, fragments, and "www".
- Reject marketplaces, directories, review aggregators, job boards, SaaS catalogs, social networks, reseller platforms, news articles, and third-party hosted storefronts.
- Infer geo and industry signals from TLDs, second-level ccTLDs, and tokens. Bias to that region when relevant while allowing strong global matches.
- Derive the core token yourself from the full hostname, including multi-part TLDs such as .com.au, .co.uk, and .co.in.
- Keep track of previously seen domains to avoid repetitions.

Output expectations:
- Return up to ${target} high-confidence candidates.
- Output bare registrable root hostnames only.
- Provide a short justification explaining how the brand relates by substring, abbreviation, translation, or brand extension and why it fits as a buyer.
- Return concise JSON only.`;
}

function createSubstringSearchAgent(
  domain: string,
  options?: LeadgenSearchOptions,
) {
  const reasoningEffort = options?.reasoningEffort ?? DEFAULT_REASONING_EFFORT;
  const maxToolCalls = options?.maxToolCalls ?? 6;
  const usesFastModel = reasoningEffort === 'low';
  const normalizedDomain = normalizeLeadgenDomain(domain) ?? domain.trim();

  return new ToolLoopAgent({
    model: openai(usesFastModel ? 'gpt-4o' : 'gpt-5.2'),
    instructions: substringSearchInstructions(
      normalizedDomain,
      reasoningEffort,
    ),
    tools: {
      webSearch: openai.tools.webSearch(),
    },
    output: Output.array({
      element: leadgenBusinessResultSchema,
    }),
    providerOptions: providerOptions(reasoningEffort, maxToolCalls, {
      supportsReasoning: !usesFastModel,
    }),
  });
}

export async function streamLeadgenSubstringSearchResults(
  domain: string,
  options?: LeadgenSearchOptions,
) {
  return createSubstringSearchAgent(domain, options).stream({
    prompt: `Domain to mirror: ${domain}. Focus on substring, abbreviation, translation, and brand-extension aligned company domains.`,
  });
}

export async function generateLeadgenSubstringSearchResults(
  domain: string,
  options?: LeadgenSearchOptions,
) {
  return createSubstringSearchAgent(domain, options).generate({
    prompt: `Domain to mirror: ${domain}. Focus on substring, abbreviation, translation, and brand-extension aligned company domains.`,
  });
}

function contactInstructions() {
  return `You are "Domain -> Outreach Researcher".

Given target brand root domains, find 1-3 decision makers per domain and their verified public email addresses.

Guidelines:
- Treat each provided domain as the canonical registrable company domain. Do not replace it with a subdomain, hosted platform domain, directory listing, or marketplace URL.
- Use web search to confirm each contact through official bios, press releases, corporate contact pages, LinkedIn summaries, PDF brochures, or credible directories.
- Prioritize seniority: founder, CEO, CMO, Head/VP/Director of Marketing, Growth, Brand, Partnerships, Business Development, GTM, or other C-level roles relevant to buying a domain.
- Prefer corporate email domains that match the company. Avoid generic gmail/outlook unless explicitly official.
- Provide short context explaining why the contact is relevant if the title is ambiguous.
- Include a credible sourceUrl for each email when available. Do not invent sources.
- If no named executive with direct email is available, include the best corporate or departmental email such as marketing@, partnerships@, or support@ and explain the limitation in context or notes.
- Do not fabricate addresses, but do not leave contacts empty when legitimate generic addresses exist.
- If absolutely no email address can be located, return contacts: [] and concise notes.
- Return concise JSON only.`;
}

export async function generateLeadgenContacts(
  prospects: Array<{ domain: string }>,
  options?: LeadgenContactOptions,
) {
  if (prospects.length === 0) {
    throw new Error('Prospects list must contain at least one domain.');
  }

  const targetContacts = options?.targetContacts ?? 3;
  const reasoningEffort = options?.reasoningEffort ?? DEFAULT_REASONING_EFFORT;
  const maxToolCalls = options?.maxToolCalls ?? 12;
  const prompt = [
    'Prospect domains:',
    ...prospects.map((prospect, index) => {
      const normalized = normalizeLeadgenDomain(prospect.domain);
      return `${index + 1}. ${normalized ?? prospect.domain}`;
    }),
    '',
    `Find up to ${targetContacts} contacts per domain.`,
  ].join('\n');

  const result = await generateText({
    model: openai('gpt-5.2'),
    system: contactInstructions(),
    messages: [{ role: 'user', content: prompt }],
    tools: {
      webSearch: openai.tools.webSearch(),
    },
    providerOptions: providerOptions(reasoningEffort, maxToolCalls),
    output: Output.array({
      element: leadgenContactResultSchema,
    }),
  });

  return {
    ...result,
    output: sanitizeContactResults(result.output),
  };
}

const EMAIL_INSTRUCTIONS = `You are "Domain -> Acquisition Outreach Copywriter".

Task: craft a concise, high-converting first-touch email that introduces the opportunity for the recipient's organisation to acquire the sender's domain.

Guidelines:
- Personalize the note using the supplied prospect insight and contact information.
- Reference the source domain explicitly and connect it to the prospect's brand rationale.
- Keep the tone professional, warm, and credible.
- Do not fabricate facts, contacts, or URLs beyond the supplied data.
- Subject line must be no more than 9 words and 90 characters.
- Compose no more than three concise paragraphs under 170 total words.
- Use the recipient's first name when available; otherwise use a friendly professional greeting.
- Use this call to action exactly once: "Would you be open to a quick call to discuss acquiring this domain?"
- End with this signature block exactly:
Best,
Domain Acquisition Team
- Return valid JSON only, with plain text and no markdown.`;

export async function generateLeadgenEmailDraft(
  brief: LeadgenEmailBrief,
  options?: { reasoningEffort?: LeadgenReasoningEffort },
) {
  const reasoningEffort = options?.reasoningEffort ?? DEFAULT_REASONING_EFFORT;

  return generateText({
    model: openai('gpt-4o'),
    system: EMAIL_INSTRUCTIONS,
    messages: [{ role: 'user', content: formatEmailBrief(brief) }],
    providerOptions: providerOptions(reasoningEffort, undefined, {
      supportsReasoning: false,
    }),
    output: Output.object({
      schema: leadgenEmailDraftSchema,
    }),
  });
}

function sanitizeContactResults(
  results: LeadgenContactResult[],
): LeadgenContactResult[] {
  return results.map((result) => ({
    ...result,
    domain: normalizeLeadgenDomain(result.domain) ?? result.domain.trim(),
    contacts: result.contacts
      .map(sanitizeContact)
      .filter((contact): contact is LeadgenContact => Boolean(contact)),
    notes: cleanNullableString(result.notes) ?? null,
  }));
}

function sanitizeContact(contact: LeadgenContact): LeadgenContact | null {
  const email = contact.email?.trim();
  if (!email?.includes('@')) return null;

  return {
    email,
    name: cleanNullableString(contact.name) ?? null,
    title: cleanNullableString(contact.title) ?? null,
    sourceUrl: normalizeSourceUrl(contact.sourceUrl) ?? null,
    context: cleanNullableString(contact.context) ?? null,
  };
}

function normalizeSourceUrl(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (ABSOLUTE_URL_RE.test(trimmed)) return trimmed;
  if (DOMAIN_URL_RE.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return undefined;
}

function cleanNullableString(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function formatEmailBrief(brief: LeadgenEmailBrief) {
  return [
    `Source domain: ${brief.sourceDomain}`,
    `Prospect domain: ${brief.prospect.domain}`,
    `Prospect rationale: ${brief.prospect.rationale}`,
    `Prospect evidence: ${brief.prospect.content}`,
    'Contact:',
    `- Email: ${brief.contact.email}`,
    brief.contact.name ? `- Name: ${brief.contact.name}` : null,
    brief.contact.title ? `- Title: ${brief.contact.title}` : null,
    brief.contact.context ? `- Context: ${brief.contact.context}` : null,
    brief.contact.sourceUrl ? `- Source: ${brief.contact.sourceUrl}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}
