import { type OpenAIResponsesProviderOptions, openai } from '@ai-sdk/openai';
import { generateText, Output, ToolLoopAgent } from 'ai';

import { normalizeLeadgenDomain } from './domain';
import {
  leadgenCandidateSignalSchema,
  leadgenContactResultSchema,
  leadgenDiscoveryRecipeValues,
  leadgenDomainProfileSchema,
  leadgenEmailDraftSchema,
  leadgenOpportunityTriageSchema,
  type LeadgenCandidateSignalInput,
  type LeadgenContact,
  type LeadgenContactResult,
  type LeadgenCandidateSignal,
  type LeadgenDiscoveryRecipe,
  type LeadgenDomainProfile,
  type LeadgenEmailBrief,
  type LeadgenOpportunityTriage,
  type LeadgenRecommendedAction,
  type LeadgenReasoningEffort,
} from './types';

export interface LeadgenContactOptions {
  abortSignal?: AbortSignal;
  maxToolCalls?: number;
  targetContacts?: number;
  reasoningEffort?: LeadgenReasoningEffort;
}

export interface LeadgenDomainProfileOptions {
  abortSignal?: AbortSignal;
  maxTheses?: number;
  maxToolCalls?: number;
  reasoningEffort?: LeadgenReasoningEffort;
}

export interface LeadgenDiscoveryOptions {
  abortSignal?: AbortSignal;
  domainProfile?: LeadgenDomainProfile;
  maxResults?: number;
  maxToolCalls?: number;
  reasoningEffort?: LeadgenReasoningEffort;
}

export interface LeadgenTriageOptions {
  abortSignal?: AbortSignal;
  askingPriceUsd?: number;
  domainProfile?: LeadgenDomainProfile | null;
  reasoningEffort?: LeadgenReasoningEffort;
}

export type LeadgenTriageCandidate = {
  domain: string;
  companyName?: string | null;
  existingStatus?: string;
  existingScore?: number;
  signals: Array<{
    recipe: string;
    signalType: string;
    evidenceSnippet: string;
    evidenceUrl?: string | null;
  }>;
};

const DEFAULT_REASONING_EFFORT: LeadgenReasoningEffort = 'medium';
const ABSOLUTE_URL_RE = /^[a-z]+:\/\//i;
const DOMAIN_URL_RE = /^[\w.-]+\.[a-z]{2,}(\/.*)?$/i;
const SENTENCE_BOUNDARY_RE = /^(.{1,220}?[.!?])(?:\s|$)/;
const RECIPE_SIGNAL_LABELS: Record<LeadgenDiscoveryRecipe, string> = {
  exact_near_name_search: 'Name match',
  category_operator_search: 'Category fit',
  local_business_search: 'Local fit',
  paid_demand_check: 'Paid demand',
  growth_trigger_search: 'Growth signal',
  domain_weakness_check: 'Domain upgrade',
  broad_sanity_search: 'Market signal',
};
const ACTION_LABELS: Record<LeadgenRecommendedAction, string> = {
  ready_to_contact: 'Ready to contact',
  finding_contact: 'Finding contact',
  defer_contact: 'Ranked prospect',
  filtered: 'Filtered',
};
export const LEADGEN_FAST_MODEL = 'gpt-5.4-mini';
export const LEADGEN_RESEARCH_MODEL = 'gpt-5.5';
export const LEADGEN_DOMAIN_PROFILE_MODEL = 'gpt-5.4-mini';
export const LEADGEN_CONTACT_MODEL = 'gpt-5.4-mini';
export const LEADGEN_CONTACT_RESEARCH_MODEL = 'gpt-5.5';
export const LEADGEN_EMAIL_MODEL = 'gpt-5.4-mini';

export function getLeadgenPrimaryResearchModel(
  reasoningEffort: LeadgenReasoningEffort,
) {
  return reasoningEffort === 'low' || reasoningEffort === 'medium'
    ? LEADGEN_FAST_MODEL
    : LEADGEN_RESEARCH_MODEL;
}

export function getLeadgenDomainProfileModel() {
  return LEADGEN_DOMAIN_PROFILE_MODEL;
}

