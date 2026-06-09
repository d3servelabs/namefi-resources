import {
  LEADGEN_USER_SIGNAL_RECIPE,
  leadgenUserSignalTypeByState,
  type LeadgenUserSignalState,
} from '@namefi-astra/common/contract/leadgen-contract';
import { reconcileLeadgenLeadOrder } from '@namefi-astra/common/leadgen-order';
import {
  db,
  leadgenContactsTable,
  leadgenEmailDraftsTable,
  leadgenEventsTable,
  leadgenLeadSignalsTable,
  leadgenLeadsTable,
  leadgenRunsTable,
} from '@namefi-astra/db';
import { TRPCError } from '@trpc/server';
import { and, asc, count, desc, eq, inArray } from 'drizzle-orm';

import { getLeadgenLeadPriorityOrder } from './ordering';

const publicLeadgenEventPayloadKeys = new Set([
  'businessDomain',
  'contactCount',
  'contactEmail',
  'draftCount',
  'email',
  'leadContactCount',
  'leadCount',
  'leadDraftCount',
  'leadId',
  'queries',
  'queryCount',
  'trigger',
]);

type RunRow = typeof leadgenRunsTable.$inferSelect;
type LeadRow = Pick<
  typeof leadgenLeadsTable.$inferSelect,
  'id' | 'businessDomain' | 'status' | 'rationale' | 'content'
>;
type ContactPublicRow = Pick<
  typeof leadgenContactsTable.$inferSelect,
  'leadId' | 'email' | 'name' | 'title' | 'sourceUrl' | 'context'
>;
type DraftPublicRow = {
  leadId: string;
  contactEmail: string;
  subject: string;
  fullEmail: string;
};
type SignalPublicRow = Pick<
  typeof leadgenLeadSignalsTable.$inferSelect,
  'leadId' | 'signalType' | 'updatedAt'
>;

export type LeadgenRunCounts = {
  leadCount: number;
  contactCount: number;
  draftCount: number;
};

