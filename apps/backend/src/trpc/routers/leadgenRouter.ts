import { leadgenContract } from '@namefi-astra/common/contract/leadgen-contract';
import {
  getLeadgenOutreachCreditEstimate,
  getLeadgenRunCreditEstimate,
} from '@namefi-astra/common/ai-generation-credits';
import {
  LEADGEN_CONTACT_MODEL,
  getLeadgenPrimaryResearchModel,
} from '@namefi-astra/ai';
import {
  db,
  leadgenContactsTable,
  leadgenEmailDraftsTable,
  leadgenEventsTable,
  leadgenLeadSignalsTable,
  leadgenLeadsTable,
  leadgenRunsTable,
} from '@namefi-astra/db';
import { and, desc, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

import { startLeadgenRunForUser } from '#lib/leadgen/runs';
import { config } from '#lib/env';
import { createLogger } from '#lib/logger';
import {
  generateLeadgenLeadOutreach,
  persistLeadgenEvent,
} from '../../services/leadgen/outreach.service';
import { createContractTRPCRouter } from '../contract';
import { protectedProcedure } from '../base';
import { assertUserCanSpendGenerationCredits } from './aiRouter';

function isTerminalRunStatus(status: string) {
  return status === 'SUCCEEDED' || status === 'FAILED' || status === 'CANCELED';
}

const logger = createLogger({ module: 'leadgen-router' });

export const leadgenRouter = createContractTRPCRouter<typeof leadgenContract>({
  startRun: protectedProcedure
    .input(leadgenContract.startRun.input)
    .output(leadgenContract.startRun.output)
    .mutation(async ({ input, ctx }) => {
      await assertUserCanSpendGenerationCredits({
        userId: ctx.user.id,
        requestedCredits: getLeadgenRunCreditEstimate({
          creditCosts: config.AI_GENERATION_CREDIT_COSTS,
          reasoningEffort: input.reasoningEffort,
          model: getLeadgenPrimaryResearchModel(input.reasoningEffort),
        }),
      });

      const run = await startLeadgenRunForUser({
        userId: ctx.user.id,
        domain: input.domain,
        reasoningEffort: input.reasoningEffort,
        askingPriceUsd: input.askingPriceUsd,
      });

      return await getLeadgenRunSnapshotForUser({
        runId: run.id,
        userId: ctx.user.id,
      });
    }),

  getRun: protectedProcedure
    .input(leadgenContract.getRun.input)
    .output(leadgenContract.getRun.output)
    .query(async ({ input, ctx }) => {
      return await getLeadgenRunSnapshotForUser({
        runId: input.runId,
        userId: ctx.user.id,
      });
    }),

  generateLeadOutreach: protectedProcedure
    .input(leadgenContract.generateLeadOutreach.input)
    .output(leadgenContract.generateLeadOutreach.output)
    .mutation(async ({ input, ctx }) => {
      const run = await getLeadgenRunForUser({
        runId: input.runId,
        userId: ctx.user.id,
      });

      const estimatedCredits = getLeadgenOutreachCreditEstimate({
        creditCosts: config.AI_GENERATION_CREDIT_COSTS,
        reasoningEffort: run.reasoningEffort,
        model: LEADGEN_CONTACT_MODEL,
      });
      await assertUserCanSpendGenerationCredits({
        userId: ctx.user.id,
        requestedCredits: estimatedCredits,
      });

      await generateLeadgenLeadOutreach({
        runId: run.id,
        leadId: input.leadId,
        sourceDomain: run.domain,
        reasoningEffort: run.reasoningEffort,
      });
      // Record the estimate only after successful generation so failed
      // outreach attempts do not consume monthly credits.
      try {
        await persistLeadgenEvent({
          runId: run.id,
          eventType: 'credit-estimate',
          stage: 'credits',
          payload: {
            operation: 'leadgen-outreach',
            leadId: input.leadId,
            estimatedCredits,
          },
        });
      } catch (error) {
        logger.warn(
          { error, runId: run.id, leadId: input.leadId, estimatedCredits },
          'Failed to persist leadgen outreach credit estimate',
        );
      }

      return await getLeadgenRunSnapshotForUser({
        runId: run.id,
        userId: ctx.user.id,
      });
    }),

  listRuns: protectedProcedure
    .input(leadgenContract.listRuns.input)
    .output(leadgenContract.listRuns.output)
    .query(async ({ input, ctx }) => {
      return await db
        .select({
          id: leadgenRunsTable.id,
          userId: leadgenRunsTable.userId,
          domain: leadgenRunsTable.domain,
          status: leadgenRunsTable.status,
          reasoningEffort: leadgenRunsTable.reasoningEffort,
          workflowId: leadgenRunsTable.workflowId,
          startedAt: leadgenRunsTable.startedAt,
          finishedAt: leadgenRunsTable.finishedAt,
          errorMessage: leadgenRunsTable.errorMessage,
          summary: leadgenRunsTable.summary,
          leadCount: leadgenRunsTable.leadCount,
          contactCount: leadgenRunsTable.contactCount,
          draftCount: leadgenRunsTable.draftCount,
          tokenUsage: leadgenRunsTable.tokenUsage,
          createdAt: leadgenRunsTable.createdAt,
          updatedAt: leadgenRunsTable.updatedAt,
        })
        .from(leadgenRunsTable)
        .where(eq(leadgenRunsTable.userId, ctx.user.id))
        .orderBy(desc(leadgenRunsTable.createdAt))
        .limit(input.limit);
    }),

  watchRun: protectedProcedure
    .input(leadgenContract.watchRun.input)
    .subscription(async function* ({ input, ctx, signal }) {
      let lastSnapshotKey: string | null = null;

      while (!signal?.aborted) {
        const snapshot = await getLeadgenRunSnapshotForUser({
          runId: input.runId,
          userId: ctx.user.id,
        });
        const snapshotKey = JSON.stringify(snapshot);

        if (snapshotKey !== lastSnapshotKey) {
          lastSnapshotKey = snapshotKey;
          yield snapshot;
        }

        if (isTerminalRunStatus(snapshot.status)) {
          return;
        }

        await sleep(1200, signal);
      }
    }),
});

export async function getLeadgenRunSnapshotForUser(params: {
  runId: string;
  userId: string;
}) {
  const run = await getLeadgenRunForUser(params);

  const [events, leads, contacts, drafts, signals] = await Promise.all([
    db
      .select({
        id: leadgenEventsTable.id,
        runId: leadgenEventsTable.runId,
        eventType: leadgenEventsTable.eventType,
        stage: leadgenEventsTable.stage,
        message: leadgenEventsTable.message,
        payload: leadgenEventsTable.payload,
        transient: leadgenEventsTable.transient,
        createdAt: leadgenEventsTable.createdAt,
      })
      .from(leadgenEventsTable)
      .where(eq(leadgenEventsTable.runId, run.id))
      .orderBy(leadgenEventsTable.createdAt),
    db
      .select()
      .from(leadgenLeadsTable)
      .where(eq(leadgenLeadsTable.runId, run.id))
      .orderBy(leadgenLeadsTable.rank, leadgenLeadsTable.createdAt),
    db
      .select()
      .from(leadgenContactsTable)
      .where(eq(leadgenContactsTable.runId, run.id))
      .orderBy(leadgenContactsTable.createdAt),
    db
      .select()
      .from(leadgenEmailDraftsTable)
      .where(eq(leadgenEmailDraftsTable.runId, run.id))
      .orderBy(leadgenEmailDraftsTable.createdAt),
    db
      .select()
      .from(leadgenLeadSignalsTable)
      .where(eq(leadgenLeadSignalsTable.runId, run.id))
      .orderBy(leadgenLeadSignalsTable.createdAt),
  ]);

  const publicEvents = events.map((event) => ({
    ...event,
    payload: sanitizeLeadgenEventPayload(event.payload),
  }));
  const intentQueries = extractIntentQueries(publicEvents);
  const signalsByLeadId = new Map<string, Array<(typeof signals)[number]>>();
  for (const signal of signals) {
    const groupedSignals = signalsByLeadId.get(signal.leadId);
    if (groupedSignals) {
      groupedSignals.push(signal);
    } else {
      signalsByLeadId.set(signal.leadId, [signal]);
    }
  }
  // getRun already fetches full detail rows, so surface live counts here while
  // listRuns keeps using persisted aggregates for the lightweight index view.
  const liveCounts = {
    leadCount: leads.length,
    contactCount: contacts.length,
    draftCount: drafts.length,
  };

  return {
    id: run.id,
    userId: run.userId,
    domain: run.domain,
    status: run.status,
    reasoningEffort: run.reasoningEffort,
    workflowId: run.workflowId,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    errorMessage: run.errorMessage,
    summary: run.summary,
    ...liveCounts,
    tokenUsage: run.tokenUsage,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    intentQueries,
    events: publicEvents,
    leads: leads.map((lead) => ({
      id: lead.id,
      runId: lead.runId,
      businessDomain: lead.businessDomain,
      companyName: lead.companyName,
      status: lead.status,
      score: lead.score,
      motion: lead.motion,
      thesis: lead.thesis,
      riskLevel: lead.riskLevel,
      riskNote: lead.riskNote,
      contactReadiness: lead.contactReadiness,
      rationale: lead.rationale,
      content: lead.content,
      rank: lead.rank,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      signals: (signalsByLeadId.get(lead.id) ?? []).map((signal) => ({
        id: signal.id,
        runId: signal.runId,
        leadId: signal.leadId,
        signalType: signal.signalType,
        evidenceUrl: signal.evidenceUrl,
        evidenceSnippet: signal.evidenceSnippet,
        createdAt: signal.createdAt,
        updatedAt: signal.updatedAt,
      })),
      contacts: contacts
        // Some cached contacts are linked by domain before a lead FK exists.
        .filter(
          (contact) =>
            contact.leadId === lead.id ||
            contact.businessDomain === lead.businessDomain,
        )
        .map((contact) => ({
          id: contact.id,
          runId: contact.runId,
          leadId: contact.leadId,
          businessDomain: contact.businessDomain,
          email: contact.email,
          name: contact.name,
          title: contact.title,
          sourceUrl: contact.sourceUrl,
          context: contact.context,
          notes: contact.notes,
          errorMessage: contact.errorMessage,
          fromCache: contact.fromCache,
          createdAt: contact.createdAt,
          updatedAt: contact.updatedAt,
        })),
      drafts: drafts
        // Drafts can come from cached domain matches as well as direct lead IDs.
        .filter(
          (draft) =>
            draft.leadId === lead.id ||
            draft.businessDomain === lead.businessDomain,
        )
        .map((draft) => ({
          id: draft.id,
          runId: draft.runId,
          leadId: draft.leadId,
          contactId: draft.contactId,
          businessDomain: draft.businessDomain,
          contactEmail: draft.contactEmail,
          subject: draft.subject,
          fullEmail: draft.fullEmail,
          fromCache: draft.fromCache,
          createdAt: draft.createdAt,
          updatedAt: draft.updatedAt,
        })),
    })),
  };
}

async function getLeadgenRunForUser(params: { runId: string; userId: string }) {
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
    return payload;
  }

  const publicPayload = { ...(payload as Record<string, unknown>) };
  delete publicPayload.recipe;
  delete publicPayload.recipeGroup;
  return publicPayload;
}

function sleep(ms: number, signal?: AbortSignal) {
  if (signal?.aborted) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
  });
}
