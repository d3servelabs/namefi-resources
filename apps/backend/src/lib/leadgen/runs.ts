import { randomUUID } from 'node:crypto';
import {
  db,
  leadgenContactsTable,
  leadgenEmailDraftsTable,
  leadgenEventsTable,
  leadgenLeadsTable,
  leadgenRunsTable,
} from '@namefi-astra/db';
import { EMAIL_CAMPAIGN_KEYS } from '@namefi-astra/common/email-campaigns';
import {
  namefiNormalizedDomainSchema,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';

import {
  getLeadgenLeadPriorityOrder,
  getLeadgenLeadStatusPriority,
} from '#lib/leadgen/ordering';
import { createLogger } from '#lib/logger';
import { temporalClient } from '#temporal/client';
import { TEMPORAL_QUEUES } from '#temporal/shared';
import { runLeadgenWorkflow } from '#temporal/workflows/leadgen.workflow';

const logger = createLogger({ module: 'leadgen-runs' });
const FIRST_SENTENCE_RE = /^.*?[.!?](?:\s|$)/;

type LeadgenRunRow = typeof leadgenRunsTable.$inferSelect;
type LeadgenReasoningEffort = 'low' | 'medium' | 'high';

export class LeadgenRunNoLongerRetryableError extends Error {
  constructor(message = 'Leadgen run is no longer retryable.') {
    super(message);
    this.name = 'LeadgenRunNoLongerRetryableError';
  }
}

export type LeadgenEmailLead = {
  leadId: string;
  businessDomain: string;
  rationale: string;
  hasDraft: boolean;
};

export async function startLeadgenRunForUser({
  userId,
  domain,
  reasoningEffort = 'medium',
  source,
  metadata = {},
}: {
  userId: string;
  domain: string;
  reasoningEffort?: LeadgenReasoningEffort;
  source?: string;
  metadata?: Record<string, unknown>;
}): Promise<LeadgenRunRow> {
  const normalizedDomain = namefiNormalizedDomainSchema.parse(domain);
  const runId = randomUUID();
  const workflowId = `leadgen-${runId}`;
  const sourceName = source ?? 'leadgen';

  const [run] = await db
    .insert(leadgenRunsTable)
    .values({
      id: runId,
      userId,
      domain: normalizedDomain,
      reasoningEffort,
      workflowId,
      status: 'QUEUED',
      metadata: {
        ...metadata,
        source: sourceName,
      },
    })
    .returning();

  if (!run) {
    throw new Error('Failed to create leadgen run.');
  }

  try {
    await temporalClient.workflow.start(runLeadgenWorkflow, {
      args: [
        {
          runId,
          userId,
          domain: normalizedDomain,
          reasoningEffort,
        },
      ],
      taskQueue: TEMPORAL_QUEUES.DEFAULT,
      workflowId,
      workflowIdReusePolicy: 'ALLOW_DUPLICATE_FAILED_ONLY',
      workflowIdConflictPolicy: 'FAIL',
    });
  } catch (error) {
    const now = new Date();
    const errorMessage =
      error instanceof Error ? error.message : 'Workflow start failed';
    logger.error({ error, runId, workflowId }, 'Failed to start leadgen run');
    await db
      .update(leadgenRunsTable)
      .set({
        status: 'FAILED',
        errorMessage,
        finishedAt: now,
        updatedAt: now,
      })
      .where(eq(leadgenRunsTable.id, runId));
  }

  return getLeadgenRunOrThrow(runId);
}

export async function retryFailedLeadgenRunForUser({
  runId,
  userId,
}: {
  runId: string;
  userId: string;
}): Promise<LeadgenRunRow> {
  const [run] = await db
    .select()
    .from(leadgenRunsTable)
    .where(
      and(eq(leadgenRunsTable.id, runId), eq(leadgenRunsTable.userId, userId)),
    )
    .limit(1);

  if (!run) {
    throw new Error('Leadgen run not found.');
  }

  if (run.status !== 'FAILED') {
    throw new Error('Only failed leadgen runs can be retried.');
  }

  const workflowId = run.workflowId ?? `leadgen-${run.id}`;
  const queuedAt = new Date();
  const [queuedRun] = await db
    .update(leadgenRunsTable)
    .set({
      status: 'QUEUED',
      workflowId,
      errorMessage: null,
      startedAt: null,
      finishedAt: null,
      tokenUsage: [],
      updatedAt: queuedAt,
    })
    .where(
      and(
        eq(leadgenRunsTable.id, run.id),
        eq(leadgenRunsTable.userId, userId),
        eq(leadgenRunsTable.status, 'FAILED'),
      ),
    )
    .returning();

  if (!queuedRun) {
    throw new LeadgenRunNoLongerRetryableError();
  }

  try {
    await resetRetryableLeadgenContactDiscovery({
      runId: run.id,
      updatedAt: queuedAt,
    });
    await temporalClient.workflow.start(runLeadgenWorkflow, {
      args: [
        {
          runId: run.id,
          userId,
          domain: run.domain,
          reasoningEffort: run.reasoningEffort,
        },
      ],
      taskQueue: TEMPORAL_QUEUES.DEFAULT,
      workflowId,
      workflowIdReusePolicy: 'ALLOW_DUPLICATE_FAILED_ONLY',
      workflowIdConflictPolicy: 'FAIL',
    });
    try {
      await db.insert(leadgenEventsTable).values({
        runId: run.id,
        eventType: 'status',
        stage: 'intent',
        message: 'Retrying buyer search.',
        payload: {},
      });
    } catch (eventError) {
      logger.warn(
        { error: eventError, runId: run.id },
        'Failed to persist leadgen retry event',
      );
    }
  } catch (error) {
    const failedAt = new Date();
    const isPreviousExecutionStillOpen = isWorkflowAlreadyStartedError(error);
    const errorMessage =
      isPreviousExecutionStillOpen && run.errorMessage
        ? run.errorMessage
        : error instanceof Error
          ? error.message
          : 'Workflow retry failed';
    logger.error(
      { error, runId: run.id, workflowId },
      'Failed to retry leadgen run',
    );
    await db
      .update(leadgenRunsTable)
      .set({
        status: 'FAILED',
        errorMessage,
        startedAt: run.startedAt,
        finishedAt: isPreviousExecutionStillOpen
          ? (run.finishedAt ?? failedAt)
          : failedAt,
        tokenUsage: run.tokenUsage,
        updatedAt: failedAt,
      })
      .where(eq(leadgenRunsTable.id, run.id));
    throw error;
  }

  return getLeadgenRunOrThrow(run.id);
}

async function resetRetryableLeadgenContactDiscovery({
  runId,
  updatedAt,
}: {
  runId: string;
  updatedAt: Date;
}) {
  await db
    .update(leadgenLeadsTable)
    .set({
      contactDiscoveryAttemptedAt: null,
      updatedAt,
    })
    .where(
      and(
        eq(leadgenLeadsTable.runId, runId),
        eq(leadgenLeadsTable.status, 'contact_now'),
        sql`${leadgenLeadsTable.contactDiscoveryAttemptedAt} IS NOT NULL`,
        sql`NOT EXISTS (
          SELECT 1
          FROM ${leadgenContactsTable}
          INNER JOIN ${leadgenEmailDraftsTable}
            ON ${leadgenEmailDraftsTable.contactId} = ${leadgenContactsTable.id}
          WHERE ${leadgenContactsTable.leadId} = ${leadgenLeadsTable.id}
        )`,
      ),
    );
}

function isWorkflowAlreadyStartedError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === 'WorkflowExecutionAlreadyStartedError') return true;
  return /already.*started/i.test(error.message);
}

