import { Context } from '@temporalio/activity';
import {
  generateLeadgenIntentQueries,
  getLeadgenPrimaryResearchModel,
  normalizeLeadgenDomain,
  streamLeadgenSubstringSearchResults,
  streamLeadgenSearchResults,
  type LeadgenBusinessResult,
  type LeadgenReasoningEffort,
} from '@namefi-astra/ai';
import { db, leadgenLeadsTable, leadgenRunsTable } from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
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

const DEFAULT_CONTACT_DISCOVERY_LIMIT = 6;
const DEFAULT_SEARCH_RESULTS_PER_QUERY = 8;
const LEADGEN_HEARTBEAT_INTERVAL_MS = 20_000;

export interface InitializeLeadgenRunParams {
  runId: string;
  workflowId: string;
}

export interface LeadgenIntentActivityParams {
  runId: string;
  domain: string;
  reasoningEffort: LeadgenReasoningEffort;
  maxQueries?: number;
}

export interface LeadgenSearchActivityParams {
  runId: string;
  sourceDomain: string;
  bucket: 'general' | 'substring';
  queries: string[];
  reasoningEffort: LeadgenReasoningEffort;
  maxResultsPerQuery?: number;
  contactDiscoveryLimit?: number;
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
type LeadgenActivityContext = Pick<Context, 'cancellationSignal' | 'heartbeat'>;
type LeadgenSearchRuntime = {
  seenDomains: Set<string>;
  contactTasks: Map<string, Promise<void>>;
  contactDiscoveryAnnounced: boolean;
  inserted: number;
  rank: number;
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
    message: 'Building buyer intent buckets.',
  });
}

export async function generateLeadgenIntentsActivity({
  runId,
  domain,
  reasoningEffort,
  maxQueries,
}: LeadgenIntentActivityParams) {
  const result = await heartbeatLeadgenWhile(
    (abortSignal) =>
      generateLeadgenIntentQueries(domain, {
        abortSignal,
        reasoningEffort,
        maxQueries: maxQueries ?? (reasoningEffort === 'low' ? 3 : 5),
      }),
    { stage: 'intent', runId, domain },
  );
  await recordLeadgenTokenUsageFromResult({
    runId,
    result,
    fallbackModel: getLeadgenPrimaryResearchModel(reasoningEffort),
  });
  const queries = result.output.queries;

  await persistLeadgenEvent({
    runId,
    eventType: 'intent-queries',
    stage: 'intent',
    ...(queries.length > 0
      ? {
          message: `Built ${queries.length} buyer search ${queries.length === 1 ? 'query' : 'queries'}.`,
        }
      : {}),
    payload: { queries },
  });

  return { queries };
}

export async function searchLeadgenProspectsActivity(
  params: LeadgenSearchActivityParams,
) {
  return await heartbeatLeadgenWhile(
    (abortSignal) => searchLeadgenProspects({ ...params, abortSignal }),
    {
      stage: 'search',
      runId: params.runId,
      bucket: params.bucket,
      queryCount: params.queries.length,
    },
  );
}

async function searchLeadgenProspects(
  params: LeadgenSearchActivityParams & { abortSignal: AbortSignal },
) {
  const {
    runId,
    sourceDomain,
    bucket,
    queries,
    reasoningEffort,
    maxResultsPerQuery = DEFAULT_SEARCH_RESULTS_PER_QUERY,
    contactDiscoveryLimit = DEFAULT_CONTACT_DISCOVERY_LIMIT,
  } = params;

  const runtime: LeadgenSearchRuntime = {
    seenDomains: new Set<string>(),
    contactTasks: new Map<string, Promise<void>>(),
    contactDiscoveryAnnounced: false,
    inserted: 0,
    rank: bucket === 'substring' ? 10_000 : 0,
  };

  await persistLeadgenEvent({
    runId,
    eventType: 'status',
    stage: 'search',
    message:
      bucket === 'substring'
        ? 'Scanning exact and substring-aligned companies.'
        : 'Searching buyer categories in parallel.',
    payload: { bucket, queries },
  });
  throwIfLeadgenAborted(params.abortSignal);

  const queryResults = await Promise.allSettled(
    queries.map((query) =>
      processLeadgenQuery({
        runId,
        sourceDomain,
        bucket,
        query,
        reasoningEffort,
        maxResultsPerQuery,
        contactDiscoveryLimit,
        abortSignal: params.abortSignal,
        runtime,
      }),
    ),
  );
  throwIfLeadgenAborted(params.abortSignal);

  for (const result of queryResults) {
    if (result.status === 'rejected') {
      logger.warn(
        { error: result.reason, runId, bucket },
        'Leadgen query processing failed',
      );
    }
  }

  if (runtime.contactTasks.size > 0) {
    const results = await Promise.allSettled(runtime.contactTasks.values());
    throwIfLeadgenAborted(params.abortSignal);

    for (const result of results) {
      if (result.status === 'rejected') {
        logger.warn(
          { error: result.reason, runId, bucket },
          'Leadgen contact task failed',
        );
      }
    }
  }

  await refreshLeadgenRunCounts(runId);

  return { inserted: runtime.inserted };
}

