import {
  LEADGEN_USER_SIGNAL_RECIPE,
  leadgenContract,
  leadgenUserSignalEvidenceByState,
  leadgenUserSignalTypeByState,
  type LeadgenUserSignalState,
} from '@namefi-astra/common/contract/leadgen-contract';
import {
  getLeadgenOutreachCreditEstimate,
  getLeadgenRunCreditEstimate,
} from '@namefi-astra/common/ai-generation-credits';
import {
  getLeadgenContactModel,
  getLeadgenPrimaryResearchModel,
} from '@namefi-astra/ai';
import {
  db,
  leadgenLeadSignalsTable,
  leadgenLeadsTable,
  leadgenRunsTable,
} from '@namefi-astra/db';
import { TRPCError } from '@trpc/server';
import { and, desc, eq } from 'drizzle-orm';

import {
  deriveLeadgenRunSummary,
  getLeadgenAgentOrderedLeadIds,
  getLeadgenLeadSnapshotForRun,
  getLeadgenRunForUser,
  getLeadgenRunCountsByRunId,
  getLeadgenRunSnapshotForUser,
  hasCompleteLeadgenOutreach,
} from '#lib/leadgen/snapshot';
import {
  findActiveLeadgenRunForUserDomain,
  LeadgenRunNoLongerRetryableError,
  retryFailedLeadgenRunForUser,
  startLeadgenRunForUser,
} from '#lib/leadgen/runs';
import { buildLeadgenLeadOrderUpdate } from '#lib/leadgen/order-update';
import { config } from '#lib/env';
import { createLogger } from '#lib/logger';
import {
  generateLeadgenLeadOutreach,
  persistLeadgenEvent,
} from '../../services/leadgen/outreach.service';
import { protectedProcedure } from '../base';
import { createContractTRPCRouter } from '../contract';
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
      const activeRun = await findActiveLeadgenRunForUserDomain({
        userId: ctx.user.id,
        domain: input.domain,
      });

      if (activeRun) {
        return await getLeadgenRunSnapshotForUser({
          runId: activeRun.id,
          userId: ctx.user.id,
        });
      }

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
      });

      return await getLeadgenRunSnapshotForUser({
        runId: run.id,
        userId: ctx.user.id,
      });
    }),

  retryRun: protectedProcedure
    .input(leadgenContract.retryRun.input)
    .output(leadgenContract.retryRun.output)
    .mutation(async ({ input, ctx }) => {
      const run = await getLeadgenRunForUser({
        runId: input.runId,
        userId: ctx.user.id,
      });

      if (run.status !== 'FAILED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only failed buyer searches can be retried.',
        });
      }

      await assertUserCanSpendGenerationCredits({
        userId: ctx.user.id,
        requestedCredits: getLeadgenRunCreditEstimate({
          creditCosts: config.AI_GENERATION_CREDIT_COSTS,
          reasoningEffort: run.reasoningEffort,
          model: getLeadgenPrimaryResearchModel(run.reasoningEffort),
        }),
      });

      try {
        const retriedRun = await retryFailedLeadgenRunForUser({
          runId: run.id,
          userId: ctx.user.id,
        });

        return await getLeadgenRunSnapshotForUser({
          runId: retriedRun.id,
          userId: ctx.user.id,
        });
      } catch (error) {
        if (error instanceof LeadgenRunNoLongerRetryableError) {
          throw new TRPCError({
            code: 'CONFLICT',
            message:
              'This buyer search is already retrying or no longer failed.',
            cause: error,
          });
        }

        logger.error(
          { error, runId: run.id, userId: ctx.user.id },
          'Failed to retry leadgen run',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            'Could not retry the buyer search. Try again in a few minutes.',
          cause: error,
        });
      }
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
        model: getLeadgenContactModel(run.reasoningEffort),
      });
      const lead = await getLeadgenLeadSnapshotForRun({
        runId: run.id,
        leadId: input.leadId,
      });

      if (!lead) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Lead not found for this run',
        });
      }

      if (hasCompleteLeadgenOutreach(lead)) {
        return await getLeadgenRunSnapshotForUser({
          runId: run.id,
          userId: ctx.user.id,
        });
      }

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

  setLeadUserSignal: protectedProcedure
    .input(leadgenContract.setLeadUserSignal.input)
    .output(leadgenContract.setLeadUserSignal.output)
    .mutation(async ({ input, ctx }) => {
      const run = await getLeadgenRunForUser({
        runId: input.runId,
        userId: ctx.user.id,
      });

      const [lead] = await db
        .select({ id: leadgenLeadsTable.id })
        .from(leadgenLeadsTable)
        .where(
          and(
            eq(leadgenLeadsTable.id, input.leadId),
            eq(leadgenLeadsTable.runId, run.id),
          ),
        )
        .limit(1);

      if (!lead) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Leadgen prospect not found',
        });
      }

      await persistLeadgenUserSignal({
        leadId: lead.id,
        state: input.state,
        userId: ctx.user.id,
      });

      return {
        runId: run.id,
        leadId: lead.id,
        state: input.state,
      };
    }),

  setLeadOrder: protectedProcedure
    .input(leadgenContract.setLeadOrder.input)
    .output(leadgenContract.setLeadOrder.output)
    .mutation(async ({ input, ctx }) => {
      const run = await getLeadgenRunForUser({
        runId: input.runId,
        userId: ctx.user.id,
      });
      const agentOrderedLeadIds = await getLeadgenAgentOrderedLeadIds(run.id);
      const { signalUpdates, userLeadOrder } = buildLeadgenLeadOrderUpdate({
        agentOrderedLeadIds,
        requestedLeadIds: input.leadIds,
        signalUpdates: input.signalUpdates,
      });

      await db.transaction(async (tx) => {
        await tx
          .update(leadgenRunsTable)
          .set({
            userLeadOrder,
            updatedAt: new Date(),
          })
          .where(eq(leadgenRunsTable.id, run.id));

        for (const update of signalUpdates) {
          await persistLeadgenUserSignal(
            {
              leadId: update.leadId,
              state: update.state,
              userId: ctx.user.id,
            },
            tx,
          );
        }
      });

      return await getLeadgenRunSnapshotForUser({
        runId: run.id,
        userId: ctx.user.id,
      });
    }),

  listRuns: protectedProcedure
    .input(leadgenContract.listRuns.input)
    .output(leadgenContract.listRuns.output)
    .query(async ({ input, ctx }) => {
      const runs = await db
        .select({
          id: leadgenRunsTable.id,
          domain: leadgenRunsTable.domain,
          status: leadgenRunsTable.status,
          reasoningEffort: leadgenRunsTable.reasoningEffort,
          startedAt: leadgenRunsTable.startedAt,
          finishedAt: leadgenRunsTable.finishedAt,
          errorMessage: leadgenRunsTable.errorMessage,
          createdAt: leadgenRunsTable.createdAt,
          updatedAt: leadgenRunsTable.updatedAt,
        })
        .from(leadgenRunsTable)
        .where(eq(leadgenRunsTable.userId, ctx.user.id))
        .orderBy(desc(leadgenRunsTable.createdAt), desc(leadgenRunsTable.id))
        .limit(input.limit);
      const countsByRunId = await getLeadgenRunCountsByRunId(
        runs.map((run) => run.id),
      );

      return runs.map((run) => {
        const counts = countsByRunId.get(run.id) ?? {
          leadCount: 0,
          contactCount: 0,
          draftCount: 0,
        };

        return {
          ...run,
          ...counts,
          summary: deriveLeadgenRunSummary({
            status: run.status,
            ...counts,
          }),
        };
      });
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

async function persistLeadgenUserSignal(
  params: {
    leadId: string;
    state: LeadgenUserSignalState;
    userId: string;
  },
  database: Pick<typeof db, 'insert'> = db,
) {
  const now = new Date();
  const signalType = leadgenUserSignalTypeByState[params.state];
  const evidenceSnippet = leadgenUserSignalEvidenceByState[params.state];

  const [signal] = await database
    .insert(leadgenLeadSignalsTable)
    .values({
      leadId: params.leadId,
      recipe: LEADGEN_USER_SIGNAL_RECIPE,
      signalType,
      query: LEADGEN_USER_SIGNAL_RECIPE,
      evidenceUrl: null,
      evidenceSnippet,
      metadata: {
        source: 'outbound-prospect-organizer',
        state: params.state,
        userId: params.userId,
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
        query: LEADGEN_USER_SIGNAL_RECIPE,
        evidenceUrl: null,
        metadata: {
          source: 'outbound-prospect-organizer',
          state: params.state,
          userId: params.userId,
        },
        updatedAt: now,
      },
    })
    .returning({
      id: leadgenLeadSignalsTable.id,
      leadId: leadgenLeadSignalsTable.leadId,
      signalType: leadgenLeadSignalsTable.signalType,
      evidenceUrl: leadgenLeadSignalsTable.evidenceUrl,
      evidenceSnippet: leadgenLeadSignalsTable.evidenceSnippet,
      createdAt: leadgenLeadSignalsTable.createdAt,
      updatedAt: leadgenLeadSignalsTable.updatedAt,
    });

  if (!signal) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Could not save prospect signal',
    });
  }

  return signal;
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