export async function findActiveLeadgenRunForUserDomain({
  userId,
  domain,
}: {
  userId: string;
  domain: string;
}) {
  const normalizedDomain = namefiNormalizedDomainSchema.parse(domain);
  const [run] = await db
    .select()
    .from(leadgenRunsTable)
    .where(
      and(
        eq(leadgenRunsTable.userId, userId),
        eq(leadgenRunsTable.domain, normalizedDomain),
        inArray(leadgenRunsTable.status, ['QUEUED', 'RUNNING']),
      ),
    )
    .orderBy(desc(leadgenRunsTable.createdAt), desc(leadgenRunsTable.id))
    .limit(1);

  return run ?? null;
}

export async function ensureDomainTrafficSurgeLeadgenRun({
  userId,
  domain,
  campaignSendId,
  periodStart,
}: {
  userId: string;
  domain: NamefiNormalizedDomain;
  campaignSendId: string;
  periodStart: Date;
}): Promise<LeadgenRunRow> {
  const sourceKey = buildDomainTrafficSurgeLeadgenSourceKey({
    campaignSendId,
    domain,
  });
  const existing = await findReusableCampaignRun({
    userId,
    domain,
    sourceKey,
  });

  if (existing) {
    await waitForLeadgenRunIfRunning(existing);
    return getLeadgenRunOrThrow(existing.id);
  }

  const run = await startLeadgenRunForUser({
    userId,
    domain,
    reasoningEffort: 'low',
    source: EMAIL_CAMPAIGN_KEYS.DOMAIN_TRAFFIC_SURGE,
    metadata: {
      sourceKey,
      campaignSendId,
      periodStart: periodStart.toISOString(),
    },
  });

  await waitForLeadgenRunIfRunning(run);
  return getLeadgenRunOrThrow(run.id);
}

