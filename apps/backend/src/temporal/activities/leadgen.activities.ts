import { Context } from '@temporalio/activity';
import {
  generateLeadgenDomainThesisProfile,
  generateLeadgenOpportunityTriages,
  getLeadgenDomainProfileModel,
  getLeadgenPrimaryResearchModel,
  normalizeLeadgenDomain,
  sanitizeCandidateSignals,
  streamLeadgenCandidateSignals,
  type LeadgenCandidateSignal,
  type LeadgenDiscoveryRecipe,
  type LeadgenDomainProfile,
  type LeadgenOpportunityStatus,
  type LeadgenOpportunityTriage,
  type LeadgenReasoningEffort,
  type LeadgenTriageCandidate,
} from '@namefi-astra/ai';
import {
  db,
  leadgenLeadSignalsTable,
  leadgenLeadsTable,
  leadgenRunsTable,
} from '@namefi-astra/db';
import { and, asc, count, eq, inArray, ne, sql } from 'drizzle-orm';
import { createLogger } from '#lib/logger';
import {
  discoverLeadgenContactsAndDraft,
  generateLeadgenLeadOutreach,
  getLeadgenErrorMessage,
  persistLeadgenEvent,
  refreshLeadgenRunCounts,
} from '../../services/leadgen/outreach.service';
import { appendLeadgenTokenUsageFromResult } from '../../services/leadgen/token-usage';

const logger = createLogger({ module: 'leadgen-activities' });

const LEADGEN_HEARTBEAT_INTERVAL_MS = 20_000;
const SEED_RECIPES: LeadgenDiscoveryRecipe[] = [
  'exact_near_name_search',
  'broad_sanity_search',
];
const RECIPE_ORDER: LeadgenDiscoveryRecipe[] = [
  'category_operator_search',
  'paid_demand_check',
  'growth_trigger_search',
  'domain_weakness_check',
  'local_business_search',
];
const STATUS_RANK: Record<LeadgenOpportunityStatus, number> = {
  contact_now: 0,
  checking: 2_000,
  low_priority: 3_000,
  suppressed: 4_000,
};

export interface InitializeLeadgenRunParams {
  runId: string;
  workflowId: string;
}

export interface LeadgenDomainProfileActivityParams {
  runId: string;
  domain: string;
  reasoningEffort: LeadgenReasoningEffort;
  maxTheses?: number;
}

export interface LeadgenSeedDiscoveryActivityParams {
  runId: string;
  sourceDomain: string;
  reasoningEffort: LeadgenReasoningEffort;
  rawCandidateLimit?: number;
  askingPriceUsd?: number;
}

export interface LeadgenRecipeDiscoveryActivityParams {
  runId: string;
  sourceDomain: string;
  domainProfile: LeadgenDomainProfile;
  reasoningEffort: LeadgenReasoningEffort;
  selectedRecipeLimit?: number;
  rawCandidateLimit?: number;
  askingPriceUsd?: number;
}

export interface FinalizeLeadgenOpportunitiesParams {
  runId: string;
  sourceDomain: string;
  domainProfile: LeadgenDomainProfile;
  reasoningEffort: LeadgenReasoningEffort;
  askingPriceUsd?: number;
  contactDiscoveryLimit?: number;
}

export interface DiscoverLeadgenEarlyContactsParams {
  runId: string;
  sourceDomain: string;
  reasoningEffort: LeadgenReasoningEffort;
  contactDiscoveryLimit: number;
}

export interface GenerateLeadgenLeadOutreachParams {
  runId: string;
  leadId: string;
  sourceDomain: string;
  reasoningEffort: LeadgenReasoningEffort;
}

export interface CompleteLeadgenRunParams {
  runId: string;
}

export interface FailLeadgenRunParams {
  runId: string;
  errorMessage: string;
}

type LeadRow = typeof leadgenLeadsTable.$inferSelect;
type SignalRow = typeof leadgenLeadSignalsTable.$inferSelect;
type LeadgenActivityContext = Pick<Context, 'cancellationSignal' | 'heartbeat'>;
type LeadgenEffortConfig = {
  maxTheses: number;
  rawCandidateLimit: number;
  triageLeadLimit: number;
  contactDiscoveryLimit: number;
  selectedRecipeLimit: number;
  discoveryMaxResults: number;
  recipeConcurrency: number;
  triageBatchSize: number;
};
type DiscoveryRecipeJob = {
  recipe: LeadgenDiscoveryRecipe;
  queries: string[];
};
type DiscoveryRuntime = {
  sourceDomain: string;
  domainProfile?: LeadgenDomainProfile | null;
  reasoningEffort: LeadgenReasoningEffort;
  askingPriceUsd?: number;
  abortSignal: AbortSignal;
  config: LeadgenEffortConfig;
  pendingTriageDomains: Set<string>;
  emittedLeadDomains: Set<string>;
  persistedSignalKeys: Set<string>;
  persistedSignalCount: number;
  nextRank: number;
};

