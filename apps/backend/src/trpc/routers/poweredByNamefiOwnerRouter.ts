import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';
import { protectedProcedure, poweredByNamefiOwnerProcedure } from '../base';
import { createContractTRPCRouter } from '../contract';
import { poweredByNamefiOwnerContract } from '@namefi-astra/common/contract/powered-by-namefi-owner-contract';
import {
  db,
  freeClaimsTable,
  type PoweredByNamefiDomainSelect,
  namefiNftView,
  orderItemsTable,
  ordersTable,
  poweredbyNamefiDomainsTable,
  namefiNftCte,
} from '@namefi-astra/db';
import { subDays } from 'date-fns';
import { isNil, sum } from 'ramda';
import { logger } from '#lib/logger';
import { TRPCError } from '@trpc/server';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { isReservedKeyword } from '#lib/namefi-registry-helpers';
import { getDashboardOverview } from './analyticsRouter';
import { getSystemReservedKeywords } from '#lib/namefi-registry-helpers';

export const poweredByNamefiOwnerRouter = createContractTRPCRouter<
  typeof poweredByNamefiOwnerContract
>({
  // For topBar visibility
  isUserAPoweredByNamefiOwner: protectedProcedure
    .input(poweredByNamefiOwnerContract.isUserAPoweredByNamefiOwner.input)
    .output(poweredByNamefiOwnerContract.isUserAPoweredByNamefiOwner.output)
    .query(async ({ ctx }) => {
      const [{ count }] = await ctx.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(poweredbyNamefiDomainsTable)
        .where(eq(poweredbyNamefiDomainsTable.ownerId, ctx.user.id));
      return { isOwner: (count ?? 0) > 0 };
    }),

  // For specific domain auth checks
  isUserOwnerOf: protectedProcedure
    .input(poweredByNamefiOwnerContract.isUserOwnerOf.input)
    .output(poweredByNamefiOwnerContract.isUserOwnerOf.output)
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

  getAnalyticsDashboardOverview: poweredByNamefiOwnerProcedure
    .input(poweredByNamefiOwnerContract.getAnalyticsDashboardOverview.input)
    .output(poweredByNamefiOwnerContract.getAnalyticsDashboardOverview.output)
    .query(async ({ ctx, input }) => {
      await assertOwnerOfDomain(input.publicSuffixPlusOne, ctx.user.id);
      return getDashboardOverview(input);
    }),

  // List domains owned by the user
  listOwnedDomains: poweredByNamefiOwnerProcedure
    .input(poweredByNamefiOwnerContract.listOwnedDomains.input)
    .output(poweredByNamefiOwnerContract.listOwnedDomains.output)
    .query(async ({ ctx }) => {
      const domains = await ctx.db
        .select()
        .from(poweredbyNamefiDomainsTable)
        .where(eq(poweredbyNamefiDomainsTable.ownerId, ctx.user.id))
        .orderBy(desc(poweredbyNamefiDomainsTable.updatedAt));
      return domains as PoweredByNamefiDomainSelect[];
    }),

  // Update a domain (no creation)
  updateDomain: poweredByNamefiOwnerProcedure
    .input(poweredByNamefiOwnerContract.updateDomain.input)
    .output(poweredByNamefiOwnerContract.updateDomain.output)
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
    .input(poweredByNamefiOwnerContract.orderItemsHistory.input)
    .output(poweredByNamefiOwnerContract.orderItemsHistory.output)
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
    .input(poweredByNamefiOwnerContract.revenue.input)
    .output(poweredByNamefiOwnerContract.revenue.output)
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
    .input(poweredByNamefiOwnerContract.revenueByDomain.input)
    .output(poweredByNamefiOwnerContract.revenueByDomain.output)
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

  // Reserved words management
  getReservedWords: poweredByNamefiOwnerProcedure
    .input(poweredByNamefiOwnerContract.getReservedWords.input)
    .output(poweredByNamefiOwnerContract.getReservedWords.output)
    .query(async ({ ctx, input }) => {
      await assertOwnerOfDomain(input.normalizedDomainName, ctx.user.id);

      // Get the domain record
      const domainRecord =
        await ctx.db.query.poweredbyNamefiDomainsTable.findFirst({
          where: and(
            eq(
              poweredbyNamefiDomainsTable.normalizedDomainName,
              input.normalizedDomainName as any,
            ),
            eq(poweredbyNamefiDomainsTable.ownerId, ctx.user.id),
          ),
        });

      if (!domainRecord) {
        throw new Error('Domain not found or access denied');
      }

      // Get fixed reserved words from the helper
      const fixedReservedWords = Array.from(getSystemReservedKeywords());

      return {
        fixedReservedWords,
        editableReservedWords: domainRecord.additionalReservedNames,
      };
    }),

  validateReservedWords: poweredByNamefiOwnerProcedure
    .input(poweredByNamefiOwnerContract.validateReservedWords.input)
    .output(poweredByNamefiOwnerContract.validateReservedWords.output)
    .query(async ({ ctx, input }) => {
      const { normalizedDomainName, words } = input;

      await assertOwnerOfDomain(normalizedDomainName, ctx.user.id);

      // Check if domain exists and user owns it
      const domainRecord =
        await ctx.db.query.poweredbyNamefiDomainsTable.findFirst({
          where: and(
            eq(
              poweredbyNamefiDomainsTable.normalizedDomainName,
              normalizedDomainName as any,
            ),
            eq(poweredbyNamefiDomainsTable.ownerId, ctx.user.id),
          ),
        });

      if (!domainRecord) {
        throw new Error('Domain not found or access denied');
      }

      const validationResults = await Promise.all(
        words.map(async (word) => {
          const sanitizedWord = word.toLowerCase().trim();

          // Check if word is already in fixed reserved words
          if (isReservedKeyword(sanitizedWord)) {
            return {
              word: sanitizedWord,
              isValid: false,
              reason: 'Word is in fixed reserved words list',
            };
          }

          // Check if word already exists as a domain
          const existingDomain = await ctx.db
            .with(namefiNftCte)
            .select()
            .from(namefiNftView)
            .where(
              eq(
                namefiNftView.normalizedDomainName,
                `${sanitizedWord}.${normalizedDomainName}` as any,
              ),
            )
            .limit(1);

          if (existingDomain.length > 0) {
            return {
              word: sanitizedWord,
              isValid: false,
              reason: 'Word already exists as a registered domain',
            };
          }

          // Check if word is already in editable reserved words
          const currentReservedWords =
            domainRecord.additionalReservedNames ?? [];
          if (currentReservedWords.includes(sanitizedWord)) {
            return {
              word: sanitizedWord,
              isValid: false,
              reason: 'Word is already in reserved words list',
            };
          }

          return {
            word: sanitizedWord,
            isValid: true,
            reason: null,
          };
        }),
      );

      return { validationResults };
    }),

  addReservedWords: poweredByNamefiOwnerProcedure
    .input(poweredByNamefiOwnerContract.addReservedWords.input)
    .output(poweredByNamefiOwnerContract.addReservedWords.output)
    .mutation(async ({ ctx, input }) => {
      const { normalizedDomainName, words } = input;

      await assertOwnerOfDomain(normalizedDomainName, ctx.user.id);

      // Check if domain exists and user owns it
      const domainRecord =
        await ctx.db.query.poweredbyNamefiDomainsTable.findFirst({
          where: and(
            eq(
              poweredbyNamefiDomainsTable.normalizedDomainName,
              normalizedDomainName as any,
            ),
            eq(poweredbyNamefiDomainsTable.ownerId, ctx.user.id),
          ),
        });

      if (!domainRecord) {
        throw new Error('Domain not found or access denied');
      }

      // Validate words
      const validationResults = await Promise.all(
        words.map(async (word) => {
          const sanitizedWord = word.toLowerCase().trim();

          // Check if word is already in fixed reserved words
          if (isReservedKeyword(sanitizedWord)) {
            return {
              word: sanitizedWord,
              isValid: false,
              reason: 'Word is in fixed reserved words list',
            };
          }

          // Check if word already exists as a domain
          const existingDomain = await ctx.db
            .with(namefiNftCte)
            .select()
            .from(namefiNftView)
            .where(
              eq(
                namefiNftView.normalizedDomainName,
                `${sanitizedWord}.${normalizedDomainName}` as any,
              ),
            )
            .limit(1);

          if (existingDomain.length > 0) {
            return {
              word: sanitizedWord,
              isValid: false,
              reason: 'Word already exists as a registered domain',
            };
          }

          // Check if word is already in editable reserved words
          const currentReservedWords =
            domainRecord.additionalReservedNames ?? [];
          if (currentReservedWords.includes(sanitizedWord)) {
            return {
              word: sanitizedWord,
              isValid: false,
              reason: 'Word is already in reserved words list',
            };
          }

          return {
            word: sanitizedWord,
            isValid: true,
            reason: null,
          };
        }),
      );

      const invalidWords = validationResults.filter(
        (result) => !result.isValid,
      );
      if (invalidWords.length > 0) {
        throw new Error(
          `Invalid words: ${invalidWords.map((w: any) => `${w.word} (${w.reason})`).join(', ')}`,
        );
      }

      // Sanitize words
      const sanitizedWords = words.map((word) => word.toLowerCase().trim());

      // Add new words to existing list
      const currentReservedWords = domainRecord.additionalReservedNames ?? [];
      const updatedReservedWords = Array.from(
        new Set([...currentReservedWords, ...sanitizedWords]),
      );

      // Update the domain
      await ctx.db
        .update(poweredbyNamefiDomainsTable)
        .set({
          additionalReservedNames: updatedReservedWords,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(
              poweredbyNamefiDomainsTable.normalizedDomainName,
              normalizedDomainName as any,
            ),
            eq(poweredbyNamefiDomainsTable.ownerId, ctx.user.id),
          ),
        );

      return { success: true, addedWords: sanitizedWords };
    }),

  removeReservedWords: poweredByNamefiOwnerProcedure
    .input(poweredByNamefiOwnerContract.removeReservedWords.input)
    .output(poweredByNamefiOwnerContract.removeReservedWords.output)
    .mutation(async ({ ctx, input }) => {
      const { normalizedDomainName, words } = input;

      await assertOwnerOfDomain(normalizedDomainName, ctx.user.id);

      // Get current reserved words
      const domainRecord =
        await ctx.db.query.poweredbyNamefiDomainsTable.findFirst({
          where: and(
            eq(
              poweredbyNamefiDomainsTable.normalizedDomainName,
              normalizedDomainName as any,
            ),
            eq(poweredbyNamefiDomainsTable.ownerId, ctx.user.id),
          ),
        });

      if (!domainRecord) {
        throw new Error('Domain not found or access denied');
      }

      // Remove specified words
      const wordsToRemove = new Set(
        words.map((word) => word.toLowerCase().trim()),
      );
      const currentReservedWords = domainRecord.additionalReservedNames ?? [];
      const updatedReservedWords = currentReservedWords.filter(
        (word) => !wordsToRemove.has(word),
      );

      // Update the domain
      await ctx.db
        .update(poweredbyNamefiDomainsTable)
        .set({
          additionalReservedNames: updatedReservedWords,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(
              poweredbyNamefiDomainsTable.normalizedDomainName,
              normalizedDomainName as any,
            ),
            eq(poweredbyNamefiDomainsTable.ownerId, ctx.user.id),
          ),
        );

      return { success: true, removedWords: words };
    }),
});

export async function assertOwnerOfDomain(
  normalizedDomainName: NamefiNormalizedDomain,
  userId: string,
) {
  if (!(await isOwnerOfDomain(normalizedDomainName, userId))) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You are not the owner of this domain',
    });
  }
}
async function isOwnerOfDomain(
  normalizedDomainName: NamefiNormalizedDomain,
  userId: string,
) {
  const domain = await db.query.poweredbyNamefiDomainsTable.findFirst({
    where: and(
      eq(
        poweredbyNamefiDomainsTable.normalizedDomainName,
        normalizedDomainName,
      ),
      eq(poweredbyNamefiDomainsTable.ownerId, userId),
    ),
  });
  return !!domain;
}
