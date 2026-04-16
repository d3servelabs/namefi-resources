import {
  db,
  namefiNftCte,
  namefiNftView,
  usersTable,
  domainConfigTable,
  domainUserPreferencesTable,
} from '@namefi-astra/db';
import { Permission } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, asc, eq, sql, type SQL } from 'drizzle-orm';
import {
  buildWhereClause,
  buildSortClause,
  type FilterOptions,
  type SortOptions,
} from '@samyx/drizzler-filters-sorters';
import {
  adminProcedureWithPermissions,
  auditedAdminProcedureWithPermissions,
} from '../../base';
import { createContractTRPCRouter } from '../../contract';
import { adminDomainPreferencesContract } from '@namefi-astra/common/contract/admin/admin-domain-preferences-contract';
import { updateDomainPreferencesAndConfig } from '#lib/domains/domain-preferences';
import { logger } from '#lib/logger';
import { ResourceType } from '#lib/auditor';
import {
  ensurePrivyTableFresh,
  privyUsersTableSchema,
} from '../../../services/admin/privy-user-cache';

export const domainPreferencesRouter = createContractTRPCRouter<
  typeof adminDomainPreferencesContract
>({
  listDomainPreferences: adminProcedureWithPermissions(
    Permission.READ_DOMAIN_PREFERENCES,
  )
    .input(adminDomainPreferencesContract.listDomainPreferences.input)
    .output(adminDomainPreferencesContract.listDomainPreferences.output)
    .query(async ({ input }) => {
      const { page, pageSize, filters, sorting } = input;
      const offset = (page - 1) * pageSize;

      await ensurePrivyTableFresh();

      const tableStructure = {
        userId: usersTable.id,
        normalizedDomainName: namefiNftView.normalizedDomainName,
        ownerAddress: namefiNftView.ownerAddress,
        chainId: namefiNftView.chainId,
        autoRenewEnabled: sql<
          string | null
        >`${domainUserPreferencesTable.autoRenewEnabled}::text`,
        autoEnsEnabled: sql<
          string | null
        >`${domainConfigTable.autoEnsEnabled}::text`,
        autoParkEnabled: sql<
          string | null
        >`${domainConfigTable.autoParkEnabled}::text`,
        forwardTo: domainConfigTable.forwardTo,
      };

      const baseQuery = db
        .with(namefiNftCte)
        .select({
          userId: usersTable.id,
          normalizedDomainName: namefiNftView.normalizedDomainName,
          chainId: namefiNftView.chainId,
          ownerAddress: namefiNftView.ownerAddress,
          autoRenewEnabled: domainUserPreferencesTable.autoRenewEnabled,
          autoEnsEnabled: domainConfigTable.autoEnsEnabled,
          autoParkEnabled: domainConfigTable.autoParkEnabled,
          forwardTo: domainConfigTable.forwardTo,
        })
        .from(privyUsersTableSchema)
        .leftJoin(
          usersTable,
          eq(usersTable.privyUserId, privyUsersTableSchema.privyUserId),
        )
        .innerJoin(
          namefiNftView,
          sql`LOWER(${namefiNftView.ownerAddress}) = ANY( array_lowercase(${privyUsersTableSchema.wallets}))`,
        )
        .leftJoin(
          domainConfigTable,
          eq(
            domainConfigTable.normalizedDomainName,
            namefiNftView.normalizedDomainName,
          ),
        )
        .leftJoin(
          domainUserPreferencesTable,
          and(
            eq(
              domainUserPreferencesTable.normalizedDomainName,
              namefiNftView.normalizedDomainName,
            ),
            eq(domainUserPreferencesTable.userId, usersTable.id),
          ),
        )
        .$dynamic();

      const whereClauses: SQL[] = [];

      if (filters) {
        const drizzlerWhere = buildWhereClause(
          tableStructure,
          filters as FilterOptions<any>,
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
        ? buildSortClause(tableStructure, sorting as SortOptions<any>)
        : [asc(namefiNftView.normalizedDomainName)];

      try {
        const countQuery = db
          .with(namefiNftCte)
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(privyUsersTableSchema)
          .leftJoin(
            usersTable,
            eq(usersTable.privyUserId, privyUsersTableSchema.privyUserId),
          )
          .innerJoin(
            namefiNftView,
            sql`LOWER(${namefiNftView.ownerAddress}) = ANY( array_lowercase(${privyUsersTableSchema.wallets}))`,
          )
          .leftJoin(
            domainConfigTable,
            eq(
              domainConfigTable.normalizedDomainName,
              namefiNftView.normalizedDomainName,
            ),
          )
          .leftJoin(
            domainUserPreferencesTable,
            and(
              eq(
                domainUserPreferencesTable.normalizedDomainName,
                namefiNftView.normalizedDomainName,
              ),
              eq(domainUserPreferencesTable.userId, usersTable.id),
            ),
          )
          .$dynamic();

        let countQueryWithWhere = countQuery;
        if (whereClauses.length > 0) {
          countQueryWithWhere = countQuery.where(and(...whereClauses));
        }

        const [rows, countRow] = await Promise.all([
          query
            .orderBy(...orderByClauses)
            .limit(pageSize)
            .offset(offset),
          countQueryWithWhere,
        ]);

        const total = countRow[0]?.count ?? 0;

        return {
          data: rows,
          pagination: {
            page,
            pageSize,
            totalCount: total,
            totalPages: Math.ceil(total / pageSize),
          },
        };
      } catch (error) {
        logger.error({ error }, 'Failed to list domain preferences');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to list domain preferences',
        });
      }
    }),

  updateDomainPreferences: auditedAdminProcedureWithPermissions(
    Permission.WRITE_DOMAIN_PREFERENCES,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.DOMAIN,
      resourceId: input.domainName,
      action: 'update_domain_preferences',
      extraInput: input,
    }),
  )
    .input(adminDomainPreferencesContract.updateDomainPreferences.input)
    .output(adminDomainPreferencesContract.updateDomainPreferences.output)
    .mutation(async ({ ctx, input }) => {
      await ensurePrivyTableFresh();
      const { domainName, domainPreferencesAndConfig } = input;

      const ownerQuery = await db
        .with(namefiNftCte)
        .select({
          normalizedDomainName: namefiNftView.normalizedDomainName,
          userId: usersTable.id,
          privyUserId: usersTable.privyUserId,
        })
        .from(privyUsersTableSchema)
        .innerJoin(
          namefiNftView,
          sql`LOWER(${namefiNftView.ownerAddress}) = ANY( array_lowercase(${privyUsersTableSchema.wallets}))`,
        )
        .innerJoin(
          usersTable,
          eq(usersTable.privyUserId, privyUsersTableSchema.privyUserId),
        )
        .where(eq(namefiNftView.normalizedDomainName, domainName))
        .limit(1);
      const owner = ownerQuery[0];
      if (!owner || !owner.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `You cannot change the config and preferences for this domain. domain(${domainName}) owner account is not found`,
        });
      }

      await updateDomainPreferencesAndConfig(
        domainName,
        owner.userId,
        domainPreferencesAndConfig,
      );

      return { success: true };
    }),
});