export async function getLeadgenEmailLeads({
  runId,
  limit = 5,
}: {
  runId: string;
  limit?: number;
}): Promise<LeadgenEmailLead[]> {
  const [leads, drafts] = await Promise.all([
    db
      .select({
        id: leadgenLeadsTable.id,
        businessDomain: leadgenLeadsTable.businessDomain,
        rationale: leadgenLeadsTable.rationale,
        status: leadgenLeadsTable.status,
        score: leadgenLeadsTable.score,
        createdAt: leadgenLeadsTable.createdAt,
      })
      .from(leadgenLeadsTable)
      .where(eq(leadgenLeadsTable.runId, runId))
      .orderBy(
        getLeadgenLeadPriorityOrder(),
        desc(leadgenLeadsTable.score),
        leadgenLeadsTable.createdAt,
        leadgenLeadsTable.id,
      )
      .limit(limit * 3),
    db
      .select({
        leadId: leadgenContactsTable.leadId,
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
      .where(eq(leadgenLeadsTable.runId, runId)),
  ]);
  const draftedLeadIds = new Set(drafts.map((draft) => draft.leadId));

  return (
    leads
      .map((lead) => ({
        ...lead,
        hasDraft: draftedLeadIds.has(lead.id),
      }))
      // Draft presence is only known after loading drafts, so the DB query
      // over-fetches leads and this final pass promotes drafted leads before slicing.
      .sort((a, b) => {
        if (a.hasDraft !== b.hasDraft) return a.hasDraft ? -1 : 1;
        return (
          getLeadgenLeadStatusPriority(a.status) -
            getLeadgenLeadStatusPriority(b.status) ||
          b.score - a.score ||
          a.createdAt.getTime() - b.createdAt.getTime() ||
          a.id.localeCompare(b.id)
        );
      })
      .slice(0, limit)
      .map((lead) => ({
        leadId: lead.id,
        businessDomain: lead.businessDomain,
        rationale: crispRationale(lead.rationale),
        hasDraft: lead.hasDraft,
      }))
  );
}

async function findReusableCampaignRun({
  userId,
  domain,
  sourceKey,
}: {
  userId: string;
  domain: NamefiNormalizedDomain;
  sourceKey: string;
}) {
  const [run] = await db
    .select()
    .from(leadgenRunsTable)
    .where(
      and(
        eq(leadgenRunsTable.userId, userId),
        eq(leadgenRunsTable.domain, domain),
        sql`${leadgenRunsTable.metadata}->>'sourceKey' = ${sourceKey}`,
        sql`${leadgenRunsTable.status} <> 'FAILED'`,
        sql`${leadgenRunsTable.status} <> 'CANCELED'`,
      ),
    )
    .orderBy(desc(leadgenRunsTable.createdAt))
    .limit(1);

  return run ?? null;
}

async function waitForLeadgenRunIfRunning(run: LeadgenRunRow) {
  if (!run.workflowId || run.status === 'SUCCEEDED') return;

  try {
    await temporalClient.workflow.getHandle(run.workflowId).result();
  } catch (error) {
    // Callers re-query the run after waiting, so a failed workflow should be
    // handled through persisted run status instead of throwing from here.
    logger.warn(
      { error, runId: run.id, workflowId: run.workflowId },
      'Leadgen run finished unsuccessfully while waiting for campaign email',
    );
  }
}

async function getLeadgenRunOrThrow(runId: string) {
  const [run] = await db
    .select()
    .from(leadgenRunsTable)
    .where(eq(leadgenRunsTable.id, runId))
    .limit(1);

  if (!run) {
    throw new Error(`Leadgen run not found: ${runId}`);
  }

  return run;
}

function buildDomainTrafficSurgeLeadgenSourceKey({
  campaignSendId,
  domain,
}: {
  campaignSendId: string;
  domain: NamefiNormalizedDomain;
}) {
  return `domain-traffic-surge:${campaignSendId}:${domain}`;
}

function crispRationale(value: string) {
  const clean = value.replace(/\s+/g, ' ').trim();
  const firstSentence = clean.match(FIRST_SENTENCE_RE)?.[0]?.trim() ?? clean;
  if (firstSentence.length <= 132) return firstSentence;

  const clipped = firstSentence.slice(0, 129);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${clipped.slice(0, lastSpace > 80 ? lastSpace : 129).trim()}...`;
}