export async function getLeadgenRunSnapshotForUser(params: {
  runId: string;
  userId: string;
}) {
  const run = await getLeadgenRunForUser(params);

  const [events, leads, contacts, drafts, signals] = await Promise.all([
    db
      .select({
        id: leadgenEventsTable.id,
        eventType: leadgenEventsTable.eventType,
        stage: leadgenEventsTable.stage,
        message: leadgenEventsTable.message,
        payload: leadgenEventsTable.payload,
        createdAt: leadgenEventsTable.createdAt,
      })
      .from(leadgenEventsTable)
      .where(eq(leadgenEventsTable.runId, run.id))
      .orderBy(asc(leadgenEventsTable.createdAt)),
    db
      .select({
        id: leadgenLeadsTable.id,
        businessDomain: leadgenLeadsTable.businessDomain,
        status: leadgenLeadsTable.status,
        rationale: leadgenLeadsTable.rationale,
        content: leadgenLeadsTable.content,
      })
      .from(leadgenLeadsTable)
      .where(eq(leadgenLeadsTable.runId, run.id))
      .orderBy(
        getLeadgenLeadPriorityOrder(),
        desc(leadgenLeadsTable.score),
        asc(leadgenLeadsTable.createdAt),
        asc(leadgenLeadsTable.id),
      ),
    db
      .select({
        leadId: leadgenContactsTable.leadId,
        email: leadgenContactsTable.email,
        name: leadgenContactsTable.name,
        title: leadgenContactsTable.title,
        sourceUrl: leadgenContactsTable.sourceUrl,
        context: leadgenContactsTable.context,
      })
      .from(leadgenContactsTable)
      .innerJoin(
        leadgenLeadsTable,
        eq(leadgenContactsTable.leadId, leadgenLeadsTable.id),
      )
      .where(eq(leadgenLeadsTable.runId, run.id))
      .orderBy(asc(leadgenContactsTable.createdAt)),
    db
      .select({
        leadId: leadgenContactsTable.leadId,
        contactEmail: leadgenContactsTable.email,
        subject: leadgenEmailDraftsTable.subject,
        fullEmail: leadgenEmailDraftsTable.fullEmail,
      })
      .from(leadgenEmailDraftsTable)
      .innerJoin(
        leadgenContactsTable,
        eq(leadgenEmailDraftsTable.contactId, leadgenContactsTable.id),
      )
      .innerJoin(
        leadgenLeadsTable,
        eq(leadgenContactsTable.leadId, leadgenLeadsTable.id),
      )
      .where(eq(leadgenLeadsTable.runId, run.id))
      .orderBy(asc(leadgenEmailDraftsTable.createdAt)),
    db
      .select({
        leadId: leadgenLeadSignalsTable.leadId,
        signalType: leadgenLeadSignalsTable.signalType,
        updatedAt: leadgenLeadSignalsTable.updatedAt,
      })
      .from(leadgenLeadSignalsTable)
      .innerJoin(
        leadgenLeadsTable,
        eq(leadgenLeadSignalsTable.leadId, leadgenLeadsTable.id),
      )
      .where(
        and(
          eq(leadgenLeadsTable.runId, run.id),
          eq(leadgenLeadSignalsTable.recipe, LEADGEN_USER_SIGNAL_RECIPE),
        ),
      )
      .orderBy(asc(leadgenLeadSignalsTable.createdAt)),
  ]);

  const publicEvents = events.map((event) => ({
    ...event,
    payload: sanitizeLeadgenEventPayload(event.payload),
  }));
  const intentQueries = extractIntentQueries(publicEvents);
  const liveCounts = {
    leadCount: leads.length,
    contactCount: contacts.length,
    draftCount: drafts.length,
  };
  const agentOrderedLeadIds = leads.map((lead) => lead.id);

  return {
    id: run.id,
    domain: run.domain,
    status: run.status,
    reasoningEffort: run.reasoningEffort,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    errorMessage: run.errorMessage,
    ...liveCounts,
    summary: deriveLeadgenRunSummary({
      status: run.status,
      ...liveCounts,
    }),
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    userLeadOrder: reconcileLeadgenLeadOrder(
      run.userLeadOrder,
      agentOrderedLeadIds,
    ),
    intentQueries,
    events: publicEvents,
    leads: leads.map((lead) =>
      serializeLeadgenLeadSnapshot({
        lead,
        signals: signals.filter((signal) => signal.leadId === lead.id),
        contacts: contacts.filter((contact) => contact.leadId === lead.id),
        drafts: drafts.filter((draft) => draft.leadId === lead.id),
      }),
    ),
  };
}

export async function getLeadgenRunForUser(params: {
  runId: string;
  userId: string;
}) {
  const [run] = await db
    .select()
    .from(leadgenRunsTable)
    .where(
      and(
        eq(leadgenRunsTable.id, params.runId),
        eq(leadgenRunsTable.userId, params.userId),
      ),
    );

  if (!run) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Leadgen run not found',
    });
  }

  return run;
}

export async function getLeadgenAgentOrderedLeadIds(runId: string) {
  const leads = await db
    .select({ id: leadgenLeadsTable.id })
    .from(leadgenLeadsTable)
    .where(eq(leadgenLeadsTable.runId, runId))
    .orderBy(
      getLeadgenLeadPriorityOrder(),
      desc(leadgenLeadsTable.score),
      asc(leadgenLeadsTable.createdAt),
      asc(leadgenLeadsTable.id),
    );

  return leads.map((lead) => lead.id);
}