export async function heartbeatLeadgenWhile<T>(
  operation: (abortSignal: AbortSignal) => Promise<T>,
  details: Record<string, unknown>,
  intervalMs = LEADGEN_HEARTBEAT_INTERVAL_MS,
  ctx: LeadgenActivityContext = Context.current(),
): Promise<T> {
  const abortController = new AbortController();

  if (ctx.cancellationSignal.aborted) {
    abortController.abort(ctx.cancellationSignal.reason);
    throw new Error('activity-cancelled');
  }

  return await new Promise<T>((resolve, reject) => {
    let settled = false;
    let interval: ReturnType<typeof setInterval> | undefined;

    const cleanup = () => {
      if (interval) {
        clearInterval(interval);
      }
      ctx.cancellationSignal.removeEventListener('abort', cancelOperation);
    };

    const resolveOnce = (value: T) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      resolve(value);
    };

    const rejectOnce = (error: unknown) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      reject(error);
    };

    const cancelOperation = () => {
      abortController.abort(ctx.cancellationSignal.reason);
      rejectOnce(new Error('activity-cancelled'));
    };

    ctx.cancellationSignal.addEventListener('abort', cancelOperation, {
      once: true,
    });

    const sendHeartbeat = () => {
      try {
        ctx.heartbeat(details);
      } catch (error) {
        logger.debug(
          { error, details },
          'Leadgen activity heartbeat failed; aborting in-flight work',
        );
        abortController.abort(error);
        rejectOnce(
          error instanceof Error
            ? error
            : new Error('leadgen-activity-heartbeat-failed'),
        );
      }
    };

    sendHeartbeat();

    if (settled) {
      return;
    }

    interval = setInterval(sendHeartbeat, intervalMs);

    void operation(abortController.signal).then(resolveOnce).catch(rejectOnce);
  });
}

function throwIfLeadgenAborted(abortSignal: AbortSignal) {
  if (!abortSignal.aborted) {
    return;
  }

  throw abortSignal.reason instanceof Error
    ? abortSignal.reason
    : new Error('activity-cancelled');
}

export async function initializeLeadgenRun({
  runId,
  workflowId,
}: InitializeLeadgenRunParams) {
  const now = new Date();
  await db
    .update(leadgenRunsTable)
    .set({
      status: 'RUNNING',
      workflowId,
      startedAt: now,
      updatedAt: now,
    })
    .where(eq(leadgenRunsTable.id, runId));

  await persistLeadgenEvent({
    runId,
    eventType: 'status',
    stage: 'intent',
    message: 'Finding buyer angles.',
  });
}

export async function generateLeadgenDomainProfileActivity({
  runId,
  domain,
  reasoningEffort,
  maxTheses,
}: LeadgenDomainProfileActivityParams) {
  const result = await heartbeatLeadgenWhile(
    (abortSignal) =>
      generateLeadgenDomainThesisProfile(domain, {
        abortSignal,
        reasoningEffort,
        maxTheses,
      }),
    { stage: 'intent', runId, domain },
  );
  await recordLeadgenTokenUsageFromResult({
    runId,
    result,
    fallbackModel: getLeadgenDomainProfileModel(),
  });
  await persistDomainProfile({ runId, domainProfile: result.output });

  const angleTitles = result.output.theses.map((thesis) => thesis.title);
  await persistLeadgenEvent({
    runId,
    eventType: 'intent-queries',
    stage: 'intent',
    message:
      angleTitles.length > 0
        ? `Found ${angleTitles.length} buyer ${angleTitles.length === 1 ? 'angle' : 'angles'}.`
        : 'Buyer angles ready.',
    payload: {
      queries: angleTitles,
      buyerAngles: angleTitles,
    },
  });

  return { domainProfile: result.output };
}

export async function discoverLeadgenSeedCandidatesActivity(
  params: LeadgenSeedDiscoveryActivityParams,
) {
  return await heartbeatLeadgenWhile(
    (abortSignal) =>
      discoverLeadgenSignals({
        ...params,
        abortSignal,
        domainProfile: null,
        jobs: buildSeedRecipeJobs(params.sourceDomain),
        eventMessage: 'Finding prospects.',
      }),
    {
      stage: 'search',
      runId: params.runId,
      recipeGroup: 'seed',
    },
  );
}

export async function discoverLeadgenRecipeCandidatesActivity(
  params: LeadgenRecipeDiscoveryActivityParams,
) {
  return await heartbeatLeadgenWhile(
    (abortSignal) =>
      discoverLeadgenSignals({
        ...params,
        abortSignal,
        jobs: buildProfileRecipeJobs({
          sourceDomain: params.sourceDomain,
          domainProfile: params.domainProfile,
          selectedRecipeLimit:
            params.selectedRecipeLimit ??
            getLeadgenEffortConfig(params.reasoningEffort).selectedRecipeLimit,
        }),
        eventMessage: 'Finding more prospects from buyer angles.',
      }),
    {
      stage: 'search',
      runId: params.runId,
      recipeGroup: 'profile',
    },
  );
}

