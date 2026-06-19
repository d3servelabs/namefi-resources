import { randomUUID } from 'node:crypto';
import { adminNamefiFeedContract } from '@namefi-astra/common/contract/admin/admin-namefi-feed-contract';
import { Permission } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { ResourceType } from '#lib/auditor';
import { secrets } from '#lib/env';
import { temporalClient } from '#temporal/client';
import { TEMPORAL_QUEUES } from '#temporal/shared/enums';
import { namefiFeedSalesDigestWorkflow } from '#temporal/workflows/namefi-feed-digest.workflow';
import { namefiFeedIngestionWorkflow } from '#temporal/workflows/namefi-feed-ingestion.workflow';
import {
  getNamefiFeedAdminOverview,
  listNamefiFeedAdminDigestDeliveries,
  listNamefiFeedAdminDigestRuns,
  listNamefiFeedAdminListings,
  listNamefiFeedAdminPosts,
  listNamefiFeedAdminReports,
  listNamefiFeedAdminRuns,
  updateNamefiFeedSettings,
} from '../../../services/namefi-feed/admin.service';
import { resolveNamefiFeedSalesDigestRunAt } from '../../../services/namefi-feed/digest.service';
import {
  createNamefiFeedSalesDigestTarget,
  deleteNamefiFeedSalesDigestTarget,
  SalesDigestTargetInputError,
  updateNamefiFeedSalesDigestTarget,
} from '../../../services/namefi-feed/digest-targets.service';
import {
  NamefiFeedListingConflictError,
  NamefiFeedListingNotFoundError,
  NamefiFeedReportNotFoundError,
  resolveNamefiFeedListingReport,
  setNamefiFeedListingSuppressed,
} from '../../../services/namefi-feed/listings.service';
import {
  adminProcedureWithPermissions,
  auditedAdminProcedureWithPermissions,
} from '../../base';
import { createContractTRPCRouter } from '../../contract';

export const namefiFeedRouter = createContractTRPCRouter<
  typeof adminNamefiFeedContract
