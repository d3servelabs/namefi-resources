import {
  db,
  namefiNftCte,
  namefiNftView,
  usersTable,
  indexedDomainsTable,
  domainConfigTable,
} from '@namefi-astra/db';
import { Permission } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import {
  and,
  asc,
  eq,
  inArray,
  like,
  not,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import {
  buildWhereClause,
  buildSortClause,
  type FilterOptions,
  type SortOptions,
} from '@samyx/drizzler-filters-sorters';
import {
  toPunycodeDomainName,
  toPunycodeFqdn,
} from '@namefi-astra/registrars/lib/data/validations';
import {
  adminProcedureWithPermissions,
  auditedAdminProcedureWithPermissions,
} from '../../base';
import { createContractTRPCRouter } from '../../contract';
import { adminNsAndDnssecContract } from '@namefi-astra/common/contract/admin/admin-ns-and-dnssec-contract';
import {
  enableAutoDnssecForDomain,
  disableDnssecForDomain,
  getDnssecStatusDetails,
} from '#lib/domains/dnssec';
import {
  submitNameserversChangeWorkflow,
  submitResetNameserversWorkflow,
} from '#lib/domains/nameservers';
import { getPoweredByNamefi3PDomains } from '#lib/namefi-registry';
import { logger } from '#lib/logger';
import { ResourceType } from '#lib/auditor';
import { config } from '#lib/env';
import {
  ensurePrivyTableFresh,
  privyUsersTableSchema,
} from '../../../services/admin/privy-user-cache';
import { temporalClient } from '../../../temporal/client';
import { TEMPORAL_QUEUES } from '../../../temporal/shared';
import { enableDnssecWorkflow } from '../../../temporal/workflows/enable-dnssec.workflow';
import { disableDnssecWorkflow } from '../../../temporal/workflows/disable-dnssec.workflow';
import { changeNameserversWorkflow } from '../../../temporal/workflows/change-nameservers.workflow';
import { resetNameserversWorkflow } from '../../../temporal/workflows/reset-nameservers.workflow';

type ActiveWorkflowOperation =
  | 'ENABLE_DNSSEC'
  | 'REMOVE_DNSSEC'
  | 'CHANGE_NAMESERVERS'
  | 'RESET_NAMESERVERS';

type ActiveWorkflow = {
  operation: ActiveWorkflowOperation;
  workflowId: string;
  runId: string;
  workflowType: string;
  status: 'RUNNING';
};

function operationFromWorkflowId(
  workflowId: string,
): ActiveWorkflowOperation | null {
  if (workflowId.startsWith('enable-dnssec-')) return 'ENABLE_DNSSEC';
  if (workflowId.startsWith('disable-dnssec-')) return 'REMOVE_DNSSEC';
  if (workflowId.startsWith('change-nameservers-')) return 'CHANGE_NAMESERVERS';
  if (workflowId.startsWith('reset-nameservers-')) return 'RESET_NAMESERVERS';
  return null;
}

/**
 * For a page of domains, returns a map of normalized domain name → active
 * workflows split into (dnssec, nameservers). Issues a single
 * `temporalClient.workflow.list` call with all candidate workflow IDs OR'd
 * together — much cheaper than four queries per row.
 */
async function getActiveWorkflowsForDomains(
  domainNames: string[],
): Promise<
  Map<string, { dnssec: ActiveWorkflow | null; ns: ActiveWorkflow | null }>
> {
  const result = new Map<
    string,
    { dnssec: ActiveWorkflow | null; ns: ActiveWorkflow | null }
  >();
  for (const name of domainNames) {
    result.set(name, { dnssec: null, ns: null });
  }

  if (domainNames.length === 0) return result;

  // Map punycoded workflow domain → normalized domain so we can route hits
  // back to the original row.
  const punyToNormalized = new Map<string, string>();
  const workflowIds: string[] = [];
  for (const name of domainNames) {
    const puny = toPunycodeDomainName(name);
    punyToNormalized.set(puny, name);
    workflowIds.push(
      enableDnssecWorkflow.generateId({ domainName: puny }),
      disableDnssecWorkflow.generateId({ domainName: puny }),
      changeNameserversWorkflow.generateId({
        domainName: puny,
        nameservers: [],
      }),
      resetNameserversWorkflow.generateId({ domainName: puny }),
    );
  }

  const idClauses = workflowIds
    .map((id) => `WorkflowId = '${id}'`)
    .join(' OR ');
  const query = `TaskQueue = '${TEMPORAL_QUEUES.DOMAINS}' AND ExecutionStatus = 'Running' AND (${idClauses})`;

  try {
    const workflows = temporalClient.workflow.list({ query });
    for await (const wf of workflows) {
      const status = await wf.status;
      if (status.name !== 'RUNNING') continue;
      const op = operationFromWorkflowId(wf.workflowId);
      if (!op) continue;

      // Extract the punycode domain from the bracketed workflow id.
      const match = wf.workflowId.match(/\[(.+)\]$/);
      if (!match) continue;
      const normalized = punyToNormalized.get(match[1]);
      if (!normalized) continue;

      const entry = result.get(normalized);
      if (!entry) continue;

      const slot: ActiveWorkflow = {
        operation: op,
        workflowId: wf.workflowId,
        runId: wf.runId,
        workflowType: wf.type,
        status: 'RUNNING',
      };
      if (op === 'ENABLE_DNSSEC' || op === 'REMOVE_DNSSEC') {
        entry.dnssec = slot;
      } else {
        entry.ns = slot;
      }
    }
  } catch (error) {
    logger.error(
      { error },
      'Failed to query active NS/DNSSEC workflows for admin page',
    );
  }

  return result;
}

export const nsAndDnssecRouter = createContractTRPCRouter<
  typeof adminNsAndDnssecContract
>({
  listDomainsNsAndDnssec: adminProcedureWithPermissions(
    Permission.READ_NS_DNSSEC,
  )
    .input(adminNsAndDnssecContract.listDomainsNsAndDnssec.input)
    .output(adminNsAndDnssecContract.listDomainsNsAndDnssec.output)
    .query(async ({ input }) => {
      const { page, pageSize, filters, sorting, pbnFilter } = input;
      const offset = (page - 1) * pageSize;

      await ensurePrivyTableFresh();

      const tableStructure = {
        userId: usersTable.id,
        normalizedDomainName: namefiNftView.normalizedDomainName,
        ownerAddress: namefiNftView.ownerAddress,
        // Text-cast so the drizzler filter middleware can apply
        // eq/neq/isNull/isNotNull. NULL appears when no `domainConfigTable`
        // row exists for the domain (LEFT JOIN miss); the underlying
        // column itself is `notNull default false`.
        zoneHasActiveDnssec: sql<
          string | null
        >`${domainConfigTable.dnssecEnabled}::text`,
      };

      const baseQuery = db
        .with(namefiNftCte)
        .select({
          userId: usersTable.id,
          normalizedDomainName: namefiNftView.normalizedDomainName,
          chainId: namefiNftView.chainId,
          ownerAddress: namefiNftView.ownerAddress,
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
        .$dynamic();

      const whereClauses: SQL[] = [];
      if (filters) {
        const drizzlerWhere = buildWhereClause(
          tableStructure,
          filters as FilterOptions<any>,
        );
        if (drizzlerWhere) whereClauses.push(drizzlerWhere);
      }

      // PBN-subdomain filter: derived predicate, not a single-column
      // comparison, so it lives outside the drizzler middleware. We OR
      // together a `LIKE '%.<parent>'` clause for each PBN parent, then
      // either include or exclude the match depending on the mode. Using
      // Drizzle's parametrized `like` builders — never raw SQL.
      if (pbnFilter !== 'all') {
        const parents = await getPoweredByNamefi3PDomains();
        const subdomainClauses = parents.map((parent) =>
          like(namefiNftView.normalizedDomainName, `%.${parent}`),
        );
        const subdomainPredicate = subdomainClauses.length
          ? or(...subdomainClauses)
          : undefined;
        if (subdomainPredicate) {
          whereClauses.push(
            pbnFilter === 'pbnOnly'
              ? subdomainPredicate
              : (not(subdomainPredicate) as SQL),
          );
        } else if (pbnFilter === 'pbnOnly') {
          // No PBN parents configured — `pbnOnly` matches nothing. Force
          // an unsatisfiable clause so the page renders zero rows
          // consistently between data and count queries.
          whereClauses.push(sql`FALSE`);
        }
      }

      let query = baseQuery;
      if (whereClauses.length > 0) {
        query = query.where(and(...whereClauses));
      }

      const orderByClauses = sorting
        ? buildSortClause(tableStructure, sorting as SortOptions<any>)
        : [asc(namefiNftView.normalizedDomainName)];

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
        .$dynamic();

      let countQueryWithWhere = countQuery;
      if (whereClauses.length > 0) {
        countQueryWithWhere = countQuery.where(and(...whereClauses));
      }

      try {
        const [rows, countRow] = await Promise.all([
          query
            .orderBy(...orderByClauses)
            .limit(pageSize)
            .offset(offset),
          countQueryWithWhere,
        ]);
        const total = countRow[0]?.count ?? 0;

        const domainNames = rows.map((r) => r.normalizedDomainName);

        // Batch-load nameservers from the indexed-domains table.
        const indexedRows =
          domainNames.length > 0
            ? await db
                .select({
                  normalizedDomainName:
                    indexedDomainsTable.normalizedDomainName,
                  nameservers: indexedDomainsTable.nameservers,
                  isUsingNamefiNameservers:
                    indexedDomainsTable.isUsingNamefiNameservers,
                })
                .from(indexedDomainsTable)
                .where(
                  inArray(
                    indexedDomainsTable.normalizedDomainName,
                    domainNames,
                  ),
                )
            : [];
        const nsByDomain = new Map(
          indexedRows.map((r) => [
            r.normalizedDomainName,
            {
              nameservers: r.nameservers ?? [],
              isUsingNamefiNameservers: !!r.isUsingNamefiNameservers,
            },
          ]),
        );

        const [activeWorkflows, dnssecResults] = await Promise.all([
          getActiveWorkflowsForDomains(domainNames),
          // Live DNSSEC details — one registrar call per domain. We fan out
          // in parallel and degrade rows whose call fails so a single bad
          // domain doesn't fail the page.
          Promise.allSettled(
            domainNames.map((d) =>
              getDnssecStatusDetails(toPunycodeDomainName(d)),
            ),
          ),
        ]);

        const data = rows.map((row, idx) => {
          const ns = nsByDomain.get(row.normalizedDomainName);
          const wf = activeWorkflows.get(row.normalizedDomainName) ?? {
            dnssec: null,
            ns: null,
          };
          const dnssecResult = dnssecResults[idx];
          const dnssecOk = dnssecResult?.status === 'fulfilled';
          const dnssec = dnssecOk ? dnssecResult.value : undefined;
          return {
            userId: row.userId ?? null,
            normalizedDomainName: row.normalizedDomainName,
            ownerAddress: row.ownerAddress ?? null,
            chainId: Number(row.chainId),
            nameservers: ns?.nameservers ?? dnssec?.nameservers ?? [],
            isUsingNamefiNameservers:
              ns?.isUsingNamefiNameservers ??
              dnssec?.isUsingNamefiNameservers ??
              false,
            dnssecZoneHasActiveDnssec: dnssec?.zoneHasActiveDnssec ?? null,
            dnssecHasDelegationSigner: dnssec?.hasDelegationSigner ?? null,
            dnssecIsUsingNamefiDelegationSigner:
              dnssec?.isUsingNamefiDelegationSigner ?? null,
            dnssecError: !dnssecOk,
            activeDnssecWorkflow: wf.dnssec,
            activeNameserversWorkflow: wf.ns,
          };
        });

        return {
          data,
          pagination: {
            page,
            pageSize,
            totalCount: total,
            totalPages: Math.ceil(total / pageSize),
          },
          temporal: {
            apiUrl: config.TEMPORAL_API_URL,
            namespace: config.TEMPORAL_NAMESPACE,
          },
        };
      } catch (error) {
        logger.error({ error }, 'Failed to list NS & DNSSEC for admin page');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to list NS & DNSSEC',
        });
      }
    }),

  enableDnssec: auditedAdminProcedureWithPermissions(
    Permission.WRITE_NS_DNSSEC,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.DOMAIN,
      resourceId: input.domainName,
      action: 'admin_enable_dnssec',
      extraInput: input,
    }),
  )
    .input(adminNsAndDnssecContract.enableDnssec.input)
    .output(adminNsAndDnssecContract.enableDnssec.output)
    .mutation(async ({ input, ctx }) => {
      await enableAutoDnssecForDomain(
        toPunycodeDomainName(input.domainName),
        ctx.user.id,
      );
      return { success: true };
    }),

  disableDnssec: auditedAdminProcedureWithPermissions(
    Permission.WRITE_NS_DNSSEC,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.DOMAIN,
      resourceId: input.domainName,
      action: 'admin_disable_dnssec',
      extraInput: input,
    }),
  )
    .input(adminNsAndDnssecContract.disableDnssec.input)
    .output(adminNsAndDnssecContract.disableDnssec.output)
    .mutation(async ({ input, ctx }) => {
      await disableDnssecForDomain(
        toPunycodeDomainName(input.domainName),
        ctx.user.id,
      );
      return { success: true };
    }),

  changeNameservers: auditedAdminProcedureWithPermissions(
    Permission.WRITE_NS_DNSSEC,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.DOMAIN,
      resourceId: input.domainName,
      action: 'admin_change_nameservers',
      extraInput: input,
    }),
  )
    .input(adminNsAndDnssecContract.changeNameservers.input)
    .output(adminNsAndDnssecContract.changeNameservers.output)
    .mutation(async ({ input }) => {
      await submitNameserversChangeWorkflow(
        toPunycodeDomainName(input.domainName),
        input.nameservers.map((ns) => toPunycodeFqdn(ns)),
      );
      return { success: true };
    }),

  resetNameservers: auditedAdminProcedureWithPermissions(
    Permission.WRITE_NS_DNSSEC,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.DOMAIN,
      resourceId: input.domainName,
      action: 'admin_reset_nameservers',
      extraInput: input,
    }),
  )
    .input(adminNsAndDnssecContract.resetNameservers.input)
    .output(adminNsAndDnssecContract.resetNameservers.output)
    .mutation(async ({ input }) => {
      await submitResetNameserversWorkflow(
        toPunycodeDomainName(input.domainName),
      );
      return { success: true };
    }),

  cancelDnssecWorkflow: auditedAdminProcedureWithPermissions(
    Permission.WRITE_NS_DNSSEC,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.DOMAIN,
      resourceId: input.domainName,
      action: 'admin_cancel_dnssec_workflow',
      extraInput: input,
    }),
  )
    .input(adminNsAndDnssecContract.cancelDnssecWorkflow.input)
    .output(adminNsAndDnssecContract.cancelDnssecWorkflow.output)
    .mutation(async ({ input, ctx }) => {
      const { domainName, operation } = input;
      const punycodeDomain = toPunycodeDomainName(domainName);
      const workflowId =
        operation === 'ENABLE_DNSSEC'
          ? enableDnssecWorkflow.generateId({ domainName: punycodeDomain })
          : disableDnssecWorkflow.generateId({ domainName: punycodeDomain });

      try {
        const handle = temporalClient.workflow.getHandle(workflowId);
        const description = await handle.describe();
        if (description.status.name !== 'RUNNING') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Workflow is not running',
          });
        }
        await handle.cancel();
        logger.info(
          { domainName, operation, workflowId, adminUserId: ctx.user.id },
          'Admin DNSSEC workflow cancellation requested',
        );
        return { success: true, workflowId };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error(
          { error, domainName, operation, workflowId },
          'Failed to cancel DNSSEC workflow as admin',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to cancel workflow',
          cause: error,
        });
      }
    }),

  cancelNameserversWorkflow: auditedAdminProcedureWithPermissions(
    Permission.WRITE_NS_DNSSEC,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.DOMAIN,
      resourceId: input.domainName,
      action: 'admin_cancel_nameservers_workflow',
      extraInput: input,
    }),
  )
    .input(adminNsAndDnssecContract.cancelNameserversWorkflow.input)
    .output(adminNsAndDnssecContract.cancelNameserversWorkflow.output)
    .mutation(async ({ input, ctx }) => {
      const { domainName } = input;
      const punycodeDomain = toPunycodeDomainName(domainName);
      const wfMap = await getActiveWorkflowsForDomains([domainName]);
      const active = wfMap.get(domainName)?.ns ?? null;
      if (!active) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No active nameservers change workflow found',
        });
      }
      try {
        const handle = temporalClient.workflow.getHandle(active.workflowId);
        await handle.cancel();
        logger.info(
          {
            domainName: punycodeDomain,
            workflowId: active.workflowId,
            adminUserId: ctx.user.id,
          },
          'Admin nameservers change workflow cancellation requested',
        );
        return { success: true, workflowId: active.workflowId };
      } catch (error) {
        logger.error(
          { error, domainName, workflowId: active.workflowId },
          'Failed to cancel nameservers change workflow as admin',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to cancel workflow',
          cause: error,
        });
      }
    }),
});
