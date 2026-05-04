import {
  db,
  orderItemsTable,
  ordersTable,
  paymentsTable,
  refundsTable,
  usersTable,
} from '@namefi-astra/db';
import { adminFinancialAnalyticsContract } from '@namefi-astra/common/contract/admin/admin-financial-analytics-contract';
import { Permission } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import {
  buildSortClause,
  buildWhereClause,
  type FilterOptions,
  type SortOptions,
} from '@samyx/drizzler-filters-sorters';
import { and, eq, inArray, or, type SQL, sql } from 'drizzle-orm';
import { ResourceType } from '#lib/auditor';
import { logger } from '#lib/logger';
import {
  adminProcedureWithPermissions,
  auditedAdminProcedureWithPermissions,
} from '../../base';
import { createContractTRPCRouter } from '../../contract';

type FinancialMode =
  | 'orderItemsByOrder'
  | 'paymentsByOrder'
  | 'ordersWithItems';

type FinancialDateRangeInput = {
  startDate: string;
  endDate: string;
};

type FinancialGlobalFilters = {
  searchTerm?: string;
  orderStatus?: string;
  autoRenew?: boolean;
  legacyBackfilled?: boolean;
};

type FinancialTableInput = {
  page: number;
  pageSize: number;
  dateRange: FinancialDateRangeInput;
  globalFilters?: FinancialGlobalFilters;
  tableFilters?: unknown;
  sorting?: unknown;
};

type FinancialRowsInput = Omit<FinancialTableInput, 'page' | 'pageSize'> & {
  page?: number;
  pageSize?: number;
};

