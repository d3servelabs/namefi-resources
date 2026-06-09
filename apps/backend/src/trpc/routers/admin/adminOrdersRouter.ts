import {
  db,
  usersTable,
  orderItemsTable,
  ordersTable,
  paymentsTable,
  freeClaimsTable,
} from '@namefi-astra/db';
import { Permission } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, eq, or, type SQL, sql } from 'drizzle-orm';
import { adminProcedureWithPermissions } from '../../base';
import { createContractTRPCRouter } from '../../contract';
import { adminOrdersContract } from '@namefi-astra/common/contract/admin/admin-orders-contract';
import {
  getPrivyUserLinkedEthereumWalletAddresses,
  privyClient,
} from '../../utils';
import { logger } from '#lib/logger';

export const adminOrdersRouter = createContractTRPCRouter<
  typeof adminOrdersContract
>({
  listOrderItems: adminProcedureWithPermissions(
    [Permission.READ_ORDERS, Permission.READ_USERS],
    { mode: 'every' },
  )
    .input(adminOrdersContract.listOrderItems.input)
    .output(adminOrdersContract.listOrderItems.output)
    .query(async ({ input }) => {
      const { page, pageSize, searchTerm, columnFilters, sorting } = input;
      const offset = (page - 1) * pageSize;

      // Build base query with all necessary joins
      const baseQuery = db
        .select({
          // Order item fields
          id: orderItemsTable.id,
          normalizedDomainName: orderItemsTable.normalizedDomainName,
          amountInUsdCents: orderItemsTable.amountInUSDCents,
          durationInYears: orderItemsTable.durationInYears,
          type: orderItemsTable.type,
          registrar: orderItemsTable.registrar,
          status: orderItemsTable.status,
          createdAt: orderItemsTable.createdAt,
          updatedAt: orderItemsTable.updatedAt,
          // Order fields
          orderId: ordersTable.id,
          orderStatus: ordersTable.status,
          nftWalletAddress: ordersTable.nftWalletAddress,
          nftChainId: ordersTable.nftChainId,
          // User fields
          userId: usersTable.id,
          userEmail: usersTable.primaryEmail,
          userPrivyUserId: usersTable.privyUserId,
          // Payment fields from the latest payment for this order
          paymentProvider: sql<string | null>`(
            SELECT p.payment_provider
            FROM ${paymentsTable} p
            WHERE p.order_id = ${ordersTable.id}
            ORDER BY p.created_at DESC
            LIMIT 1
          )`.as('payment_provider'),
          paymentStatus: sql<string | null>`(
            SELECT p.status
            FROM ${paymentsTable} p
            WHERE p.order_id = ${ordersTable.id}
            ORDER BY p.created_at DESC
            LIMIT 1
          )`.as('payment_status'),
          paymentAmount: sql<number | null>`(
            SELECT p.amount_in_usd_cents
            FROM ${paymentsTable} p
            WHERE p.order_id = ${ordersTable.id}
            ORDER BY p.created_at DESC
            LIMIT 1
          )`.as('payment_amount'),
          nfscWalletAddress: sql<string | null>`(
            SELECT p.nfsc_payment_details->>'walletAddress'
            FROM ${paymentsTable} p
            WHERE p.order_id = ${ordersTable.id}
            ORDER BY p.created_at DESC
            LIMIT 1
          )`.as('nfsc_wallet_address'),
          // Free claim data
          freeClaimId: freeClaimsTable.id,
          freeClaimGroupOrCampaignKey: freeClaimsTable.groupOrCampaignKey,
          freeClaimReason: freeClaimsTable.reason,
        })
        .from(orderItemsTable)
        .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
        .innerJoin(usersTable, eq(ordersTable.userId, usersTable.id))
        .leftJoin(
          freeClaimsTable,
          eq(freeClaimsTable.orderItemId, orderItemsTable.id),
        )
        .$dynamic();

      // Build WHERE clause based on search terms and column filters
      const whereClauses: SQL[] = [];

      // Add general search term filter
      if (searchTerm) {
        const term = searchTerm.trim().toLowerCase();
        const likeTerm = `%${term}%`;
        const searchCondition = or(
          sql`LOWER(${orderItemsTable.normalizedDomainName}) LIKE ${likeTerm}`,
          sql`LOWER(${usersTable.primaryEmail}) LIKE ${likeTerm}`,
          sql`LOWER(${ordersTable.nftWalletAddress}) LIKE ${likeTerm}`,
          sql`${ordersTable.id}::text LIKE ${likeTerm}`,
          sql`${orderItemsTable.id}::text LIKE ${likeTerm}`,
        );
        if (searchCondition) {
          whereClauses.push(searchCondition);
        }
      }

      // Add column filters
      if (columnFilters && columnFilters.length > 0) {
        for (const filter of columnFilters) {
          const { id, value } = filter;
          const { operator, value: filterValue } = value;

          let columnSql: SQL | undefined;
          switch (id) {
            case 'normalizedDomainName':
              columnSql = sql`${orderItemsTable.normalizedDomainName}`;
              break;
            case 'type':
              columnSql = sql`${orderItemsTable.type}`;
              break;
            case 'registrar':
              columnSql = sql`${orderItemsTable.registrar}`;
              break;
            case 'status':
              columnSql = sql`${orderItemsTable.status}`;
              break;
            case 'amountInUsdCents':
              columnSql = sql`${orderItemsTable.amountInUSDCents}`;
              break;
            case 'createdAt':
              columnSql = sql`${orderItemsTable.createdAt}`;
              break;
            case 'nftChainId':
              columnSql = sql`${ordersTable.nftChainId}`;
              break;
            case 'userEmail':
              columnSql = sql`${usersTable.primaryEmail}`;
              break;
            case 'nftWalletAddress':
              columnSql = sql`${ordersTable.nftWalletAddress}`;
              break;
            case 'userId':
              columnSql = sql`${usersTable.id}`;
              break;
          }

          if (columnSql) {
            switch (operator) {
              case 'like':
                whereClauses.push(
                  sql`${columnSql} ILIKE ${`%${String(filterValue)}%`}`,
                );
                break;
              case 'eq':
                whereClauses.push(sql`${columnSql} = ${filterValue}`);
                break;
              case 'neq':
                whereClauses.push(sql`${columnSql} != ${filterValue}`);
                break;
              case 'gt':
                whereClauses.push(sql`${columnSql} > ${filterValue}`);
                break;
              case 'gte':
                whereClauses.push(sql`${columnSql} >= ${filterValue}`);
                break;
              case 'lt':
                whereClauses.push(sql`${columnSql} < ${filterValue}`);
                break;
              case 'lte':
                whereClauses.push(sql`${columnSql} <= ${filterValue}`);
                break;
            }
          }
        }
      }

      // Apply WHERE clauses
      let query = baseQuery;
      if (whereClauses.length > 0) {
        query = query.where(and(...whereClauses));
      }

      // Build ORDER BY clause
      const orderByClauses: SQL[] = [];
      if (sorting && sorting.length > 0) {
        for (const sort of sorting) {
          let columnSql: SQL | undefined;
          switch (sort.id) {
            case 'createdAt':
              columnSql = sql`${orderItemsTable.createdAt}`;
              break;
            case 'normalizedDomainName':
              columnSql = sql`${orderItemsTable.normalizedDomainName}`;
              break;
            case 'amountInUsdCents':
              columnSql = sql`${orderItemsTable.amountInUSDCents}`;
              break;
            case 'status':
              columnSql = sql`${orderItemsTable.status}`;
              break;
            case 'type':
              columnSql = sql`${orderItemsTable.type}`;
              break;
            case 'nftChainId':
              columnSql = sql`${ordersTable.nftChainId}`;
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
      } else {
        // Default sort by createdAt DESC
        orderByClauses.push(sql`${orderItemsTable.createdAt} DESC`);
      }

      try {
        // Build count query with same WHERE clause
        const countQuery = db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(query.as('sq'));

        // Execute queries in parallel
        const [rows, countRow] = await Promise.all([
          query
            .orderBy(...orderByClauses)
            .limit(pageSize)
            .offset(offset),
          countQuery,
        ]);

        // Get user wallets for "Bought For" determination
        const userIds = [...new Set(rows.map((r) => r.userId))];
        const userWalletsMap = new Map<string, string[]>();

        // Fetch Privy user data for all users in the result set
        await Promise.all(
          userIds.map(async (userId) => {
            const user = await db
              .select({
                id: usersTable.id,
                privyUserId: usersTable.privyUserId,
              })
              .from(usersTable)
              .where(eq(usersTable.id, userId))
              .limit(1);

            if (user[0]?.privyUserId) {
              try {
                const privyUser = await privyClient.getUserById(
                  user[0].privyUserId,
                );
                const wallets = getPrivyUserLinkedEthereumWalletAddresses({
                  privyUser,
                });
                userWalletsMap.set(
                  userId,
                  wallets.map((w) => w.toLowerCase()),
                );
              } catch {
                userWalletsMap.set(userId, []);
              }
            } else {
              userWalletsMap.set(userId, []);
            }
          }),
        );

        const items = rows.map((r) => {
          const userWallets = userWalletsMap.get(r.userId) || [];
          const nftWallet = r.nftWalletAddress?.toLowerCase();
          const boughtForType = !nftWallet
            ? 'Unknown'
            : userWallets.includes(nftWallet)
              ? 'Own Wallet'
              : 'Other Wallet';

          return {
            id: r.id,
            normalizedDomainName: r.normalizedDomainName,
            amountInUsdCents: r.amountInUsdCents,
            durationInYears: r.durationInYears,
            type: r.type,
            registrar: r.registrar,
            status: r.status,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
            orderId: r.orderId,
            orderStatus: r.orderStatus,
            nftWalletAddress: r.nftWalletAddress,
            nftChainId: r.nftChainId,
            userId: r.userId,
            userEmail: r.userEmail,
            userPrivyUserId: r.userPrivyUserId,
            paymentProvider: r.paymentProvider,
            paymentStatus: r.paymentStatus,
            paymentAmount: r.paymentAmount,
            nfscWalletAddress: r.nfscWalletAddress,
            boughtForType,
            userWallets,
            freeClaimId: r.freeClaimId,
            freeClaimGroupOrCampaignKey: r.freeClaimGroupOrCampaignKey,
            freeClaimReason: r.freeClaimReason,
          };
        });

        const total = countRow[0]?.count ?? 0;
        return {
          items,
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        };
      } catch (error) {
        logger.error({ error }, 'Failed to list order items');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to list order items',
        });
      }
    }),

  listOrders: adminProcedureWithPermissions(
    [Permission.READ_ORDERS, Permission.READ_USERS],
    { mode: 'every' },
  )
    .input(adminOrdersContract.listOrders.input)
    .output(adminOrdersContract.listOrders.output)
    .query(async ({ input }) => {
      const { page, pageSize, searchTerm, userId, columnFilters, sorting } =
        input;
      const offset = (page - 1) * pageSize;

      const baseQuery = db
        .select({
          id: ordersTable.id,
          status: ordersTable.status,
          amountInUsdCents: ordersTable.amountInUSDCents,
          nftWalletAddress: ordersTable.nftWalletAddress,
          nftChainId: ordersTable.nftChainId,
          createdAt: ordersTable.createdAt,
          updatedAt: ordersTable.updatedAt,
          userId: usersTable.id,
          userEmail: usersTable.primaryEmail,
          userPrivyUserId: usersTable.privyUserId,
        })
        .from(ordersTable)
        .innerJoin(usersTable, eq(ordersTable.userId, usersTable.id))
        .$dynamic();

      const whereClauses: SQL[] = [];

      if (userId) {
        whereClauses.push(sql`${usersTable.id} = ${userId}`);
      }

      if (searchTerm) {
        const term = searchTerm.trim().toLowerCase();
        const likeTerm = `%${term}%`;
        const searchCondition = or(
          sql`LOWER(${usersTable.primaryEmail}) LIKE ${likeTerm}`,
          sql`LOWER(${ordersTable.nftWalletAddress}) LIKE ${likeTerm}`,
          sql`${ordersTable.id}::text LIKE ${likeTerm}`,
          sql`EXISTS (
            SELECT 1 FROM ${orderItemsTable}
            WHERE ${orderItemsTable.orderId} = ${ordersTable.id}
            AND LOWER(${orderItemsTable.normalizedDomainName}) LIKE ${likeTerm}
          )`,
        );
        if (searchCondition) {
          whereClauses.push(searchCondition);
        }
      }

      if (columnFilters && columnFilters.length > 0) {
        for (const filter of columnFilters) {
          const { id, value } = filter;
          const { operator, value: filterValue } = value;

          let columnSql: SQL | undefined;
          switch (id) {
            case 'status':
              columnSql = sql`${ordersTable.status}`;
              break;
            case 'amountInUsdCents':
              columnSql = sql`${ordersTable.amountInUSDCents}`;
              break;
            case 'createdAt':
              columnSql = sql`${ordersTable.createdAt}`;
              break;
            case 'nftChainId':
              columnSql = sql`${ordersTable.nftChainId}`;
              break;
            case 'userEmail':
              columnSql = sql`${usersTable.primaryEmail}`;
              break;
            case 'nftWalletAddress':
              columnSql = sql`${ordersTable.nftWalletAddress}`;
              break;
            case 'userId':
              if (!userId) {
                columnSql = sql`${usersTable.id}`;
              }
              break;
          }

          if (columnSql) {
            switch (operator) {
              case 'like':
                whereClauses.push(
                  sql`${columnSql} ILIKE ${`%${String(filterValue)}%`}`,
                );
                break;
              case 'eq':
                whereClauses.push(sql`${columnSql} = ${filterValue}`);
                break;
              case 'neq':
                whereClauses.push(sql`${columnSql} != ${filterValue}`);
                break;
              case 'gt':
                whereClauses.push(sql`${columnSql} > ${filterValue}`);
                break;
              case 'gte':
                whereClauses.push(sql`${columnSql} >= ${filterValue}`);
                break;
              case 'lt':
                whereClauses.push(sql`${columnSql} < ${filterValue}`);
                break;
              case 'lte':
                whereClauses.push(sql`${columnSql} <= ${filterValue}`);
                break;
            }
          }
        }
      }

      let query = baseQuery;
      if (whereClauses.length > 0) {
        query = query.where(and(...whereClauses));
      }

      const orderByClauses: SQL[] = [];
      if (sorting && sorting.length > 0) {
        for (const sort of sorting) {
          let columnSql: SQL | undefined;
          switch (sort.id) {
            case 'createdAt':
              columnSql = sql`${ordersTable.createdAt}`;
              break;
            case 'amountInUsdCents':
              columnSql = sql`${ordersTable.amountInUSDCents}`;
              break;
            case 'status':
              columnSql = sql`${ordersTable.status}`;
              break;
            case 'nftChainId':
              columnSql = sql`${ordersTable.nftChainId}`;
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
        orderByClauses.push(sql`${ordersTable.createdAt} DESC`);
      }

      try {
        const whereClause =
          whereClauses.length > 0 ? and(...whereClauses) : undefined;

        const countQuery = db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(ordersTable)
          .innerJoin(usersTable, eq(ordersTable.userId, usersTable.id));

        const [rows, countRow] = await Promise.all([
          query
            .orderBy(...orderByClauses)
            .limit(pageSize)
            .offset(offset),
          whereClause ? countQuery.where(whereClause) : countQuery,
        ]);

        const items = rows.map((r) => ({
          id: r.id,
          status: r.status,
          amountInUsdCents: r.amountInUsdCents,
          nftWalletAddress: r.nftWalletAddress,
          nftChainId: r.nftChainId,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          userId: r.userId,
          userEmail: r.userEmail,
          userPrivyUserId: r.userPrivyUserId,
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
        logger.error({ error }, 'Failed to list orders');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to list orders',
        });
      }
    }),

  /**
   * Resolve an order's owner. Used by the decision-gates admin UI to show the
   * affected user when a gate carries an `orderId` but no `userId`.
   */
  getOrderUserId: adminProcedureWithPermissions(Permission.READ_ORDERS)
    .input(adminOrdersContract.getOrderUserId.input)
    .output(adminOrdersContract.getOrderUserId.output)
    .query(async ({ input }) => {
      const order = await db.query.ordersTable.findFirst({
        where: eq(ordersTable.id, input.orderId),
        columns: { userId: true },
      });
      return { userId: order?.userId ?? null };
    }),
});