async function processLeadgenQuery(params: {
  runId: string;
  sourceDomain: string;
  bucket: 'general' | 'substring';
  query: string;
  reasoningEffort: LeadgenReasoningEffort;
  maxResultsPerQuery: number;
  contactDiscoveryLimit: number;
  abortSignal: AbortSignal;
  runtime: LeadgenSearchRuntime;
}) {
  await persistLeadgenEvent({
    runId: params.runId,
    eventType: 'search-progress',
    stage: 'search',
    message: `Searching: ${params.query}`,
    payload: { bucket: params.bucket, query: params.query, status: 'loading' },
    transient: true,
  });

  try {
    const hits = await streamAndPersistSearchCandidates(params);
    if (hits.length > 0) {
      await persistLeadgenEvent({
        runId: params.runId,
        eventType: 'search-progress',
        stage: 'search',
        message: `Found ${hits.length} candidates for one intent.`,
        payload: {
          bucket: params.bucket,
          query: params.query,
          status: 'complete',
          count: hits.length,
        },
      });
    }
  } catch (error) {
    throwIfLeadgenAborted(params.abortSignal);

    logger.warn(
      {
        error,
        runId: params.runId,
        bucket: params.bucket,
        query: params.query,
      },
      'Leadgen search query failed',
    );
    await persistLeadgenEvent({
      runId: params.runId,
      eventType: 'error',
      stage: 'search',
      payload: {
        bucket: params.bucket,
        query: params.query,
        error: getLeadgenErrorMessage(error),
      },
    });
  }
}

async function streamAndPersistSearchCandidates(params: {
  runId: string;
  sourceDomain: string;
  bucket: 'general' | 'substring';
  query: string;
  reasoningEffort: LeadgenReasoningEffort;
  maxResultsPerQuery: number;
  contactDiscoveryLimit: number;
  abortSignal: AbortSignal;
  runtime: LeadgenSearchRuntime;
}) {
  const stream =
    params.bucket === 'substring'
      ? await streamLeadgenSubstringSearchResults(params.sourceDomain, {
          abortSignal: params.abortSignal,
          reasoningEffort: params.reasoningEffort,
          maxResults: params.maxResultsPerQuery,
        })
      : await streamLeadgenSearchResults(params.query, {
          abortSignal: params.abortSignal,
          reasoningEffort: params.reasoningEffort,
          maxResults: params.maxResultsPerQuery,
        });
  let processedCount = 0;

  for await (const partial of stream.partialOutputStream) {
    if (!Array.isArray(partial)) continue;

    const nextLength = Math.min(partial.length, params.maxResultsPerQuery);
    if (nextLength <= processedCount) continue;

    await persistSearchCandidates({
      ...params,
      candidates: partial.slice(processedCount, nextLength),
    });
    processedCount = nextLength;
  }

  const finalOutput = await stream.output;
  await recordLeadgenTokenUsageFromResult({
    runId: params.runId,
    result: stream,
    fallbackModel: getLeadgenPrimaryResearchModel(params.reasoningEffort),
  });
  const hits = Array.isArray(finalOutput)
    ? finalOutput.slice(0, params.maxResultsPerQuery)
    : [];

  await persistSearchCandidates({ ...params, candidates: hits });
  return hits;
}