export async function finalizeLeadgenOpportunitiesActivity(
  params: FinalizeLeadgenOpportunitiesParams,
) {
  return await heartbeatLeadgenWhile(
    async (abortSignal) => {
      const config = getLeadgenEffortConfig(params.reasoningEffort, {
        contactDiscoveryLimit: params.contactDiscoveryLimit,
      });

      await persistLeadgenEvent({
        runId: params.runId,
        eventType: 'status',
        stage: 'triage',
        message: 'Scoring remaining prospects.',
      });

      await triageLeadgenCandidates({
        runId: params.runId,
        sourceDomain: params.sourceDomain,
        domainProfile: params.domainProfile,
        reasoningEffort: params.reasoningEffort,
        askingPriceUsd: params.askingPriceUsd,
        statuses: ['checking'],
        limit: config.triageLeadLimit,
        abortSignal,
      });

      await discoverContactsForPromotedLeads({
        runId: params.runId,
        sourceDomain: params.sourceDomain,
        reasoningEffort: params.reasoningEffort,
        contactDiscoveryLimit: config.contactDiscoveryLimit,
        abortSignal,
      });

      return await refreshLeadgenRunCounts(params.runId);
    },
    {
      stage: 'contacts',
      runId: params.runId,
    },
  );
}

export async function discoverLeadgenEarlyContactsActivity(
  params: DiscoverLeadgenEarlyContactsParams,
) {
  if (params.contactDiscoveryLimit <= 0) {
    return await refreshLeadgenRunCounts(params.runId);
  }

  return await heartbeatLeadgenWhile(
    async (abortSignal) => {
      await discoverContactsForPromotedLeads({
        runId: params.runId,
        sourceDomain: params.sourceDomain,
        reasoningEffort: params.reasoningEffort,
        contactDiscoveryLimit: params.contactDiscoveryLimit,
        abortSignal,
      });

      return await refreshLeadgenRunCounts(params.runId);
    },
    {
      stage: 'contacts',
      runId: params.runId,
      early: true,
    },
  );
}

async function discoverLeadgenSignals(params: {
  runId: string;
  sourceDomain: string;
  domainProfile?: LeadgenDomainProfile | null;
  reasoningEffort: LeadgenReasoningEffort;
  askingPriceUsd?: number;
  rawCandidateLimit?: number;
  abortSignal: AbortSignal;
  jobs: DiscoveryRecipeJob[];
  eventMessage: string;
}) {
  const config = getLeadgenEffortConfig(params.reasoningEffort, {
    rawCandidateLimit: params.rawCandidateLimit,
  });
  if (params.jobs.length === 0) {
    return { inserted: 0 };
  }

  const runtime: DiscoveryRuntime = {
    sourceDomain: params.sourceDomain,
    domainProfile: params.domainProfile,
    reasoningEffort: params.reasoningEffort,
    askingPriceUsd: params.askingPriceUsd,
    abortSignal: params.abortSignal,
    config,
    pendingTriageDomains: new Set<string>(),
    emittedLeadDomains: new Set<string>(),
    persistedSignalKeys: new Set<string>(),
    persistedSignalCount: 0,
    nextRank: await getNextLeadgenRank(params.runId),
  };

  await persistLeadgenEvent({
    runId: params.runId,
    eventType: 'status',
    stage: 'search',
    message: params.eventMessage,
    payload: {
      queryCount: params.jobs.reduce(
        (count, job) => count + job.queries.length,
        0,
      ),
    },
  });

  const recipeLimit = Math.max(
    1,
    Math.ceil(config.rawCandidateLimit / Math.max(1, params.jobs.length)),
  );

  await runWithConcurrency(
    params.jobs,
    config.recipeConcurrency,
    async (job) => {
      await processDiscoveryRecipe({
        runId: params.runId,
        job,
        maxResults: Math.min(recipeLimit, config.discoveryMaxResults),
        runtime,
      });
    },
  );

  await triagePendingDomains({
    runId: params.runId,
    runtime,
    force: true,
  });
  await refreshLeadgenRunCounts(params.runId);

  return { inserted: runtime.emittedLeadDomains.size };
}

