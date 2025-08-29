import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import {
  createTRPCRouter,
  protectedProcedure,
  poweredByNamefiOwnerProcedure,
} from '../base';
import {
  db,
  freeClaimsTable,
  type PoweredByNamefiDomainSelect,
  orderItemsTable,
  ordersTable,
  poweredbyNamefiDomainsTable,
} from '@namefi-astra/db';
import { subDays } from 'date-fns';
import { isNil, sum } from 'ramda';
import { logger } from '#lib/logger';
import { TRPCError } from '@trpc/server';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';

export const poweredByNamefiOwnerRouter = createTRPCRouter({
  // For topBar visibility
  isUserAPoweredByNamefiOwner: protectedProcedure.query(async ({ ctx }) => {
    const [{ count }] = await ctx.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(poweredbyNamefiDomainsTable)
      .where(eq(poweredbyNamefiDomainsTable.ownerId, ctx.user.id));
    return { isOwner: (count ?? 0) > 0 };
  }),

  // For specific domain auth checks
  isUserOwnerOf: protectedProcedure
    .input(z.object({ normalizedDomainName: namefiNormalizedDomainSchema }))
    .query(async ({ ctx, input }) => {
      const record = await ctx.db.query.poweredbyNamefiDomainsTable.findFirst({
        where: (t, { eq }) =>
          eq(t.normalizedDomainName, input.normalizedDomainName),
      });
      if (isNil(record)) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Domain not found',
        });
      }

      return { isOwner: record.ownerId === ctx.user.id };
    }),

  // List domains owned by the user
  listOwnedDomains: poweredByNamefiOwnerProcedure.query(async ({ ctx }) => {
    const domains = await ctx.db
      .select()
      .from(poweredbyNamefiDomainsTable)
      .where(eq(poweredbyNamefiDomainsTable.ownerId, ctx.user.id))
      .orderBy(desc(poweredbyNamefiDomainsTable.updatedAt));
    return domains as PoweredByNamefiDomainSelect[];
  }),

  // Update a domain (no creation)
  updateDomain: poweredByNamefiOwnerProcedure
    .input(
      z.object({
        normalizedDomainName: namefiNormalizedDomainSchema,
        additionalAllowedHostnames: z.array(z.string()).optional(),
        additionalReservedNames: z.array(z.string()).optional(),
        durationConstraints: z
          .object({
            minDurationInYears: z.number().min(1),
            maxDurationInYears: z.number().min(1),
          })
          .optional(),
        costPerYearInUsdCents: z.number().int().nonnegative().optional(),
        enabled: z.boolean().optional(),
        metadata: z.record(z.any()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { normalizedDomainName, ...updates } = input;
      const updated = await ctx.db
        .update(poweredbyNamefiDomainsTable)
        .set({ ...updates, updatedAt: new Date() })
        .where(
          and(
            eq(
              poweredbyNamefiDomainsTable.normalizedDomainName,
              normalizedDomainName,
            ),
            eq(poweredbyNamefiDomainsTable.ownerId, ctx.user.id),
          ),
        )
        .returning();
      return updated[0] ?? null;
    }),

  // Order history for owned domains
  orderItemsHistory: poweredByNamefiOwnerProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        normalizedDomainName: namefiNormalizedDomainSchema.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, normalizedDomainName } = input;
      const offset = (page - 1) * limit;

      const owned = await ctx.db
        .select({
          normalizedDomainName:
            poweredbyNamefiDomainsTable.normalizedDomainName,
        })
        .from(poweredbyNamefiDomainsTable)
        .where(eq(poweredbyNamefiDomainsTable.ownerId, ctx.user.id));
      const ownedNames = owned.map((d) => d.normalizedDomainName);
      if (ownedNames.length === 0)
        return {
          data: [],
          pagination: { page, limit, totalCount: 0, totalPages: 0 },
        };

      // Filter SUCCEEDED items where normalizedDomainName is either exactly one of owned domains
      // or a subdomain under one of them (%.parentDomain)
      const domainFilter = normalizedDomainName
        ? [normalizedDomainName]
        : ownedNames;
      const exactMatch = inArray(
        orderItemsTable.normalizedDomainName,
        domainFilter,
      );
      const ilikeConditions = domainFilter.map(
        (name) =>
          sql`${orderItemsTable.normalizedDomainName} ILIKE ${'%.'.concat(name)}`,
      );
      const domainMatch =
        ilikeConditions.length > 0
          ? or(exactMatch, ...ilikeConditions)
          : exactMatch;
      const baseWhere = and(
        domainMatch,
        eq(orderItemsTable.status, 'SUCCEEDED'),
      );

      const [rows, [{ count }]] = await Promise.all([
        ctx.db
          .select({
            id: orderItemsTable.id,
            normalizedDomainName: orderItemsTable.normalizedDomainName,
            amountInUSDCents: orderItemsTable.amountInUSDCents,
            status: orderItemsTable.status,
            createdAt: orderItemsTable.createdAt,
            promoGroupOrCampaignKey: freeClaimsTable.groupOrCampaignKey,
            promoReason: freeClaimsTable.reason,
            nftChainId: ordersTable.nftChainId,
          })
          .from(orderItemsTable)
          .leftJoin(
            freeClaimsTable,
            eq(freeClaimsTable.orderItemId, orderItemsTable.id),
          )
          .leftJoin(ordersTable, eq(ordersTable.id, orderItemsTable.orderId))
          .where(baseWhere)
          .orderBy(desc(orderItemsTable.createdAt))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: sql<number>`COUNT(*)` })
          .from(orderItemsTable)
          .where(baseWhere),
      ]);

      return {
        data: rows,
        pagination: {
          page,
          limit,
          totalCount: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / limit),
        },
      };
    }),

  // Revenue timeseries + total (SUCCEEDED only)
  revenue: poweredByNamefiOwnerProcedure
    .input(
      z.object({
        from: z.date().optional(),
        to: z.date().optional(),
        normalizedDomainName: z.string().optional(),
        interval: z.enum(['day', 'week', 'month']).default('day'),
      }),
    )
    .query(async ({ ctx, input }) => {
      const owned = await ctx.db
        .select({
          normalizedDomainName:
            poweredbyNamefiDomainsTable.normalizedDomainName,
        })
        .from(poweredbyNamefiDomainsTable)
        .where(eq(poweredbyNamefiDomainsTable.ownerId, ctx.user.id));
      const ownedNames = owned.map((d) => d.normalizedDomainName);
      if (ownedNames.length === 0) return { totalInUsdCents: 0, points: [] };

      const domainFilter = input.normalizedDomainName
        ? [input.normalizedDomainName]
        : ownedNames;

      const ilikeConditions = domainFilter.map(
        (name) =>
          sql`${orderItemsTable.normalizedDomainName} ILIKE ${'%.'.concat(name)}`,
      );
      const domainMatch =
        ilikeConditions.length > 0 ? or(...ilikeConditions) : undefined;

      const whereParts = [domainMatch, eq(orderItemsTable.status, 'SUCCEEDED')];
      if (input.from) {
        whereParts.push(sql`${orderItemsTable.createdAt} >= ${input.from}`);
      }
      if (input.to) {
        whereParts.push(sql`${orderItemsTable.createdAt} <= ${input.to}`);
      }
      const whereAll = and(...whereParts);

      const [{ totalInUsdCents }] = await ctx.db
        .select({
          totalInUsdCents: sql<number>`COALESCE(SUM(${orderItemsTable.amountInUSDCents}), 0)`,
        })
        .from(orderItemsTable)
        .where(whereAll);

      // Build daily series with zeros then left join sums
      const start = input.from ?? subDays(new Date(), 14);
      const end = input.to ?? new Date();
      const startIso = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
      ).toISOString();
      const endIso = new Date(
        end.getFullYear(),
        end.getMonth(),
        end.getDate(),
      ).toISOString();
      try {
        const series = db
          .select({
            bucket: sql
              .raw(`date_trunc('${input.interval}', points)`)
              .as('_bucket'),
          })
          .from(
            sql.raw(
              `(SELECT generate_series('${startIso}', '${endIso}', INTERVAL '1 day') AS points)`,
            ),
          )
          .groupBy(sql.raw(`date_trunc('${input.interval}', points)`))
          .as('series');

        const sums = db
          .select({
            bucket:
              sql`date_trunc('${sql.raw(input.interval)}', ${orderItemsTable.createdAt})`.as(
                'bucket',
              ),
            amount: sql<number>`SUM(${orderItemsTable.amountInUSDCents})`.as(
              'amount',
            ),
          })
          .from(orderItemsTable)
          .where(whereAll)
          .groupBy(
            sql`date_trunc('${sql.raw(input.interval)}', ${orderItemsTable.createdAt})`,
          )
          .as('sums');

        const points = await db
          .select({
            bucket: series.bucket,
            amountInUsdCents: sql<number>`COALESCE(${sums.amount}, 0)`,
          })
          .from(series)
          .leftJoin(sums, eq(series.bucket, sums.bucket))
          .orderBy(series.bucket);

        return { totalInUsdCents, points };
      } catch (error) {
        logger.error(error, 'Error in revenue query');
        return { totalInUsdCents: 0, points: [] };
      }
    }),

  // Revenue by domain (distribution across owned domains)
  revenueByDomain: poweredByNamefiOwnerProcedure
    .input(
      z.object({
        from: z.date().optional(),
        to: z.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const owned = await ctx.db
        .select({
          normalizedDomainName:
            poweredbyNamefiDomainsTable.normalizedDomainName,
        })
        .from(poweredbyNamefiDomainsTable)
        .where(eq(poweredbyNamefiDomainsTable.ownerId, ctx.user.id));
      const ownedNames = owned.map((d) => d.normalizedDomainName);
      if (ownedNames.length === 0)
        return {
          totalInUsdCents: 0,
          byDomain: [] as {
            normalizedDomainName: string;
            amountInUsdCents: number;
          }[],
        };

      const results = await Promise.all(
        ownedNames.map(async (name) => {
          const domainMatch = or(
            inArray(orderItemsTable.normalizedDomainName, [name]),
            sql`${orderItemsTable.normalizedDomainName} ILIKE ${'%.'.concat(name)}`,
          );
          const whereParts = [
            domainMatch,
            eq(orderItemsTable.status, 'SUCCEEDED'),
          ];
          if (input.from)
            whereParts.push(sql`${orderItemsTable.createdAt} >= ${input.from}`);
          if (input.to)
            whereParts.push(sql`${orderItemsTable.createdAt} <= ${input.to}`);

          const [{ sum }] = await ctx.db
            .select({
              sum: sql<number>`COALESCE(SUM(${orderItemsTable.amountInUSDCents}), 0)`,
            })
            .from(orderItemsTable)
            .where(and(...whereParts));
          return { normalizedDomainName: name, amountInUsdCents: sum ?? 0 };
        }),
      );

      const totalInUsdCents = sum(results.map((r) => r.amountInUsdCents ?? 0));
      return { totalInUsdCents, byDomain: results };
    }),
});