export function getLeadgenContactModel(
  reasoningEffort: LeadgenReasoningEffort,
) {
  return reasoningEffort === 'high'
    ? LEADGEN_CONTACT_RESEARCH_MODEL
    : LEADGEN_CONTACT_MODEL;
}

// Effort levels tune search-call and contact-count budgets. Revalidate cost,
// throughput, and contact success-rate targets whenever these values change.
function getLeadgenDomainProfileMaxToolCalls(
  reasoningEffort: LeadgenReasoningEffort,
) {
  switch (reasoningEffort) {
    case 'low':
      return 1;
    case 'medium':
      return 1;
    case 'high':
      return 2;
  }
}

function getLeadgenContactMaxToolCalls(
  reasoningEffort: LeadgenReasoningEffort,
) {
  switch (reasoningEffort) {
    case 'low':
      return 4;
    case 'medium':
      return 6;
    case 'high':
      return 9;
  }
}

function getLeadgenTargetContactCount(reasoningEffort: LeadgenReasoningEffort) {
  switch (reasoningEffort) {
    case 'low':
      return 1;
    case 'medium':
      return 2;
    case 'high':
      return 3;
  }
}

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

const FIXED_RECIPE_LIST = leadgenDiscoveryRecipeValues.join(', ');

function domainThesisInstructions(targetTheses: number) {
  return `Role: You are "Domain Thesis Agent", a broker-grade domain outbound planner.
Goal: For one seller-owned domain, produce a grounded opportunity frame and exactly ${targetTheses} buyer theses that can drive end-user outbound.
Success criteria: Use a fast evidence pass to identify commercial meaning, exact or near-name usage, category/geo meaning, and buyer-specific evidence patterns. Deeper prospect validation happens later.
Evidence rules: Use web search. Do not invent market demand or active companies. The opportunity frame must explain what kind of domain asset this is and what evidence standard makes a buyer real for this domain.
Tool budget: Use the fewest precise searches needed to frame the angles, then stop.
Constraints: Choose discovery recipes only from this fixed list: ${FIXED_RECIPE_LIST}. Always include seed queries that can find official company websites. For short/acronym/brandable domains, allow acronym, brand-upgrade, funded-company, and weak-domain evidence rather than requiring keyword usage. Do not expose internal reasoning.
Output: Return the structured DomainThesisProfile only.`;
}

function getLeadgenDomainProfileReasoningEffort(
  reasoningEffort: LeadgenReasoningEffort,
): LeadgenReasoningEffort {
  return reasoningEffort === 'high' ? 'medium' : 'low';
}

function getTargetThesisCount(
  reasoningEffort: LeadgenReasoningEffort,
  maxTheses: number,
) {
  const target =
    reasoningEffort === 'low' ? 2 : reasoningEffort === 'medium' ? 3 : 5;
  return Math.max(1, Math.min(maxTheses, target));
}

export async function generateLeadgenDomainThesisProfile(
  domain: string,
  options?: LeadgenDomainProfileOptions,
) {
  const reasoningEffort = options?.reasoningEffort ?? DEFAULT_REASONING_EFFORT;
  const maxTheses =
    options?.maxTheses ??
    (reasoningEffort === 'low' ? 2 : reasoningEffort === 'medium' ? 3 : 5);
  const targetTheses = getTargetThesisCount(reasoningEffort, maxTheses);
  const maxToolCalls =
    options?.maxToolCalls ??
    getLeadgenDomainProfileMaxToolCalls(reasoningEffort);

  const result = await generateText({
    model: openai(getLeadgenDomainProfileModel()),
    system: domainThesisInstructions(targetTheses),
    messages: [
      {
        role: 'user',
        content: [
          `Seller-owned domain: ${domain}`,
          `Return exactly ${targetTheses} buyer theses.`,
          'Optimize for high-conviction outbound opportunities, not broad lead volume.',
        ].join('\n'),
      },
    ],
    tools: {
      webSearch: openai.tools.webSearch(),
    },
    toolChoice: { type: 'tool', toolName: 'webSearch' },
    providerOptions: providerOptions(
      getLeadgenDomainProfileReasoningEffort(reasoningEffort),
      maxToolCalls,
    ),
    abortSignal: options?.abortSignal,
    output: Output.object({ schema: leadgenDomainProfileSchema }),
  });

  return {
    ...result,
    output: sanitizeDomainProfile(result.output, {
      maxTheses,
    }),
  };
}

