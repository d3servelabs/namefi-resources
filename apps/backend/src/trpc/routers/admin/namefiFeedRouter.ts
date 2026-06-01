import { randomUUID } from 'node:crypto';
import { adminNamefiFeedContract } from '@namefi-astra/common/contract/admin/admin-namefi-feed-contract';
import { Permission } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { ResourceType } from '#lib/auditor';
import { secrets } from '#lib/env';
import { temporalClient } from '#temporal/client';
import { TEMPORAL_QUEUES } from '#temporal/shared/enums';
import { namefiFeedIngestionWorkflow } from '#temporal/workflows/namefi-feed-ingestion.workflow';
import {
  getNamefiFeedAdminOverview,
  updateNamefiFeedSettings,
} from '../../../services/namefi-feed/admin.service';
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
      );
    }),

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

  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: error instanceof Error ? error.message : fallbackMessage,
  });
}
