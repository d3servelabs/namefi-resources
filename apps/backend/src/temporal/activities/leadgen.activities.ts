import { Context } from '@temporalio/activity';
import {
  generateLeadgenContacts,
  generateLeadgenEmailDraft,
  generateLeadgenIntentQueries,
  normalizeLeadgenDomain,
  normalizeLeadgenEmail,
  streamLeadgenSubstringSearchResults,
  streamLeadgenSearchResults,
  type LeadgenBusinessResult,
  type LeadgenContact,
  type LeadgenReasoningEffort,
} from '@namefi-astra/ai';
import {
  db,
  leadgenContactsTable,
  leadgenEmailDraftsTable,
  leadgenEventsTable,
  leadgenLeadsTable,
  leadgenRunsTable,
} from '@namefi-astra/db';
import { and, count, desc, eq } from 'drizzle-orm';
import { createLogger } from '#lib/logger';

const logger = createLogger({ module: 'leadgen-activities' });

const DEFAULT_CONTACT_DISCOVERY_LIMIT = 6;
const DEFAULT_SEARCH_RESULTS_PER_QUERY = 8;

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

export interface CompleteLeadgenRunParams {
  runId: string;
}

export interface FailLeadgenRunParams {
  runId: string;
  errorMessage: string;
}

type LeadRow = typeof leadgenLeadsTable.$inferSelect;
type ContactRow = typeof leadgenContactsTable.$inferSelect;
type LeadgenSearchRuntime = {
  seenDomains: Set<string>;
  contactTasks: Map<string, Promise<void>>;
  inserted: number;
  rank: number;
};

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
  Context.current().heartbeat({ stage: 'intent', domain });
  const result = await generateLeadgenIntentQueries(domain, {
    reasoningEffort,
    maxQueries: maxQueries ?? (reasoningEffort === 'low' ? 3 : 5),
  });
  const queries = result.output.queries;

  await persistLeadgenEvent({
    runId,
    eventType: 'intent-queries',
    stage: 'intent',
    message:
      queries.length > 0
        ? `Built ${queries.length} buyer search ${queries.length === 1 ? 'query' : 'queries'}.`
        : 'No buyer search queries were generated.',
    payload: { queries },
  });

  return { queries };
}

export async function searchLeadgenProspectsActivity(
  params: LeadgenSearchActivityParams,
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
        runtime,
      }),
    ),
  );

  for (const result of queryResults) {
    if (result.status === 'rejected') {
      logger.warn(
        { error: result.reason, runId, bucket },
        'Leadgen query processing failed',
      );
    }
  }

  if (runtime.contactTasks.size > 0) {
    await persistLeadgenEvent({
      runId,
      eventType: 'status',
      stage: 'contacts',
      message: `Finding contacts for ${runtime.contactTasks.size} top ${runtime.contactTasks.size === 1 ? 'lead' : 'leads'}.`,
      payload: { bucket, count: runtime.contactTasks.size },
    });

    const results = await Promise.allSettled(runtime.contactTasks.values());
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
    await persistLeadgenEvent({
      runId: params.runId,
      eventType: 'search-progress',
      stage: 'search',
      message:
        hits.length > 0
          ? `Found ${hits.length} candidates for one intent.`
          : 'No direct candidates for one intent.',
      payload: {
        bucket: params.bucket,
        query: params.query,
        status: 'complete',
        count: hits.length,
      },
    });
  } catch (error) {
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
      message: `Search failed for "${params.query}".`,
      payload: {
        bucket: params.bucket,
        query: params.query,
        error: getErrorMessage(error),
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
  runtime: LeadgenSearchRuntime;
}) {
  const stream =
    params.bucket === 'substring'
      ? await streamLeadgenSubstringSearchResults(params.sourceDomain, {
          reasoningEffort: params.reasoningEffort,
          maxResults: params.maxResultsPerQuery,
        })
      : await streamLeadgenSearchResults(params.query, {
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
    Context.current().heartbeat({
      stage: 'search',
      bucket: params.bucket,
      query: params.query,
      processedCount,
    });
  }

  const finalOutput = await stream.output;
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
  runtime: LeadgenSearchRuntime;
  candidates: LeadgenBusinessResult[];
}) {
  for (const candidate of params.candidates) {
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
    scheduleContactDiscovery({ ...params, lead });
  }
}