async function processDiscoveryRecipe(params: {
  runId: string;
  job: DiscoveryRecipeJob;
  maxResults: number;
  runtime: DiscoveryRuntime;
}) {
  throwIfLeadgenAborted(params.runtime.abortSignal);

  try {
    const stream = await streamLeadgenCandidateSignals({
      sourceDomain: params.runtime.sourceDomain,
      recipe: params.job.recipe,
      queries: params.job.queries,
      options: {
        abortSignal: params.runtime.abortSignal,
        domainProfile: params.runtime.domainProfile ?? undefined,
        maxResults: params.maxResults,
        reasoningEffort: params.runtime.reasoningEffort,
      },
    });

    for await (const partial of stream.partialOutputStream) {
      throwIfLeadgenAborted(params.runtime.abortSignal);
      if (!Array.isArray(partial)) continue;

      await persistCandidateSignals({
        runId: params.runId,
        recipe: params.job.recipe,
        signals: sanitizeCandidateSignals(
          partial.slice(0, params.maxResults),
          params.runtime.sourceDomain,
          params.job.recipe,
        ),
        runtime: params.runtime,
      });
    }

    const finalOutput = await stream.output;
    await recordLeadgenTokenUsageFromResult({
      runId: params.runId,
      result: stream,
      fallbackModel: getLeadgenPrimaryResearchModel(
        params.runtime.reasoningEffort,
      ),
    });
    await persistCandidateSignals({
      runId: params.runId,
      recipe: params.job.recipe,
      signals: sanitizeCandidateSignals(
        Array.isArray(finalOutput)
          ? finalOutput.slice(0, params.maxResults)
          : [],
        params.runtime.sourceDomain,
        params.job.recipe,
      ),
      runtime: params.runtime,
    });
  } catch (error) {
    throwIfLeadgenAborted(params.runtime.abortSignal);
    logger.warn(
      {
        error,
        runId: params.runId,
        recipe: params.job.recipe,
      },
      'Leadgen discovery recipe failed',
    );
    await persistLeadgenEvent({
      runId: params.runId,
      eventType: 'error',
      stage: 'search',
      payload: {
        recipe: params.job.recipe,
        error: getLeadgenErrorMessage(error),
      },
    });
  }
}

async function persistCandidateSignals(params: {
  runId: string;
  recipe: LeadgenDiscoveryRecipe;
  signals: LeadgenCandidateSignal[];
  runtime: DiscoveryRuntime;
}) {
  for (const signal of params.signals) {
    throwIfLeadgenAborted(params.runtime.abortSignal);

    if (
      params.runtime.persistedSignalCount >=
      params.runtime.config.rawCandidateLimit
    ) {
      return;
    }

    const signalKey = [
      signal.domain,
      signal.recipe,
      signal.signalType.toLowerCase(),
      signal.evidenceSnippet.toLowerCase(),
    ].join(':');
    if (params.runtime.persistedSignalKeys.has(signalKey)) continue;
    params.runtime.persistedSignalKeys.add(signalKey);

    const lead = await persistCandidateSignal({
      runId: params.runId,
      signal: {
        ...signal,
        recipe: params.recipe,
      },
      rank: params.runtime.nextRank++,
    });
    if (!lead) continue;

    params.runtime.persistedSignalCount += 1;
    params.runtime.pendingTriageDomains.add(lead.businessDomain);

    if (!params.runtime.emittedLeadDomains.has(lead.businessDomain)) {
      params.runtime.emittedLeadDomains.add(lead.businessDomain);
      await refreshLeadgenRunCounts(params.runId);
      await persistLeadgenEvent({
        runId: params.runId,
        eventType: 'lead',
        stage: 'search',
        message: `Checking ${lead.companyName ?? lead.businessDomain}.`,
        payload: {
          leadId: lead.id,
          businessDomain: lead.businessDomain,
          companyName: lead.companyName,
          status: lead.status,
          signalType: signal.signalType,
        },
      });
    }

    await triagePendingDomains({
      runId: params.runId,
      runtime: params.runtime,
      force: false,
    });
  }
}

async function persistCandidateSignal(params: {
  runId: string;
  signal: LeadgenCandidateSignal;
  rank: number;
}) {
  const businessDomain = normalizeLeadgenDomain(params.signal.domain);
  if (!businessDomain) return null;

  const now = new Date();
  const [lead] = await db
    .insert(leadgenLeadsTable)
    .values({
      runId: params.runId,
      businessDomain,
      companyName: params.signal.companyName ?? null,
      status: 'checking',
      score: 0,
      riskLevel: 'low',
      contactReadiness: 'not_searched',
      query: params.signal.query,
      rationale: params.signal.candidateReason,
      content: params.signal.evidenceSnippet,
      rank: params.rank,
    })
    .onConflictDoUpdate({
      target: [leadgenLeadsTable.runId, leadgenLeadsTable.businessDomain],
      set: {
        companyName: sql`coalesce(${leadgenLeadsTable.companyName}, ${params.signal.companyName ?? null})`,
        query: params.signal.query,
        updatedAt: now,
      },
    })
    .returning();

  if (!lead) return null;

  await db
    .insert(leadgenLeadSignalsTable)
    .values({
      runId: params.runId,
      leadId: lead.id,
      recipe: params.signal.recipe,
      signalType: params.signal.signalType,
      query: params.signal.query,
      evidenceUrl: params.signal.evidenceUrl ?? null,
      evidenceSnippet: params.signal.evidenceSnippet,
      metadata: {
        candidateReason: params.signal.candidateReason,
        companyName: params.signal.companyName,
      },
    })
    .onConflictDoUpdate({
      target: [
        leadgenLeadSignalsTable.leadId,
        leadgenLeadSignalsTable.recipe,
        leadgenLeadSignalsTable.signalType,
        leadgenLeadSignalsTable.evidenceSnippet,
      ],
      set: {
        query: params.signal.query,
        evidenceUrl: params.signal.evidenceUrl ?? null,
        metadata: {
          candidateReason: params.signal.candidateReason,
          companyName: params.signal.companyName,
        },
        updatedAt: now,
      },
    });

  return lead;
}