function sanitizeDomainProfile(
  profile: LeadgenDomainProfile,
  options: { maxTheses: number },
): LeadgenDomainProfile {
  const seedQueries = [
    ...new Set(
      profile.seedQueries.map((query) => query.trim()).filter(Boolean),
    ),
  ];
  const theses = profile.theses.slice(0, options.maxTheses).map((thesis) => ({
    ...thesis,
    // Every thesis keeps a bounded baseline exact-name and broad sanity pass
    // before adding vetted thesis recipes, so weak or narrow profiles still
    // get fallback coverage without exceeding the five-recipe cap.
    discoveryRecipes: [
      ...new Set([
        'exact_near_name_search' as const,
        'broad_sanity_search' as const,
        ...thesis.discoveryRecipes.filter((recipe) =>
          leadgenDiscoveryRecipeValues.includes(recipe),
        ),
      ]),
    ].slice(0, 5),
    seedQueries: [
      ...new Set(
        thesis.seedQueries.map((query) => query.trim()).filter(Boolean),
      ),
    ].slice(0, 5),
  }));
  const searchDirections = profile.searchDirections
    .filter((direction) =>
      leadgenDiscoveryRecipeValues.includes(direction.recipe),
    )
    .map((direction) => ({
      recipe: direction.recipe,
      intent: clipToSentence(direction.intent.trim(), 140),
    }));

  return {
    evidenceStandards: uniqueNonEmpty(profile.evidenceStandards).slice(0, 6),
    searchDirections: searchDirections.length
      ? searchDirections.slice(0, 6)
      : [
          {
            recipe: 'broad_sanity_search',
            intent: 'Find official company sites with buyer-specific evidence.',
          },
        ],
    traits: profile.traits.slice(0, 8),
    theses,
    cautions: profile.cautions.slice(0, 5),
    seedQueries: [
      ...new Set(
        [
          `${profile.seedQueries[0] ?? ''}`.trim(),
          `"${profile.seedQueries[1] ?? profile.seedQueries[0] ?? ''}" official company`.trim(),
          ...seedQueries,
        ].filter(Boolean),
      ),
    ].slice(0, 8),
  };
}

function discoveryInstructions(
  recipe: LeadgenDiscoveryRecipe,
  reasoningEffort: LeadgenReasoningEffort,
) {
  const target =
    reasoningEffort === 'low'
      ? '5-8'
      : reasoningEffort === 'medium'
        ? '8-15'
        : '12-25';

  return `Role: You are "Opportunity Discovery Agent", an evidence collector for domain outbound.
Goal: Find official company root domains that may have a buyer-specific reason to care about the seller-owned domain.
Success criteria: Return only candidates with a canonical official root domain and a concise web-supported evidence snippet.
Evidence rules: Use web search. Same-vibe or same-industry is insufficient unless there is a concrete offer, domain pain, paid demand, growth trigger, local/category fit, or exact/near-name alignment.
Tool budget: Use the active recipe "${recipe}" and stop after finding the strongest ${target} candidates or when searches repeat low-quality results.
Constraints: Do not score leads, suppress leads, draft outreach, or expose recipe names to the user. Reject marketplaces, directories, review aggregators, social profiles, hosted storefronts, job boards, news pages, and the seller domain.
Output: Return structured candidate signals only.`;
}

function createDiscoveryAgent(
  recipe: LeadgenDiscoveryRecipe,
  options?: LeadgenDiscoveryOptions,
) {
  const reasoningEffort = options?.reasoningEffort ?? DEFAULT_REASONING_EFFORT;
  const maxToolCalls =
    options?.maxToolCalls ??
    (reasoningEffort === 'low' ? 3 : reasoningEffort === 'medium' ? 5 : 8);

  return new ToolLoopAgent({
    model: openai(getLeadgenPrimaryResearchModel(reasoningEffort)),
    instructions: discoveryInstructions(recipe, reasoningEffort),
    tools: {
      webSearch: openai.tools.webSearch(),
    },
    toolChoice: { type: 'tool', toolName: 'webSearch' },
    output: Output.array({
      element: leadgenCandidateSignalSchema,
    }),
    providerOptions: providerOptions(reasoningEffort, maxToolCalls),
  });
}