export async function getLeadgenLeadSnapshotForRun(params: {
  runId: string;
  leadId: string;
}) {
  const [lead] = await db
    .select({
      id: leadgenLeadsTable.id,
      businessDomain: leadgenLeadsTable.businessDomain,
      status: leadgenLeadsTable.status,
      rationale: leadgenLeadsTable.rationale,
      content: leadgenLeadsTable.content,
    })
    .from(leadgenLeadsTable)
    .where(
      and(
        eq(leadgenLeadsTable.runId, params.runId),
        eq(leadgenLeadsTable.id, params.leadId),
      ),
    )
    .limit(1);

  if (!lead) return null;

  const [contacts, drafts, signals] = await Promise.all([
    db
      .select({
        leadId: leadgenContactsTable.leadId,
        email: leadgenContactsTable.email,
        name: leadgenContactsTable.name,
        title: leadgenContactsTable.title,
        sourceUrl: leadgenContactsTable.sourceUrl,
        context: leadgenContactsTable.context,
      })
      .from(leadgenContactsTable)
      .where(eq(leadgenContactsTable.leadId, lead.id))
      .orderBy(asc(leadgenContactsTable.createdAt)),
    db
      .select({
        leadId: leadgenContactsTable.leadId,
        contactEmail: leadgenContactsTable.email,
        subject: leadgenEmailDraftsTable.subject,
        fullEmail: leadgenEmailDraftsTable.fullEmail,
      })
      .from(leadgenEmailDraftsTable)
      .innerJoin(
        leadgenContactsTable,
        eq(leadgenEmailDraftsTable.contactId, leadgenContactsTable.id),
      )
      .where(eq(leadgenContactsTable.leadId, lead.id))
      .orderBy(asc(leadgenEmailDraftsTable.createdAt)),
    db
      .select({
        leadId: leadgenLeadSignalsTable.leadId,
        signalType: leadgenLeadSignalsTable.signalType,
        updatedAt: leadgenLeadSignalsTable.updatedAt,
      })
      .from(leadgenLeadSignalsTable)
      .where(
        and(
          eq(leadgenLeadSignalsTable.leadId, lead.id),
          eq(leadgenLeadSignalsTable.recipe, LEADGEN_USER_SIGNAL_RECIPE),
        ),
      )
      .orderBy(asc(leadgenLeadSignalsTable.createdAt)),
  ]);

  return serializeLeadgenLeadSnapshot({
    lead,
    signals,
    contacts,
    drafts,
  });
}

/**
 * Complete means at least one draft exists and every discovered contact has a draft.
 */
export function hasCompleteLeadgenOutreach(lead: {
  contacts: unknown[];
  drafts: unknown[];
}) {
  return lead.drafts.length > 0 && lead.drafts.length >= lead.contacts.length;
}

export function deriveLeadgenRunSummary(
  params: LeadgenRunCounts & { status: RunRow['status'] },
): string | null {
  if (params.status !== 'SUCCEEDED') return null;
  if (params.leadCount === 0) return 'Research complete.';

  return `Found ${params.leadCount} prospects, ${params.contactCount} contacts, and ${params.draftCount} drafts.`;
}

export async function getLeadgenRunCounts(
  runId: string,
): Promise<LeadgenRunCounts> {
  const countsByRunId = await getLeadgenRunCountsByRunId([runId]);
  return countsByRunId.get(runId) ?? emptyLeadgenRunCounts();
}