function scheduleContactDiscovery(params: {
  runId: string;
  sourceDomain: string;
  lead: LeadRow;
  reasoningEffort: LeadgenReasoningEffort;
  contactDiscoveryLimit: number;
  runtime: LeadgenSearchRuntime;
}) {
  if (params.runtime.contactTasks.size >= params.contactDiscoveryLimit) return;
  if (params.runtime.contactTasks.has(params.lead.businessDomain)) return;

  params.runtime.contactTasks.set(
    params.lead.businessDomain,
    discoverContactsAndDraft({
      runId: params.runId,
      sourceDomain: params.sourceDomain,
      lead: params.lead,
      reasoningEffort: params.reasoningEffort,
    }),
  );
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
          : 'No strong leads found.',
    })
    .where(eq(leadgenRunsTable.id, runId));

  await persistLeadgenEvent({
    runId,
    eventType: 'status',
    stage: 'complete',
    message:
      counts.leadCount > 0
        ? `Finished with ${counts.leadCount} leads and ${counts.draftCount} drafts.`
        : 'Finished without strong lead matches.',
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
    message: errorMessage,
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

async function discoverContactsAndDraft(params: {
  runId: string;
  sourceDomain: string;
  lead: LeadRow;
  reasoningEffort: LeadgenReasoningEffort;
}) {
  const cachedContacts = await loadCachedContactsForDomain({
    runId: params.runId,
    businessDomain: params.lead.businessDomain,
  });

  if (cachedContacts.length > 0) {
    for (const cached of cachedContacts) {
      const contact = await upsertContact({
        runId: params.runId,
        leadId: params.lead.id,
        businessDomain: params.lead.businessDomain,
        contact: {
          email: cached.email,
          name: cached.name ?? null,
          title: cached.title ?? null,
          sourceUrl: cached.sourceUrl ?? null,
          context: cached.context ?? null,
        },
        notes: cached.notes ?? undefined,
        fromCache: true,
      });
      await draftForContact({
        runId: params.runId,
        sourceDomain: params.sourceDomain,
        lead: params.lead,
        contact,
        reasoningEffort: params.reasoningEffort,
        fromCache: true,
      });
    }
    return;
  }

  try {
    const result = await generateLeadgenContacts(
      [{ domain: params.lead.businessDomain }],
      {
        reasoningEffort: params.reasoningEffort,
        targetContacts: 3,
      },
    );
    const contactResult = result.output[0];
    const contacts = contactResult?.contacts ?? [];

    if (contacts.length === 0) {
      await persistLeadgenEvent({
        runId: params.runId,
        eventType: 'contact',
        stage: 'contacts',
        message: `No public email found for ${params.lead.businessDomain}.`,
        payload: {
          leadId: params.lead.id,
          businessDomain: params.lead.businessDomain,
          notes: contactResult?.notes ?? null,
        },
      });
      return;
    }

    const savedContacts = await Promise.all(
      contacts.map((contact) =>
        upsertContact({
          runId: params.runId,
          leadId: params.lead.id,
          businessDomain: params.lead.businessDomain,
          contact,
          notes: contactResult?.notes ?? undefined,
          fromCache: false,
        }),
      ),
    );

    const firstContact = savedContacts.find((contact) =>
      contact.email.includes('@'),
    );
    if (!firstContact) return;

    await draftForContact({
      runId: params.runId,
      sourceDomain: params.sourceDomain,
      lead: params.lead,
      contact: firstContact,
      reasoningEffort: params.reasoningEffort,
      fromCache: false,
    });
  } catch (error) {
    await persistLeadgenEvent({
      runId: params.runId,
      eventType: 'error',
      stage: 'contacts',
      message: `Contact discovery failed for ${params.lead.businessDomain}.`,
      payload: {
        leadId: params.lead.id,
        businessDomain: params.lead.businessDomain,
        error: getErrorMessage(error),
      },
    });
  }
}

async function loadCachedContactsForDomain(params: {
  runId: string;
  businessDomain: string;
}) {
  return await db
    .select()
    .from(leadgenContactsTable)
    .where(eq(leadgenContactsTable.businessDomain, params.businessDomain))
    .orderBy(desc(leadgenContactsTable.createdAt))
    .limit(3)
    .then((rows) => rows.filter((row) => row.runId !== params.runId));
}

async function upsertContact(params: {
  runId: string;
  leadId: string;
  businessDomain: string;
  contact: LeadgenContact;
  notes?: string;
  fromCache: boolean;
}) {
  const email = normalizeLeadgenEmail(params.contact.email);
  if (!email) {
    throw new Error('Contact email is invalid');
  }

  const [saved] = await db
    .insert(leadgenContactsTable)
    .values({
      runId: params.runId,
      leadId: params.leadId,
      businessDomain: params.businessDomain,
      email,
      name: params.contact.name ?? null,
      title: params.contact.title ?? null,
      sourceUrl: params.contact.sourceUrl ?? null,
      context: params.contact.context ?? null,
      notes: params.notes ?? null,
      fromCache: params.fromCache,
    })
    .onConflictDoUpdate({
      target: [
        leadgenContactsTable.runId,
        leadgenContactsTable.businessDomain,
        leadgenContactsTable.email,
      ],
      set: {
        leadId: params.leadId,
        name: params.contact.name ?? null,
        title: params.contact.title ?? null,
        sourceUrl: params.contact.sourceUrl ?? null,
        context: params.contact.context ?? null,
        notes: params.notes ?? null,
        fromCache: params.fromCache,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!saved) {
    throw new Error('Failed to persist contact');
  }

  await persistLeadgenEvent({
    runId: params.runId,
    eventType: 'contact',
    stage: 'contacts',
    message: `Found ${email} for ${params.businessDomain}.`,
    payload: {
      leadId: params.leadId,
      contactId: saved.id,
      businessDomain: params.businessDomain,
      email,
      name: saved.name,
      title: saved.title,
      fromCache: params.fromCache,
    },
  });

  return saved;
}

async function draftForContact(params: {
  runId: string;
  sourceDomain: string;
  lead: LeadRow;
  contact: ContactRow;
  reasoningEffort: LeadgenReasoningEffort;
  fromCache: boolean;
}) {
  const existing = await db.query.leadgenEmailDraftsTable.findFirst({
    where: and(
      eq(leadgenEmailDraftsTable.runId, params.runId),
      eq(leadgenEmailDraftsTable.businessDomain, params.lead.businessDomain),
      eq(leadgenEmailDraftsTable.contactEmail, params.contact.email),
    ),
  });
  if (existing) return existing;

  const draft = await generateLeadgenEmailDraft(
    {
      sourceDomain: params.sourceDomain,
      prospect: {
        domain: params.lead.businessDomain,
        content: params.lead.content,
        rationale: params.lead.rationale,
      },
      contact: {
        email: params.contact.email,
        name: params.contact.name ?? null,
        title: params.contact.title ?? null,
        sourceUrl: params.contact.sourceUrl ?? null,
        context: params.contact.context ?? null,
      },
    },
    { reasoningEffort: params.reasoningEffort },
  );

  const [saved] = await db
    .insert(leadgenEmailDraftsTable)
    .values({
      runId: params.runId,
      leadId: params.lead.id,
      contactId: params.contact.id,
      businessDomain: params.lead.businessDomain,
      contactEmail: params.contact.email,
      subject: draft.output.subject.trim(),
      fullEmail: draft.output.fullEmail.trim(),
      fromCache: params.fromCache,
    })
    .onConflictDoUpdate({
      target: [
        leadgenEmailDraftsTable.runId,
        leadgenEmailDraftsTable.businessDomain,
        leadgenEmailDraftsTable.contactEmail,
      ],
      set: {
        subject: draft.output.subject.trim(),
        fullEmail: draft.output.fullEmail.trim(),
        fromCache: params.fromCache,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!saved) {
    throw new Error('Failed to persist email draft');
  }

  await persistLeadgenEvent({
    runId: params.runId,
    eventType: 'draft',
    stage: 'drafts',
    message: `Drafted outreach to ${params.contact.email}.`,
    payload: {
      leadId: params.lead.id,
      contactId: params.contact.id,
      draftId: saved.id,
      businessDomain: params.lead.businessDomain,
      contactEmail: params.contact.email,
      subject: saved.subject,
      fromCache: params.fromCache,
    },
  });

  await refreshLeadgenRunCounts(params.runId);

  return saved;
}

async function refreshLeadgenRunCounts(runId: string) {
  const [[leadCountRow], [contactCountRow], [draftCountRow]] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(leadgenLeadsTable)
        .where(eq(leadgenLeadsTable.runId, runId)),
      db
        .select({ value: count() })
        .from(leadgenContactsTable)
        .where(eq(leadgenContactsTable.runId, runId)),
      db
        .select({ value: count() })
        .from(leadgenEmailDraftsTable)
        .where(eq(leadgenEmailDraftsTable.runId, runId)),
    ]);

  const counts = {
    leadCount: leadCountRow?.value ?? 0,
    contactCount: contactCountRow?.value ?? 0,
    draftCount: draftCountRow?.value ?? 0,
  };

  await db
    .update(leadgenRunsTable)
    .set({ ...counts, updatedAt: new Date() })
    .where(eq(leadgenRunsTable.id, runId));

  return counts;
}

async function persistLeadgenEvent(params: {
  runId: string;
  eventType: string;
  stage?: string;
  message?: string;
  payload?: Record<string, unknown>;
  transient?: boolean;
}) {
  await db.insert(leadgenEventsTable).values({
    runId: params.runId,
    eventType: params.eventType,
    stage: params.stage ?? null,
    message: params.message ?? null,
    payload: params.payload ?? {},
    transient: params.transient ?? false,
  });
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
