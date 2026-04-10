import { db, freeClaimsTable } from '@namefi-astra/db';
import { namefiNormalizedDomainSchema, Permission } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq, or, type SQL, sql } from 'drizzle-orm';
import { z } from 'zod';
import {
  adminProcedureWithPermissions,
  auditedAdminProcedureWithPermissions,
  createTRPCRouter,
} from '../../base';
import { ResourceType } from '#lib/auditor';
import { logger } from '#lib/logger';

export const freeClaimsRouter = createTRPCRouter({
  getFreeClaimsWithPagination: adminProcedureWithPermissions(
    Permission.READ_FREE_CLAIMS,
  )
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        sortBy: z
          .enum([
            'groupOrCampaignKey',
            'reason',
            'exactDomainName',
            'parentDomain',
            'expirationDate',
            'createdAt',
          ])
          .default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
        searchTerm: z.string().optional(),
        status: z.enum(['all', 'IDLE', 'CLAIMING', 'CLAIMED']).default('all'),
      }),
    )
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
    .input(
      z
        .object({
          userId: z.string().uuid(),
          groupOrCampaignKey: z.string().min(1),
          reason: z.string().min(1),
          exactDomainName: namefiNormalizedDomainSchema.optional(),
          parentDomain: namefiNormalizedDomainSchema.optional(),
          expirationDate: z.date().optional(),
        })
        .refine((data) => data.exactDomainName || data.parentDomain, {
          message: 'Either exactDomainName or parentDomain must be provided',
          path: ['exactDomainName', 'parentDomain'],
        })
        .refine((data) => !(data.exactDomainName && data.parentDomain), {
          message: 'Cannot specify both exactDomainName and parentDomain',
          path: ['exactDomainName', 'parentDomain'],
        }),
    )
    .mutation(async ({ input }) => {
      const {
        userId,
        groupOrCampaignKey,
        reason,
        exactDomainName,
        parentDomain,
        expirationDate,
      } = input;

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
    .input(
      z.object({
        id: z.string().uuid(),
        groupOrCampaignKey: z.string().min(1).optional(),
        reason: z.string().min(1).optional(),
        exactDomainName: namefiNormalizedDomainSchema.optional(),
        parentDomain: namefiNormalizedDomainSchema.optional(),
        expirationDate: z.date().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;

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

          // Perform the update
          const updated = await tx
            .update(freeClaimsTable)
            .set({
              ...updateData,
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
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
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