async function triagePendingDomains(params: {
  runId: string;
  runtime: DiscoveryRuntime;
  force: boolean;
}) {
  if (
    params.runtime.pendingTriageDomains.size === 0 ||
    (!params.force &&
      params.runtime.pendingTriageDomains.size <
        params.runtime.config.triageBatchSize)
  ) {
    return;
  }

  const domains = [...params.runtime.pendingTriageDomains];
  params.runtime.pendingTriageDomains.clear();
  await triageLeadgenCandidates({
    runId: params.runId,
    sourceDomain: params.runtime.sourceDomain,
    domainProfile: params.runtime.domainProfile,
    reasoningEffort: params.runtime.reasoningEffort,
    askingPriceUsd: params.runtime.askingPriceUsd,
    domains,
    abortSignal: params.runtime.abortSignal,
  });
}

async function triageLeadgenCandidates(params: {
  runId: string;
  sourceDomain: string;
  domainProfile?: LeadgenDomainProfile | null;
  reasoningEffort: LeadgenReasoningEffort;
  askingPriceUsd?: number;
  domains?: string[];
  statuses?: LeadRow['status'][];
  limit?: number;
  abortSignal: AbortSignal;
}) {
  throwIfLeadgenAborted(params.abortSignal);

  const leads = await loadTriageLeads({
    runId: params.runId,
    domains: params.domains,
    statuses: params.statuses,
    limit: params.limit,
  });
  if (leads.length === 0) return;

  const signalsByLeadId = await loadSignalsByLeadId(
    leads.map((lead) => lead.id),
  );
  const candidates = leads
    .map((lead): LeadgenTriageCandidate | null => {
      const signals = signalsByLeadId.get(lead.id) ?? [];
      if (signals.length === 0) return null;

      return {
        domain: lead.businessDomain,
        companyName: lead.companyName,
        existingStatus: lead.status,
        existingScore: lead.score,
        signals: signals.slice(0, 8).map((signal) => ({
          recipe: signal.recipe,
          signalType: signal.signalType,
          evidenceSnippet: signal.evidenceSnippet,
          evidenceUrl: signal.evidenceUrl,
        })),
      };
    })
    .filter((candidate): candidate is LeadgenTriageCandidate =>
      Boolean(candidate),
    );
  if (candidates.length === 0) return;

  const result = await generateLeadgenOpportunityTriages({
    sourceDomain: params.sourceDomain,
    candidates,
    options: {
      abortSignal: params.abortSignal,
      askingPriceUsd: params.askingPriceUsd,
      domainProfile: params.domainProfile,
      reasoningEffort: params.reasoningEffort,
    },
  });
  await recordLeadgenTokenUsageFromResult({
    runId: params.runId,
    result,
    fallbackModel: getLeadgenPrimaryResearchModel(params.reasoningEffort),
  });

  const triagesByDomain = new Map(
    result.output.map((triage) => [triage.domain, triage]),
  );

  for (const lead of leads) {
    const triage = triagesByDomain.get(lead.businessDomain);
    if (!triage) continue;

    await updateLeadFromTriage({
      runId: params.runId,
      lead,
      triage,
    });
  }

  await refreshLeadgenRunCounts(params.runId);
}

async function updateLeadFromTriage(params: {
  runId: string;
  lead: LeadRow;
  triage: LeadgenOpportunityTriage;
}) {
  const now = new Date();
  await db
    .update(leadgenLeadsTable)
    .set({
      status: params.triage.status,
      score: params.triage.score,
      riskLevel: 'low',
      riskNote: null,
      contactReadiness: params.lead.contactReadiness,
      rank: getOpportunityRank(params.triage.status, params.triage.score),
      updatedAt: now,
    })
    .where(eq(leadgenLeadsTable.id, params.lead.id));

  if (
    params.triage.status === 'contact_now' ||
    params.triage.status === 'suppressed'
  ) {
    await persistLeadgenEvent({
      runId: params.runId,
      eventType: 'triage',
      stage: 'triage',
      message: getTriageEventMessage(params.lead, params.triage),
      payload: {
        leadId: params.lead.id,
        businessDomain: params.lead.businessDomain,
        status: params.triage.status,
        score: params.triage.score,
      },
    });
  }
}

