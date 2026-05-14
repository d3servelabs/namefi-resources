import { randomUUID } from 'node:crypto';
import {
  db,
  leadgenEmailDraftsTable,
  leadgenLeadsTable,
  leadgenRunsTable,
} from '@namefi-astra/db';
import {
  namefiNormalizedDomainSchema,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import { and, desc, eq, sql } from 'drizzle-orm';

import { createLogger } from '#lib/logger';
import { temporalClient } from '#temporal/client';
import { TEMPORAL_QUEUES } from '#temporal/shared';
import { runLeadgenWorkflow } from '#temporal/workflows/leadgen.workflow';

const logger = createLogger({ module: 'leadgen-runs' });

type LeadgenRunRow = typeof leadgenRunsTable.$inferSelect;
type LeadgenReasoningEffort = 'low' | 'medium' | 'high';
type LeadgenRunProfile = 'full' | 'campaign_short';

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
  runProfile = 'full',
  source,
  metadata = {},
  maxIntentQueries,
  maxResultsPerQuery,
  contactDiscoveryLimit,
}: {
  userId: string;
  domain: string;
  reasoningEffort?: LeadgenReasoningEffort;
  runProfile?: LeadgenRunProfile;
  source?: string;
  metadata?: Record<string, unknown>;
  maxIntentQueries?: number;
  maxResultsPerQuery?: number;
  contactDiscoveryLimit?: number;
}): Promise<LeadgenRunRow> {
  const normalizedDomain = namefiNormalizedDomainSchema.parse(domain);
  const runId = randomUUID();
  const workflowId = `leadgen-${runId}`;
  const input = {
    domain: normalizedDomain,
    reasoningEffort,
    ...(runProfile !== 'full' ? { runProfile } : {}),
    ...(source ? { source } : {}),
    ...(maxIntentQueries ? { maxIntentQueries } : {}),
    ...(maxResultsPerQuery ? { maxResultsPerQuery } : {}),
    ...(contactDiscoveryLimit ? { contactDiscoveryLimit } : {}),
  };

  const [run] = await db
    .insert(leadgenRunsTable)
    .values({
      id: runId,
      userId,
      domain: normalizedDomain,
      reasoningEffort,
      workflowId,
      status: 'QUEUED',
      input,
      metadata: {
        ...metadata,
        source: source ?? 'leadgen',
        runProfile,
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
          ...(runProfile !== 'full' ? { runProfile } : {}),
          ...(maxIntentQueries ? { maxIntentQueries } : {}),
          ...(maxResultsPerQuery ? { maxResultsPerQuery } : {}),
          ...(contactDiscoveryLimit ? { contactDiscoveryLimit } : {}),
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
    reasoningEffort: 'medium',
    runProfile: 'campaign_short',
    source: 'domain-traffic-surge',
    maxIntentQueries: 3,
    maxResultsPerQuery: 5,
    contactDiscoveryLimit: 5,
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
        rank: leadgenLeadsTable.rank,
        createdAt: leadgenLeadsTable.createdAt,
      })
      .from(leadgenLeadsTable)
      .where(eq(leadgenLeadsTable.runId, runId))
      .orderBy(leadgenLeadsTable.rank, leadgenLeadsTable.createdAt)
      .limit(limit * 3),
    db
      .select({
        leadId: leadgenEmailDraftsTable.leadId,
        businessDomain: leadgenEmailDraftsTable.businessDomain,
      })
      .from(leadgenEmailDraftsTable)
      .where(eq(leadgenEmailDraftsTable.runId, runId)),
  ]);
  const draftedLeadIds = new Set(
    drafts.map((draft) => draft.leadId).filter((id): id is string => !!id),
  );
  const draftedDomains = new Set(
    drafts.map((draft) => draft.businessDomain.toLowerCase()),
  );

  return leads
    .map((lead) => ({
      ...lead,
      hasDraft:
        draftedLeadIds.has(lead.id) ||
        draftedDomains.has(lead.businessDomain.toLowerCase()),
    }))
    .sort((a, b) => {
      if (a.hasDraft !== b.hasDraft) return a.hasDraft ? -1 : 1;
      return a.rank - b.rank || a.createdAt.getTime() - b.createdAt.getTime();
    })
    .slice(0, limit)
    .map((lead) => ({
      leadId: lead.id,
      businessDomain: lead.businessDomain,
      rationale: crispRationale(lead.rationale),
      hasDraft: lead.hasDraft,
    }));
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
  const firstSentence = clean.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() ?? clean;
  if (firstSentence.length <= 132) return firstSentence;

  const clipped = firstSentence.slice(0, 129);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${clipped.slice(0, lastSpace > 80 ? lastSpace : 129).trim()}...`;
}