async function persistSearchCandidates(params: {
  runId: string;
  sourceDomain: string;
  bucket: 'general' | 'substring';
  query: string;
  reasoningEffort: LeadgenReasoningEffort;
  contactDiscoveryLimit: number;
  abortSignal: AbortSignal;
  runtime: LeadgenSearchRuntime;
  candidates: LeadgenBusinessResult[];
}) {
  for (const candidate of params.candidates) {
    throwIfLeadgenAborted(params.abortSignal);

    const lead = await persistLeadCandidate({
      runId: params.runId,
      candidate,
      bucket: params.bucket,
      query: params.query,
      rank: params.runtime.rank++,
      seenDomains: params.runtime.seenDomains,
    });
    if (!lead) continue;

    params.runtime.inserted += 1;
    await refreshLeadgenRunCounts(params.runId);
    await scheduleContactDiscovery({ ...params, lead });
  }
}

async function scheduleContactDiscovery(params: {
  runId: string;
  sourceDomain: string;
  lead: LeadRow;
  reasoningEffort: LeadgenReasoningEffort;
  contactDiscoveryLimit: number;
  abortSignal: AbortSignal;
  runtime: LeadgenSearchRuntime;
}) {
  throwIfLeadgenAborted(params.abortSignal);

  if (params.runtime.contactTasks.size >= params.contactDiscoveryLimit) return;
  if (params.runtime.contactTasks.has(params.lead.businessDomain)) return;

  if (!params.runtime.contactDiscoveryAnnounced) {
    params.runtime.contactDiscoveryAnnounced = true;
    await persistLeadgenEvent({
      runId: params.runId,
      eventType: 'status',
      stage: 'contacts',
      message: 'Finding contacts and drafting outreach for top leads.',
      payload: {
        bucket: params.lead.bucket,
        contactDiscoveryLimit: params.contactDiscoveryLimit,
      },
    });
  }

  const task = discoverLeadgenContactsAndDraft({
    runId: params.runId,
    sourceDomain: params.sourceDomain,
    lead: params.lead,
    reasoningEffort: params.reasoningEffort,
    abortSignal: params.abortSignal,
  });
  void task.catch(() => undefined);
  params.runtime.contactTasks.set(params.lead.businessDomain, task);
}

export async function completeLeadgenRun({ runId }: CompleteLeadgenRunParams) {
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
          ? `Found ${counts.leadCount} leads, ${counts.contactCount} contacts, and ${counts.draftCount} drafts.`
          : 'Research complete.',
    })
    .where(eq(leadgenRunsTable.id, runId));

  await persistLeadgenEvent({
    runId,
    eventType: 'status',
    stage: 'complete',
    message:
      counts.leadCount > 0
        ? `Finished with ${counts.leadCount} leads and ${counts.draftCount} drafts.`
        : 'Research complete.',
    payload: counts,
  });

  return counts;
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

async function persistLeadCandidate(params: {
  runId: string;
  candidate: LeadgenBusinessResult;
  bucket: 'general' | 'substring';
  query: string;
  rank: number;
  seenDomains: Set<string>;
}): Promise<LeadRow | null> {
  const businessDomain = normalizeLeadgenDomain(params.candidate.domain);
  if (!businessDomain) return null;
  if (params.seenDomains.has(businessDomain)) return null;
  params.seenDomains.add(businessDomain);

  const [lead] = await db
    .insert(leadgenLeadsTable)
    .values({
      runId: params.runId,
      businessDomain,
      bucket: params.bucket,
      query: params.query,
      rationale: params.candidate.justification.trim(),
      content: params.candidate.content.trim(),
      rank: params.rank,
    })
    .onConflictDoUpdate({
      target: [
        leadgenLeadsTable.runId,
        leadgenLeadsTable.businessDomain,
        leadgenLeadsTable.bucket,
      ],
      set: {
        query: params.query,
        rationale: params.candidate.justification.trim(),
        content: params.candidate.content.trim(),
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!lead) return null;

  await persistLeadgenEvent({
    runId: params.runId,
    eventType: 'lead',
    stage: 'search',
    message: `Found ${businessDomain}`,
    payload: {
      leadId: lead.id,
      businessDomain,
      bucket: params.bucket,
      query: params.query,
      rationale: lead.rationale,
      content: lead.content,
    },
  });

  return lead;
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