async function discoverContactsForPromotedLeads(params: {
  runId: string;
  sourceDomain: string;
  reasoningEffort: LeadgenReasoningEffort;
  contactDiscoveryLimit: number;
  abortSignal: AbortSignal;
}) {
  const [searchedCountRow] = await db
    .select({ value: count() })
    .from(leadgenLeadsTable)
    .where(
      and(
        eq(leadgenLeadsTable.runId, params.runId),
        ne(leadgenLeadsTable.contactReadiness, 'not_searched'),
      ),
    );
  const remainingContactSearches = Math.max(
    0,
    params.contactDiscoveryLimit - (searchedCountRow?.value ?? 0),
  );
  if (remainingContactSearches === 0) return;

  const leads = await db
    .select()
    .from(leadgenLeadsTable)
    .where(
      and(
        eq(leadgenLeadsTable.runId, params.runId),
        eq(leadgenLeadsTable.status, 'contact_now'),
        eq(leadgenLeadsTable.contactReadiness, 'not_searched'),
      ),
    )
    .orderBy(asc(leadgenLeadsTable.rank), asc(leadgenLeadsTable.createdAt))
    .limit(remainingContactSearches);

  if (leads.length === 0) return;

  await persistLeadgenEvent({
    runId: params.runId,
    eventType: 'status',
    stage: 'contacts',
    message: `Finding contacts and drafting outreach for ${leads.length} ${leads.length === 1 ? 'prospect' : 'prospects'}.`,
    payload: {
      contactDiscoveryLimit: params.contactDiscoveryLimit,
      remainingContactSearches,
    },
  });

  await runWithConcurrency(leads, 2, async (lead) => {
    throwIfLeadgenAborted(params.abortSignal);
    await discoverLeadgenContactsAndDraft({
      runId: params.runId,
      sourceDomain: params.sourceDomain,
      lead,
      reasoningEffort: params.reasoningEffort,
      abortSignal: params.abortSignal,
    });
  });
  await refreshLeadgenRunCounts(params.runId);
}

export async function completeLeadgenRun({ runId }: CompleteLeadgenRunParams) {
  await finalizeUntriagedLeadgenLeads({
    runId,
    reason: 'run-complete',
  });
  const counts = await refreshLeadgenRunCounts(runId);
  const now = new Date();
  await db
    .update(leadgenRunsTable)
    .set({
      status: 'SUCCEEDED',
      finishedAt: now,
      updatedAt: now,
      summary:
        counts.leadCount > 0
          ? `Found ${counts.leadCount} prospects, ${counts.contactCount} contacts, and ${counts.draftCount} drafts.`
          : 'Research complete.',
    })
    .where(eq(leadgenRunsTable.id, runId));

  await persistLeadgenEvent({
    runId,
    eventType: 'status',
    stage: 'complete',
    message:
      counts.leadCount > 0
        ? `Finished with ${counts.leadCount} prospects, ${counts.contactCount} contacts, and ${counts.draftCount} drafts.`
        : 'Research complete.',
    payload: counts,
  });

  return counts;
}

export async function finalizeUntriagedLeadgenLeads({
  runId,
  reason,
}: {
  runId: string;
  reason: 'run-complete';
}) {
  const finalizedAt = new Date();
  const finalizedLeads = await db
    .update(leadgenLeadsTable)
    .set({
      status: 'low_priority',
      score: 0,
      rank: getOpportunityRank('low_priority', 0),
      updatedAt: finalizedAt,
    })
    .where(
      and(
        eq(leadgenLeadsTable.runId, runId),
        eq(leadgenLeadsTable.status, 'checking'),
      ),
    )
    .returning({
      id: leadgenLeadsTable.id,
      businessDomain: leadgenLeadsTable.businessDomain,
    });

  if (finalizedLeads.length === 0) return 0;

  await persistLeadgenEvent({
    runId,
    eventType: 'status',
    stage: 'triage',
    message: `Marked ${finalizedLeads.length} ${finalizedLeads.length === 1 ? 'prospect' : 'prospects'} for manual review.`,
    payload: {
      reason,
      finalizedLeadCount: finalizedLeads.length,
      businessDomains: finalizedLeads.map((lead) => lead.businessDomain),
    },
  });

  return finalizedLeads.length;
}

export async function failLeadgenRun({
  runId,
  errorMessage,
}: FailLeadgenRunParams) {
  const now = new Date();
  await db
    .update(leadgenRunsTable)
    .set({
      status: 'FAILED',
      errorMessage,
      finishedAt: now,
      updatedAt: now,
    })
    .where(eq(leadgenRunsTable.id, runId));

  await persistLeadgenEvent({
    runId,
    eventType: 'error',
    stage: 'complete',
    payload: { errorMessage },
  });
}