export async function getLeadgenRunCountsByRunId(
  runIds: string[],
): Promise<Map<string, LeadgenRunCounts>> {
  const uniqueRunIds = [...new Set(runIds)];
  const countsByRunId = new Map(
    uniqueRunIds.map((runId) => [runId, emptyLeadgenRunCounts()]),
  );

  if (uniqueRunIds.length === 0) {
    return countsByRunId;
  }

  const [leadCountRows, contactCountRows, draftCountRows] = await Promise.all([
    db
      .select({ runId: leadgenLeadsTable.runId, value: count() })
      .from(leadgenLeadsTable)
      .where(inArray(leadgenLeadsTable.runId, uniqueRunIds))
      .groupBy(leadgenLeadsTable.runId),
    db
      .select({ runId: leadgenLeadsTable.runId, value: count() })
      .from(leadgenContactsTable)
      .innerJoin(
        leadgenLeadsTable,
        eq(leadgenContactsTable.leadId, leadgenLeadsTable.id),
      )
      .where(inArray(leadgenLeadsTable.runId, uniqueRunIds))
      .groupBy(leadgenLeadsTable.runId),
    db
      .select({ runId: leadgenLeadsTable.runId, value: count() })
      .from(leadgenEmailDraftsTable)
      .innerJoin(
        leadgenContactsTable,
        eq(leadgenEmailDraftsTable.contactId, leadgenContactsTable.id),
      )
      .innerJoin(
        leadgenLeadsTable,
        eq(leadgenContactsTable.leadId, leadgenLeadsTable.id),
      )
      .where(inArray(leadgenLeadsTable.runId, uniqueRunIds))
      .groupBy(leadgenLeadsTable.runId),
  ]);

  for (const row of leadCountRows) {
    const counts = countsByRunId.get(row.runId);
    if (counts) counts.leadCount = row.value;
  }

  for (const row of contactCountRows) {
    const counts = countsByRunId.get(row.runId);
    if (counts) counts.contactCount = row.value;
  }

  for (const row of draftCountRows) {
    const counts = countsByRunId.get(row.runId);
    if (counts) counts.draftCount = row.value;
  }

  return countsByRunId;
}

function serializeLeadgenLeadSnapshot({
  lead,
  signals,
  contacts,
  drafts,
}: {
  lead: LeadRow;
  signals: SignalPublicRow[];
  contacts: ContactPublicRow[];
  drafts: DraftPublicRow[];
}) {
  return {
    id: lead.id,
    businessDomain: lead.businessDomain,
    rankingState:
      lead.status === 'checking' ? ('checking' as const) : ('ranked' as const),
    initialOutreachCandidate: lead.status === 'contact_now',
    organizationState: deriveLeadgenUserSignalState(signals),
    rationale: lead.rationale,
    content: lead.content,
    contacts: contacts.map((contact) => ({
      email: contact.email,
      name: contact.name,
      title: contact.title,
      sourceUrl: contact.sourceUrl,
      context: contact.context,
    })),
    drafts: drafts.map((draft) => ({
      contactEmail: draft.contactEmail,
      subject: draft.subject,
      fullEmail: draft.fullEmail,
    })),
  };
}

const userSignalStateBySignalType = new Map<string, LeadgenUserSignalState>(
  Object.entries(leadgenUserSignalTypeByState).map(([state, signalType]) => [
    signalType,
    state as LeadgenUserSignalState,
  ]),
);

function deriveLeadgenUserSignalState(
  signals: SignalPublicRow[],
): LeadgenUserSignalState {
  let latestUserSignal: {
    state: LeadgenUserSignalState;
    timestamp: number;
  } | null = null;

  for (const signal of signals) {
    const state = userSignalStateBySignalType.get(signal.signalType);
    if (!state) continue;

    const timestamp = signal.updatedAt.getTime();
    if (!latestUserSignal || timestamp >= latestUserSignal.timestamp) {
      latestUserSignal = { state, timestamp };
    }
  }

  return latestUserSignal?.state ?? 'none';
}

function emptyLeadgenRunCounts(): LeadgenRunCounts {
  return {
    leadCount: 0,
    contactCount: 0,
    draftCount: 0,
  };
}

function extractIntentQueries(
  events: Array<{ eventType: string; payload: unknown }>,
) {
  const event = events.find((item) => item.eventType === 'intent-queries');
  if (!event?.payload || typeof event.payload !== 'object') {
    return [];
  }

  const queries = (event.payload as { queries?: unknown }).queries;
  return Array.isArray(queries)
    ? queries.filter((query): query is string => typeof query === 'string')
    : [];
}

function sanitizeLeadgenEventPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {};
  }

  const publicPayload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (publicLeadgenEventPayloadKeys.has(key)) {
      publicPayload[key] = value;
    }
  }

  return publicPayload;
}
