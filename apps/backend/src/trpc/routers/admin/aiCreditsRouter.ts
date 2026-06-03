import { randomUUID } from 'node:crypto';
import { aiCreditAwardsTable, db, usersTable } from '@namefi-astra/db';
import { adminAiCreditsContract } from '@namefi-astra/common/contract/admin/admin-ai-credits-contract';
import { Permission } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, inArray, or, sql, type SQL } from 'drizzle-orm';
import { ResourceType } from '#lib/auditor';
import {
  adminProcedureWithPermissions,
  auditedAdminProcedureWithPermissions,
} from '../../base';
import { createContractTRPCRouter } from '../../contract';
import { privyUsersTableSchema } from '../../../services/admin/privy-user-cache';

type AiCreditAwardRow = typeof aiCreditAwardsTable.$inferSelect;

type AwardUserSummary = {
  id: string;
  primaryEmail: string | null;
  displayName: string | null;
  walletAddresses: string[];
};

function getNextAiCreditRefreshAt(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

async function getUserSummariesById(userIds: string[]) {
  const uniqueUserIds = Array.from(new Set(userIds));
  if (uniqueUserIds.length === 0) {
    return new Map<string, AwardUserSummary>();
  }

  const rows = await db
    .select({
      id: usersTable.id,
      primaryEmail: sql<
        string | null
      >`COALESCE(${usersTable.primaryEmail}, ${privyUsersTableSchema.email})`.as(
        'primary_email',
      ),
      displayName: privyUsersTableSchema.displayName,
      walletAddresses: sql<
        string[]
      >`COALESCE(${privyUsersTableSchema.wallets}, ARRAY[]::text[])`.as(
        'wallet_addresses',
      ),
    })
    .from(usersTable)
    .leftJoin(
      privyUsersTableSchema,
      eq(privyUsersTableSchema.privyUserId, usersTable.privyUserId),
    )
    .where(inArray(usersTable.id, uniqueUserIds));

  return new Map(
    rows.map((row) => [
      row.id,
      {
        id: row.id,
        primaryEmail: row.primaryEmail ?? null,
        displayName: row.displayName ?? null,
        walletAddresses: row.walletAddresses ?? [],
      },
    ]),
  );
}

async function enrichAwardRows(rows: AiCreditAwardRow[]) {
  const userIds = rows.flatMap((row) =>
    row.awardedByAdminUserId
      ? [row.userId, row.awardedByAdminUserId]
      : [row.userId],
  );
  const userSummaries = await getUserSummariesById(userIds);

  return rows.map((row) => ({
    ...row,
    user: userSummaries.get(row.userId) ?? null,
    awardedByAdmin: row.awardedByAdminUserId
      ? (userSummaries.get(row.awardedByAdminUserId) ?? null)
      : null,
  }));
}

function buildAwardSearchFilter(searchTerm: string): SQL | undefined {
  const trimmed = searchTerm.trim().toLowerCase();
  if (!trimmed) return undefined;

  const likeTerm = `%${trimmed}%`;

  return or(
    sql`${aiCreditAwardsTable.reason} ILIKE ${likeTerm}`,
    sql`${aiCreditAwardsTable.userId}::text ILIKE ${likeTerm}`,
    sql`${aiCreditAwardsTable.awardedByAdminUserId}::text ILIKE ${likeTerm}`,
    sql`EXISTS (
      SELECT 1
      FROM ${usersTable}
      LEFT JOIN ${privyUsersTableSchema}
        ON ${privyUsersTableSchema.privyUserId} = ${usersTable.privyUserId}
      WHERE ${usersTable.id} = ${aiCreditAwardsTable.userId}
        AND (
          LOWER(COALESCE(${usersTable.primaryEmail}, ${privyUsersTableSchema.email}, '')) LIKE ${likeTerm}
          OR LOWER(COALESCE(${privyUsersTableSchema.displayName}, '')) LIKE ${likeTerm}
          OR EXISTS (
            SELECT 1
            FROM unnest(COALESCE(array_lowercase(${privyUsersTableSchema.wallets}), ARRAY[]::text[])) AS wallet
            WHERE wallet LIKE ${likeTerm}
          )
        )
    )`,
  );
}

export const aiCreditsRouter = createContractTRPCRouter<
  typeof adminAiCreditsContract
>({
  listAwards: adminProcedureWithPermissions(Permission.READ_AI_CREDITS)
    .input(adminAiCreditsContract.listAwards.input)
    .output(adminAiCreditsContract.listAwards.output)
    .query(async ({ input }) => {
      const { page, limit, searchTerm, userId } = input;
      const offset = (page - 1) * limit;
      const filters: SQL[] = [];

      if (userId) {
        filters.push(eq(aiCreditAwardsTable.userId, userId));
      }

      const searchFilter = searchTerm
        ? buildAwardSearchFilter(searchTerm)
        : undefined;
      if (searchFilter) {
        filters.push(searchFilter);
      }

      const whereClause = filters.length > 0 ? and(...filters) : undefined;
      const baseQuery = db.select().from(aiCreditAwardsTable);
      const baseCountQuery = db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(aiCreditAwardsTable);

      const [rows, countRows] = await Promise.all([
        (whereClause ? baseQuery.where(whereClause) : baseQuery)
          .orderBy(desc(aiCreditAwardsTable.createdAt))
          .limit(limit)
          .offset(offset),
        whereClause ? baseCountQuery.where(whereClause) : baseCountQuery,
      ]);

      const totalCount = countRows[0]?.count ?? 0;

      return {
        data: await enrichAwardRows(rows),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    }),

  awardCredits: auditedAdminProcedureWithPermissions(
    Permission.WRITE_AI_CREDITS,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.AI_CREDIT_AWARD,
      resourceId: input.userIds.length === 1 ? input.userIds[0] : 'bulk',
      action: 'award_ai_credits',
      extraInput: {
        ...input,
        recipientCount: input.userIds.length,
      },
    }),
  )
    .input(adminAiCreditsContract.awardCredits.input)
    .output(adminAiCreditsContract.awardCredits.output)
    .mutation(async ({ input, ctx }) => {
      const userIds = Array.from(new Set(input.userIds));
      const userRows = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(inArray(usersTable.id, userIds));

      const foundUserIds = new Set(userRows.map((row) => row.id));
      const missingUserIds = userIds.filter(
        (userId) => !foundUserIds.has(userId),
      );

      if (missingUserIds.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Unknown user ids: ${missingUserIds.join(', ')}`,
        });
      }

      const now = new Date();
      const batchId = randomUUID();
      const awards = await db
        .insert(aiCreditAwardsTable)
        .values(
          userIds.map((userId) => ({
            userId,
            awardedByAdminUserId: ctx.user.id,
            amountCredits: input.amountCredits,
            reason: input.reason,
            expiresAt: getNextAiCreditRefreshAt(now),
            metadata: { batchId },
            createdAt: now,
            updatedAt: now,
          })),
        )
        .returning();

      return {
        success: true,
        awards: await enrichAwardRows(awards),
        summary: {
          requested: input.userIds.length,
          created: awards.length,
        },
      };
    }),
});