export async function streamLeadgenCandidateSignals(params: {
  sourceDomain: string;
  recipe: LeadgenDiscoveryRecipe;
  queries: string[];
  options?: LeadgenDiscoveryOptions;
}) {
  const normalizedDomain =
    normalizeLeadgenDomain(params.sourceDomain) ?? params.sourceDomain.trim();
  const profileSummary = formatDomainProfileForPrompt(
    params.options?.domainProfile,
  );
  const prompt = [
    `Seller-owned domain: ${normalizedDomain}`,
    `Active recipe: ${params.recipe}`,
    profileSummary,
    'Search queries to use or adapt:',
    ...params.queries.map((query, index) => `${index + 1}. ${query}`),
    `Return at most ${params.options?.maxResults ?? 12} candidate signals.`,
  ]
    .filter(Boolean)
    .join('\n');

  return createDiscoveryAgent(params.recipe, params.options).stream({
    prompt,
    abortSignal: params.options?.abortSignal,
  });
}

export async function generateLeadgenCandidateSignals(params: {
  sourceDomain: string;
  recipe: LeadgenDiscoveryRecipe;
  queries: string[];
  options?: LeadgenDiscoveryOptions;
}) {
  const stream = await streamLeadgenCandidateSignals(params);
  const output = await stream.output;
  const maxResults = params.options?.maxResults ?? 12;
  const sanitizedSignals = sanitizeCandidateSignals(
    Array.isArray(output) ? output : [],
    params.sourceDomain,
    params.recipe,
  );

  return {
    ...stream,
    output: sanitizedSignals.slice(0, maxResults),
  };
}

function triageInstructions() {
  return `Role: You are "Opportunity Triage Agent", a domain outbound deal desk.
Goal: Rank canonical buyer opportunities for one seller-owned domain.
Success criteria: Promote only buyers with a buyer-specific reason to care. Same-vibe, same-industry, or generic budget alone cannot become a ready-to-contact opportunity. Each thesis says what the company does and why this domain fits in one concise buyer-facing sentence.
Evidence rules: Use only supplied evidence and the domain evidence standards. Do not browse, invent facts, infer contacts, or add claims not in signals.
Tool budget: No tools.
Constraints: Score sale likelihood from fit + buyer pain + timing + capacity + contactability - adoption friction. Suppress invalid, noisy, or weak-evidence opportunities. Do not emit list-tier labels; the app shows one ranked prospect list. Use recommendedAction only to indicate whether contact research should run now. Keep thesis to one natural sentence under 180 characters. Do not write separate rationale/evidence recaps or repeat the same fact in motion and thesis. Keep motion to a short action label under 40 characters.
Output: Return structured opportunity triage records only.`;
}

export async function generateLeadgenOpportunityTriages(params: {
  sourceDomain: string;
  candidates: LeadgenTriageCandidate[];
  options?: LeadgenTriageOptions;
}) {
  if (params.candidates.length === 0) {
    throw new Error('Triage candidates list must not be empty.');
  }

  const reasoningEffort =
    params.options?.reasoningEffort ?? DEFAULT_REASONING_EFFORT;
  const result = await generateText({
    model: openai(getLeadgenPrimaryResearchModel(reasoningEffort)),
    system: triageInstructions(),
    messages: [
      {
        role: 'user',
        content: [
          `Seller-owned domain: ${params.sourceDomain}`,
          params.options?.askingPriceUsd
            ? `Seller asking price: $${params.options.askingPriceUsd}`
            : 'Seller asking price: unknown',
          formatDomainProfileForPrompt(params.options?.domainProfile),
          'Canonical buyer candidates:',
          JSON.stringify(params.candidates, null, 2),
        ]
          .filter(Boolean)
          .join('\n'),
      },
    ],
    providerOptions: providerOptions(reasoningEffort),
    abortSignal: params.options?.abortSignal,
    output: Output.array({
      element: leadgenOpportunityTriageSchema,
    }),
  });

  return {
    ...result,
    output: sanitizeTriages(result.output),
  };
}

