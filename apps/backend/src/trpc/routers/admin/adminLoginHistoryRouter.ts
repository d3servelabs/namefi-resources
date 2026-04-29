import { db, userLoginHistoryTable, usersTable } from '@namefi-astra/db';
import { Permission } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, gte, or, type SQL, sql } from 'drizzle-orm';
import { adminProcedureWithPermissions } from '../../base';
import { createContractTRPCRouter } from '../../contract';
import { adminLoginHistoryContract } from '@namefi-astra/common/contract/admin/admin-login-history-contract';
import { logger } from '#lib/logger';

/**
 * Read-only admin view onto user_login_history. Gated by READ_USERS since
 * login history is conceptually an attribute of the user (same gate used by
 * /admin/users on the frontend).
 */
export const adminLoginHistoryRouter = createContractTRPCRouter<
  typeof adminLoginHistoryContract
>({
  listLoginHistory: adminProcedureWithPermissions([Permission.READ_USERS])
    .input(adminLoginHistoryContract.listLoginHistory.input)
    .output(adminLoginHistoryContract.listLoginHistory.output)
    .query(async ({ input }) => {
      const { page, pageSize, searchTerm, userId, since, novelty, sorting } =
        input;
      const offset = (page - 1) * pageSize;

      const whereClauses: SQL[] = [];

      if (userId) {
        whereClauses.push(eq(userLoginHistoryTable.userId, userId));
      }

      if (since) {
        whereClauses.push(
          gte(userLoginHistoryTable.signedInAt, new Date(since)),
        );
      }

      if (novelty === 'newIp') {
        whereClauses.push(eq(userLoginHistoryTable.isNewIp, true));
      } else if (novelty === 'newLocation') {
        whereClauses.push(eq(userLoginHistoryTable.isNewLocation, true));
      } else if (novelty === 'anyNew') {
        const anyNew = or(
          eq(userLoginHistoryTable.isNewIp, true),
          eq(userLoginHistoryTable.isNewLocation, true),
        );
        if (anyNew) whereClauses.push(anyNew);
      }

      const trimmedSearchTerm = searchTerm?.trim().toLowerCase();
      if (trimmedSearchTerm) {
        const likeTerm = `%${trimmedSearchTerm}%`;
        const searchCondition = or(
          sql`LOWER(${usersTable.primaryEmail}) LIKE ${likeTerm}`,
          sql`LOWER(${userLoginHistoryTable.ipAddress}) LIKE ${likeTerm}`,
          sql`LOWER(${userLoginHistoryTable.geoCity}) LIKE ${likeTerm}`,
          sql`${userLoginHistoryTable.sessionId} ILIKE ${likeTerm}`,
        );
        if (searchCondition) whereClauses.push(searchCondition);
      }

      const whereClause =
        whereClauses.length > 0 ? and(...whereClauses) : undefined;

      const orderByClauses: SQL[] = [];
      if (sorting && sorting.length > 0) {
        for (const sort of sorting) {
          let columnSql: SQL | undefined;
          switch (sort.id) {
            case 'signedInAt':
              columnSql = sql`${userLoginHistoryTable.signedInAt}`;
              break;
            case 'lastAccessedAt':
              columnSql = sql`${userLoginHistoryTable.lastAccessedAt}`;
              break;
            case 'ipAddress':
              columnSql = sql`${userLoginHistoryTable.ipAddress}`;
              break;
            case 'userEmail':
              columnSql = sql`${usersTable.primaryEmail}`;
              break;
          }
          if (columnSql) {
            orderByClauses.push(
              sort.desc
                ? sql`${columnSql} DESC NULLS LAST`
                : sql`${columnSql} ASC NULLS LAST`,
            );
          }
        }
      }
      if (orderByClauses.length === 0) {
        orderByClauses.push(desc(userLoginHistoryTable.signedInAt));
      }
      // Stable tie-breaker so pagination is deterministic when two rows share
      // the primary sort key (e.g. many sessions at the same minute). id is a
      // UUID so ordering it is cheap and avoids rows shuffling across pages.
      orderByClauses.push(desc(userLoginHistoryTable.id));

      try {
        const baseQuery = db
          .select({
            id: userLoginHistoryTable.id,
            userId: userLoginHistoryTable.userId,
            userEmail: usersTable.primaryEmail,
            userPrivyUserId: usersTable.privyUserId,
            sessionId: userLoginHistoryTable.sessionId,
            signedInAt: userLoginHistoryTable.signedInAt,
            lastAccessedAt: userLoginHistoryTable.lastAccessedAt,
            ipAddress: userLoginHistoryTable.ipAddress,
            userAgent: userLoginHistoryTable.userAgent,
            os: userLoginHistoryTable.os,
            browser: userLoginHistoryTable.browser,
            device: userLoginHistoryTable.device,
            loginMethod: userLoginHistoryTable.loginMethod,
            geoCity: userLoginHistoryTable.geoCity,
            geoSubdivision: userLoginHistoryTable.geoSubdivision,
            geoRegionCode: userLoginHistoryTable.geoRegionCode,
            geoLat: userLoginHistoryTable.geoLat,
            geoLng: userLoginHistoryTable.geoLng,
            isGoogleLB: userLoginHistoryTable.isGoogleLB,
            isNewIp: userLoginHistoryTable.isNewIp,
            isNewLocation: userLoginHistoryTable.isNewLocation,
            isFirstSession: userLoginHistoryTable.isFirstSession,
            notificationSent: userLoginHistoryTable.notificationSent,
            systemRecognizedSessionDetails:
              userLoginHistoryTable.systemRecognizedSessionDetails,
            userRecognizedSessionDetails:
              userLoginHistoryTable.userRecognizedSessionDetails,
          })
          .from(userLoginHistoryTable)
          .innerJoin(
            usersTable,
            eq(usersTable.id, userLoginHistoryTable.userId),
          )
          .$dynamic();

        const listQuery = whereClause
          ? baseQuery.where(whereClause)
          : baseQuery;

        const countBase = db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(userLoginHistoryTable)
          .innerJoin(
            usersTable,
            eq(usersTable.id, userLoginHistoryTable.userId),
          )
          .$dynamic();
        const countQuery = whereClause
          ? countBase.where(whereClause)
          : countBase;

        const [rows, countRow] = await Promise.all([
          listQuery
            .orderBy(...orderByClauses)
            .limit(pageSize)
            .offset(offset),
          countQuery,
        ]);

        const items = rows.map((r) => ({
          id: r.id,
          userId: r.userId,
          userEmail: r.userEmail,
          userPrivyUserId: r.userPrivyUserId,
          sessionId: r.sessionId,
          signedInAt: r.signedInAt,
          lastAccessedAt: r.lastAccessedAt,
          ipAddress: r.ipAddress,
          userAgent: r.userAgent,
          os: r.os,
          browser: r.browser,
          device: r.device,
          loginMethod: r.loginMethod,
          geoCity: r.geoCity,
          geoSubdivision: r.geoSubdivision,
          geoRegionCode: r.geoRegionCode,
          geoLat: r.geoLat !== null ? Number.parseFloat(r.geoLat) : null,
          geoLng: r.geoLng !== null ? Number.parseFloat(r.geoLng) : null,
          isGoogleLB: r.isGoogleLB,
          isNewIp: r.isNewIp,
          isNewLocation: r.isNewLocation,
          isFirstSession: r.isFirstSession,
          notificationSent: r.notificationSent,
          systemRecognizedSessionDetails: r.systemRecognizedSessionDetails,
          userRecognizedSessionDetails: r.userRecognizedSessionDetails,
        }));

        const total = countRow[0]?.count ?? 0;
        return {
          items,
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        };
      } catch (error) {
        logger.error({ error }, 'Failed to list login history');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to list login history',
        });
      }
    }),

  acknowledgeSession: adminProcedureWithPermissions([Permission.READ_USERS])
    .input(adminLoginHistoryContract.acknowledgeSession.input)
    .output(adminLoginHistoryContract.acknowledgeSession.output)
    .mutation(async ({ input }) => {
      // Admin variant — acts on a row by id alone (no userId scope) so
      // customer-support staff can record the recognize/reject decision
      // they captured during a support call. The column being written is
      // still `user_recognized_session_details` regardless of who clicked
      // — if forensic auditing of the actor matters later, add a separate
      // `recognized_by_user_id` column.
      const updated = await db
        .update(userLoginHistoryTable)
        .set({ userRecognizedSessionDetails: input.recognized })
        .where(eq(userLoginHistoryTable.id, input.id))
        .returning({ id: userLoginHistoryTable.id });

      if (updated.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Login session not found',
        });
      }

      return { ok: true as const };
    }),
});
