import { db, domainExportTrackingTable } from '@namefi-astra/db';
import { Permission } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, eq, type SQL, sql } from 'drizzle-orm';
import {
  buildWhereClause,
  buildSortClause,
  type FilterOptions,
  type SortOptions,
} from '@samyx/drizzler-filters-sorters';
import {
  adminProcedureWithPermissions,
  auditedAdminProcedureWithPermissions,
} from '../../base';
import { createContractTRPCRouter } from '../../contract';
import { adminExportTrackingContract } from '@namefi-astra/common/contract/admin/admin-export-tracking-contract';
import {
  getUserIdFromOwnerAddress,
  sendPendingExportEmail,
  sendFailedExportEmail,
  sendExportCompleteEmail,
} from '#temporal/activities/domain/export-tracking.activities';
import {
  appendExportTrackingStatusHistory,
  canApproveExportTrackingStatus,
  canResolveExportTrackingStatus,
  getExportTrackingEmailType,
  type ExportTrackingStatusHistoryEntry,
} from '#temporal/activities/domain/export-tracking-state';
import { ResourceType } from '#lib/auditor';
import { logger } from '#lib/logger';

export const exportTrackingRouter = createContractTRPCRouter<
  typeof adminExportTrackingContract
>({
  /**
   * Get export tracking records with pagination and filtering.
   */
  getExportTrackingRecords: adminProcedureWithPermissions(Permission.READ_NFT)
    .input(adminExportTrackingContract.getExportTrackingRecords.input)
    .output(adminExportTrackingContract.getExportTrackingRecords.output)
    .query(async ({ input }) => {
      const { page, pageSize, filters, sorting } = input;
      const offset = (page - 1) * pageSize;

      const tableStructure = {
        id: domainExportTrackingTable.id,
        normalizedDomainName: domainExportTrackingTable.normalizedDomainName,
        chainId: domainExportTrackingTable.chainId,
        ownerAddress: domainExportTrackingTable.ownerAddress,
        status: domainExportTrackingTable.status,
        previousStatus: domainExportTrackingTable.previousStatus,
        isActive: domainExportTrackingTable.isActive,
        registrarKey: domainExportTrackingTable.registrarKey,
        statusChangedAt: domainExportTrackingTable.statusChangedAt,
        firstDetectedAt: domainExportTrackingTable.firstDetectedAt,
        lastCheckedAt: domainExportTrackingTable.lastCheckedAt,
        transferCompletedAt: domainExportTrackingTable.transferCompletedAt,
        pendingExportEmailSentAt:
          domainExportTrackingTable.pendingExportEmailSentAt,
        pendingExportEmailAttempts:
          domainExportTrackingTable.pendingExportEmailAttempts,
        failedExportEmailSentAt:
          domainExportTrackingTable.failedExportEmailSentAt,
        failedExportEmailAttempts:
          domainExportTrackingTable.failedExportEmailAttempts,
        completedExportEmailSentAt:
          domainExportTrackingTable.completedExportEmailSentAt,
        completedExportEmailAttempts:
          domainExportTrackingTable.completedExportEmailAttempts,
        latestEvidence: domainExportTrackingTable.latestEvidence,
        clientApprovedAt: domainExportTrackingTable.clientApprovedAt,
        adminVerifiedAt: domainExportTrackingTable.adminVerifiedAt,
        confirmedOutOfAccountAt:
          domainExportTrackingTable.confirmedOutOfAccountAt,
        nftBurnedAt: domainExportTrackingTable.nftBurnedAt,
        createdAt: domainExportTrackingTable.createdAt,
        updatedAt: domainExportTrackingTable.updatedAt,
      };

      const baseQuery = db
        .select({
          id: domainExportTrackingTable.id,
          normalizedDomainName: domainExportTrackingTable.normalizedDomainName,
          chainId: domainExportTrackingTable.chainId,
          ownerAddress: domainExportTrackingTable.ownerAddress,
          status: domainExportTrackingTable.status,
          previousStatus: domainExportTrackingTable.previousStatus,
          isActive: domainExportTrackingTable.isActive,
          statusHistory: domainExportTrackingTable.statusHistory,
          eppStatuses: domainExportTrackingTable.eppStatuses,
          registrarKey: domainExportTrackingTable.registrarKey,
          statusChangedAt: domainExportTrackingTable.statusChangedAt,
          firstDetectedAt: domainExportTrackingTable.firstDetectedAt,
          lastCheckedAt: domainExportTrackingTable.lastCheckedAt,
          transferCompletedAt: domainExportTrackingTable.transferCompletedAt,
          pendingExportEmailSentAt:
            domainExportTrackingTable.pendingExportEmailSentAt,
          pendingExportEmailLastAttemptAt:
            domainExportTrackingTable.pendingExportEmailLastAttemptAt,
          pendingExportEmailAttempts:
            domainExportTrackingTable.pendingExportEmailAttempts,
          pendingExportEmailLastError:
            domainExportTrackingTable.pendingExportEmailLastError,
          pendingExportEmailRecipient:
            domainExportTrackingTable.pendingExportEmailRecipient,
          failedExportEmailSentAt:
            domainExportTrackingTable.failedExportEmailSentAt,
          failedExportEmailLastAttemptAt:
            domainExportTrackingTable.failedExportEmailLastAttemptAt,
          failedExportEmailAttempts:
            domainExportTrackingTable.failedExportEmailAttempts,
          failedExportEmailLastError:
            domainExportTrackingTable.failedExportEmailLastError,
          failedExportEmailRecipient:
            domainExportTrackingTable.failedExportEmailRecipient,
          completedExportEmailSentAt:
            domainExportTrackingTable.completedExportEmailSentAt,
          completedExportEmailLastAttemptAt:
            domainExportTrackingTable.completedExportEmailLastAttemptAt,
          completedExportEmailAttempts:
            domainExportTrackingTable.completedExportEmailAttempts,
          completedExportEmailLastError:
            domainExportTrackingTable.completedExportEmailLastError,
          completedExportEmailRecipient:
            domainExportTrackingTable.completedExportEmailRecipient,
          latestEvidence: domainExportTrackingTable.latestEvidence,
          clientApprovedAt: domainExportTrackingTable.clientApprovedAt,
          verifyingAdminId: domainExportTrackingTable.verifyingAdminId,
          adminVerifiedAt: domainExportTrackingTable.adminVerifiedAt,
          confirmedOutOfAccountAt:
            domainExportTrackingTable.confirmedOutOfAccountAt,
          nftBurnedAt: domainExportTrackingTable.nftBurnedAt,
          nftBurnTxHash: domainExportTrackingTable.nftBurnTxHash,
          createdAt: domainExportTrackingTable.createdAt,
          updatedAt: domainExportTrackingTable.updatedAt,
        })
        .from(domainExportTrackingTable)
        .$dynamic();

      const whereClauses: SQL[] = [];

      if (filters) {
        const drizzlerWhere = buildWhereClause(
          tableStructure,
          filters as FilterOptions<any>,
        );
        if (drizzlerWhere) {
          whereClauses.push(drizzlerWhere);
        }
      }

      let query = baseQuery;
      if (whereClauses.length > 0) {
        query = query.where(and(...whereClauses));
      }

      const orderByClauses = sorting
        ? buildSortClause(tableStructure, sorting as SortOptions<any>)
        : [sql`${domainExportTrackingTable.statusChangedAt} DESC`];

      try {
        const countQuery = db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(domainExportTrackingTable)
          .$dynamic();

        let countQueryWithWhere = countQuery;
        if (whereClauses.length > 0) {
          countQueryWithWhere = countQuery.where(and(...whereClauses));
        }

        const [rows, countRow] = await Promise.all([
          query
            .orderBy(...orderByClauses)
            .limit(pageSize)
            .offset(offset),
          countQueryWithWhere,
        ]);

        const total = countRow[0]?.count ?? 0;

        return {
          data: rows,
          pagination: {
            page,
            pageSize,
            totalCount: total,
            totalPages: Math.ceil(total / pageSize),
          },
        };
      } catch (error) {
        logger.error({ error }, 'Failed to get export tracking records');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get export tracking records',
        });
      }
    }),

  /**
   * Admin verify an export tracking record.
   *
   * Transitions NEEDS_ADMIN_REVIEW → TRANSFER_COMPLETED (terminal),
   * sends the completion email, and flips `isActive = false` on the
   * same UPDATE. Refuses to operate on rows that are not active.
   */
  verifyExportTracking: auditedAdminProcedureWithPermissions(
    Permission.WRITE_NFT,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin' as const,
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.DOMAIN_EXPORT,
      resourceId: input.id,
      action: 'verify_export',
      extraInput: input,
    }),
  )
    .input(adminExportTrackingContract.verifyExportTracking.input)
    .output(adminExportTrackingContract.verifyExportTracking.output)
    .mutation(async ({ ctx, input }) => {
      const existingRecord = await db
        .select({
          id: domainExportTrackingTable.id,
          normalizedDomainName: domainExportTrackingTable.normalizedDomainName,
          chainId: domainExportTrackingTable.chainId,
          ownerAddress: domainExportTrackingTable.ownerAddress,
          status: domainExportTrackingTable.status,
          isActive: domainExportTrackingTable.isActive,
          statusHistory: domainExportTrackingTable.statusHistory,
          latestEvidence: domainExportTrackingTable.latestEvidence,
          completedExportEmailSentAt:
            domainExportTrackingTable.completedExportEmailSentAt,
          adminVerifiedAt: domainExportTrackingTable.adminVerifiedAt,
          nftBurnedAt: domainExportTrackingTable.nftBurnedAt,
        })
        .from(domainExportTrackingTable)
        .where(eq(domainExportTrackingTable.id, input.id))
        .limit(1);

      if (!existingRecord[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Export tracking record not found',
        });
      }

      const record = existingRecord[0];

      if (!record.isActive) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot verify a terminal (frozen) export tracking row',
        });
      }

      if (record.adminVerifiedAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Export tracking record is already verified',
        });
      }

      if (record.nftBurnedAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'NFT has already been burned for this export',
        });
      }

      if (!canApproveExportTrackingStatus(record.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot verify export with status: ${record.status}. Only NEEDS_ADMIN_REVIEW records can be verified.`,
        });
      }

      // Send the completion email first; the email function self-writes
      // attempt counters and the recipient column. If send fails, the
      // tracking row records the failure and we refuse the transition.
      if (!record.completedExportEmailSentAt) {
        const userId = await getUserIdFromOwnerAddress(record.ownerAddress);
        if (!userId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Cannot send export notification: no user is linked to owner wallet ${record.ownerAddress}`,
          });
        }

        const notifyResult = await sendExportCompleteEmail({
          trackingRecordId: record.id,
          userId,
          domain: record.normalizedDomainName,
          chainId: record.chainId,
        });

        if (!notifyResult.sent) {
          const reason =
            notifyResult.error ??
            'user does not have a deliverable email address';
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Cannot send export notification: ${reason}`,
          });
        }
      }

      const now = new Date();
      const updatedHistory = appendExportTrackingStatusHistory(
        (record.statusHistory as ExportTrackingStatusHistoryEntry[] | null) ??
          [],
        'TRANSFER_COMPLETED',
        {
          now,
          reason: `Admin ${ctx.user.id} verified export and sent user notification`,
          evidence: {
            ...(record.latestEvidence ?? undefined),
            actor: 'admin',
            checkedAt: now.toISOString(),
            decisionAction: 'TRANSFER_COMPLETED',
            decisionReason: 'Admin verify action',
          },
        },
      );

      await db
        .update(domainExportTrackingTable)
        .set({
          previousStatus: sql`${domainExportTrackingTable.status}`,
          status: 'TRANSFER_COMPLETED',
          statusHistory: updatedHistory,
          verifyingAdminId: ctx.user.id,
          adminVerifiedAt: now,
          statusChangedAt: now,
          isActive: false,
          updatedAt: now,
        })
        .where(eq(domainExportTrackingTable.id, input.id));

      logger.debug(
        {
          recordId: input.id,
          domain: record.normalizedDomainName,
          adminId: ctx.user.id,
        },
        'Admin verified export tracking record',
      );

      return {
        success: true,
        message: `Export for ${record.normalizedDomainName} has been verified`,
      };
    }),

  /**
   * Admin resolve an export tracking review without sending notification.
   * Transitions NEEDS_ADMIN_REVIEW → RESOLVED (terminal, isActive=false).
   */
  resolveExportTracking: auditedAdminProcedureWithPermissions(
    Permission.WRITE_NFT,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin' as const,
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.DOMAIN_EXPORT,
      resourceId: input.id,
      action: 'resolve_export',
      extraInput: input,
    }),
  )
    .input(adminExportTrackingContract.resolveExportTracking.input)
    .output(adminExportTrackingContract.resolveExportTracking.output)
    .mutation(async ({ ctx, input }) => {
      const existingRecord = await db
        .select({
          id: domainExportTrackingTable.id,
          normalizedDomainName: domainExportTrackingTable.normalizedDomainName,
          status: domainExportTrackingTable.status,
          isActive: domainExportTrackingTable.isActive,
          statusHistory: domainExportTrackingTable.statusHistory,
          latestEvidence: domainExportTrackingTable.latestEvidence,
          nftBurnedAt: domainExportTrackingTable.nftBurnedAt,
        })
        .from(domainExportTrackingTable)
        .where(eq(domainExportTrackingTable.id, input.id))
        .limit(1);

      if (!existingRecord[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Export tracking record not found',
        });
      }

      const record = existingRecord[0];

      if (!record.isActive) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Export tracking record is already terminal',
        });
      }

      if (record.nftBurnedAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot resolve review: NFT has already been burned',
        });
      }

      if (!canResolveExportTrackingStatus(record.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot resolve export with status: ${record.status}.`,
        });
      }

      const now = new Date();
      const updatedHistory = appendExportTrackingStatusHistory(
        (record.statusHistory as ExportTrackingStatusHistoryEntry[] | null) ??
          [],
        'RESOLVED',
        {
          now,
          reason: `Admin ${ctx.user.id} resolved export review without notification`,
          evidence: {
            ...(record.latestEvidence ?? undefined),
            actor: 'admin',
            checkedAt: now.toISOString(),
            decisionAction: 'RESOLVED',
            decisionReason: 'Admin resolve action',
          },
        },
      );

      await db
        .update(domainExportTrackingTable)
        .set({
          previousStatus: sql`${domainExportTrackingTable.status}`,
          status: 'RESOLVED',
          statusHistory: updatedHistory,
          verifyingAdminId: ctx.user.id,
          adminVerifiedAt: sql`COALESCE(${domainExportTrackingTable.adminVerifiedAt}, NOW())`,
          statusChangedAt: now,
          isActive: false,
          updatedAt: now,
        })
        .where(eq(domainExportTrackingTable.id, input.id));

      logger.debug(
        {
          recordId: input.id,
          domain: record.normalizedDomainName,
          adminId: ctx.user.id,
        },
        'Admin resolved export tracking review',
      );

      return {
        success: true,
        message: `Export review for ${record.normalizedDomainName} has been resolved`,
      };
    }),

  /**
   * Send export notification email based on current export tracking status.
   *  - pending statuses → pending export email
   *  - TRANSFER_FAILED → failed export email
   *  - completed/review statuses → export complete email
   *
   * The email-send activity self-writes per-email-type columns on the row
   * (attempt counter, last attempt timestamp, recipient, last error) for
   * both success and failure cases.
   *
   * One-time-per-email-type by default; use `forceResend: true` to override.
   * Resending is allowed on terminal (isActive=false) rows for support
   * purposes.
   */
  sendExportTrackingEmail: auditedAdminProcedureWithPermissions(
    Permission.WRITE_NFT,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin' as const,
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.DOMAIN_EXPORT,
      resourceId: input.id,
      action: input.forceResend ? 'resend_export_email' : 'send_export_email',
      extraInput: input,
    }),
  )
    .input(adminExportTrackingContract.sendExportTrackingEmail.input)
    .output(adminExportTrackingContract.sendExportTrackingEmail.output)
    .mutation(async ({ input }) => {
      const existingRecord = await db
        .select({
          id: domainExportTrackingTable.id,
          normalizedDomainName: domainExportTrackingTable.normalizedDomainName,
          chainId: domainExportTrackingTable.chainId,
          ownerAddress: domainExportTrackingTable.ownerAddress,
          status: domainExportTrackingTable.status,
          registrarKey: domainExportTrackingTable.registrarKey,
          pendingExportEmailSentAt:
            domainExportTrackingTable.pendingExportEmailSentAt,
          failedExportEmailSentAt:
            domainExportTrackingTable.failedExportEmailSentAt,
          completedExportEmailSentAt:
            domainExportTrackingTable.completedExportEmailSentAt,
          nftBurnTxHash: domainExportTrackingTable.nftBurnTxHash,
        })
        .from(domainExportTrackingTable)
        .where(eq(domainExportTrackingTable.id, input.id))
        .limit(1);

      if (!existingRecord[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Export tracking record not found',
        });
      }

      const record = existingRecord[0];
      const emailType = getExportTrackingEmailType(record.status);

      if (!emailType) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `No export email template applies to status: ${record.status}.`,
        });
      }

      const alreadySent =
        emailType === 'pending'
          ? Boolean(record.pendingExportEmailSentAt)
          : emailType === 'failed'
            ? Boolean(record.failedExportEmailSentAt)
            : Boolean(record.completedExportEmailSentAt);

      if (alreadySent && !input.forceResend) {
        const labels: Record<typeof emailType, string> = {
          pending: 'Pending export email',
          failed: 'Failed export email',
          complete: 'Export complete email',
        };
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `${labels[emailType]} was already sent. Set forceResend=true to resend.`,
        });
      }

      const userId = await getUserIdFromOwnerAddress(record.ownerAddress);
      if (!userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot send export notification: no user is linked to owner wallet ${record.ownerAddress}`,
        });
      }

      if (emailType === 'pending') {
        const pendingResult = await sendPendingExportEmail({
          trackingRecordId: record.id,
          userId,
          domain: record.normalizedDomainName,
          registrarKey: record.registrarKey ?? 'unknown',
        });

        if (!pendingResult.sent) {
          const reason =
            pendingResult.error ??
            'user does not have a deliverable email address';
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Cannot send pending export notification: ${reason}`,
          });
        }

        return {
          success: true,
          emailType,
          message: input.forceResend
            ? `Pending export email resent for ${record.normalizedDomainName}`
            : `Pending export email sent for ${record.normalizedDomainName}`,
        };
      }

      if (emailType === 'failed') {
        const failedResult = await sendFailedExportEmail({
          trackingRecordId: record.id,
          userId,
          domain: record.normalizedDomainName,
        });

        if (!failedResult.sent) {
          const reason =
            failedResult.error ??
            'user does not have a deliverable email address';
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Cannot send failed export notification: ${reason}`,
          });
        }

        return {
          success: true,
          emailType,
          message: input.forceResend
            ? `Failed export email resent for ${record.normalizedDomainName}`
            : `Failed export email sent for ${record.normalizedDomainName}`,
        };
      }

      const completeResult = await sendExportCompleteEmail({
        trackingRecordId: record.id,
        userId,
        domain: record.normalizedDomainName,
        chainId: record.chainId,
        nftBurnTxHash: record.nftBurnTxHash ?? undefined,
      });

      if (!completeResult.sent) {
        const reason =
          completeResult.error ??
          'user does not have a deliverable email address';
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot send export completion notification: ${reason}`,
        });
      }

      return {
        success: true,
        emailType,
        message: input.forceResend
          ? `Export completion email resent for ${record.normalizedDomainName}`
          : `Export completion email sent for ${record.normalizedDomainName}`,
      };
    }),
});