function formatDomainProfileForPrompt(profile?: LeadgenDomainProfile | null) {
  if (!profile) return '';
  return [
    'Domain thesis profile:',
    JSON.stringify(
      {
        evidenceStandards: profile.evidenceStandards,
        searchDirections: profile.searchDirections,
        traits: profile.traits,
        theses: profile.theses.map((thesis) => ({
          title: thesis.title,
          confidence: thesis.confidence,
          requiredEvidence: thesis.requiredEvidence,
        })),
        cautions: profile.cautions,
      },
      null,
      2,
    ),
  ].join('\n');
}

export function sanitizeCandidateSignals(
  signals: LeadgenCandidateSignalInput[],
  sourceDomain?: string,
  recipe: LeadgenDiscoveryRecipe = 'broad_sanity_search',
): LeadgenCandidateSignal[] {
  const source = sourceDomain ? normalizeLeadgenDomain(sourceDomain) : null;
  const seen = new Set<string>();
  const sanitized: LeadgenCandidateSignal[] = [];

  for (const signal of signals) {
    const domain = normalizeLeadgenDomain(signal.domain);
    if (!domain || domain === source) continue;

    const normalizedDomain = String(domain);
    const signalRecipe = recipe ?? 'broad_sanity_search';
    const dedupeKey = [
      normalizedDomain,
      signalRecipe,
      signal.signalType.trim().toLowerCase(),
      signal.evidenceSnippet.trim().toLowerCase(),
    ].join(':');
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    sanitized.push({
      ...signal,
      recipe: signalRecipe,
      domain: normalizedDomain,
      companyName: cleanNullableString(signal.companyName) ?? null,
      signalType: cleanSignalType(signal.signalType, signalRecipe),
      query: signal.query.trim(),
      evidenceUrl: normalizeSourceUrl(signal.evidenceUrl) ?? null,
      evidenceSnippet: signal.evidenceSnippet.trim(),
      candidateReason: signal.candidateReason.trim(),
    });
  }

  return sanitized;
}

function sanitizeTriages(
  triages: LeadgenOpportunityTriage[],
): LeadgenOpportunityTriage[] {
  const seen = new Set<string>();
  const sanitized: LeadgenOpportunityTriage[] = [];

  for (const triage of triages) {
    const domain = normalizeLeadgenDomain(triage.domain);
    if (!domain || seen.has(domain)) continue;
    seen.add(domain);

    const recommendedAction = triage.recommendedAction;
    const status = getStatusForRecommendedAction(recommendedAction);

    sanitized.push({
      ...triage,
      domain: String(domain),
      status,
      score: Math.max(0, Math.min(100, Math.trunc(triage.score))),
      recommendedAction,
      motion: getActionMotion(recommendedAction),
      thesis: clipToSentence(triage.thesis.trim(), 180),
    });
  }

  return sanitized;
}

function getStatusForRecommendedAction(
  action: LeadgenRecommendedAction,
): LeadgenOpportunityTriage['status'] {
  if (action === 'filtered') return 'suppressed';
  if (action === 'defer_contact') return 'low_priority';
  return 'contact_now';
}

function getActionMotion(action: LeadgenRecommendedAction) {
  return ACTION_LABELS[action];
}