type RefundRow = {
  id: string;
  paymentId: string;
  status: string;
  amountInUsdCents: number;
  paymentProviderReferenceId: string | null;
  chainId: number | null;
  walletAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type PaymentRow = {
  paymentId: string;
  orderId: string;
  orderStatus: string;
  orderCreatedAt: Date;
  orderUpdatedAt: Date;
  orderAmountInUsdCents: number;
  orderGrossAmountInUsdCents: number;
  orderRefundAmountInUsdCents: number;
  orderNetAmountInUsdCents: number;
  userId: string;
  userEmail: string | null;
  userPrivyUserId: string | null;
  nftWalletAddress: string | null;
  nftChainId: number | null;
  status: string;
  paymentProvider: string;
  paymentProviderReferenceId: string | null;
  amountInUsdCents: number;
  grossAmountInUsdCents: number;
  refundAmountInUsdCents: number;
  netAmountInUsdCents: number;
  chain: string | null;
  walletAddress: string | null;
  refunds: RefundRow[];
  createdAt: Date;
  updatedAt: Date;
};

type OrderItemRow = {
  orderItemId: string;
  orderId: string;
  orderStatus: string;
  orderCreatedAt: Date;
  orderUpdatedAt: Date;
  orderAmountInUsdCents: number;
  orderGrossAmountInUsdCents: number;
  orderRefundAmountInUsdCents: number;
  orderNetAmountInUsdCents: number;
  userId: string;
  userEmail: string | null;
  userPrivyUserId: string | null;
  nftWalletAddress: string | null;
  nftChainId: number | null;
  normalizedDomainName: string;
  amountInUsdCents: number;
  durationInYears: number;
  type: string;
  registrar: string;
  status: string | null;
  metadataAutoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type OrderRow = {
  orderId: string;
  orderStatus: string;
  amountInUsdCents: number;
  grossAmountInUsdCents: number;
  refundAmountInUsdCents: number;
  netAmountInUsdCents: number;
  itemCount: number;
  paymentCount: number;
  refundCount: number;
  userId: string;
  userEmail: string | null;
  userPrivyUserId: string | null;
  nftWalletAddress: string | null;
  nftChainId: number | null;
  registrars: string[];
  itemTypes: string[];
  paymentProviders: string[];
  items: OrderItemRow[];
  payments: PaymentRow[];
  createdAt: Date;
  updatedAt: Date;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const absoluteDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const relativeDaysAgoRegex = /^(\d+)daysAgo$/;
const csvEscapeRequiredRegex = /[",\n\r]/;
const settledPaymentStatuses = ['SUCCEEDED', 'REFUND_REQUESTED'] as const;
const MAX_EXPORT_FILE_NAME_DATE_LENGTH = 10;

const requiredFinancialPermissions = [
  Permission.READ_ANALYTICS,
  Permission.READ_ORDERS,
  Permission.READ_USERS,
];

const orderItemExportHeaders = [
  'order_id',
  'order_created_at',
  'order_status',
  'user_id',
  'user_email',
  'order_gross_usd_cents',
  'order_refund_usd_cents',
  'order_net_usd_cents',
  'item_id',
  'domain',
  'item_type',
  'item_registrar',
  'item_status',
  'item_amount_usd_cents',
  'item_auto_renew',
  'item_created_at',
] as const;

const paymentExportHeaders = [
  'order_id',
  'order_created_at',
  'order_status',
  'user_id',
  'user_email',
  'order_gross_usd_cents',
  'order_refund_usd_cents',
  'order_net_usd_cents',
  'payment_id',
  'payment_provider',
  'payment_status',
  'payment_amount_usd_cents',
  'payment_gross_usd_cents',
  'payment_refund_usd_cents',
  'payment_net_usd_cents',
  'payment_chain',
  'payment_wallet_address',
  'payment_reference_id',
  'payment_created_at',
  'refund_ids',
] as const;

const orderExportHeaders = [
  'order_id',
  'order_created_at',
  'order_status',
  'user_id',
  'user_email',
  'nft_wallet_address',
  'nft_chain_id',
  'order_amount_usd_cents',
  'order_gross_usd_cents',
  'order_refund_usd_cents',
  'order_net_usd_cents',
  'item_count',
  'payment_count',
  'refund_count',
  'item_ids',
  'payment_ids',
  'registrars',
  'item_types',
  'payment_providers',
] as const;

export const adminFinancialAnalyticsRouter = createContractTRPCRouter<
  typeof adminFinancialAnalyticsContract
>({
  getSummary: adminProcedureWithPermissions(requiredFinancialPermissions, {
    mode: 'every',
  })
    .input(adminFinancialAnalyticsContract.getSummary.input)
    .output(adminFinancialAnalyticsContract.getSummary.output)
    .query(async ({ input }) => {
      try {
        return await getFinancialSummary(input);
      } catch (error) {
        throwFinancialError(error, 'Failed to get financial summary');
      }
    }),

  listOrderItemGroups: adminProcedureWithPermissions(
    requiredFinancialPermissions,
    { mode: 'every' },
  )
    .input(adminFinancialAnalyticsContract.listOrderItemGroups.input)
    .output(adminFinancialAnalyticsContract.listOrderItemGroups.output)
    .query(async ({ input }) => listFinancialRows('orderItemsByOrder', input)),

  listPaymentGroups: adminProcedureWithPermissions(
    requiredFinancialPermissions,
    {
      mode: 'every',
    },
  )
    .input(adminFinancialAnalyticsContract.listPaymentGroups.input)
    .output(adminFinancialAnalyticsContract.listPaymentGroups.output)
    .query(async ({ input }) => listFinancialRows('paymentsByOrder', input)),

  listOrdersWithItems: adminProcedureWithPermissions(
    requiredFinancialPermissions,
    { mode: 'every' },
  )
    .input(adminFinancialAnalyticsContract.listOrdersWithItems.input)
    .output(adminFinancialAnalyticsContract.listOrdersWithItems.output)
    .query(async ({ input }) => listFinancialRows('ordersWithItems', input)),

  exportData: auditedAdminProcedureWithPermissions(
    requiredFinancialPermissions,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.OTHER,
      resourceId: `financials:${input.mode}`,
      action: 'export_financial_analytics',
      extraInput: {
        mode: input.mode,
        format: input.format,
        dateRange: input.dateRange,
        orderStatus: input.globalFilters?.orderStatus,
        autoRenew: input.globalFilters?.autoRenew,
        legacyBackfilled: input.globalFilters?.legacyBackfilled,
        hasSearchTerm: Boolean(input.globalFilters?.searchTerm),
        hasTableFilters: Boolean(input.tableFilters),
        hasSorting: Boolean(input.sorting),
        containsPiiFields: ['user_email'],
      },
    }),
    { mode: 'every' },
  )
    .input(adminFinancialAnalyticsContract.exportData.input)
    .output(adminFinancialAnalyticsContract.exportData.output)
    .mutation(async ({ input }) => {
      try {
        const rows = await listAllFinancialRows(input.mode, input);
        const exportRows = buildExportRows(input.mode, rows);
        const content =
          input.format === 'json'
            ? JSON.stringify(
                {
                  mode: input.mode,
                  dateRange: input.dateRange,
                  globalFilters: input.globalFilters ?? {},
                  rows,
                },
                null,
                2,
              )
            : rowsToCsv(exportRows, getExportHeaders(input.mode));

        return {
          fileName: buildExportFileName(
            input.mode,
            input.format,
            input.dateRange,
          ),
          contentType:
            input.format === 'json' ? 'application/json' : 'text/csv',
          content,
        };
      } catch (error) {
        throwFinancialError(error, 'Failed to export financial data');
      }
    }),
});

async function listFinancialRows(
  mode: FinancialMode,
  input: FinancialTableInput,
) {
  try {
    switch (mode) {
      case 'orderItemsByOrder':
        return await listOrderItemRows(input);
      case 'paymentsByOrder':
        return await listPaymentRows(input);
      case 'ordersWithItems':
        return await listOrderRows(input);
    }
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    logger.error(
      { error, mode },
      'Failed to list financial rows; returning empty result',
    );
    return emptyPaginatedResult(input);
  }
}

async function listAllFinancialRows(
  mode: FinancialMode,
  input: FinancialRowsInput,
) {
  switch (mode) {
    case 'orderItemsByOrder':
      return (await listOrderItemRows(input)).items;
    case 'paymentsByOrder':
      return (await listPaymentRows(input)).items;
    case 'ordersWithItems':
      return (await listOrderRows(input)).items;
  }
}

async function listOrderItemRows(input: FinancialRowsInput) {
  const whereClauses = buildOrderWhereClauses(
    input.dateRange,
    input.globalFilters,
  );
  appendDrizzlerWhere(
    whereClauses,
    orderItemFilterStructure,
    input.tableFilters,
  );

  const whereClause = and(...whereClauses);
  const orderByClauses = buildSort(input.sorting, orderItemFilterStructure, [
    sql`${orderItemsTable.createdAt} DESC`,
  ]);
  const baseQuery = db
    .select({
      orderItemId: orderItemsTable.id,
      orderId: ordersTable.id,
      orderStatus: ordersTable.status,
      orderCreatedAt: ordersTable.createdAt,
      orderUpdatedAt: ordersTable.updatedAt,
      orderAmountInUsdCents: ordersTable.amountInUSDCents,
      orderGrossAmountInUsdCents: orderGrossSql(ordersTable.id),
      orderRefundAmountInUsdCents: orderRefundSql(ordersTable.id),
      orderNetAmountInUsdCents: orderNetSql(ordersTable.id),
      userId: usersTable.id,
      userEmail: usersTable.primaryEmail,
      userPrivyUserId: usersTable.privyUserId,
      nftWalletAddress: ordersTable.nftWalletAddress,
      nftChainId: ordersTable.nftChainId,
      normalizedDomainName: orderItemsTable.normalizedDomainName,
      amountInUsdCents: orderItemsTable.amountInUSDCents,
      durationInYears: orderItemsTable.durationInYears,
      type: orderItemsTable.type,
      registrar: orderItemsTable.registrar,
      status: orderItemsTable.status,
      metadata: orderItemsTable.metadata,
      createdAt: orderItemsTable.createdAt,
      updatedAt: orderItemsTable.updatedAt,
    })
    .from(orderItemsTable)
    .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
    .innerJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .where(whereClause)
    .$dynamic();

  const countQuery = db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(orderItemsTable)
    .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
    .innerJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .where(whereClause);

  const rowsQuery = input.pageSize
    ? baseQuery
        .orderBy(...orderByClauses)
        .limit(input.pageSize)
        .offset(((input.page ?? 1) - 1) * input.pageSize)
    : baseQuery.orderBy(...orderByClauses);

  const [rows, countRows] = await Promise.all([rowsQuery, countQuery]);

  return paginatedResult(
    rows.map((row) => ({
      ...row,
      amountInUsdCents: toNumber(row.amountInUsdCents),
      orderAmountInUsdCents: toNumber(row.orderAmountInUsdCents),
      orderGrossAmountInUsdCents: toNumber(row.orderGrossAmountInUsdCents),
      orderRefundAmountInUsdCents: toNumber(row.orderRefundAmountInUsdCents),
      orderNetAmountInUsdCents: toNumber(row.orderNetAmountInUsdCents),
      metadataAutoRenew: Boolean(
        (row.metadata as { autoRenew?: boolean } | null)?.autoRenew,
      ),
    })),
    countRows,
    input,
  );
}

async function listPaymentRows(input: FinancialRowsInput) {
  const whereClauses = buildOrderWhereClauses(
    input.dateRange,
    input.globalFilters,
  );
  appendDrizzlerWhere(whereClauses, paymentFilterStructure, input.tableFilters);

  const whereClause = and(...whereClauses);
  const orderByClauses = buildSort(input.sorting, paymentFilterStructure, [
    sql`${paymentsTable.createdAt} DESC`,
  ]);
  const baseQuery = db
    .select({
      paymentId: paymentsTable.id,
      orderId: ordersTable.id,
      orderStatus: ordersTable.status,
      orderCreatedAt: ordersTable.createdAt,
      orderUpdatedAt: ordersTable.updatedAt,
      orderAmountInUsdCents: ordersTable.amountInUSDCents,
      orderGrossAmountInUsdCents: orderGrossSql(ordersTable.id),
      orderRefundAmountInUsdCents: orderRefundSql(ordersTable.id),
      orderNetAmountInUsdCents: orderNetSql(ordersTable.id),
      userId: usersTable.id,
      userEmail: usersTable.primaryEmail,
      userPrivyUserId: usersTable.privyUserId,
      nftWalletAddress: ordersTable.nftWalletAddress,
      nftChainId: ordersTable.nftChainId,
      status: paymentsTable.status,
      paymentProvider: paymentsTable.paymentProvider,
      paymentProviderReferenceId: paymentsTable.paymentProviderReferenceId,
      amountInUsdCents: paymentsTable.amountInUSDCents,
      grossAmountInUsdCents: sql<number>`CASE WHEN ${settledPaymentStatusSql(paymentsTable.status)} THEN ${paymentsTable.amountInUSDCents} ELSE 0 END`,
      refundAmountInUsdCents: paymentRefundSql(paymentsTable.id),
      netAmountInUsdCents: sql<number>`(CASE WHEN ${settledPaymentStatusSql(paymentsTable.status)} THEN ${paymentsTable.amountInUSDCents} ELSE 0 END - ${paymentRefundSql(paymentsTable.id)})::int`,
      nfscPaymentDetails: paymentsTable.nfscPaymentDetails,
      x402PaymentDetails: paymentsTable.x402PaymentDetails,
      createdAt: paymentsTable.createdAt,
      updatedAt: paymentsTable.updatedAt,
    })
    .from(paymentsTable)
    .innerJoin(ordersTable, eq(paymentsTable.orderId, ordersTable.id))
    .innerJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .where(whereClause)
    .$dynamic();

  const countQuery = db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(paymentsTable)
    .innerJoin(ordersTable, eq(paymentsTable.orderId, ordersTable.id))
    .innerJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .where(whereClause);

  const rowsQuery = input.pageSize
    ? baseQuery
        .orderBy(...orderByClauses)
        .limit(input.pageSize)
        .offset(((input.page ?? 1) - 1) * input.pageSize)
    : baseQuery.orderBy(...orderByClauses);

  const [rows, countRows] = await Promise.all([rowsQuery, countQuery]);
  const refundsByPaymentId = await getRefundsByPaymentId(
    rows.map((row) => row.paymentId),
  );

  return paginatedResult(
    rows.map((row) => ({
      ...row,
      orderAmountInUsdCents: toNumber(row.orderAmountInUsdCents),
      orderGrossAmountInUsdCents: toNumber(row.orderGrossAmountInUsdCents),
      orderRefundAmountInUsdCents: toNumber(row.orderRefundAmountInUsdCents),
      orderNetAmountInUsdCents: toNumber(row.orderNetAmountInUsdCents),
      amountInUsdCents: toNumber(row.amountInUsdCents),
      grossAmountInUsdCents: toNumber(row.grossAmountInUsdCents),
      refundAmountInUsdCents: toNumber(row.refundAmountInUsdCents),
      netAmountInUsdCents: toNumber(row.netAmountInUsdCents),
      chain: getPaymentChain(row),
      walletAddress: getPaymentWalletAddress(row),
      refunds: refundsByPaymentId.get(row.paymentId) ?? [],
    })),
    countRows,
    input,
  );
}

async function listOrderRows(input: FinancialRowsInput) {
  const whereClauses = buildOrderWhereClauses(
    input.dateRange,
    input.globalFilters,
  );
  appendDrizzlerWhere(whereClauses, orderFilterStructure, input.tableFilters);

  const whereClause = and(...whereClauses);
  const orderByClauses = buildSort(input.sorting, orderFilterStructure, [
    sql`${ordersTable.createdAt} DESC`,
  ]);
  const baseQuery = db
    .select({
      orderId: ordersTable.id,
      orderStatus: ordersTable.status,
      amountInUsdCents: ordersTable.amountInUSDCents,
      grossAmountInUsdCents: orderGrossSql(ordersTable.id),
      refundAmountInUsdCents: orderRefundSql(ordersTable.id),
      netAmountInUsdCents: orderNetSql(ordersTable.id),
      itemCount: sql<number>`(
        SELECT COUNT(*)::int FROM ${orderItemsTable} oi_count
        WHERE oi_count.order_id = ${ordersTable.id}
      )`,
      paymentCount: sql<number>`(
        SELECT COUNT(*)::int FROM ${paymentsTable} p_count
        WHERE p_count.order_id = ${ordersTable.id}
      )`,
      refundCount: sql<number>`(
        SELECT COUNT(*)::int FROM ${refundsTable} r_count
        INNER JOIN ${paymentsTable} rp_count ON rp_count.id = r_count.payment_id
        WHERE rp_count.order_id = ${ordersTable.id}
      )`,
      userId: usersTable.id,
      userEmail: usersTable.primaryEmail,
      userPrivyUserId: usersTable.privyUserId,
      nftWalletAddress: ordersTable.nftWalletAddress,
      nftChainId: ordersTable.nftChainId,
      createdAt: ordersTable.createdAt,
      updatedAt: ordersTable.updatedAt,
    })
    .from(ordersTable)
    .innerJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .where(whereClause)
    .$dynamic();

  const countQuery = db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(ordersTable)
    .innerJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .where(whereClause);

  const rowsQuery = input.pageSize
    ? baseQuery
        .orderBy(...orderByClauses)
        .limit(input.pageSize)
        .offset(((input.page ?? 1) - 1) * input.pageSize)
    : baseQuery.orderBy(...orderByClauses);

  const [rows, countRows] = await Promise.all([rowsQuery, countQuery]);
  const orderIds = rows.map((row) => row.orderId);
  const [items, payments] = await Promise.all([
    getOrderItemsForOrders(orderIds),
    getPaymentsForOrders(orderIds),
  ]);
  const itemsByOrderId = groupBy(items, (item) => item.orderId);
  const paymentsByOrderId = groupBy(payments, (payment) => payment.orderId);

  return paginatedResult(
    rows.map((row) => {
      const orderItems = itemsByOrderId.get(row.orderId) ?? [];
      const orderPayments = paymentsByOrderId.get(row.orderId) ?? [];
      const amountInUsdCents = toNumber(row.amountInUsdCents);
      const grossAmountInUsdCents = toNumber(row.grossAmountInUsdCents);
      const refundAmountInUsdCents = toNumber(row.refundAmountInUsdCents);
      const netAmountInUsdCents = toNumber(row.netAmountInUsdCents);
      const itemsWithOrderFields = orderItems.map((item) => ({
        ...item,
        orderId: row.orderId,
        orderStatus: row.orderStatus,
        orderCreatedAt: row.createdAt,
        orderUpdatedAt: row.updatedAt,
        orderAmountInUsdCents: amountInUsdCents,
        orderGrossAmountInUsdCents: grossAmountInUsdCents,
        orderRefundAmountInUsdCents: refundAmountInUsdCents,
        orderNetAmountInUsdCents: netAmountInUsdCents,
        userId: row.userId,
        userEmail: row.userEmail,
        userPrivyUserId: row.userPrivyUserId,
        nftWalletAddress: row.nftWalletAddress,
        nftChainId: row.nftChainId,
      }));
      const paymentsWithOrderFields = orderPayments.map((payment) => ({
        ...payment,
        orderId: row.orderId,
        orderStatus: row.orderStatus,
        orderCreatedAt: row.createdAt,
        orderUpdatedAt: row.updatedAt,
        orderAmountInUsdCents: amountInUsdCents,
        orderGrossAmountInUsdCents: grossAmountInUsdCents,
        orderRefundAmountInUsdCents: refundAmountInUsdCents,
        orderNetAmountInUsdCents: netAmountInUsdCents,
        userId: row.userId,
        userEmail: row.userEmail,
        userPrivyUserId: row.userPrivyUserId,
        nftWalletAddress: row.nftWalletAddress,
        nftChainId: row.nftChainId,
      }));

      return {
        ...row,
        amountInUsdCents,
        grossAmountInUsdCents,
        refundAmountInUsdCents,
        netAmountInUsdCents,
        itemCount: toNumber(row.itemCount),
        paymentCount: toNumber(row.paymentCount),
        refundCount: toNumber(row.refundCount),
        registrars: uniqueSorted(
          itemsWithOrderFields.map((item) => item.registrar),
        ),
        itemTypes: uniqueSorted(itemsWithOrderFields.map((item) => item.type)),
        paymentProviders: uniqueSorted(
          paymentsWithOrderFields.map((payment) => payment.paymentProvider),
        ),
        items: itemsWithOrderFields,
        payments: paymentsWithOrderFields,
      };
    }),
    countRows,
    input,
  );
}

async function getFinancialSummary(input: {
  dateRange: FinancialDateRangeInput;
  globalFilters?: FinancialGlobalFilters;
}) {
  const matchedOrders = buildMatchedOrdersSubquery(
    input.dateRange,
    input.globalFilters,
    'matched_orders_summary',
  );
  const matchedOrdersForRefunds = buildMatchedOrdersSubquery(
    input.dateRange,
    input.globalFilters,
    'matched_orders_refunds',
  );
  const matchedOrdersForItems = buildMatchedOrdersSubquery(
    input.dateRange,
    input.globalFilters,
    'matched_orders_items',
  );
  const matchedOrdersForRegistrar = buildMatchedOrdersSubquery(
    input.dateRange,
    input.globalFilters,
    'matched_orders_registrar',
  );
  const matchedOrdersForAutoRenew = buildMatchedOrdersSubquery(
    input.dateRange,
    input.globalFilters,
    'matched_orders_autorenew',
  );
  const matchedOrdersForPayments = buildMatchedOrdersSubquery(
    input.dateRange,
    input.globalFilters,
    'matched_orders_payments',
  );
  const matchedOrdersForDaily = buildMatchedOrdersSubquery(
    input.dateRange,
    input.globalFilters,
    'matched_orders_daily',
  );
  const matchedOrdersForStatus = buildMatchedOrdersSubquery(
    input.dateRange,
    input.globalFilters,
    'matched_orders_status',
  );
  const matchedOrdersForItemCount = buildMatchedOrdersSubquery(
    input.dateRange,
    input.globalFilters,
    'matched_orders_item_count',
  );

  const itemAllocationNetExpression = itemAllocatedNetSql(
    orderItemsTable.orderId,
    orderItemsTable.amountInUSDCents,
  );
  const paymentChainExpression = paymentChainSql(paymentsTable);

  const [
    totalsRows,
    refundsRows,
    itemTypeRows,
    registrarRows,
    autoRenewRows,
    paymentMethodRows,
    dailyRows,
    statusRows,
    itemCountRows,
  ] = await Promise.all([
    db
      .select({
        orderCount: sql<number>`COUNT(DISTINCT ${matchedOrders.id})::int`,
        paymentCount: sql<number>`COUNT(${paymentsTable.id})::int`,
        paidOrderCount: sql<number>`COUNT(DISTINCT ${matchedOrders.id}) FILTER (WHERE ${settledPaymentStatusSql(paymentsTable.status)})::int`,
        grossAmountInUsdCents: sql<number>`COALESCE(SUM(CASE WHEN ${settledPaymentStatusSql(paymentsTable.status)} THEN ${paymentsTable.amountInUSDCents} ELSE 0 END), 0)::int`,
      })
      .from(matchedOrders)
      .leftJoin(paymentsTable, eq(paymentsTable.orderId, matchedOrders.id)),
    db
      .select({
        refundCount: sql<number>`COUNT(${refundsTable.id}) FILTER (WHERE ${refundsTable.status} = 'SUCCEEDED')::int`,
        refundAmountInUsdCents: sql<number>`COALESCE(SUM(CASE WHEN ${refundsTable.status} = 'SUCCEEDED' THEN ${refundsTable.amountInUSDCents} ELSE 0 END), 0)::int`,
      })
      .from(matchedOrdersForRefunds)
      .innerJoin(
        paymentsTable,
        eq(paymentsTable.orderId, matchedOrdersForRefunds.id),
      )
      .leftJoin(refundsTable, eq(refundsTable.paymentId, paymentsTable.id)),
    db
      .select({
        type: orderItemsTable.type,
        itemCount: sql<number>`COUNT(*)::int`,
        grossAmountInUsdCents: sql<number>`COALESCE(SUM(${orderItemsTable.amountInUSDCents}), 0)::int`,
        netAmountInUsdCents: sql<number>`COALESCE(SUM(${itemAllocationNetExpression}), 0)::int`,
      })
      .from(matchedOrdersForItems)
      .innerJoin(
        orderItemsTable,
        eq(orderItemsTable.orderId, matchedOrdersForItems.id),
      )
      .groupBy(orderItemsTable.type)
      .orderBy(sql`COALESCE(SUM(${itemAllocationNetExpression}), 0) DESC`),
    db
      .select({
        registrar: orderItemsTable.registrar,
        itemCount: sql<number>`COUNT(*)::int`,
        grossAmountInUsdCents: sql<number>`COALESCE(SUM(${orderItemsTable.amountInUSDCents}), 0)::int`,
        netAmountInUsdCents: sql<number>`COALESCE(SUM(${itemAllocationNetExpression}), 0)::int`,
      })
      .from(matchedOrdersForRegistrar)
      .innerJoin(
        orderItemsTable,
        eq(orderItemsTable.orderId, matchedOrdersForRegistrar.id),
      )
      .groupBy(orderItemsTable.registrar)
      .orderBy(sql`COALESCE(SUM(${itemAllocationNetExpression}), 0) DESC`),
    db
      .select({
        itemCount: sql<number>`COUNT(*)::int`,
        grossAmountInUsdCents: sql<number>`COALESCE(SUM(${orderItemsTable.amountInUSDCents}), 0)::int`,
        netAmountInUsdCents: sql<number>`COALESCE(SUM(${itemAllocationNetExpression}), 0)::int`,
      })
      .from(matchedOrdersForAutoRenew)
      .innerJoin(
        orderItemsTable,
        eq(orderItemsTable.orderId, matchedOrdersForAutoRenew.id),
      )
      .where(
        and(
          sql`${orderItemsTable.type} = 'RENEW'`,
          sql`${orderItemsTable.metadata}->>'autoRenew' = 'true'`,
        ),
      ),
    db
      .select({
        paymentProvider: paymentsTable.paymentProvider,
        chain: paymentChainExpression,
        paymentCount: sql<number>`COUNT(*)::int`,
        grossAmountInUsdCents: sql<number>`COALESCE(SUM(CASE WHEN ${settledPaymentStatusSql(paymentsTable.status)} THEN ${paymentsTable.amountInUSDCents} ELSE 0 END), 0)::int`,
        refundAmountInUsdCents: sql<number>`COALESCE(SUM(${paymentRefundSql(paymentsTable.id)}), 0)::int`,
        netAmountInUsdCents: sql<number>`COALESCE(SUM(CASE WHEN ${settledPaymentStatusSql(paymentsTable.status)} THEN ${paymentsTable.amountInUSDCents} ELSE 0 END) - SUM(${paymentRefundSql(paymentsTable.id)}), 0)::int`,
      })
      .from(matchedOrdersForPayments)
      .innerJoin(
        paymentsTable,
        eq(paymentsTable.orderId, matchedOrdersForPayments.id),
      )
      .groupBy(paymentsTable.paymentProvider, paymentChainExpression)
      .orderBy(
        sql`COALESCE(SUM(CASE WHEN ${settledPaymentStatusSql(paymentsTable.status)} THEN ${paymentsTable.amountInUSDCents} ELSE 0 END) - SUM(${paymentRefundSql(paymentsTable.id)}), 0) DESC`,
      ),
    db
      .select({
        date: sql<string>`to_char(${matchedOrdersForDaily.createdAt}, 'YYYY-MM-DD')`,
        grossAmountInUsdCents: sql<number>`COALESCE(SUM(${orderGrossSql(matchedOrdersForDaily.id)}), 0)::int`,
        refundAmountInUsdCents: sql<number>`COALESCE(SUM(${orderRefundSql(matchedOrdersForDaily.id)}), 0)::int`,
        netAmountInUsdCents: sql<number>`COALESCE(SUM(${orderNetSql(matchedOrdersForDaily.id)}), 0)::int`,
      })
      .from(matchedOrdersForDaily)
      .groupBy(sql`to_char(${matchedOrdersForDaily.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(
        sql`to_char(${matchedOrdersForDaily.createdAt}, 'YYYY-MM-DD') ASC`,
      ),
    db
      .select({
        status: ordersTable.status,
        orderCount: sql<number>`COUNT(*)::int`,
      })
      .from(matchedOrdersForStatus)
      .innerJoin(ordersTable, eq(ordersTable.id, matchedOrdersForStatus.id))
      .groupBy(ordersTable.status),
    db
      .select({
        itemCount: sql<number>`COUNT(${orderItemsTable.id})::int`,
      })
      .from(matchedOrdersForItemCount)
      .innerJoin(
        orderItemsTable,
        eq(orderItemsTable.orderId, matchedOrdersForItemCount.id),
      ),
  ]);

  const totals = totalsRows[0] ?? {
    orderCount: 0,
    paymentCount: 0,
    paidOrderCount: 0,
    grossAmountInUsdCents: 0,
  };
  const refunds = refundsRows[0] ?? {
    refundCount: 0,
    refundAmountInUsdCents: 0,
  };
  const grossAmountInUsdCents = toNumber(totals.grossAmountInUsdCents);
  const refundAmountInUsdCents = toNumber(refunds.refundAmountInUsdCents);
  const paidOrderCount = toNumber(totals.paidOrderCount);
  const netAmountInUsdCents = grossAmountInUsdCents - refundAmountInUsdCents;

  return {
    totals: {
      orderCount: toNumber(totals.orderCount),
      paidOrderCount,
      itemCount: toNumber(itemCountRows[0]?.itemCount ?? 0),
      paymentCount: toNumber(totals.paymentCount),
      refundCount: toNumber(refunds.refundCount),
      grossAmountInUsdCents,
      refundAmountInUsdCents,
      netAmountInUsdCents,
      averageOrderValueInUsdCents:
        paidOrderCount > 0
          ? Math.round(grossAmountInUsdCents / paidOrderCount)
          : 0,
      refundRate:
        grossAmountInUsdCents > 0
          ? refundAmountInUsdCents / grossAmountInUsdCents
          : 0,
    },
    byItemType: itemTypeRows.map((row) => ({
      type: row.type,
      itemCount: toNumber(row.itemCount),
      grossAmountInUsdCents: toNumber(row.grossAmountInUsdCents),
      netAmountInUsdCents: toNumber(row.netAmountInUsdCents),
    })),
    autoRenew: {
      itemCount: toNumber(autoRenewRows[0]?.itemCount ?? 0),
      grossAmountInUsdCents: toNumber(
        autoRenewRows[0]?.grossAmountInUsdCents ?? 0,
      ),
      netAmountInUsdCents: toNumber(autoRenewRows[0]?.netAmountInUsdCents ?? 0),
    },
    byRegistrar: registrarRows.map((row) => ({
      registrar: row.registrar,
      itemCount: toNumber(row.itemCount),
      grossAmountInUsdCents: toNumber(row.grossAmountInUsdCents),
      netAmountInUsdCents: toNumber(row.netAmountInUsdCents),
    })),
    byPaymentMethod: paymentMethodRows.map((row) => ({
      paymentProvider: row.paymentProvider,
      chain: row.chain,
      paymentCount: toNumber(row.paymentCount),
      grossAmountInUsdCents: toNumber(row.grossAmountInUsdCents),
      refundAmountInUsdCents: toNumber(row.refundAmountInUsdCents),
      netAmountInUsdCents: toNumber(row.netAmountInUsdCents),
    })),
    daily: dailyRows.map((row) => ({
      date: row.date,
      grossAmountInUsdCents: toNumber(row.grossAmountInUsdCents),
      refundAmountInUsdCents: toNumber(row.refundAmountInUsdCents),
      netAmountInUsdCents: toNumber(row.netAmountInUsdCents),
    })),
    byOrderStatus: statusRows.map((row) => ({
      status: row.status,
      orderCount: toNumber(row.orderCount),
    })),
  };
}

const orderItemFilterStructure = {
  orderItemId: orderItemsTable.id,
  orderId: ordersTable.id,
  orderStatus: ordersTable.status,
  orderCreatedAt: ordersTable.createdAt,
  userEmail: usersTable.primaryEmail,
  nftWalletAddress: ordersTable.nftWalletAddress,
  nftChainId: ordersTable.nftChainId,
  normalizedDomainName: orderItemsTable.normalizedDomainName,
  amountInUsdCents: orderItemsTable.amountInUSDCents,
  durationInYears: orderItemsTable.durationInYears,
  type: orderItemsTable.type,
  registrar: orderItemsTable.registrar,
  status: orderItemsTable.status,
  createdAt: orderItemsTable.createdAt,
};

const paymentFilterStructure = {
  paymentId: paymentsTable.id,
  orderId: ordersTable.id,
  orderStatus: ordersTable.status,
  orderCreatedAt: ordersTable.createdAt,
  userEmail: usersTable.primaryEmail,
  nftWalletAddress: ordersTable.nftWalletAddress,
  nftChainId: ordersTable.nftChainId,
  status: paymentsTable.status,
  paymentProvider: paymentsTable.paymentProvider,
  paymentProviderReferenceId: paymentsTable.paymentProviderReferenceId,
  amountInUsdCents: paymentsTable.amountInUSDCents,
  chainId: sql`(${paymentsTable.nfscPaymentDetails}->>'chainId')::int`,
  createdAt: paymentsTable.createdAt,
};

const orderFilterStructure = {
  orderId: ordersTable.id,
  orderStatus: ordersTable.status,
  orderCreatedAt: ordersTable.createdAt,
  orderAmountInUsdCents: ordersTable.amountInUSDCents,
  amountInUsdCents: ordersTable.amountInUSDCents,
  grossAmountInUsdCents: orderGrossSql(ordersTable.id),
  refundAmountInUsdCents: orderRefundSql(ordersTable.id),
  netAmountInUsdCents: orderNetSql(ordersTable.id),
  itemCount: sql<number>`(
    SELECT COUNT(*)::int FROM ${orderItemsTable} oi_sort_count
    WHERE oi_sort_count.order_id = ${ordersTable.id}
  )`,
  paymentCount: sql<number>`(
    SELECT COUNT(*)::int FROM ${paymentsTable} p_sort_count
    WHERE p_sort_count.order_id = ${ordersTable.id}
  )`,
  refundCount: sql<number>`(
    SELECT COUNT(*)::int FROM ${refundsTable} r_sort_count
    INNER JOIN ${paymentsTable} rp_sort_count ON rp_sort_count.id = r_sort_count.payment_id
    WHERE rp_sort_count.order_id = ${ordersTable.id}
  )`,
  nftWalletAddress: ordersTable.nftWalletAddress,
  nftChainId: ordersTable.nftChainId,
  createdAt: ordersTable.createdAt,
  userId: usersTable.id,
  userEmail: usersTable.primaryEmail,
};

function appendDrizzlerWhere(
  whereClauses: SQL[],
  tableStructure: Record<string, unknown>,
  filters: unknown,
) {
  if (!filters) return;
  const where = buildWhereClause(
    tableStructure,
    filters as FilterOptions<Record<string, unknown>>,
  );
  if (where) {
    whereClauses.push(where);
  }
}

function buildSort(
  sorting: unknown,
  tableStructure: Record<string, unknown>,
  fallback: SQL[],
) {
  if (!sorting) {
    return fallback;
  }
  try {
    const clauses = buildSortClause(
      tableStructure,
      sorting as SortOptions<Record<string, unknown>>,
    );
    return clauses.length > 0 ? clauses : fallback;
  } catch (error) {
    logger.warn({ error, sorting }, 'Ignoring invalid financial table sort');
    return fallback;
  }
}

function buildMatchedOrdersSubquery(
  dateRange: FinancialDateRangeInput,
  filters: FinancialGlobalFilters | undefined,
  alias: string,
) {
  return db
    .select({
      id: ordersTable.id,
      createdAt: ordersTable.createdAt,
    })
    .from(ordersTable)
    .innerJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .where(and(...buildOrderWhereClauses(dateRange, filters)))
    .as(alias);
}

function buildOrderWhereClauses(
  dateRange: FinancialDateRangeInput,
  filters?: FinancialGlobalFilters,
): SQL[] {
  const { startDate, endExclusive } = resolveDateRange(dateRange);
  const whereClauses: SQL[] = [
    sql`${ordersTable.createdAt} >= ${startDate}`,
    sql`${ordersTable.createdAt} < ${endExclusive}`,
  ];

  if (filters?.orderStatus) {
    whereClauses.push(sql`${ordersTable.status} = ${filters.orderStatus}`);
  }

  if (filters?.autoRenew !== undefined) {
    whereClauses.push(
      booleanCondition(orderAutoRenewSql(ordersTable.id), filters.autoRenew),
    );
  }

  if (filters?.legacyBackfilled !== undefined) {
    whereClauses.push(
      booleanCondition(
        orderLegacyBackfilledSql(ordersTable.id),
        filters.legacyBackfilled,
      ),
    );
  }

  const term = filters?.searchTerm?.trim().toLowerCase();
  if (term) {
    const likeTerm = `%${term}%`;
    const searchCondition = or(
      sql`LOWER(${usersTable.primaryEmail}) LIKE ${likeTerm}`,
      sql`LOWER(${ordersTable.nftWalletAddress}) LIKE ${likeTerm}`,
      sql`${ordersTable.id}::text LIKE ${likeTerm}`,
      sql`${usersTable.id}::text LIKE ${likeTerm}`,
      sql`EXISTS (
        SELECT 1 FROM ${orderItemsTable} oi_search
        WHERE oi_search.order_id = ${ordersTable.id}
        AND (
          LOWER(oi_search.normalized_domain_name) LIKE ${likeTerm}
          OR oi_search.id::text LIKE ${likeTerm}
          OR LOWER(oi_search.registrar) LIKE ${likeTerm}
        )
      )`,
      sql`EXISTS (
        SELECT 1 FROM ${paymentsTable} p_search
        WHERE p_search.order_id = ${ordersTable.id}
        AND (
          p_search.id::text LIKE ${likeTerm}
          OR LOWER(p_search.payment_provider::text) LIKE ${likeTerm}
          OR LOWER(COALESCE(p_search.payment_provider_reference_id, '')) LIKE ${likeTerm}
        )
      )`,
    );
    if (searchCondition) {
      whereClauses.push(searchCondition);
    }
  }

  return whereClauses;
}

function booleanCondition(condition: SQL<boolean>, expected: boolean) {
  return sql<boolean>`COALESCE(${condition}, false) = ${expected}`;
}

function orderAutoRenewSql(orderId: unknown): SQL<boolean> {
  return sql<boolean>`(
    ${ordersTable.metadata}->>'autoRenew' = 'true'
    OR EXISTS (
      SELECT 1 FROM ${orderItemsTable} oi_auto_renew
      WHERE oi_auto_renew.order_id = ${orderId}
      AND oi_auto_renew.metadata->>'autoRenew' = 'true'
    )
  )`;
}

function orderLegacyBackfilledSql(orderId: unknown): SQL<boolean> {
  return sql<boolean>`(
    ${ordersTable.metadata}->'legacyOrderMetadata' IS NOT NULL
    OR ${ordersTable.metadata}->>'backfilled_started_finished_at' = 'true'
    OR ${ordersTable.metadata}->>'source' = 'legacy'
    OR EXISTS (
      SELECT 1 FROM ${orderItemsTable} oi_legacy_backfilled
      WHERE oi_legacy_backfilled.order_id = ${orderId}
      AND (
        oi_legacy_backfilled.metadata->'legacyOrderItemMetadata' IS NOT NULL
        OR oi_legacy_backfilled.metadata->>'backfilled_started_finished_at' = 'true'
        OR oi_legacy_backfilled.metadata->>'source' = 'legacy'
      )
    )
  )`;
}

function resolveDateRange(input: FinancialDateRangeInput) {
  const startDate = startOfUtcDay(parseDateToken(input.startDate));
  const endDate = startOfUtcDay(parseDateToken(input.endDate));
  const endExclusive = new Date(endDate.getTime() + DAY_IN_MS);

  if (startDate >= endExclusive) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Start date must be before or equal to end date',
    });
  }

  return { startDate, endExclusive };
}

function parseDateToken(value: string): Date {
  if (absoluteDateRegex.test(value)) {
    return new Date(`${value}T00:00:00.000Z`);
  }

  const today = startOfUtcDay(new Date());
  if (value === 'today') {
    return today;
  }
  if (value === 'yesterday') {
    return new Date(today.getTime() - DAY_IN_MS);
  }

  const relativeMatch = value.match(relativeDaysAgoRegex);
  if (relativeMatch) {
    return new Date(today.getTime() - Number(relativeMatch[1]) * DAY_IN_MS);
  }

  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: 'Use YYYY-MM-DD, today, yesterday, or NdaysAgo for dates',
  });
}

function startOfUtcDay(value: Date): Date {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );
}

function settledPaymentStatusSql(statusColumn: unknown): SQL<boolean> {
  return sql<boolean>`${statusColumn} IN (${settledPaymentStatusesSql()})`;
}

function settledPaymentStatusesSql() {
  return sql.join(
    settledPaymentStatuses.map((status) => sql`${status}`),
    sql`, `,
  );
}

function orderGrossSql(orderId: unknown): SQL<number> {
  return sql<number>`(
    SELECT COALESCE(SUM(p_gross.amount_in_usd_cents), 0)::int
    FROM ${paymentsTable} p_gross
    WHERE p_gross.order_id = ${orderId}
    AND p_gross.status IN (${settledPaymentStatusesSql()})
  )`;
}

function orderRefundSql(orderId: unknown): SQL<number> {
  return sql<number>`(
    SELECT COALESCE(SUM(r_refund.amount_in_usd_cents), 0)::int
    FROM ${refundsTable} r_refund
    INNER JOIN ${paymentsTable} p_refund ON p_refund.id = r_refund.payment_id
    WHERE p_refund.order_id = ${orderId}
    AND r_refund.status = 'SUCCEEDED'
  )`;
}

function orderNetSql(orderId: unknown): SQL<number> {
  return sql<number>`(${orderGrossSql(orderId)} - ${orderRefundSql(orderId)})::int`;
}

function paymentRefundSql(paymentId: unknown): SQL<number> {
  return sql<number>`(
    SELECT COALESCE(SUM(r_payment.amount_in_usd_cents), 0)::int
    FROM ${refundsTable} r_payment
    WHERE r_payment.payment_id = ${paymentId}
    AND r_payment.status = 'SUCCEEDED'
  )`;
}

function itemAllocatedNetSql(
  orderId: unknown,
  itemAmount: unknown,
): SQL<number> {
  const itemTotalSql = sql<number>`(
    SELECT COALESCE(SUM(oi_total.amount_in_usd_cents), 0)::numeric
    FROM ${orderItemsTable} oi_total
    WHERE oi_total.order_id = ${orderId}
  )`;

  return sql<number>`(
    CASE
      WHEN ${itemTotalSql} > 0 THEN ROUND(
        (${orderNetSql(orderId)})::numeric * (${itemAmount})::numeric / NULLIF(${itemTotalSql}, 0)
      )::int
      ELSE 0
    END
  )`;
}

function paymentChainSql(
  paymentTable: typeof paymentsTable,
): SQL<string | null> {
  return sql<string | null>`COALESCE(
    ${paymentTable.nfscPaymentDetails}->>'chainId',
    ${paymentTable.x402PaymentDetails}->>'network',
    'offchain'
  )`;
}

async function getOrderItemsForOrders(
  orderIds: string[],
): Promise<OrderItemRow[]> {
  if (orderIds.length === 0) return [];
  const rows = await db
    .select({
      orderItemId: orderItemsTable.id,
      orderId: orderItemsTable.orderId,
      normalizedDomainName: orderItemsTable.normalizedDomainName,
      amountInUsdCents: orderItemsTable.amountInUSDCents,
      durationInYears: orderItemsTable.durationInYears,
      type: orderItemsTable.type,
      registrar: orderItemsTable.registrar,
      status: orderItemsTable.status,
      metadata: orderItemsTable.metadata,
      createdAt: orderItemsTable.createdAt,
      updatedAt: orderItemsTable.updatedAt,
    })
    .from(orderItemsTable)
    .where(inArray(orderItemsTable.orderId, orderIds))
    .orderBy(sql`${orderItemsTable.createdAt} ASC`);

  return rows.map((row) => ({
    ...row,
    orderStatus: '',
    orderCreatedAt: row.createdAt,
    orderUpdatedAt: row.updatedAt,
    orderAmountInUsdCents: 0,
    orderGrossAmountInUsdCents: 0,
    orderRefundAmountInUsdCents: 0,
    orderNetAmountInUsdCents: 0,
    userId: '',
    userEmail: null,
    userPrivyUserId: null,
    nftWalletAddress: null,
    nftChainId: null,
    amountInUsdCents: toNumber(row.amountInUsdCents),
    metadataAutoRenew: Boolean(
      (row.metadata as { autoRenew?: boolean } | null)?.autoRenew,
    ),
  }));
}

async function getPaymentsForOrders(orderIds: string[]): Promise<PaymentRow[]> {
  if (orderIds.length === 0) return [];
  const rows = await db
    .select({
      paymentId: paymentsTable.id,
      orderId: paymentsTable.orderId,
      status: paymentsTable.status,
      paymentProvider: paymentsTable.paymentProvider,
      paymentProviderReferenceId: paymentsTable.paymentProviderReferenceId,
      amountInUsdCents: paymentsTable.amountInUSDCents,
      grossAmountInUsdCents: sql<number>`CASE WHEN ${settledPaymentStatusSql(paymentsTable.status)} THEN ${paymentsTable.amountInUSDCents} ELSE 0 END`,
      refundAmountInUsdCents: paymentRefundSql(paymentsTable.id),
      netAmountInUsdCents: sql<number>`(CASE WHEN ${settledPaymentStatusSql(paymentsTable.status)} THEN ${paymentsTable.amountInUSDCents} ELSE 0 END - ${paymentRefundSql(paymentsTable.id)})::int`,
      nfscPaymentDetails: paymentsTable.nfscPaymentDetails,
      x402PaymentDetails: paymentsTable.x402PaymentDetails,
      createdAt: paymentsTable.createdAt,
      updatedAt: paymentsTable.updatedAt,
    })
    .from(paymentsTable)
    .where(inArray(paymentsTable.orderId, orderIds))
    .orderBy(sql`${paymentsTable.createdAt} ASC`);

  const refundsByPaymentId = await getRefundsByPaymentId(
    rows.map((row) => row.paymentId),
  );
  return rows.map((row) => ({
    ...row,
    orderId: row.orderId ?? '',
    orderStatus: '',
    orderCreatedAt: row.createdAt,
    orderUpdatedAt: row.updatedAt,
    orderAmountInUsdCents: 0,
    orderGrossAmountInUsdCents: 0,
    orderRefundAmountInUsdCents: 0,
    orderNetAmountInUsdCents: 0,
    userId: '',
    userEmail: null,
    userPrivyUserId: null,
    nftWalletAddress: null,
    nftChainId: null,
    amountInUsdCents: toNumber(row.amountInUsdCents),
    grossAmountInUsdCents: toNumber(row.grossAmountInUsdCents),
    refundAmountInUsdCents: toNumber(row.refundAmountInUsdCents),
    netAmountInUsdCents: toNumber(row.netAmountInUsdCents),
    chain: getPaymentChain(row),
    walletAddress: getPaymentWalletAddress(row),
    refunds: refundsByPaymentId.get(row.paymentId) ?? [],
  }));
}

async function getRefundsByPaymentId(paymentIds: string[]) {
  if (paymentIds.length === 0) return new Map<string, RefundRow[]>();
  const rows = await db
    .select({
      id: refundsTable.id,
      paymentId: refundsTable.paymentId,
      status: refundsTable.status,
      amountInUsdCents: refundsTable.amountInUSDCents,
      paymentProviderReferenceId: refundsTable.paymentProviderReferenceId,
      chainId: refundsTable.chainId,
      walletAddress: refundsTable.walletAddress,
      createdAt: refundsTable.createdAt,
      updatedAt: refundsTable.updatedAt,
    })
    .from(refundsTable)
    .where(inArray(refundsTable.paymentId, paymentIds))
    .orderBy(sql`${refundsTable.createdAt} ASC`);

  return groupBy(
    rows.map((row) => ({
      ...row,
      amountInUsdCents: toNumber(row.amountInUsdCents),
    })),
    (row) => row.paymentId,
  );
}

function paginatedResult<T>(
  items: T[],
  countRows: Array<{ count: number }>,
  input: FinancialRowsInput,
) {
  const total = countRows[0]?.count ?? items.length;
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? Math.max(total, 1);
  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

function emptyPaginatedResult(input: FinancialTableInput) {
  return {
    items: [],
    page: input.page,
    pageSize: input.pageSize,
    total: 0,
    totalPages: 1,
  };
}

function getPaymentChain(payment: {
  nfscPaymentDetails: { chainId: number; walletAddress: string } | null;
  x402PaymentDetails: { network?: string } | null;
}): string | null {
  return (
    payment.nfscPaymentDetails?.chainId?.toString() ??
    payment.x402PaymentDetails?.network ??
    null
  );
}

function getPaymentWalletAddress(payment: {
  nfscPaymentDetails: { walletAddress: string } | null;
  x402PaymentDetails: { buyerWalletAddress?: string } | null;
}): string | null {
  return (
    payment.nfscPaymentDetails?.walletAddress ??
    payment.x402PaymentDetails?.buyerWalletAddress ??
    null
  );
}

function buildExportRows(mode: FinancialMode, rows: unknown[]) {
  switch (mode) {
    case 'orderItemsByOrder':
      return (rows as OrderItemRow[]).map(orderItemExportRow);
    case 'paymentsByOrder':
      return (rows as PaymentRow[]).map(paymentExportRow);
    case 'ordersWithItems':
      return (rows as OrderRow[]).map(orderExportRow);
  }
}

function orderItemExportRow(row: OrderItemRow): Record<string, unknown> {
  return {
    order_id: row.orderId,
    order_created_at: toIsoString(row.orderCreatedAt),
    order_status: row.orderStatus,
    user_id: row.userId,
    user_email: row.userEmail,
    order_gross_usd_cents: row.orderGrossAmountInUsdCents,
    order_refund_usd_cents: row.orderRefundAmountInUsdCents,
    order_net_usd_cents: row.orderNetAmountInUsdCents,
    item_id: row.orderItemId,
    domain: row.normalizedDomainName,
    item_type: row.type,
    item_registrar: row.registrar,
    item_status: row.status,
    item_amount_usd_cents: row.amountInUsdCents,
    item_auto_renew: row.metadataAutoRenew,
    item_created_at: toIsoString(row.createdAt),
  };
}

function paymentExportRow(row: PaymentRow): Record<string, unknown> {
  return {
    order_id: row.orderId,
    order_created_at: toIsoString(row.orderCreatedAt),
    order_status: row.orderStatus,
    user_id: row.userId,
    user_email: row.userEmail,
    order_gross_usd_cents: row.orderGrossAmountInUsdCents,
    order_refund_usd_cents: row.orderRefundAmountInUsdCents,
    order_net_usd_cents: row.orderNetAmountInUsdCents,
    payment_id: row.paymentId,
    payment_provider: row.paymentProvider,
    payment_status: row.status,
    payment_amount_usd_cents: row.amountInUsdCents,
    payment_gross_usd_cents: row.grossAmountInUsdCents,
    payment_refund_usd_cents: row.refundAmountInUsdCents,
    payment_net_usd_cents: row.netAmountInUsdCents,
    payment_chain: row.chain,
    payment_wallet_address: row.walletAddress,
    payment_reference_id: row.paymentProviderReferenceId,
    payment_created_at: toIsoString(row.createdAt),
    refund_ids: row.refunds.map((refund) => refund.id).join(';'),
  };
}

function orderExportRow(row: OrderRow): Record<string, unknown> {
  return {
    order_id: row.orderId,
    order_created_at: toIsoString(row.createdAt),
    order_status: row.orderStatus,
    user_id: row.userId,
    user_email: row.userEmail,
    nft_wallet_address: row.nftWalletAddress,
    nft_chain_id: row.nftChainId,
    order_amount_usd_cents: row.amountInUsdCents,
    order_gross_usd_cents: row.grossAmountInUsdCents,
    order_refund_usd_cents: row.refundAmountInUsdCents,
    order_net_usd_cents: row.netAmountInUsdCents,
    item_count: row.itemCount,
    payment_count: row.paymentCount,
    refund_count: row.refundCount,
    item_ids: row.items.map((item) => item.orderItemId).join(';'),
    payment_ids: row.payments.map((payment) => payment.paymentId).join(';'),
    registrars: row.registrars.join(';'),
    item_types: row.itemTypes.join(';'),
    payment_providers: row.paymentProviders.join(';'),
  };
}

function getExportHeaders(mode: FinancialMode) {
  switch (mode) {
    case 'orderItemsByOrder':
      return orderItemExportHeaders;
    case 'paymentsByOrder':
      return paymentExportHeaders;
    case 'ordersWithItems':
      return orderExportHeaders;
  }
}

function rowsToCsv(
  rows: Array<Record<string, unknown>>,
  headers: readonly string[],
) {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(','));
  }
  return lines.join('\n');
}

function csvEscape(value: unknown) {
  if (value === null || value === undefined) return '';
  const stringValue =
    typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (csvEscapeRequiredRegex.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }
  return stringValue;
}

function buildExportFileName(
  mode: string,
  format: 'csv' | 'json',
  dateRange: FinancialDateRangeInput,
) {
  const start = dateRange.startDate.slice(0, MAX_EXPORT_FILE_NAME_DATE_LENGTH);
  const end = dateRange.endDate.slice(0, MAX_EXPORT_FILE_NAME_DATE_LENGTH);
  return `financials-${mode}-${start}-to-${end}.${format}`;
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    const key = getKey(item);
    const existing = grouped.get(key);
    if (existing) existing.push(item);
    else grouped.set(key, [item]);
  }
  return grouped;
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') return Number(value);
  return 0;
}

function toIsoString(value: Date | string) {
  return new Date(value).toISOString();
}

function throwFinancialError(error: unknown, message: string): never {
  if (error instanceof TRPCError) throw error;
  logger.error({ error }, message);
  throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message });
}