/**
 * On-demand activity for preparing outreach for one lead in an existing run.
 *
 * `runId` and `leadId` identify the persisted run and lead; the activity
 * persists timeline events, finds contacts/drafts outreach, refreshes run
 * counts, and returns those refreshed counts.
 */
export async function generateLeadgenLeadOutreachActivity({
  runId,
  leadId,
  sourceDomain,
  reasoningEffort,
}: GenerateLeadgenLeadOutreachParams) {
  return await heartbeatLeadgenWhile(
    (abortSignal) =>
      generateLeadgenLeadOutreach({
        runId,
        leadId,
        sourceDomain,
        reasoningEffort,
        abortSignal,
      }),
    { stage: 'contacts', runId, leadId },
  );
}

async function persistDomainProfile(params: {
  runId: string;
  domainProfile: LeadgenDomainProfile;
}) {
  const [run] = await db
    .select({ metadata: leadgenRunsTable.metadata })
    .from(leadgenRunsTable)
    .where(eq(leadgenRunsTable.id, params.runId))
    .limit(1);

  await db
    .update(leadgenRunsTable)
    .set({
      metadata: {
        ...(isRecord(run?.metadata) ? run.metadata : {}),
        domainProfile: params.domainProfile,
      },
      updatedAt: new Date(),
    })
    .where(eq(leadgenRunsTable.id, params.runId));
}

async function loadTriageLeads(params: {
  runId: string;
  domains?: string[];
  statuses?: LeadRow['status'][];
  limit?: number;
}) {
  const clauses = [eq(leadgenLeadsTable.runId, params.runId)];
  if (params.domains && params.domains.length > 0) {
    clauses.push(inArray(leadgenLeadsTable.businessDomain, params.domains));
  }
  if (params.statuses && params.statuses.length > 0) {
    clauses.push(inArray(leadgenLeadsTable.status, params.statuses));
  }

  return await db
    .select()
    .from(leadgenLeadsTable)
    .where(and(...clauses))
    .orderBy(asc(leadgenLeadsTable.rank), asc(leadgenLeadsTable.createdAt))
    .limit(params.limit ?? 50);
}

async function loadSignalsByLeadId(leadIds: string[]) {
  if (leadIds.length === 0) return new Map<string, SignalRow[]>();

  const signals = await db
    .select()
    .from(leadgenLeadSignalsTable)
    .where(inArray(leadgenLeadSignalsTable.leadId, leadIds))
    .orderBy(asc(leadgenLeadSignalsTable.createdAt));
  const signalsByLeadId = new Map<string, SignalRow[]>();

  for (const signal of signals) {
    const group = signalsByLeadId.get(signal.leadId);
    if (group) {
      group.push(signal);
    } else {
      signalsByLeadId.set(signal.leadId, [signal]);
    }
  }

  return signalsByLeadId;
}

async function getNextLeadgenRank(runId: string) {
  const [row] = await db
    .select({
      value: sql<number>`coalesce(max(${leadgenLeadsTable.rank}), 0)`,
    })
    .from(leadgenLeadsTable)
    .where(eq(leadgenLeadsTable.runId, runId));

  return (row?.value ?? 0) + 1;
}

function buildSeedRecipeJobs(sourceDomain: string): DiscoveryRecipeJob[] {
  return SEED_RECIPES.map((recipe) => ({
    recipe,
    queries: getRecipeQueries({
      sourceDomain,
      recipe,
      profileQueries: [],
    }),
  }));
}

function buildProfileRecipeJobs(params: {
  sourceDomain: string;
  domainProfile: LeadgenDomainProfile;
  selectedRecipeLimit: number;
}): DiscoveryRecipeJob[] {
  const recipeQueries = new Map<LeadgenDiscoveryRecipe, string[]>();

  for (const direction of params.domainProfile.searchDirections) {
    if (
      direction.recipe === 'exact_near_name_search' ||
      direction.recipe === 'broad_sanity_search'
    ) {
      continue;
    }

    recipeQueries.set(direction.recipe, [
      ...(recipeQueries.get(direction.recipe) ?? []),
      direction.intent,
    ]);
  }

  for (const thesis of params.domainProfile.theses) {
    for (const recipe of thesis.discoveryRecipes) {
      if (
        recipe === 'exact_near_name_search' ||
        recipe === 'broad_sanity_search'
      ) {
        continue;
      }

      recipeQueries.set(recipe, [
        ...(recipeQueries.get(recipe) ?? []),
        ...thesis.seedQueries,
      ]);
    }
  }

  const selectedRecipes = [
    ...RECIPE_ORDER.filter((recipe) => recipeQueries.has(recipe)),
    ...RECIPE_ORDER.filter((recipe) => !recipeQueries.has(recipe)),
  ].slice(0, params.selectedRecipeLimit);

  return selectedRecipes.map((recipe) => ({
    recipe,
    queries: getRecipeQueries({
      sourceDomain: params.sourceDomain,
      recipe,
      profileQueries: [
        ...(recipeQueries.get(recipe) ?? []),
        ...params.domainProfile.seedQueries,
      ],
    }),
  }));
}

