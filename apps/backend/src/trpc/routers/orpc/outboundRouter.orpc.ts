import {
  leadgenReasoningEffortSchema,
  leadgenRunStatusSchema,
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
  leadgenContactsTable,
  leadgenEmailDraftsTable,
  leadgenEventsTable,
  leadgenLeadsTable,
  leadgenRunsTable,
} from '@namefi-astra/db';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { asc, and, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

import { config } from '#lib/env';
import { getLeadgenLeadPriorityOrder } from '#lib/leadgen/ordering';
import {
  findActiveLeadgenRunForUserDomain,
  startLeadgenRunForUser,
} from '#lib/leadgen/runs';
import {
  deriveLeadgenRunSummary,
  getLeadgenLeadSnapshotForRun,
  getLeadgenRunCountsByRunId,
  hasCompleteLeadgenOutreach,
} from '#lib/leadgen/snapshot';
import { createLogger } from '#lib/logger';
import {
  createOutboundApiError,
  type OutboundApiErrorCode,
} from '#lib/outbound/errors';
import {
  decodeOutboundCursor,
  encodeOutboundCursor,
  outboundCursorSchema,
  outboundLimitSchema,
  paginateOutboundRows,
} from '#lib/outbound/pagination';
import {
  serializeOutboundLeadDetail,
  serializeOutboundRun,
  type OutboundContactSource,
  type OutboundDraftSource,
  type OutboundLeadSource,
  type OutboundRunSource,
} from '#lib/outbound/serialization';
import {
  generateLeadgenLeadOutreach,
  persistLeadgenEvent,
} from '../../../services/leadgen/outreach.service';
import { createTRPCRouter, protectedProcedure } from '../../base';
import { assertUserCanSpendGenerationCredits } from '../aiRouter';

const logger = createLogger({ module: 'outbound-api-router' });

type LeadAssets = {
  contacts: OutboundContactSource[];
  drafts: OutboundDraftSource[];
};
type OutboundRunRecord = Omit<
  OutboundRunSource,
  'leadCount' | 'contactCount' | 'draftCount' | 'summary'
>;

const outboundRunSchema = z.object({
  id: z.string().uuid(),
  domain: namefiNormalizedDomainSchema,
  status: leadgenRunStatusSchema,
  reasoningEffort: leadgenReasoningEffortSchema,
  leadCount: z.number().int().min(0),
  contactCount: z.number().int().min(0),
  draftCount: z.number().int().min(0),
  summary: z.string().nullable(),
  latestMessage: z.string().nullable(),
  errorMessage: z.string().nullable(),
  pollAfterSeconds: z.number().int().positive().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  startedAt: z.date().nullable(),
  finishedAt: z.date().nullable(),
});

const outboundLeadSummarySchema = z.object({
  id: z.string().uuid(),
  businessDomain: z.string().min(1),
  buyerSummary: z.string().nullable(),
  contactCount: z.number().int().min(0),
  draftCount: z.number().int().min(0),
});

const outboundLeadDetailSchema = outboundLeadSummarySchema.extend({
  rationale: z.string().nullable(),
  content: z.string().nullable(),
  contacts: z.array(
    z.object({
      email: z.string().nullable(),
      name: z.string().nullable(),
      title: z.string().nullable(),
      sourceUrl: z.string().nullable(),
      context: z.string().nullable(),
    }),
  ),
  drafts: z.array(
    z.object({
      contactEmail: z.string().nullable(),
      subject: z.string().nullable(),
      fullEmail: z.string().nullable(),
    }),
  ),
});

const outboundPaginationObjectSchema = z.object({
  cursor: outboundCursorSchema,
  limit: outboundLimitSchema,
});

const outboundPaginationInputSchema = outboundPaginationObjectSchema.default({
  limit: 20,
});

const outboundPaginatedRunsSchema = z.object({
  items: z.array(outboundRunSchema),
  nextCursor: z.string().nullable(),
});

const outboundPaginatedLeadsSchema = z.object({
  items: z.array(outboundLeadDetailSchema),
  nextCursor: z.string().nullable(),
});

const startOutboundRunInputSchema = z
  .object({
    domain: namefiNormalizedDomainSchema.describe(
      'Domain you own on Namefi and want to use as the outbound offer.',
    ),
    reasoningEffort: leadgenReasoningEffortSchema
      .default('medium')
      .describe('How much research depth to spend on lead discovery.'),
  })
  .strict();

const runIdInputSchema = z.object({
  runId: z.string().uuid(),
});

const leadIdInputSchema = runIdInputSchema.extend({
  leadId: z.string().uuid(),
});

export const outboundRouterOrpc = createTRPCRouter({
  listRuns: protectedProcedure
    .meta({
      route: {
        path: '/outbound/runs',
        method: 'GET',
        tags: ['outbound'],
        operationId: 'listOutboundRuns',
        summary: 'List outbound lead-finding runs',
        description:
          "List the authenticated user's outbound lead-finding runs, newest first. Use this to resume recent work before starting a new run.",
      },
    })
    .input(outboundPaginationInputSchema)
    .output(outboundPaginatedRunsSchema)
    .query(async ({ input, ctx }) => {
      const offset = decodeOutboundCursorOrThrow(input.cursor);
      const rows = await db
        .select(selectOutboundRunFields)
        .from(leadgenRunsTable)
        .where(eq(leadgenRunsTable.userId, ctx.user.id))
        .orderBy(desc(leadgenRunsTable.createdAt), desc(leadgenRunsTable.id))
        .limit(input.limit + 1)
        .offset(offset);
      const rowsWithCounts = await attachOutboundRunCounts(rows);

      return paginateOutboundRows(
        rowsWithCounts.map((run) => serializeOutboundRun({ run })),
        input,
      );
    }),

  startRun: protectedProcedure
    .meta({
      route: {
        path: '/outbound/runs',
        method: 'POST',
        tags: ['outbound'],
        operationId: 'startOutboundRun',
        summary: 'Start an outbound lead-finding run',
        description:
          'Start lead discovery for a domain. If an active run already exists for the same domain, the existing run is returned instead of creating duplicate work.',
      },
    })
    .input(startOutboundRunInputSchema)
    .output(outboundRunSchema)
    .mutation(async ({ input, ctx }) => {
      const activeRun = await findActiveLeadgenRunForUserDomain({
        userId: ctx.user.id,
        domain: input.domain,
      });

      if (activeRun) {
        return serializeOutboundRun({
          run: await attachOutboundRunCount(activeRun),
          latestMessage: await getLatestPublicRunMessage(activeRun.id),
        });
      }

      await assertOutboundCreditsAvailable({
        userId: ctx.user.id,
        requestedCredits: getLeadgenRunCreditEstimate({
          creditCosts: config.AI_GENERATION_CREDIT_COSTS,
          reasoningEffort: input.reasoningEffort,
          model: getLeadgenPrimaryResearchModel(input.reasoningEffort),
        }),
      });

      try {
        const run = await startLeadgenRunForUser({
          userId: ctx.user.id,
          domain: input.domain,
          reasoningEffort: input.reasoningEffort,
          source: 'outbound-api',
          metadata: {
            source: 'outbound-api',
            requestId: ctx.honoVars?.requestId ?? null,
          },
        });

        if (run.status === 'FAILED') {
          throwOutboundError({
            code: 'OUTBOUND_TEMPORARILY_UNAVAILABLE',
            trpcCode: 'INTERNAL_SERVER_ERROR',
            message:
              'Could not start the outbound lead-finding run. Try again in a few minutes.',
            retryable: true,
            details: {
              runId: run.id,
              errorMessage: run.errorMessage,
            },
          });
        }

        return serializeOutboundRun({
          run: await attachOutboundRunCount(run),
          latestMessage: await getLatestPublicRunMessage(run.id),
        });
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        logger.error(
          { error, userId: ctx.user.id, domain: input.domain },
          'Failed to start outbound lead-finding run',
        );
        throwOutboundError({
          code: 'OUTBOUND_TEMPORARILY_UNAVAILABLE',
          trpcCode: 'INTERNAL_SERVER_ERROR',
          message:
            'Could not start the outbound lead-finding run. Try again in a few minutes.',
          retryable: true,
        });
      }
    }),

  getRun: protectedProcedure
    .meta({
      route: {
        path: '/outbound/runs/{runId}',
        method: 'GET',
        tags: ['outbound'],
        operationId: 'getOutboundRun',
        summary: 'Get outbound run status',
        description:
          'Get the current status and aggregate counts for one outbound lead-finding run. Poll using pollAfterSeconds while status is QUEUED or RUNNING.',
      },
    })
    .input(runIdInputSchema)
    .output(outboundRunSchema)
    .query(async ({ input, ctx }) => {
      const run = await getOutboundRunForUser({
        runId: input.runId,
        userId: ctx.user.id,
      });

      return serializeOutboundRun({
        run,
        latestMessage: await getLatestPublicRunMessage(run.id),
      });
    }),

  listLeads: protectedProcedure
    .meta({
      route: {
        path: '/outbound/runs/{runId}/leads',
        method: 'GET',
        tags: ['outbound'],
        operationId: 'listOutboundLeads',
        summary: 'List outbound leads',
        description:
          'List discovered leads for a run in ranked order with public rationale, contacts, and generated outreach drafts when available. The ranking is represented by response order; internal score and rank fields are intentionally not exposed.',
      },
    })
    .input(runIdInputSchema.merge(outboundPaginationObjectSchema))
    .output(outboundPaginatedLeadsSchema)
    .query(async ({ input, ctx }) => {
      const offset = decodeOutboundCursorOrThrow(input.cursor);
      const run = await getOutboundRunRecordForUser({
        runId: input.runId,
        userId: ctx.user.id,
      });
      const leads = await db
        .select(selectOutboundLeadFields)
        .from(leadgenLeadsTable)
        .where(eq(leadgenLeadsTable.runId, run.id))
        .orderBy(
          getLeadgenLeadPriorityOrder(),
          desc(leadgenLeadsTable.score),
          asc(leadgenLeadsTable.createdAt),
          asc(leadgenLeadsTable.id),
        )
        .limit(input.limit + 1)
        .offset(offset);
      const pageLeads = leads.slice(0, input.limit);
      // Lead assets are loaded after page selection, so this route computes
      // nextCursor locally instead of using the generic row paginator.
      const { contacts, drafts } = await listLeadAssetsForLeads({
        runId: run.id,
        leads: pageLeads,
      });
      const leadAssets = groupLeadAssets({
        leads: pageLeads,
        contacts,
        drafts,
      });

      return {
        items: pageLeads.map((lead) => {
          const assets = leadAssets.get(lead.id) ?? {
            contacts: [],
            drafts: [],
          };

          return serializeOutboundLeadDetail({
            lead,
            contacts: assets.contacts,
            drafts: assets.drafts,
          });
        }),
        nextCursor:
          leads.length > input.limit
            ? encodeOutboundCursor(offset + input.limit)
            : null,
      };
    }),

  prepareOutreach: protectedProcedure
    .meta({
      route: {
        path: '/outbound/runs/{runId}/leads/{leadId}/outreach',
        method: 'POST',
        tags: ['outbound'],
        operationId: 'prepareOutboundOutreach',
        summary: 'Prepare outreach for an outbound lead',
        description:
          'Generate contact research and an outreach email draft for a lead. Existing drafts are returned without spending additional generation credits.',
      },
    })
    .input(leadIdInputSchema)
    .output(outboundLeadDetailSchema)
    .mutation(async ({ input, ctx }) => {
      const existingDetail = await getOutboundLeadDetailForUser({
        runId: input.runId,
        leadId: input.leadId,
        userId: ctx.user.id,
      });

      if (hasCompleteLeadgenOutreach(existingDetail)) {
        return existingDetail;
      }

      const run = await getOutboundRunRecordForUser({
        runId: input.runId,
        userId: ctx.user.id,
      });
      const estimatedCredits = getLeadgenOutreachCreditEstimate({
        creditCosts: config.AI_GENERATION_CREDIT_COSTS,
        reasoningEffort: run.reasoningEffort,
        model: getLeadgenContactModel(run.reasoningEffort),
      });

      await assertOutboundCreditsAvailable({
        userId: ctx.user.id,
        requestedCredits: estimatedCredits,
      });

      try {
        await generateLeadgenLeadOutreach({
          runId: run.id,
          leadId: input.leadId,
          sourceDomain: run.domain,
          reasoningEffort: run.reasoningEffort,
        });

        try {
          await persistLeadgenEvent({
            runId: run.id,
            eventType: 'credit-estimate',
            stage: 'credits',
            payload: {
              operation: 'leadgen-outreach',
              leadId: input.leadId,
              estimatedCredits,
              source: 'outbound-api',
            },
          });
        } catch (error) {
          logger.warn(
            { error, runId: run.id, leadId: input.leadId, estimatedCredits },
            'Failed to persist outbound outreach credit estimate',
          );
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        logger.error(
          { error, runId: run.id, leadId: input.leadId },
          'Failed to prepare outbound lead outreach',
        );
        throwOutboundError({
          code: 'OUTBOUND_TEMPORARILY_UNAVAILABLE',
          trpcCode: 'INTERNAL_SERVER_ERROR',
          message:
            'Could not prepare outreach for this lead. Try again in a few minutes.',
          retryable: true,
        });
      }

      return getOutboundLeadDetailForUser({
        runId: input.runId,
        leadId: input.leadId,
        userId: ctx.user.id,
      });
    }),
});

const selectOutboundRunFields = {
  id: leadgenRunsTable.id,
  domain: leadgenRunsTable.domain,
  status: leadgenRunsTable.status,
  reasoningEffort: leadgenRunsTable.reasoningEffort,
  startedAt: leadgenRunsTable.startedAt,
  finishedAt: leadgenRunsTable.finishedAt,
  errorMessage: leadgenRunsTable.errorMessage,
  createdAt: leadgenRunsTable.createdAt,
  updatedAt: leadgenRunsTable.updatedAt,
};

const selectOutboundLeadFields = {
  id: leadgenLeadsTable.id,
  businessDomain: leadgenLeadsTable.businessDomain,
  rationale: leadgenLeadsTable.rationale,
  content: leadgenLeadsTable.content,
};

const selectOutboundContactFields = {
  leadId: leadgenContactsTable.leadId,
  email: leadgenContactsTable.email,
  name: leadgenContactsTable.name,
  title: leadgenContactsTable.title,
  sourceUrl: leadgenContactsTable.sourceUrl,
  context: leadgenContactsTable.context,
};

const selectOutboundDraftFields = {
  leadId: leadgenContactsTable.leadId,
  contactEmail: leadgenContactsTable.email,
  subject: leadgenEmailDraftsTable.subject,
  fullEmail: leadgenEmailDraftsTable.fullEmail,
};

async function getOutboundRunForUser(params: {
  runId: string;
  userId: string;
}): Promise<OutboundRunSource> {
  return await attachOutboundRunCount(
    await getOutboundRunRecordForUser(params),
  );
}

async function getOutboundRunRecordForUser(params: {
  runId: string;
  userId: string;
}): Promise<OutboundRunRecord> {
  const [run] = await db
    .select(selectOutboundRunFields)
    .from(leadgenRunsTable)
    .where(
      and(
        eq(leadgenRunsTable.id, params.runId),
        eq(leadgenRunsTable.userId, params.userId),
      ),
    )
    .limit(1);

  if (!run) {
    throwOutboundError({
      code: 'OUTBOUND_NOT_FOUND',
      trpcCode: 'NOT_FOUND',
      message:
        'Outbound run not found. Check the runId and make sure it belongs to the authenticated user.',
      details: { runId: params.runId },
    });
  }

  return run;
}

async function attachOutboundRunCount<
  T extends { id: string; status: OutboundRunSource['status'] },
>(
  run: T,
): Promise<
  T &
    Pick<
      OutboundRunSource,
      'leadCount' | 'contactCount' | 'draftCount' | 'summary'
    >
> {
  const [runWithCounts] = await attachOutboundRunCounts([run]);
  if (!runWithCounts) {
    return {
      ...run,
      leadCount: 0,
      contactCount: 0,
      draftCount: 0,
      summary: null,
    };
  }

  return runWithCounts;
}

async function attachOutboundRunCounts<
  T extends { id: string; status: OutboundRunSource['status'] },
>(
  runs: T[],
): Promise<
  Array<
    T &
      Pick<
        OutboundRunSource,
        'leadCount' | 'contactCount' | 'draftCount' | 'summary'
      >
  >
> {
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
}

async function getLatestPublicRunMessage(
  runId: string,
): Promise<string | null> {
  const events = await db
    .select({
      eventType: leadgenEventsTable.eventType,
      message: leadgenEventsTable.message,
    })
    .from(leadgenEventsTable)
    .where(eq(leadgenEventsTable.runId, runId))
    .orderBy(desc(leadgenEventsTable.createdAt))
    .limit(25);

  // latestMessage can surface transient progress, but error details stay internal.
  const event = events.find((item) => {
    const message = item.message?.trim();
    return !!message && item.eventType !== 'error';
  });

  return event?.message ?? null;
}

async function getOutboundLeadDetailForUser(params: {
  runId: string;
  leadId: string;
  userId: string;
}) {
  await getOutboundRunRecordForUser({
    runId: params.runId,
    userId: params.userId,
  });

  const lead = await getLeadgenLeadSnapshotForRun({
    runId: params.runId,
    leadId: params.leadId,
  });

  if (!lead) {
    throwOutboundError({
      code: 'OUTBOUND_NOT_FOUND',
      trpcCode: 'NOT_FOUND',
      message:
        'Outbound lead not found. Check the leadId and make sure it belongs to the run.',
      details: { runId: params.runId, leadId: params.leadId },
    });
  }

  return serializeOutboundLeadDetail({
    lead,
    contacts: lead.contacts.map((contact) => ({
      email: contact.email,
      name: contact.name,
      title: contact.title,
      sourceUrl: contact.sourceUrl,
      context: contact.context,
    })),
    drafts: lead.drafts.map((draft) => ({
      contactEmail: draft.contactEmail,
      subject: draft.subject,
      fullEmail: draft.fullEmail,
    })),
  });
}

async function listLeadAssetsForLeads({
  runId,
  leads,
}: {
  runId: string;
  leads: OutboundLeadSource[];
}) {
  const leadIds = leads.map((lead) => lead.id);
  if (leadIds.length === 0) {
    return { contacts: [], drafts: [] };
  }

  const [contacts, drafts] = await Promise.all([
    db
      .select(selectOutboundContactFields)
      .from(leadgenContactsTable)
      .innerJoin(
        leadgenLeadsTable,
        eq(leadgenContactsTable.leadId, leadgenLeadsTable.id),
      )
      .where(
        and(
          eq(leadgenLeadsTable.runId, runId),
          inArray(leadgenContactsTable.leadId, leadIds),
        ),
      ),
    db
      .select(selectOutboundDraftFields)
      .from(leadgenEmailDraftsTable)
      .innerJoin(
        leadgenContactsTable,
        eq(leadgenEmailDraftsTable.contactId, leadgenContactsTable.id),
      )
      .innerJoin(
        leadgenLeadsTable,
        eq(leadgenContactsTable.leadId, leadgenLeadsTable.id),
      )
      .where(
        and(
          eq(leadgenLeadsTable.runId, runId),
          inArray(leadgenContactsTable.leadId, leadIds),
        ),
      ),
  ]);

  return { contacts, drafts };
}

function groupLeadAssets({
  leads,
  contacts,
  drafts,
}: {
  leads: OutboundLeadSource[];
  contacts: Array<{ leadId: string } & OutboundContactSource>;
  drafts: Array<{ leadId: string } & OutboundDraftSource>;
}): Map<string, LeadAssets> {
  const assetsByLeadId = new Map<string, LeadAssets>(
    leads.map((lead) => [lead.id, { contacts: [], drafts: [] }]),
  );

  for (const contact of contacts) {
    const assets = assetsByLeadId.get(contact.leadId);

    if (assets) {
      assets.contacts.push({
        email: contact.email,
        name: contact.name,
        title: contact.title,
        sourceUrl: contact.sourceUrl,
        context: contact.context,
      });
    }
  }

  for (const draft of drafts) {
    const assets = assetsByLeadId.get(draft.leadId);

    if (assets) {
      assets.drafts.push({
        contactEmail: draft.contactEmail,
        subject: draft.subject,
        fullEmail: draft.fullEmail,
      });
    }
  }

  return assetsByLeadId;
}

function decodeOutboundCursorOrThrow(cursor: string | undefined): number {
  try {
    return decodeOutboundCursor(cursor);
  } catch {
    throwOutboundError({
      code: 'OUTBOUND_BAD_REQUEST',
      trpcCode: 'BAD_REQUEST',
      message:
        'Invalid cursor. Use the opaque nextCursor value returned by the previous list response.',
      details: { cursorLength: cursor?.length ?? 0 },
    });
  }
}

async function assertOutboundCreditsAvailable(params: {
  requestedCredits: number;
  userId: string;
}) {
  try {
    await assertUserCanSpendGenerationCredits(params);
  } catch (error) {
    if (
      error instanceof TRPCError &&
      error.code === 'FORBIDDEN' &&
      error.message.includes('AI credit')
    ) {
      throwOutboundError({
        code: 'OUTBOUND_PAYMENT_REQUIRED',
        trpcCode: 'PAYMENT_REQUIRED',
        message: error.message,
        details: { requestedCredits: params.requestedCredits },
      });
    }

    throw error;
  }
}

function throwOutboundError(params: {
  code: OutboundApiErrorCode;
  trpcCode: Parameters<typeof createOutboundApiError>[0]['trpcCode'];
  message: string;
  retryable?: boolean;
  details?: Record<string, unknown>;
}): never {
  throw createOutboundApiError(params);
}