>({
  getOverview: adminProcedureWithPermissions(Permission.READ_NAMEFI_FEED)
    .input(adminNamefiFeedContract.getOverview.input)
    .output(adminNamefiFeedContract.getOverview.output)
    .query(async () => {
      return getNamefiFeedAdminOverview(
        Boolean(secrets.NAMEFI_FEED_X_BEARER_TOKEN),
        {
          slack: Boolean(secrets.SLACK_BOT_TOKEN),
          telegram: Boolean(secrets.TELEGRAM_BOT_TOKEN),
          discord: Boolean(secrets.DISCORD_BOT_TOKEN),
        },
      );
    }),

  listRuns: adminProcedureWithPermissions(Permission.READ_NAMEFI_FEED)
    .input(adminNamefiFeedContract.listRuns.input)
    .output(adminNamefiFeedContract.listRuns.output)
    .query(async ({ input }) => listNamefiFeedAdminRuns(input)),

  listPosts: adminProcedureWithPermissions(Permission.READ_NAMEFI_FEED)
    .input(adminNamefiFeedContract.listPosts.input)
    .output(adminNamefiFeedContract.listPosts.output)
    .query(async ({ input }) => listNamefiFeedAdminPosts(input)),

  listListings: adminProcedureWithPermissions(Permission.READ_NAMEFI_FEED)
    .input(adminNamefiFeedContract.listListings.input)
    .output(adminNamefiFeedContract.listListings.output)
    .query(async ({ input }) => listNamefiFeedAdminListings(input)),

  listReports: adminProcedureWithPermissions(Permission.READ_NAMEFI_FEED)
    .input(adminNamefiFeedContract.listReports.input)
    .output(adminNamefiFeedContract.listReports.output)
    .query(async ({ input }) => listNamefiFeedAdminReports(input)),

  listDigestDeliveries: adminProcedureWithPermissions(
    Permission.READ_NAMEFI_FEED,
  )
    .input(adminNamefiFeedContract.listDigestDeliveries.input)
    .output(adminNamefiFeedContract.listDigestDeliveries.output)
    .query(async ({ input }) => listNamefiFeedAdminDigestDeliveries(input)),

  listDigestRuns: adminProcedureWithPermissions(Permission.READ_NAMEFI_FEED)
    .input(adminNamefiFeedContract.listDigestRuns.input)
    .output(adminNamefiFeedContract.listDigestRuns.output)
    .query(async ({ input }) => listNamefiFeedAdminDigestRuns(input)),

  updateSettings: auditedAdminProcedureWithPermissions(
    Permission.WRITE_NAMEFI_FEED,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.OTHER,
      resourceId: 'namefi-feed-settings',
      action: 'update_namefi_feed_settings',
      extraInput: input,
    }),
  )
    .input(adminNamefiFeedContract.updateSettings.input)
    .output(adminNamefiFeedContract.updateSettings.output)
    .mutation(async ({ input }) => {
      return updateNamefiFeedSettings(input);
    }),

  startIngestion: auditedAdminProcedureWithPermissions(
    Permission.WRITE_NAMEFI_FEED,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.WORKFLOW,
      resourceId: `namefi-feed-${input.mode}`,
      action: 'start_namefi_feed_ingestion',
      extraInput: input,
    }),
  )
    .input(adminNamefiFeedContract.startIngestion.input)
    .output(adminNamefiFeedContract.startIngestion.output)
    .mutation(async ({ ctx, input }) => {
      const workflowId = `namefi-feed-ingestion-${Date.now()}-${randomUUID()}`;
      try {
        await temporalClient.workflow.start(namefiFeedIngestionWorkflow, {
          args: [
            {
              trigger: 'manual',
              requestedByUserId: ctx.user.id,
              ...(input.mode === 'manual'
                ? {
                    tweets: input.tweets,
                    includeReplies: input.includeReplies,
                  }
                : { ignoreAutoScanEnabled: true }),
            },
          ],
          taskQueue: TEMPORAL_QUEUES.DEFAULT,
          workflowId,
          workflowIdReusePolicy: 'ALLOW_DUPLICATE',
          workflowIdConflictPolicy: 'USE_EXISTING',
        });
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to start Namefi feed ingestion.',
        });
      }

      return { workflowId };
    }),

  runDigest: auditedAdminProcedureWithPermissions(
    Permission.WRITE_NAMEFI_FEED,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.WORKFLOW,
      resourceId: 'namefi-feed-digest',
      action: 'start_namefi_feed_sales_digest',
      extraInput: input,
    }),
  )
    .input(adminNamefiFeedContract.runDigest.input)
    .output(adminNamefiFeedContract.runDigest.output)
    .mutation(async ({ ctx, input }) => {
      const workflowId = `namefi-feed-digest-${Date.now()}-${randomUUID()}`;
      const runAt = resolveNamefiFeedSalesDigestRunAt();
      try {
        await temporalClient.workflow.start(namefiFeedSalesDigestWorkflow, {
          args: [
            {
              trigger: 'manual',
              requestedByUserId: ctx.user.id,
              at: runAt.toISOString(),
              includeImage: input.includeImage,
              includeAnimation: input.includeAnimation,
              enabledOnly: input.enabledOnly,
              dryRun: input.dryRun,
              targetIds: input.targetIds,
            },
          ],
          taskQueue: TEMPORAL_QUEUES.DEFAULT,
          workflowId,
          workflowIdReusePolicy: 'ALLOW_DUPLICATE',
          workflowIdConflictPolicy: 'USE_EXISTING',
          memo: {
            at: runAt.toISOString(),
            dryRun: input.dryRun,
            enabledOnly: input.enabledOnly,
            includeAnimation: input.includeAnimation,
            includeImage: input.includeImage,
            requestedByUserId: ctx.user.id,
            targetIds: input.targetIds ?? null,
            trigger: 'manual',
          },
        });
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to start Namefi feed digest.',
        });
      }

      return { workflowId };
    }),

  createDigestTarget: auditedAdminProcedureWithPermissions(
    Permission.WRITE_NAMEFI_FEED,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.OTHER,
      resourceId: `namefi-feed-digest-target-${input.targetType}`,
      action: 'create_namefi_feed_digest_target',
      extraInput: input,
    }),
  )
    .input(adminNamefiFeedContract.createDigestTarget.input)
    .output(adminNamefiFeedContract.createDigestTarget.output)
    .mutation(async ({ ctx, input }) => {
      try {
        return await createNamefiFeedSalesDigestTarget({
          ...input,
          createdByUserId: ctx.user.id,
        });
      } catch (error) {
        throw mapNamefiFeedAdminError(
          error,
          'Failed to create Namefi feed digest target.',
        );
      }
    }),

  updateDigestTarget: auditedAdminProcedureWithPermissions(
    Permission.WRITE_NAMEFI_FEED,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.OTHER,
      resourceId: input.id,
      action: 'update_namefi_feed_digest_target',
      extraInput: input,
    }),
  )
    .input(adminNamefiFeedContract.updateDigestTarget.input)
    .output(adminNamefiFeedContract.updateDigestTarget.output)
    .mutation(async ({ input }) => {
      try {
        const updated = await updateNamefiFeedSalesDigestTarget(
          input.id,
          input,
        );
        if (!updated) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Namefi feed digest target not found.',
          });
        }
        return updated;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw mapNamefiFeedAdminError(
          error,
          'Failed to update Namefi feed digest target.',
        );
      }
    }),

  deleteDigestTarget: auditedAdminProcedureWithPermissions(
    Permission.WRITE_NAMEFI_FEED,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.OTHER,
      resourceId: input.targetId,
      action: 'delete_namefi_feed_digest_target',
      extraInput: input,
    }),
  )
    .input(adminNamefiFeedContract.deleteDigestTarget.input)
    .output(adminNamefiFeedContract.deleteDigestTarget.output)
    .mutation(async ({ input }) => {
      try {
        const deleted = await deleteNamefiFeedSalesDigestTarget(input.targetId);
        if (!deleted) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Namefi feed digest target not found.',
          });
        }

        return { id: input.targetId, deleted };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw mapNamefiFeedAdminError(
          error,
          'Failed to delete Namefi feed digest target.',
        );
      }
    }),

  setListingSuppressed: auditedAdminProcedureWithPermissions(
    Permission.WRITE_NAMEFI_FEED,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.OTHER,
      resourceId: input.listingId,
      action: input.suppressed
        ? 'suppress_namefi_feed_listing'
        : 'restore_namefi_feed_listing',
      extraInput: input,
    }),
  )
    .input(adminNamefiFeedContract.setListingSuppressed.input)
    .output(adminNamefiFeedContract.setListingSuppressed.output)
    .mutation(async ({ input }) => {
      try {
        return await setNamefiFeedListingSuppressed(input);
      } catch (error) {
        throw mapNamefiFeedAdminError(
          error,
          'Failed to update Namefi feed listing.',
        );
      }
    }),

  resolveReport: auditedAdminProcedureWithPermissions(
    Permission.WRITE_NAMEFI_FEED,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.OTHER,
      resourceId: input.reportId,
      action: 'resolve_namefi_feed_report',
      extraInput: input,
    }),
  )
    .input(adminNamefiFeedContract.resolveReport.input)
    .output(adminNamefiFeedContract.resolveReport.output)
    .mutation(async ({ input }) => {
      try {
        return await resolveNamefiFeedListingReport(input);
      } catch (error) {
        throw mapNamefiFeedAdminError(
          error,
          'Failed to resolve Namefi feed report.',
        );
      }
    }),
});

function mapNamefiFeedAdminError(error: unknown, fallbackMessage: string) {
  if (
    error instanceof NamefiFeedListingNotFoundError ||
    error instanceof NamefiFeedReportNotFoundError
  ) {
    return new TRPCError({
      code: 'NOT_FOUND',
      message: error.message,
    });
  }
  if (error instanceof NamefiFeedListingConflictError) {
    return new TRPCError({
      code: 'CONFLICT',
      message: error.message,
    });
  }
  if (error instanceof SalesDigestTargetInputError) {
    return new TRPCError({
      code: 'BAD_REQUEST',
      message: error.message,
    });
  }

  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: error instanceof Error ? error.message : fallbackMessage,
  });
}