function getRecipeQueries(params: {
  sourceDomain: string;
  recipe: LeadgenDiscoveryRecipe;
  profileQueries: string[];
}) {
  const normalizedDomain =
    normalizeLeadgenDomain(params.sourceDomain) ?? params.sourceDomain.trim();
  const core = getDomainCore(normalizedDomain);
  const quotedCore = `"${core}"`;
  const fallbackByRecipe: Record<LeadgenDiscoveryRecipe, string[]> = {
    exact_near_name_search: [
      `"${normalizedDomain}"`,
      `${quotedCore} official company`,
      `${quotedCore} brand official website`,
    ],
    broad_sanity_search: [
      `${quotedCore} company official`,
      `${quotedCore} product startup official`,
      `${quotedCore} service brand`,
    ],
    category_operator_search: [
      `${quotedCore} company official website`,
      `${quotedCore} product company`,
      `${quotedCore} service provider official`,
    ],
    local_business_search: [
      `${quotedCore} local business official`,
      `${quotedCore} near me company official`,
      `${quotedCore} regional service provider`,
    ],
    paid_demand_check: [
      `${quotedCore} sponsored official company`,
      `${quotedCore} pricing software company`,
      `${quotedCore} ads landing page official`,
    ],
    growth_trigger_search: [
      `${quotedCore} funding company official`,
      `${quotedCore} hiring official company`,
      `${quotedCore} new product launch company`,
    ],
    domain_weakness_check: [
      `${quotedCore} company official site`,
      `${quotedCore} brand on get started`,
      `${quotedCore} app official`,
    ],
  };

  return [
    ...new Set(
      [...params.profileQueries, ...fallbackByRecipe[params.recipe]]
        .map((query) => query.trim())
        .filter(Boolean),
    ),
  ].slice(0, 6);
}

function getLeadgenEffortConfig(
  reasoningEffort: LeadgenReasoningEffort,
  overrides?: {
    rawCandidateLimit?: number;
    contactDiscoveryLimit?: number;
  },
): LeadgenEffortConfig {
  const base: Record<LeadgenReasoningEffort, LeadgenEffortConfig> = {
    low: {
      maxTheses: 2,
      rawCandidateLimit: 20,
      triageLeadLimit: 12,
      contactDiscoveryLimit: 2,
      selectedRecipeLimit: 1,
      discoveryMaxResults: 8,
      recipeConcurrency: 1,
      triageBatchSize: 3,
    },
    medium: {
      maxTheses: 3,
      rawCandidateLimit: 45,
      triageLeadLimit: 25,
      contactDiscoveryLimit: 5,
      selectedRecipeLimit: 3,
      discoveryMaxResults: 15,
      recipeConcurrency: 2,
      triageBatchSize: 5,
    },
    high: {
      maxTheses: 5,
      rawCandidateLimit: 90,
      triageLeadLimit: 45,
      contactDiscoveryLimit: 8,
      selectedRecipeLimit: 5,
      discoveryMaxResults: 25,
      recipeConcurrency: 3,
      triageBatchSize: 5,
    },
  };

  return {
    ...base[reasoningEffort],
    ...(overrides?.rawCandidateLimit != null
      ? { rawCandidateLimit: overrides.rawCandidateLimit }
      : {}),
    ...(overrides?.contactDiscoveryLimit != null
      ? { contactDiscoveryLimit: overrides.contactDiscoveryLimit }
      : {}),
  };
}

function getOpportunityRank(status: LeadgenOpportunityStatus, score: number) {
  return STATUS_RANK[status] + (100 - score);
}

function getTriageEventMessage(
  lead: LeadRow,
  triage: LeadgenOpportunityTriage,
) {
  if (triage.status === 'contact_now') {
    return `${lead.companyName ?? lead.businessDomain} is ready for contact research.`;
  }
  if (triage.status === 'suppressed') {
    return `${lead.companyName ?? lead.businessDomain} was filtered from outreach.`;
  }
  return `${lead.companyName ?? lead.businessDomain} was ranked.`;
}

function getDomainCore(domain: string) {
  const normalized = normalizeLeadgenDomain(domain) ?? domain.trim();
  return normalized
    .split('.')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
) {
  const queue = [...items];
  const workers = Array.from(
    { length: Math.max(1, Math.min(concurrency, items.length)) },
    async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) return;
        await worker(item);
      }
    },
  );

  await Promise.all(workers);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

async function recordLeadgenTokenUsageFromResult(params: {
  runId: string;
  result: unknown;
  fallbackModel: string;
}) {
  try {
    await appendLeadgenTokenUsageFromResult(params);
  } catch (error) {
    logger.warn(
      { error, runId: params.runId, fallbackModel: params.fallbackModel },
      'Failed to persist leadgen token usage',
    );
  }
}
