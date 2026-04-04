import {
  db,
  namefiNftView,
  indexedDomainsTable,
  usersTable,
  namefiNftCte,
  domainUserPreferencesTable,
} from '@namefi-astra/db';
import {
  buildWhereClause,
  buildSortClause,
  type FilterOptions,
  type SortOptions,
} from '@samyx/drizzler-filters-sorters';
import { and, eq, inArray, or, type SQL, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getPoweredByNamefi3PDomains } from '#lib/namefi-registry';
import { getConfiguredAllowedChainIds } from '#lib/env/allowed-chains';
import {
  ensurePrivyTableFresh,
  privyUsersTableSchema,
} from './privy-user-cache';
import {
  DATE_MISMATCH_THRESHOLD_SECONDS,
  MAX_GRACE_PERIOD_DAYS,
  type NftManagementFilterRow,
} from './common';

export const getNftsWithExpirationStatusInputSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(25),
  searchTerm: z.string().optional(),
  filters: z.any().optional(),
  sorting: z.any().optional(),
});

export async function getNftsWithExpirationStatus(
  input: z.output<typeof getNftsWithExpirationStatusInputSchema>,
) {
  const { page, pageSize, searchTerm, filters, sorting } = input;
  const offset = (page - 1) * pageSize;

  await ensurePrivyTableFresh();

  const poweredByNamefiDomains = [
    ...(await getPoweredByNamefi3PDomains()),
    'withharris.club',
    'withtrump.club',
    'defi.build',
  ];
  const configuredAllowedChainIds = getConfiguredAllowedChainIds();

  // Extract the powered-by-namefi condition to avoid repetition
  const isPoweredByNamefiCondition = sql<boolean>`array_to_string((string_to_array(${namefiNftView.normalizedDomainName}, '.'))[2:], '.') = ANY(${sql.raw(`ARRAY[${poweredByNamefiDomains.map((d) => `'${d}'`).join(',')}]`)})`;

  // Build filters to exclude disallowed chains and test domains
  const isConfiguredAllowedChainCondition =
    configuredAllowedChainIds.length > 0
      ? inArray(namefiNftView.chainId, configuredAllowedChainIds)
      : sql<boolean>`false`;
  const isTestDomainCondition = sql<boolean>`split_part(${namefiNftView.normalizedDomainName}, '.', -1) LIKE 'test%'`;

  const nftStatusRows = db
    .with(namefiNftCte)
    .select({
      normalizedDomainName: namefiNftView.normalizedDomainName,
      chainId: namefiNftView.chainId,
      asOfBlockNumber: sql<bigint>`${namefiNftView.lastUpdatedBlock}`.as(
        'as_of_block_number',
      ),
      ownerAddress: namefiNftView.ownerAddress,
      nftExpirationTime: namefiNftView.expirationTime,
      domainExpirationTime: sql<Date | null>`
      CASE
        WHEN ${isPoweredByNamefiCondition}
        THEN ${namefiNftView.expirationTime}
        ELSE ${indexedDomainsTable.expirationTime}
      END
    `.as('domain_expiration_time'),
      registrarKey: sql<string | null>`
      CASE
        WHEN ${isPoweredByNamefiCondition}
        THEN 'Powered by Namefi'
        ELSE ${indexedDomainsTable.registrarKey}
      END
    `.as('registrar_key'),
      lastIndexedAt: indexedDomainsTable.lastIndexedAt,
      isPoweredByNamefiDomain: isPoweredByNamefiCondition.as(
        'is_powered_by_namefi_domain',
      ),
      canBurn: sql<boolean>`
      CASE
        WHEN ${isPoweredByNamefiCondition}
        THEN false
        WHEN ${indexedDomainsTable.expirationTime} IS NULL OR ${namefiNftView.expirationTime} IS NULL
        THEN true
        WHEN ABS(EXTRACT(EPOCH FROM (${namefiNftView.expirationTime} - ${indexedDomainsTable.expirationTime}))) > ${DATE_MISMATCH_THRESHOLD_SECONDS}
        THEN false
        ELSE (
          ( NOW() - coalesce(${indexedDomainsTable.expirationTime}, ${namefiNftView.expirationTime}) ) > interval '${sql.raw(MAX_GRACE_PERIOD_DAYS.toString())} days'
        )
      END
    `.as('can_burn'),
      domainStatus: sql<string>`
      CASE
        WHEN ${indexedDomainsTable.expirationTime} IS NULL THEN 'not-found'
        WHEN ${indexedDomainsTable.expirationTime} < NOW() THEN 'expired'
        ELSE 'active'
      END
    `.as('domain_status'),
      nftStatus: sql<string>`
      CASE
        WHEN ${namefiNftView.expirationTime} IS NULL THEN 'not-available'
        WHEN ${namefiNftView.expirationTime} < NOW() THEN 'expired'
        ELSE 'active'
      END
    `.as('nft_status'),
      hasMissingData: sql<boolean>`
      CASE
        WHEN ${isPoweredByNamefiCondition}
        THEN ${namefiNftView.expirationTime} IS NULL
        ELSE ${namefiNftView.expirationTime} IS NULL OR ${indexedDomainsTable.expirationTime} IS NULL
      END
    `.as('has_missing_data'),
      hasDateMismatch: sql<boolean>`
      CASE
        WHEN ${isPoweredByNamefiCondition}
        THEN false
        WHEN ${namefiNftView.expirationTime} IS NULL OR ${indexedDomainsTable.expirationTime} IS NULL
        THEN false
          ELSE ABS(EXTRACT(EPOCH FROM (${namefiNftView.expirationTime} - ${indexedDomainsTable.expirationTime}))) > ${DATE_MISMATCH_THRESHOLD_SECONDS}
      END
    `.as('has_date_mismatch'),
      dateState: sql<string>`
      CASE
        WHEN ${isPoweredByNamefiCondition}
        THEN CASE
          WHEN ${namefiNftView.expirationTime} IS NULL THEN 'missing-data'
          ELSE 'match'
        END
        WHEN ${namefiNftView.expirationTime} IS NULL OR ${indexedDomainsTable.expirationTime} IS NULL
        THEN 'missing-data'
        WHEN ABS(EXTRACT(EPOCH FROM (${namefiNftView.expirationTime} - ${indexedDomainsTable.expirationTime}))) > ${DATE_MISMATCH_THRESHOLD_SECONDS}
        THEN 'date-mismatch'
        ELSE 'match'
      END
    `.as('date_state'),
      needsExpirationReview: sql<boolean>`
      CASE
        WHEN ${isPoweredByNamefiCondition}
        THEN false
        WHEN ${namefiNftView.expirationTime} IS NULL OR ${indexedDomainsTable.expirationTime} IS NULL
        THEN true
        ELSE ABS(EXTRACT(EPOCH FROM (${namefiNftView.expirationTime} - ${indexedDomainsTable.expirationTime}))) > ${DATE_MISMATCH_THRESHOLD_SECONDS}
      END
    `.as('needs_expiration_review'),
      isExpired: sql<boolean>`
      CASE
        WHEN ${isPoweredByNamefiCondition}
        THEN COALESCE(${namefiNftView.expirationTime} < NOW(), false)
        ELSE (
          COALESCE(${indexedDomainsTable.expirationTime} < NOW(), false)
          OR COALESCE(${namefiNftView.expirationTime} < NOW(), false)
        )
      END
    `.as('is_expired'),
      userId: sql<string | null>`MAX(${usersTable.id}::text)`.as(
        'namefi_user_id',
      ),
      privyUserId: sql<
        string | null
      >`MAX(${privyUsersTableSchema.privyUserId})`.as('privy_user_id'),
      displayName: sql<
        string | null
      >`MAX(${privyUsersTableSchema.displayName})`.as('display_name'),
      primaryEmail: sql<
        string | null
      >`MAX(COALESCE(${usersTable.primaryEmail}, ${privyUsersTableSchema.email}))`.as(
        'primary_email',
      ),
    })
    .from(namefiNftView)
    .leftJoin(
      indexedDomainsTable,
      eq(
        namefiNftView.normalizedDomainName,
        indexedDomainsTable.normalizedDomainName,
      ),
    )
    .leftJoin(
      privyUsersTableSchema,
      sql`LOWER(${namefiNftView.ownerAddress}) = ANY(array_lowercase(${privyUsersTableSchema.wallets}))`,
    )
    .leftJoin(
      usersTable,
      eq(usersTable.privyUserId, privyUsersTableSchema.privyUserId),
    )
    .where(
      and(isConfiguredAllowedChainCondition, sql`NOT ${isTestDomainCondition}`),
    )
    .groupBy(
      namefiNftView.normalizedDomainName,
      namefiNftView.chainId,
      namefiNftView.lastUpdatedBlock,
      namefiNftView.ownerAddress,
      namefiNftView.expirationTime,
      indexedDomainsTable.expirationTime,
      indexedDomainsTable.registrarKey,
      indexedDomainsTable.lastIndexedAt,
    )
    .as('nft_status_rows');

  const tableStructure = {
    normalizedDomainName: nftStatusRows.normalizedDomainName,
    chainId: nftStatusRows.chainId,
    ownerAddress: nftStatusRows.ownerAddress,
    autoRenewEnabled: sql<
      string | null
    >`${domainUserPreferencesTable.autoRenewEnabled}::text`,
    domainStatus: nftStatusRows.domainStatus,
    nftStatus: nftStatusRows.nftStatus,
    nftExpirationTime: nftStatusRows.nftExpirationTime,
    domainExpirationTime: nftStatusRows.domainExpirationTime,
    registrarKey: nftStatusRows.registrarKey,
    dateState: nftStatusRows.dateState,
    userId: nftStatusRows.userId,
    privyUserId: nftStatusRows.privyUserId,
    displayName: nftStatusRows.displayName,
    primaryEmail: nftStatusRows.primaryEmail,
    isPoweredByNamefiDomain: sql`${nftStatusRows.isPoweredByNamefiDomain}::text`,
    canBurn: sql`${nftStatusRows.canBurn}::text`,
    hasMissingData: sql`${nftStatusRows.hasMissingData}::text`,
    hasDateMismatch: sql`${nftStatusRows.hasDateMismatch}::text`,
    needsExpirationReview: sql`${nftStatusRows.needsExpirationReview}::text`,
    isExpired: sql`${nftStatusRows.isExpired}::text`,
  };

  const baseQuery = db
    .select({
      normalizedDomainName: nftStatusRows.normalizedDomainName,
      chainId: nftStatusRows.chainId,
      asOfBlockNumber: nftStatusRows.asOfBlockNumber,
      ownerAddress: nftStatusRows.ownerAddress,
      autoRenewEnabled: domainUserPreferencesTable.autoRenewEnabled,
      domainStatus: nftStatusRows.domainStatus,
      nftStatus: nftStatusRows.nftStatus,
      nftExpirationTime: nftStatusRows.nftExpirationTime,
      domainExpirationTime: nftStatusRows.domainExpirationTime,
      registrarKey: nftStatusRows.registrarKey,
      dateState: nftStatusRows.dateState,
      lastIndexedAt: nftStatusRows.lastIndexedAt,
      isPoweredByNamefiDomain: nftStatusRows.isPoweredByNamefiDomain,
      canBurn: nftStatusRows.canBurn,
      hasMissingData: nftStatusRows.hasMissingData,
      hasDateMismatch: nftStatusRows.hasDateMismatch,
      needsExpirationReview: nftStatusRows.needsExpirationReview,
      isExpired: nftStatusRows.isExpired,
      userId: nftStatusRows.userId,
      privyUserId: nftStatusRows.privyUserId,
      displayName: nftStatusRows.displayName,
      primaryEmail: nftStatusRows.primaryEmail,
    })
    .from(nftStatusRows)
    .leftJoin(
      domainUserPreferencesTable,
      and(
        eq(
          domainUserPreferencesTable.normalizedDomainName,
          nftStatusRows.normalizedDomainName,
        ),
        sql`${domainUserPreferencesTable.userId}::text = ${nftStatusRows.userId}::text`,
      ),
    )
    .$dynamic();

  const whereClauses: SQL[] = [];

  const trimmedSearchTerm = searchTerm?.trim();
  if (trimmedSearchTerm) {
    const likeTerm = `%${trimmedSearchTerm}%`;
    const searchCondition = or(
      sql`${nftStatusRows.normalizedDomainName} ILIKE ${likeTerm}`,
      sql`${nftStatusRows.ownerAddress} ILIKE ${likeTerm}`,
    );

    if (searchCondition) {
      whereClauses.push(searchCondition);
    }
  }

  if (filters) {
    const drizzlerWhere = buildWhereClause(
      tableStructure,
      filters as FilterOptions<NftManagementFilterRow>,
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
    ? buildSortClause(
        tableStructure,
        sorting as SortOptions<NftManagementFilterRow>,
      )
    : [
        sql`${nftStatusRows.normalizedDomainName} ASC NULLS LAST`,
        sql`${nftStatusRows.chainId} ASC NULLS LAST`,
      ];

  const countQuery = db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(query.as('sq'));

  const [results, countResult] = await Promise.all([
    query
      .orderBy(...orderByClauses)
      .limit(pageSize)
      .offset(offset),
    countQuery,
  ]);

  const totalCount = countResult[0]?.count ?? 0;

  return {
    data: results.map((result) => ({
      normalizedDomainName: result.normalizedDomainName,
      chainId: result.chainId,
      asOfBlockNumber: result.asOfBlockNumber,
      ownerAddress: result.ownerAddress,
      autoRenewEnabled: result.autoRenewEnabled,
      domainStatus: result.domainStatus,
      nftStatus: result.nftStatus,
      nftExpirationTime: result.nftExpirationTime,
      domainExpirationTime: result.domainExpirationTime,
      registrarKey: result.registrarKey,
      dateState: result.dateState,
      lastIndexedAt: result.lastIndexedAt,
      isPoweredByNamefiDomain: result.isPoweredByNamefiDomain,
      canBurn: result.canBurn,
      hasMissingData: result.hasMissingData,
      hasDateMismatch: result.hasDateMismatch,
      needsExpirationReview: result.needsExpirationReview,
      isExpired: result.isExpired,
      userId: result.userId,
      privyUserId: result.privyUserId,
      displayName: result.displayName,
      primaryEmail: result.primaryEmail,
    })),
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    },
  };
}