function uniqueNonEmpty(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function clipToSentence(value: string, maxLength: number) {
  const sentence =
    SENTENCE_BOUNDARY_RE.exec(value)?.[1]?.trim() ?? value.trim();
  if (sentence.length <= maxLength) return sentence;

  return `${sentence.slice(0, Math.max(0, maxLength - 1)).trimEnd()}.`;
}

function contactInstructions() {
  return `Role: You are "Contact Agent", an outreach researcher for domain acquisition opportunities.
Goal: Find 1-3 public, source-backed decision-maker emails per target company.
Success criteria: Prioritize founder, CEO, CMO, Head/VP/Director of Marketing, Growth, Brand, Partnerships, Business Development, GTM, or another role that could plausibly evaluate a domain acquisition.
Evidence rules: Use web search. Confirm contacts through official bios, press releases, corporate contact pages, LinkedIn summaries, PDFs, or credible directories. Do not invent emails or sources.
Tool budget: Search each company until a credible named contact or legitimate generic fallback is found, then stop.
Constraints: Treat each input as the canonical company root domain. Do not replace it with subdomains, hosted platforms, directories, or marketplaces. Generic emails such as marketing@ or partnerships@ are allowed only as explicit fallback with notes.
Output: Return structured contact results only.`;
}

export async function generateLeadgenContacts(
  prospects: Array<{ domain: string }>,
  options?: LeadgenContactOptions,
) {
  if (prospects.length === 0) {
    throw new Error('Prospects list must contain at least one domain.');
  }

  const reasoningEffort = options?.reasoningEffort ?? DEFAULT_REASONING_EFFORT;
  const targetContacts =
    options?.targetContacts ?? getLeadgenTargetContactCount(reasoningEffort);
  const maxToolCalls =
    options?.maxToolCalls ?? getLeadgenContactMaxToolCalls(reasoningEffort);
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
    model: openai(getLeadgenContactModel(reasoningEffort)),
    system: contactInstructions(),
    messages: [{ role: 'user', content: prompt }],
    tools: {
      webSearch: openai.tools.webSearch(),
    },
    toolChoice: { type: 'tool', toolName: 'webSearch' },
    providerOptions: providerOptions(reasoningEffort, maxToolCalls),
    abortSignal: options?.abortSignal,
    output: Output.array({
      element: leadgenContactResultSchema,
    }),
  });

  return {
    ...result,
    output: sanitizeContactResults(result.output),
  };
}

const EMAIL_INSTRUCTIONS = `Role: You are "Outreach Agent", a domain acquisition copywriter.
Goal: Write a concise first-touch email that connects the seller-owned domain to the prospect's specific opportunity thesis.
Success criteria: The email is credible, buyer-specific, and easy to reply to.
Evidence rules: Use only supplied thesis, signals, and contact context. Do not invent facts, urgency, price, traffic, or SEO claims.
Tool budget: No tools.
Constraints: Subject line must be no more than 9 words and 90 characters. Body must be at most three concise paragraphs under 170 words. Use this call to action exactly once: "Would you be open to a quick call to discuss acquiring this domain?" End with this signature block exactly:
Best,
Domain Acquisition Team
Output: Return the structured email draft only, with plain text and no markdown.`;

export async function generateLeadgenEmailDraft(
  brief: LeadgenEmailBrief,
  options?: {
    abortSignal?: AbortSignal;
    reasoningEffort?: LeadgenReasoningEffort;
  },
) {
  const reasoningEffort = options?.reasoningEffort ?? 'low';

  return generateText({
    model: openai(LEADGEN_EMAIL_MODEL),
    system: EMAIL_INSTRUCTIONS,
    messages: [{ role: 'user', content: formatEmailBrief(brief) }],
    providerOptions: providerOptions(reasoningEffort),
    abortSignal: options?.abortSignal,
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

function cleanSignalType(value: string, recipe: LeadgenDiscoveryRecipe) {
  const fallback = RECIPE_SIGNAL_LABELS[recipe];
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  const normalized = trimmed.toLowerCase().replace(/[\s-]+/g, '_');
  if (
    leadgenDiscoveryRecipeValues.includes(
      normalized as LeadgenDiscoveryRecipe,
    ) ||
    normalized.endsWith('_search') ||
    normalized.endsWith('_check')
  ) {
    return fallback;
  }

  return trimmed;
}

function formatEmailBrief(brief: LeadgenEmailBrief) {
  return [
    `Source domain: ${brief.sourceDomain}`,
    `Prospect domain: ${brief.prospect.domain}`,
    brief.prospect.thesis
      ? `Opportunity thesis: ${brief.prospect.thesis}`
      : null,
    `Prospect rationale: ${brief.prospect.rationale}`,
    `Prospect evidence: ${brief.prospect.content}`,
    brief.prospect.signals?.length
      ? [
          'Evidence signals:',
          ...brief.prospect.signals.map((signal) =>
            [
              `- ${signal.signalType}: ${signal.evidenceSnippet}`,
              signal.evidenceUrl ? `Source: ${signal.evidenceUrl}` : null,
            ]
              .filter(Boolean)
              .join(' '),
          ),
        ].join('\n')
      : null,
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
