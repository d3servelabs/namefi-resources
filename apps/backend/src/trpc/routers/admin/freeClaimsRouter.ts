import { db, freeClaimsTable } from '@namefi-astra/db';
import { Permission } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq, or, type SQL, sql } from 'drizzle-orm';
import {
  adminProcedureWithPermissions,
  auditedAdminProcedureWithPermissions,
} from '../../base';
import { createContractTRPCRouter } from '../../contract';
import { adminFreeClaimsContract } from '@namefi-astra/common/contract/admin/admin-free-claims-contract';
import { ResourceType } from '#lib/auditor';
import { logger } from '#lib/logger';

export const freeClaimsRouter = createContractTRPCRouter<
  typeof adminFreeClaimsContract
>({
  getFreeClaimsWithPagination: adminProcedureWithPermissions(
    Permission.READ_FREE_CLAIMS,
  )
    .input(adminFreeClaimsContract.getFreeClaimsWithPagination.input)
    .output(adminFreeClaimsContract.getFreeClaimsWithPagination.output)
    .query(async ({ input }) => {
      const { page, limit, sortBy, sortOrder, searchTerm, status } = input;
      const offset = (page - 1) * limit;

      // Build base query
      const baseQuery = db.select().from(freeClaimsTable);
      const baseCountQuery = db
        .select({ count: sql<number>`COUNT(*)` })
        .from(freeClaimsTable);

      // Build filters
      const filters = [];

      if (searchTerm) {
        filters.push(
          or(
            sql`${freeClaimsTable.groupOrCampaignKey} ILIKE ${'%' + searchTerm + '%'}`,
            sql`${freeClaimsTable.reason} ILIKE ${'%' + searchTerm + '%'}`,
            sql`${freeClaimsTable.exactDomainName} ILIKE ${'%' + searchTerm + '%'}`,
            sql`${freeClaimsTable.parentDomain} ILIKE ${'%' + searchTerm + '%'}`,
          ),
        );
      }

      if (status !== 'all') {
        filters.push(eq(freeClaimsTable.claimingStatus, status));
      }

      const whereClause = filters.length > 0 ? and(...filters) : undefined;

      const query = whereClause ? baseQuery.where(whereClause) : baseQuery;
      const countQuery = whereClause
        ? baseCountQuery.where(whereClause)
        : baseCountQuery;

      // Apply sorting
      let orderByClause: SQL<unknown>;
      switch (sortBy) {
        case 'groupOrCampaignKey':
          orderByClause =
            sortOrder === 'asc'
              ? asc(freeClaimsTable.groupOrCampaignKey)
              : desc(freeClaimsTable.groupOrCampaignKey);
          break;
        case 'reason':
          orderByClause =
            sortOrder === 'asc'
              ? asc(freeClaimsTable.reason)
              : desc(freeClaimsTable.reason);
          break;
        case 'exactDomainName':
          orderByClause =
            sortOrder === 'asc'
              ? sql`${freeClaimsTable.exactDomainName} ASC NULLS LAST`
              : sql`${freeClaimsTable.exactDomainName} DESC NULLS LAST`;
          break;
        case 'parentDomain':
          orderByClause =
            sortOrder === 'asc'
              ? sql`${freeClaimsTable.parentDomain} ASC NULLS LAST`
              : sql`${freeClaimsTable.parentDomain} DESC NULLS LAST`;
          break;
        case 'expirationDate':
          orderByClause =
            sortOrder === 'asc'
              ? sql`${freeClaimsTable.expirationDate} ASC NULLS LAST`
              : sql`${freeClaimsTable.expirationDate} DESC NULLS LAST`;
          break;
        case 'createdAt':
        default:
          orderByClause =
            sortOrder === 'asc'
              ? asc(freeClaimsTable.createdAt)
              : desc(freeClaimsTable.createdAt);
          break;
      }

      // Execute queries
      const [results, countResult] = await Promise.all([
        query.orderBy(orderByClause).limit(limit).offset(offset),
        countQuery,
      ]);

      const totalCount = countResult[0]?.count ?? 0;

      return {
        data: results,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    }),

  createFreeClaim: auditedAdminProcedureWithPermissions(
    Permission.WRITE_FREE_CLAIMS,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'user',
      resourceId: input.userId,
      action: 'grant_free_claim',
      extraInput: input,
    }),
  )
    .input(adminFreeClaimsContract.createFreeClaim.input)
    .output(adminFreeClaimsContract.createFreeClaim.output)
    .mutation(async ({ input }) => {
      const {
        userId,
        groupOrCampaignKey,
        reason,
        exactDomainName,
        parentDomain,
        expirationDate,
        allowPremium,
        maxPrice,
      } = input;

      // Store the free-claim guard policy in metadata (read server-side by
      // getFreeClaimPolicy). Only include keys the admin explicitly provided.
      const metadata: Record<string, unknown> = {};
      if (allowPremium !== undefined) metadata.allowPremium = allowPremium;
      if (maxPrice !== undefined) metadata.maxPrice = maxPrice;

      try {
        const newClaim = await db
          .insert(freeClaimsTable)
          .values({
            userId,
            groupOrCampaignKey,
            reason: reason || null,
            exactDomainName: exactDomainName || null,
            parentDomain: parentDomain || null,
            expirationDate: expirationDate || null,
            claimingStatus: 'IDLE',
            metadata,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        return {
          success: true,
          claim: newClaim[0],
        };
      } catch (error) {
        logger.error({ error, input }, 'Failed to create free claim');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create free claim',
        });
      }
    }),

  updateFreeClaim: auditedAdminProcedureWithPermissions(
    Permission.WRITE_FREE_CLAIMS,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.FREE_CLAIM,
      resourceId: input.id,
      action: 'update_free_claim',
      extraInput: input,
    }),
  )
    .input(adminFreeClaimsContract.updateFreeClaim.input)
    .output(adminFreeClaimsContract.updateFreeClaim.output)
    .mutation(async ({ input }) => {
      // allowPremium / maxPrice are guard-policy fields stored in metadata, not
      // table columns — pull them out of the column updates and merge separately.
      const { id, allowPremium, maxPrice, ...updateData } = input;
      const hasPolicyUpdate =
        allowPremium !== undefined || maxPrice !== undefined;

      try {
        const updatedClaim = await db.transaction(async (tx) => {
          // First, select and lock the claim to ensure it's IDLE
          const existingClaim = await tx
            .select()
            .from(freeClaimsTable)
            .where(eq(freeClaimsTable.id, id))
            .for('update')
            .limit(1);

          if (existingClaim.length === 0) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Free claim not found',
            });
          }

          const claim = existingClaim[0];

          // Only allow updates if the claim is IDLE
          if (claim.claimingStatus !== 'IDLE') {
            throw new TRPCError({
              code: 'CONFLICT',
              message: `Cannot update claim: current status is ${claim.claimingStatus}. Only IDLE claims can be updated.`,
            });
          }

          const mergedMetadata = hasPolicyUpdate
            ? {
                ...(claim.metadata ?? {}),
                ...(allowPremium !== undefined ? { allowPremium } : {}),
                ...(maxPrice !== undefined ? { maxPrice } : {}),
              }
            : undefined;

          // Perform the update
          const updated = await tx
            .update(freeClaimsTable)
            .set({
              ...updateData,
              ...(mergedMetadata ? { metadata: mergedMetadata } : {}),
              updatedAt: new Date(),
            })
            .where(eq(freeClaimsTable.id, id))
            .returning();

          return updated[0];
        });

        return {
          success: true,
          claim: updatedClaim,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logger.error({ error, input }, 'Failed to update free claim');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update free claim',
        });
      }
    }),

  deleteFreeClaim: auditedAdminProcedureWithPermissions(
    Permission.WRITE_FREE_CLAIMS,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.FREE_CLAIM,
      resourceId: input.id,
      action: 'revoke_free_claim',
      extraInput: input,
    }),
  )
    .input(adminFreeClaimsContract.deleteFreeClaim.input)
    .output(adminFreeClaimsContract.deleteFreeClaim.output)
    .mutation(async ({ input }) => {
      const { id } = input;

      try {
        const deletedClaim = await db.transaction(async (tx) => {
          // First, select and lock the claim to ensure it's IDLE
          const existingClaim = await tx
            .select()
            .from(freeClaimsTable)
            .where(eq(freeClaimsTable.id, id))
            .for('update')
            .limit(1);

          if (existingClaim.length === 0) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Free claim not found',
            });
          }

          const claim = existingClaim[0];

          // Only allow deletion if the claim is IDLE
          if (claim.claimingStatus !== 'IDLE') {
            throw new TRPCError({
              code: 'CONFLICT',
              message: `Cannot delete claim: current status is ${claim.claimingStatus}. Only IDLE claims can be deleted.`,
            });
          }

          // Perform the deletion
          const deleted = await tx
            .delete(freeClaimsTable)
            .where(eq(freeClaimsTable.id, id))
            .returning();

          return deleted[0];
        });

        return {
          success: true,
          claim: deletedClaim,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logger.error({ error, input }, 'Failed to delete free claim');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete free claim',
        });
      }
    }),
});
