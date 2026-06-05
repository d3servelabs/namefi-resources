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
import {
  namefiNormalizedDomainSchema,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { asc, and, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

import { config } from '#lib/env';
import { startLeadgenRunForUser } from '#lib/leadgen/runs';
import { createLogger } from '#lib/logger';
import {
  createOutboundApiError,
  type OutboundApiErrorCode,
} from '#lib/outbound/errors';
import {
  decodeOutboundCursor,
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
import { getLeadgenRunSnapshotForUser } from '../leadgenRouter';

const logger = createLogger({ module: 'outbound-api-router' });

type LeadAssets = {
  contacts: OutboundContactSource[];
  drafts: OutboundDraftSource[];
};

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

      return paginateOutboundRows(
        rows.map((run) => serializeOutboundRun({ run })),
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
      const activeRun = await findActiveRunForDomain({
        userId: ctx.user.id,
        domain: input.domain,
      });

      if (activeRun) {
        return serializeOutboundRun({
          run: activeRun,
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
          run,
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
      const run = await getOutboundRunForUser({
        runId: input.runId,
        userId: ctx.user.id,
      });
      const leads = await db
        .select(selectOutboundLeadFields)
        .from(leadgenLeadsTable)
        .where(eq(leadgenLeadsTable.runId, run.id))
        .orderBy(
          asc(leadgenLeadsTable.rank),
          desc(leadgenLeadsTable.score),
          asc(leadgenLeadsTable.createdAt),
          asc(leadgenLeadsTable.id),
        )
        .limit(input.limit + 1)
        .offset(offset);
      const pageLeads = leads.slice(0, input.limit);
      const { contacts, drafts } = await listLeadAssetsForLeads({
        runId: run.id,
        leads: pageLeads,
      });
      const leadAssets = groupLeadAssets({ leads, contacts, drafts });

      return paginateOutboundRows(
        leads.map((lead) => {
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
        input,
      );
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

      if (existingDetail.drafts.length > 0) {
        return existingDetail;
      }

      const run = await getOutboundRunForUser({
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
  summary: leadgenRunsTable.summary,
  leadCount: leadgenRunsTable.leadCount,
  contactCount: leadgenRunsTable.contactCount,
  draftCount: leadgenRunsTable.draftCount,
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
  businessDomain: leadgenContactsTable.businessDomain,
  email: leadgenContactsTable.email,
  name: leadgenContactsTable.name,
  title: leadgenContactsTable.title,
  sourceUrl: leadgenContactsTable.sourceUrl,
  context: leadgenContactsTable.context,
};

const selectOutboundDraftFields = {
  leadId: leadgenEmailDraftsTable.leadId,
  businessDomain: leadgenEmailDraftsTable.businessDomain,
  contactEmail: leadgenEmailDraftsTable.contactEmail,
  subject: leadgenEmailDraftsTable.subject,
  fullEmail: leadgenEmailDraftsTable.fullEmail,
};

async function findActiveRunForDomain(params: {
  userId: string;
  domain: NamefiNormalizedDomain;
}): Promise<OutboundRunSource | null> {
  const [run] = await db
    .select(selectOutboundRunFields)
    .from(leadgenRunsTable)
    .where(
      and(
        eq(leadgenRunsTable.userId, params.userId),
        eq(leadgenRunsTable.domain, params.domain),
        inArray(leadgenRunsTable.status, ['QUEUED', 'RUNNING']),
      ),
    )
    .orderBy(desc(leadgenRunsTable.createdAt), desc(leadgenRunsTable.id))
    .limit(1);

  return run ?? null;
}

async function getOutboundRunForUser(params: {
  runId: string;
  userId: string;
}): Promise<OutboundRunSource> {
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

async function getLatestPublicRunMessage(
  runId: string,
): Promise<string | null> {
  const events = await db
    .select({
      eventType: leadgenEventsTable.eventType,
      message: leadgenEventsTable.message,
      transient: leadgenEventsTable.transient,
    })
    .from(leadgenEventsTable)
    .where(eq(leadgenEventsTable.runId, runId))
    .orderBy(desc(leadgenEventsTable.createdAt))
    .limit(25);

  const event = events.find((item) => {
    const message = item.message?.trim();
    return !!message && !item.transient && item.eventType !== 'error';
  });

  return event?.message ?? null;
}

async function getOutboundLeadDetailForUser(params: {
  runId: string;
  leadId: string;
  userId: string;
}) {
  await getOutboundRunForUser({
    runId: params.runId,
    userId: params.userId,
  });

  const snapshot = await getLeadgenRunSnapshotForUser(params);
  const lead = snapshot.leads.find((item) => item.id === params.leadId);

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
  const businessDomains = [
    ...new Set(leads.map((lead) => lead.businessDomain)),
  ];
  if (businessDomains.length === 0) {
    return { contacts: [], drafts: [] };
  }

  const [contacts, drafts] = await Promise.all([
    db
      .select(selectOutboundContactFields)
      .from(leadgenContactsTable)
      .where(
        and(
          eq(leadgenContactsTable.runId, runId),
          inArray(leadgenContactsTable.businessDomain, businessDomains),
        ),
      ),
    db
      .select(selectOutboundDraftFields)
      .from(leadgenEmailDraftsTable)
      .where(
        and(
          eq(leadgenEmailDraftsTable.runId, runId),
          inArray(leadgenEmailDraftsTable.businessDomain, businessDomains),
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
  contacts: Array<
    { leadId: string | null; businessDomain: string } & OutboundContactSource
  >;
  drafts: Array<
    { leadId: string | null; businessDomain: string } & OutboundDraftSource
  >;
}): Map<string, LeadAssets> {
  const assetsByLeadId = new Map(
    leads.map((lead) => [lead.id, { contacts: [], drafts: [] }]),
  );
  const leadIds = new Set(leads.map((lead) => lead.id));
  const leadIdByDomain = new Map(
    leads.map((lead) => [lead.businessDomain, lead.id]),
  );

  for (const contact of contacts) {
    const assets = getLeadAssets({
      asset: contact,
      assetsByLeadId,
      leadIds,
      leadIdByDomain,
    });

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
    const assets = getLeadAssets({
      asset: draft,
      assetsByLeadId,
      leadIds,
      leadIdByDomain,
    });

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

function getLeadAssets({
  asset,
  assetsByLeadId,
  leadIds,
  leadIdByDomain,
}: {
  asset: { leadId: string | null; businessDomain: string };
  assetsByLeadId: Map<string, LeadAssets>;
  leadIds: Set<string>;
  leadIdByDomain: Map<string, string>;
}): LeadAssets | undefined {
  const leadId =
    asset.leadId && leadIds.has(asset.leadId)
      ? asset.leadId
      : leadIdByDomain.get(asset.businessDomain);

  return leadId ? assetsByLeadId.get(leadId) : undefined;
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
