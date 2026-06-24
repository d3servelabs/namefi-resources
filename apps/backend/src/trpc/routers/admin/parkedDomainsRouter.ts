import {
  db,
  domainConfigTable,
  namefiNftCte,
  namefiNftView,
  parkedDomainVerificationsTable,
} from '@namefi-astra/db';
import { Permission } from '@namefi-astra/utils';
import { and, asc, eq, sql, type SQL } from 'drizzle-orm';
import {
  buildSortClause,
  buildWhereClause,
  type FilterOptions,
  type SortOptions,
} from '@samyx/drizzler-filters-sorters';
import { adminParkedDomainsContract } from '@namefi-astra/common/contract/admin/admin-parked-domains-contract';
import { adminProcedureWithPermissions } from '../../base';
import { createContractTRPCRouter } from '../../contract';
import {
  ACTIVE_PARKED_CONDITION,
  parkedDomainConfigJoinOn,
} from '#lib/domains/parked-domain-query';
import { verifyParkedDomains } from '#lib/domains/parking-verification';
import { logger } from '#lib/logger';

export const parkedDomainsRouter = createContractTRPCRouter<
  typeof adminParkedDomainsContract
>({
  listParkedDomains: adminProcedureWithPermissions(
    Permission.READ_PARKED_DOMAINS,
  )
    .input(adminParkedDomainsContract.listParkedDomains.input)
    .output(adminParkedDomainsContract.listParkedDomains.output)
    .query(async ({ input }) => {
      const { page, pageSize, filters, sorting } = input;
      const offset = (page - 1) * pageSize;

      // One verification row per domain (unique), so this LEFT JOIN never
      // multiplies rows.
      const verificationJoinOn = eq(
        parkedDomainVerificationsTable.normalizedDomainName,
        namefiNftView.normalizedDomainName,
      );

      // Columns exposed to the drizzler filter/sort builder.
      const tableStructure = {
        normalizedDomainName: namefiNftView.normalizedDomainName,
        ownerAddress: namefiNftView.ownerAddress,
        chainId: namefiNftView.chainId,
        forwardTo: domainConfigTable.forwardTo,
        autoParkEnabled: sql<
          string | null
        >`${domainConfigTable.autoParkEnabled}::text`,
        lastCheckedAt: parkedDomainVerificationsTable.checkedAt,
      };

      const buildBase = () =>
        db
          .with(namefiNftCte)
          .select({
            normalizedDomainName: namefiNftView.normalizedDomainName,
            ownerAddress: namefiNftView.ownerAddress,
            chainId: namefiNftView.chainId,
            forwardTo: domainConfigTable.forwardTo,
            autoParkEnabled: domainConfigTable.autoParkEnabled,
            lastCheckedAt: parkedDomainVerificationsTable.checkedAt,
            lastOverall: parkedDomainVerificationsTable.overall,
            lastResult: parkedDomainVerificationsTable.result,
          })
          .from(namefiNftView)
          .leftJoin(domainConfigTable, parkedDomainConfigJoinOn)
          .leftJoin(parkedDomainVerificationsTable, verificationJoinOn)
          .$dynamic();

      const whereClauses: SQL[] = [ACTIVE_PARKED_CONDITION];
      if (filters) {
        const drizzlerWhere = buildWhereClause(
          tableStructure,
          filters as FilterOptions<any>,
        );
        if (drizzlerWhere) whereClauses.push(drizzlerWhere);
      }
      const where = and(...whereClauses);

      const orderByClauses = sorting
        ? buildSortClause(tableStructure, sorting as SortOptions<any>)
        : [asc(namefiNftView.normalizedDomainName)];

      try {
        const countQuery = db
          .with(namefiNftCte)
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(namefiNftView)
          .leftJoin(domainConfigTable, parkedDomainConfigJoinOn)
          // Mirror the base query's joins so a filter on `lastCheckedAt`
          // (from parkedDomainVerificationsTable) is valid in the count path too.
          .leftJoin(parkedDomainVerificationsTable, verificationJoinOn)
          .where(where);

        const [rows, countRow] = await Promise.all([
          buildBase()
            .where(where)
            .orderBy(...orderByClauses)
            .limit(pageSize)
            .offset(offset),
          countQuery,
        ]);

        const total = countRow[0]?.count ?? 0;

        return {
          // Keep `normalizedDomainName` as the key so the frontend table's
          // sort/filter column ids line up with this query's `tableStructure`.
          data: rows.map((row) => ({
            normalizedDomainName: row.normalizedDomainName,
            ownerAddress: row.ownerAddress,
            chainId: row.chainId,
            forwardTo: row.forwardTo ?? null,
            mode: row.forwardTo?.trim()
              ? ('forward' as const)
              : ('park' as const),
            lastCheckedAt: row.lastCheckedAt
              ? row.lastCheckedAt.toISOString()
              : null,
            lastOverall: row.lastOverall ?? null,
            lastResult: row.lastResult ?? null,
          })),
          pagination: {
            page,
            pageSize,
            totalCount: total,
            totalPages: Math.ceil(total / pageSize),
          },
        };
      } catch (error) {
        // List endpoints in this admin router family degrade to an empty result
        // so the UI renders empty-state predictably instead of erroring.
        logger.error({ error }, 'Failed to list parked domains');
        return {
          data: [],
          pagination: { page, pageSize, totalCount: 0, totalPages: 0 },
        };
      }
    }),

  listAllParkedDomainNames: adminProcedureWithPermissions(
    Permission.READ_PARKED_DOMAINS,
  )
    .input(adminParkedDomainsContract.listAllParkedDomainNames.input)
    .output(adminParkedDomainsContract.listAllParkedDomainNames.output)
    .query(async ({ input }) => {
      try {
        const [rows, countRow] = await Promise.all([
          db
            .with(namefiNftCte)
            .selectDistinct({
              normalizedDomainName: namefiNftView.normalizedDomainName,
            })
            .from(namefiNftView)
            .leftJoin(domainConfigTable, parkedDomainConfigJoinOn)
            .where(ACTIVE_PARKED_CONDITION)
            // Stable order so the capped subset is deterministic.
            .orderBy(asc(namefiNftView.normalizedDomainName))
            .limit(input.limit),
          db
            .with(namefiNftCte)
            .select({
              count: sql<number>`COUNT(DISTINCT ${namefiNftView.normalizedDomainName})::int`,
            })
            .from(namefiNftView)
            .leftJoin(domainConfigTable, parkedDomainConfigJoinOn)
            .where(ACTIVE_PARKED_CONDITION),
        ]);
        const total = countRow[0]?.count ?? rows.length;
        return {
          domains: rows.map((r) => r.normalizedDomainName),
          total,
          truncated: total > rows.length,
        };
      } catch (error) {
        logger.error({ error }, 'Failed to list all parked domain names');
        return { domains: [], total: 0, truncated: false };
      }
    }),

  verifyParkedDomains: adminProcedureWithPermissions(
    Permission.READ_PARKED_DOMAINS,
  )
    .input(adminParkedDomainsContract.verifyParkedDomains.input)
    .output(adminParkedDomainsContract.verifyParkedDomains.output)
    .mutation(async ({ input }) => {
      const results = await verifyParkedDomains(input.domains, {
        concurrency: 8,
      });
      return { results };
    }),
});
