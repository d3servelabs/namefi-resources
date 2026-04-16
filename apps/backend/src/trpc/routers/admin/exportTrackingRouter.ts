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
   * Get export tracking records with pagination and filtering
   */
  getExportTrackingRecords: adminProcedureWithPermissions(Permission.READ_NFT)
    .input(adminExportTrackingContract.getExportTrackingRecords.input)
    .output(adminExportTrackingContract.getExportTrackingRecords.output)
    .query(async ({ input }) => {
      const { page, pageSize, filters, sorting } = input;
      const offset = (page - 1) * pageSize;

      // Define table structure for drizzler
      const tableStructure = {
        id: domainExportTrackingTable.id,
        normalizedDomainName: domainExportTrackingTable.normalizedDomainName,
        chainId: domainExportTrackingTable.chainId,
        ownerAddress: domainExportTrackingTable.ownerAddress,
        status: domainExportTrackingTable.status,
        previousStatus: domainExportTrackingTable.previousStatus,
        registrarKey: domainExportTrackingTable.registrarKey,
        statusChangedAt: domainExportTrackingTable.statusChangedAt,
        firstDetectedAt: domainExportTrackingTable.firstDetectedAt,
        lastCheckedAt: domainExportTrackingTable.lastCheckedAt,
        transferCompletedAt: domainExportTrackingTable.transferCompletedAt,
        pendingNotifiedAt: domainExportTrackingTable.pendingNotifiedAt,
        notifiedAt: domainExportTrackingTable.notifiedAt,
        latestEvidence: domainExportTrackingTable.latestEvidence,
        userNotified: domainExportTrackingTable.userNotified,
        clientApprovedAt: domainExportTrackingTable.clientApprovedAt,
        adminVerifiedAt: domainExportTrackingTable.adminVerifiedAt,
        confirmedOutOfAccountAt:
          domainExportTrackingTable.confirmedOutOfAccountAt,
        nftBurnedAt: domainExportTrackingTable.nftBurnedAt,
        createdAt: domainExportTrackingTable.createdAt,
        updatedAt: domainExportTrackingTable.updatedAt,
      };

      // Build base query
      const baseQuery = db
        .select({
          id: domainExportTrackingTable.id,
          normalizedDomainName: domainExportTrackingTable.normalizedDomainName,
          chainId: domainExportTrackingTable.chainId,
          ownerAddress: domainExportTrackingTable.ownerAddress,
          status: domainExportTrackingTable.status,
          previousStatus: domainExportTrackingTable.previousStatus,
          statusHistory: domainExportTrackingTable.statusHistory,
          eppStatuses: domainExportTrackingTable.eppStatuses,
          registrarKey: domainExportTrackingTable.registrarKey,
          statusChangedAt: domainExportTrackingTable.statusChangedAt,
          firstDetectedAt: domainExportTrackingTable.firstDetectedAt,
          lastCheckedAt: domainExportTrackingTable.lastCheckedAt,
          transferCompletedAt: domainExportTrackingTable.transferCompletedAt,
          pendingNotifiedAt: domainExportTrackingTable.pendingNotifiedAt,
          userNotified: domainExportTrackingTable.userNotified,
          notifiedAt: domainExportTrackingTable.notifiedAt,
          latestEvidence: domainExportTrackingTable.latestEvidence,
          clientApprovedAt: domainExportTrackingTable.clientApprovedAt,
          verfyingAdminId: domainExportTrackingTable.verfyingAdminId,
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

      // Build WHERE clauses
      const whereClauses: SQL[] = [];

      // Add column filters using drizzler buildWhereClause
      if (filters) {
        const drizzlerWhere = buildWhereClause(
          tableStructure,
          filters as FilterOptions<any>,
        );
        if (drizzlerWhere) {
          whereClauses.push(drizzlerWhere);
        }
      }

      // Apply WHERE clauses
      let query = baseQuery;
      if (whereClauses.length > 0) {
        query = query.where(and(...whereClauses));
      }

      // Build ORDER BY using drizzler buildSortClause or default
      const orderByClauses = sorting
        ? buildSortClause(tableStructure, sorting as SortOptions<any>)
        : [sql`${domainExportTrackingTable.statusChangedAt} DESC`];

      try {
        // Build count query
        const countQuery = db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(domainExportTrackingTable)
          .$dynamic();

        // Apply same WHERE to count query
        let countQueryWithWhere = countQuery;
        if (whereClauses.length > 0) {
          countQueryWithWhere = countQuery.where(and(...whereClauses));
        }

        // Execute queries in parallel
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
   * Admin verify an export tracking record
   * This sets the adminVerifiedAt timestamp and verfyingAdminId,
   * which makes the domain eligible for NFT burning
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
      // First verify the record exists and is in TRANSFER_COMPLETED status
      const existingRecord = await db
        .select({
          id: domainExportTrackingTable.id,
          normalizedDomainName: domainExportTrackingTable.normalizedDomainName,
          chainId: domainExportTrackingTable.chainId,
          ownerAddress: domainExportTrackingTable.ownerAddress,
          status: domainExportTrackingTable.status,
          statusHistory: domainExportTrackingTable.statusHistory,
          userNotified: domainExportTrackingTable.userNotified,
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
          message: `Cannot verify export with status: ${record.status}. Only NEEDS_ADMIN_REVIEW records (or legacy TRANSFER_COMPLETED records) can be verified.`,
        });
      }

      if (!record.userNotified) {
        const userId = await getUserIdFromOwnerAddress(record.ownerAddress);
        if (!userId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Cannot send export notification: no user is linked to owner wallet ${record.ownerAddress}`,
          });
        }

        const notifyResult = await sendExportCompleteEmail({
          userId,
          domain: record.normalizedDomainName,
          chainId: record.chainId,
        });

        if (!notifyResult.sent) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
              'Cannot send export notification: user does not have a deliverable email address',
          });
        }
      }

      const now = new Date();
      const updatedHistory = appendExportTrackingStatusHistory(
        (record.statusHistory as ExportTrackingStatusHistoryEntry[] | null) ??
          [],
        'NOTIFIED',
        now,
      );

      // Update the record with admin verification
      await db
        .update(domainExportTrackingTable)
        .set({
          previousStatus: sql`${domainExportTrackingTable.status}`,
          status: 'NOTIFIED',
          statusHistory: updatedHistory,
          verfyingAdminId: ctx.user.id,
          adminVerifiedAt: now,
          userNotified: true,
          notifiedAt: now,
          statusChangedAt: now,
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
        message: `Export for ${record.normalizedDomainName} has been verified and marked as notified`,
      };
    }),

  /**
   * Admin resolve an export tracking review without sending user notification
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
          statusHistory: domainExportTrackingTable.statusHistory,
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

      if (record.status === 'RESOLVED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Export tracking record is already resolved',
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
        now,
      );

      await db
        .update(domainExportTrackingTable)
        .set({
          previousStatus: sql`${domainExportTrackingTable.status}`,
          status: 'RESOLVED',
          statusHistory: updatedHistory,
          verfyingAdminId: ctx.user.id,
          adminVerifiedAt: sql`COALESCE(${domainExportTrackingTable.adminVerifiedAt}, NOW())`,
          statusChangedAt: now,
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
   * Send export notification email based on current export tracking status
   * - pending statuses => pending export email
   * - completed/review/resolved statuses => export complete email
   *
   * By default this is one-time per email type. Use forceResend to override.
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
          pendingNotifiedAt: domainExportTrackingTable.pendingNotifiedAt,
          userNotified: domainExportTrackingTable.userNotified,
          notifiedAt: domainExportTrackingTable.notifiedAt,
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
          ? Boolean(record.pendingNotifiedAt)
          : Boolean(record.userNotified);

      if (alreadySent && !input.forceResend) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            emailType === 'pending'
              ? 'Pending export email was already sent. Set forceResend=true to resend.'
              : 'Export complete email was already sent. Set forceResend=true to resend.',
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
          userId,
          domain: record.normalizedDomainName,
          registrarKey: record.registrarKey ?? 'unknown',
        });

        if (!pendingResult.sent) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
              'Cannot send pending export notification: user does not have a deliverable email address',
          });
        }

        const now = new Date();
        await db
          .update(domainExportTrackingTable)
          .set({
            pendingNotifiedAt: now,
            updatedAt: now,
          })
          .where(eq(domainExportTrackingTable.id, input.id));

        return {
          success: true,
          emailType,
          message: input.forceResend
            ? `Pending export email resent for ${record.normalizedDomainName}`
            : `Pending export email sent for ${record.normalizedDomainName}`,
        };
      }

      const completeResult = await sendExportCompleteEmail({
        userId,
        domain: record.normalizedDomainName,
        chainId: record.chainId,
        nftBurnTxHash: record.nftBurnTxHash ?? undefined,
      });

      if (!completeResult.sent) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Cannot send export completion notification: user does not have a deliverable email address',
        });
      }

      const now = new Date();
      await db
        .update(domainExportTrackingTable)
        .set({
          userNotified: true,
          notifiedAt: now,
          updatedAt: now,
        })
        .where(eq(domainExportTrackingTable.id, input.id));

      return {
        success: true,
        emailType,
        message: input.forceResend
          ? `Export completion email resent for ${record.normalizedDomainName}`
          : `Export completion email sent for ${record.normalizedDomainName}`,
      };
    }),
});
