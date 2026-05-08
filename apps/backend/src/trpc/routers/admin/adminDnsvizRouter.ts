import {
  db,
  dnsvizAnalysesTable,
  indexedDomainsTable,
  namefiNftCte,
  namefiNftView,
  usersTable,
} from '@namefi-astra/db';
import type {
  // Raw 4-value enum stored on `dnsviz_analyses.status`; used for
  // verdict-explanation strings (which are derived from the underlying
  // grok output, not from the reclassification overlay).
  DnsvizAnalysisStatus as DnsvizRawAnalysisStatus,
  DnsvizAnalysisSummary,
  IndexedDomainDnssecStatus,
} from '@namefi-astra/db/schema';
import type { DnsvizAnalysisStatus } from '@namefi-astra/common/contract/admin/admin-dnsviz-contract';
import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq, type SQL, sql } from 'drizzle-orm';
import {
  buildSortClause,
  buildWhereClause,
  type FilterOptions,
  type SortOptions,
} from '@samyx/drizzler-filters-sorters';
import {
  ensurePrivyTableFresh,
  privyUsersTableSchema,
} from '../../../services/admin/privy-user-cache';
import { adminProcedure } from '../../base';
import { createContractTRPCRouter } from '../../contract';
import { adminDnsvizContract } from '@namefi-astra/common/contract/admin/admin-dnsviz-contract';
import {
  dnsvizGraphContentType,
  extractAllDnsvizMessages,
  runDnsvizGraphBuffered,
} from '#lib/dnsviz';
import { dnsvizEffectiveStatusSql as effectiveStatusSql } from '#lib/dnsviz-effective-status-sql';
import { createLogger } from '#lib/logger';
import { temporalClient } from '#temporal/client';
import { TEMPORAL_QUEUES } from '#temporal/shared/enums';
import { dnsvizOnDemandWorkflow } from '#temporal/workflows/dnsviz-on-demand.workflow';
import { randomBytes } from 'node:crypto';

const logger = createLogger({ module: 'admin-dnsviz-router' });

/**
 * Read-only admin surface onto `dnsviz_analyses`. Powers
 * `apps/frontend/src/app/admin/dnsviz/page.tsx`. Gated by `adminProcedure`
 * (baseline `VIEW_ADMIN_DASHBOARD`) — DNSSEC analysis is diagnostic data
 * that any admin should be able to inspect.
 */
export const adminDnsvizRouter = createContractTRPCRouter<
  typeof adminDnsvizContract
>({
  listAnalyses: adminProcedure
    .input(adminDnsvizContract.listAnalyses.input)
    .output(adminDnsvizContract.listAnalyses.output)
    .query(async ({ input }) => {
      const { page, pageSize, filters, sorting } = input;
      const offset = (page - 1) * pageSize;

      // The privy users cache is the source of the wallet → privy_user_id
      // mapping that powers the user JOIN. Refresh it so newly-linked
      // wallets show up here without waiting for the cache TTL.
      await ensurePrivyTableFresh();

      const whereClause = filters
        ? buildWhereClause(
            DNSVIZ_FILTER_TABLE_STRUCTURE,
            filters as FilterOptions<typeof DNSVIZ_FILTER_TABLE_STRUCTURE>,
          )
        : undefined;

      const orderByClauses: SQL[] = sorting
        ? buildSortClause(
            DNSVIZ_FILTER_TABLE_STRUCTURE,
            sorting as SortOptions<typeof DNSVIZ_FILTER_TABLE_STRUCTURE>,
          )
        : [];
      if (orderByClauses.length === 0) {
        orderByClauses.push(desc(dnsvizAnalysesTable.analysisDate));
        orderByClauses.push(asc(dnsvizAnalysesTable.normalizedDomainName));
      }
      // Stable tie-breaker for deterministic pagination.
      orderByClauses.push(asc(dnsvizAnalysesTable.id));

      // LEFT JOIN chain:
      //   indexed_domains      → nameservers + dnssec_status snapshot
      //   namefi_nft_owners    → ownerAddress + chainId per domain
      //   privy_users          → privy user id by matching wallet
      //   users                → internal user id
      //
      // All LEFT — third-party (AD_HOC) domains and not-yet-tokenized
      // domains stay in the result with null right-side columns. The
      // namefi_nft_owners JOIN can in principle return >1 row per domain
      // (one per chain); in practice 1:1, matching the
      // `apps/backend/src/trpc/routers/admin/nsAndDnssecRouter.ts`
      // convention. The COUNT query intentionally stays against the
      // base table since none of the current filters touch joined
      // columns; revisit when drizzler-filter brings user / NS filters.
      const baseQuery = db
        .with(namefiNftCte)
        .select({
          id: dnsvizAnalysesTable.id,
          normalizedDomainName: dnsvizAnalysesTable.normalizedDomainName,
          registrarKey: dnsvizAnalysesTable.registrarKey,
          analysisDate: dnsvizAnalysesTable.analysisDate,
          analysisStartedAt: dnsvizAnalysesTable.analysisStartedAt,
          durationMs: dnsvizAnalysesTable.durationMs,
          // Effective status (see `effectiveStatusSql` for the rules).
          // The raw enum is kept around for `deriveReasoningString` so the
          // verdict-explanation text reflects the underlying analysis.
          status: effectiveStatusSql.as('effective_status'),
          rawStatus: dnsvizAnalysesTable.status,
          errorsCount: dnsvizAnalysesTable.errorsCount,
          warningsCount: dnsvizAnalysesTable.warningsCount,
          summary: dnsvizAnalysesTable.summary,
          errorMessage: dnsvizAnalysesTable.errorMessage,
          workflowRunId: dnsvizAnalysesTable.workflowRunId,
          expiresAt: dnsvizAnalysesTable.expiresAt,
          joinedNameservers: indexedDomainsTable.nameservers,
          joinedIsUsingNamefiNameservers:
            indexedDomainsTable.isUsingNamefiNameservers,
          joinedDnssecStatus: indexedDomainsTable.dnssecStatus,
          joinedOwnerAddress: namefiNftView.ownerAddress,
          joinedChainId: namefiNftView.chainId,
          joinedUserId: usersTable.id,
        })
        .from(dnsvizAnalysesTable)
        .leftJoin(
          indexedDomainsTable,
          and(
            eq(
              indexedDomainsTable.normalizedDomainName,
              dnsvizAnalysesTable.normalizedDomainName,
            ),
            eq(
              indexedDomainsTable.registrarKey,
              dnsvizAnalysesTable.registrarKey,
            ),
          ),
        )
        .leftJoin(
          namefiNftView,
          eq(
            namefiNftView.normalizedDomainName,
            dnsvizAnalysesTable.normalizedDomainName,
          ),
        )
        .leftJoin(
          privyUsersTableSchema,
          sql`LOWER(${namefiNftView.ownerAddress}) = ANY(array_lowercase(${privyUsersTableSchema.wallets}))`,
        )
        .leftJoin(
          usersTable,
          eq(usersTable.privyUserId, privyUsersTableSchema.privyUserId),
        );

      const rowsQuery = whereClause ? baseQuery.where(whereClause) : baseQuery;
      const rows = await rowsQuery
        .orderBy(...orderByClauses)
        .limit(pageSize)
        .offset(offset);

      // Filters can now reference joined columns (isUsingNamefiNameservers,
      // dnssec_status->>..., ownerAddress, userId) so the COUNT must run
      // against the same JOIN tree. `COUNT(DISTINCT id)` guards against
      // 1:N inflation from the namefi_nft_owners JOIN, in case a domain
      // ever has NFTs on multiple chains.
      const totalQuery = db
        .with(namefiNftCte)
        .select({
          count: sql<number>`COUNT(DISTINCT ${dnsvizAnalysesTable.id})::int`,
        })
        .from(dnsvizAnalysesTable)
        .leftJoin(
          indexedDomainsTable,
          and(
            eq(
              indexedDomainsTable.normalizedDomainName,
              dnsvizAnalysesTable.normalizedDomainName,
            ),
            eq(
              indexedDomainsTable.registrarKey,
              dnsvizAnalysesTable.registrarKey,
            ),
          ),
        )
        .leftJoin(
          namefiNftView,
          eq(
            namefiNftView.normalizedDomainName,
            dnsvizAnalysesTable.normalizedDomainName,
          ),
        )
        .leftJoin(
          privyUsersTableSchema,
          sql`LOWER(${namefiNftView.ownerAddress}) = ANY(array_lowercase(${privyUsersTableSchema.wallets}))`,
        )
        .leftJoin(
          usersTable,
          eq(usersTable.privyUserId, privyUsersTableSchema.privyUserId),
        );
      const [{ count: total }] = whereClause
        ? await totalQuery.where(whereClause)
        : await totalQuery;

      return {
        rows: rows.map(
          ({
            joinedNameservers,
            joinedIsUsingNamefiNameservers,
            joinedDnssecStatus,
            joinedOwnerAddress,
            joinedChainId,
            joinedUserId,
            rawStatus,
            status,
            ...r
          }) => ({
            ...r,
            // SQL `CASE` returns text; cast to the wider enum here.
            status: status as DnsvizAnalysisStatus,
            // Reasoning is derived from the raw verdict so it reflects
            // the underlying grok output, not the reclassification.
            reasoning: deriveReasoningString({ ...r, status: rawStatus }),
            ...indexedSnapshotForRow({
              nameservers: joinedNameservers,
              isUsingNamefiNameservers: joinedIsUsingNamefiNameservers,
              dnssecStatus: joinedDnssecStatus,
            }),
            userId: joinedUserId ?? null,
            ownerAddress: joinedOwnerAddress ?? null,
            chainId: joinedChainId ?? null,
          }),
        ),
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    }),

  getAnalysisDetails: adminProcedure
    .input(adminDnsvizContract.getAnalysisDetails.input)
    .output(adminDnsvizContract.getAnalysisDetails.output)
    .query(async ({ input }) => {
      await ensurePrivyTableFresh();

      // Same JOIN chain as `listAnalyses` so the projected row shape stays
      // identical between the two procedures.
      const [row] = await db
        .with(namefiNftCte)
        .select({
          id: dnsvizAnalysesTable.id,
          normalizedDomainName: dnsvizAnalysesTable.normalizedDomainName,
          registrarKey: dnsvizAnalysesTable.registrarKey,
          analysisDate: dnsvizAnalysesTable.analysisDate,
          analysisStartedAt: dnsvizAnalysesTable.analysisStartedAt,
          durationMs: dnsvizAnalysesTable.durationMs,
          status: effectiveStatusSql.as('effective_status'),
          rawStatus: dnsvizAnalysesTable.status,
          errorsCount: dnsvizAnalysesTable.errorsCount,
          warningsCount: dnsvizAnalysesTable.warningsCount,
          summary: dnsvizAnalysesTable.summary,
          errorMessage: dnsvizAnalysesTable.errorMessage,
          workflowRunId: dnsvizAnalysesTable.workflowRunId,
          expiresAt: dnsvizAnalysesTable.expiresAt,
          grokData: dnsvizAnalysesTable.grokData,
          joinedNameservers: indexedDomainsTable.nameservers,
          joinedIsUsingNamefiNameservers:
            indexedDomainsTable.isUsingNamefiNameservers,
          joinedDnssecStatus: indexedDomainsTable.dnssecStatus,
          joinedOwnerAddress: namefiNftView.ownerAddress,
          joinedChainId: namefiNftView.chainId,
          joinedUserId: usersTable.id,
        })
        .from(dnsvizAnalysesTable)
        .leftJoin(
          indexedDomainsTable,
          and(
            eq(
              indexedDomainsTable.normalizedDomainName,
              dnsvizAnalysesTable.normalizedDomainName,
            ),
            eq(
              indexedDomainsTable.registrarKey,
              dnsvizAnalysesTable.registrarKey,
            ),
          ),
        )
        .leftJoin(
          namefiNftView,
          eq(
            namefiNftView.normalizedDomainName,
            dnsvizAnalysesTable.normalizedDomainName,
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
        .where(eq(dnsvizAnalysesTable.id, input.id))
        .limit(1);

      if (!row) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Analysis not found',
        });
      }

      const messages = extractAllDnsvizMessages(row.grokData);
      const counts = {
        totalErrors: 0,
        totalWarnings: 0,
        ignoredErrors: 0,
        ignoredWarnings: 0,
      };
      for (const m of messages) {
        if (m.severity === 'error') {
          counts.totalErrors++;
          if (m.ignored) counts.ignoredErrors++;
        } else {
          counts.totalWarnings++;
          if (m.ignored) counts.ignoredWarnings++;
        }
      }

      const {
        grokData,
        joinedNameservers,
        joinedIsUsingNamefiNameservers,
        joinedDnssecStatus,
        joinedOwnerAddress,
        joinedChainId,
        joinedUserId,
        rawStatus,
        status,
        ...rowWithoutGrok
      } = row;
      return {
        row: {
          ...rowWithoutGrok,
          status: status as DnsvizAnalysisStatus,
          reasoning: deriveReasoningString({
            ...rowWithoutGrok,
            status: rawStatus,
          }),
          ...indexedSnapshotForRow({
            nameservers: joinedNameservers,
            isUsingNamefiNameservers: joinedIsUsingNamefiNameservers,
            dnssecStatus: joinedDnssecStatus,
          }),
          userId: joinedUserId ?? null,
          ownerAddress: joinedOwnerAddress ?? null,
          chainId: joinedChainId ?? null,
        },
        messages,
        counts,
        grokData,
      };
    }),

  /**
   * Aggregate counts for the same filter as `listAnalyses` (no
   * page/sorting). Returns `byStatus` for the headline donut, plus a
   * `failureBreakdown` cross-tab for BOGUS+ERROR rows split by
   * `is_using_namefi_nameservers` and `supportsDnssec` so an admin can
   * see whether a failure spike correlates with a specific NS provider
   * or DNSSEC state.
   *
   * Implemented as a single GROUP BY + FILTER aggregate query so it
   * stays cheap even at high analysis-row counts.
   */
  getAnalysesCounts: adminProcedure
    .input(adminDnsvizContract.getAnalysesCounts.input)
    .output(adminDnsvizContract.getAnalysesCounts.output)
    .query(async ({ input }) => {
      // Same drizzler filters as listAnalyses; same JOIN chain so any
      // joined column referenced by the filter resolves.
      await ensurePrivyTableFresh();
      const whereClause = input.filters
        ? buildWhereClause(
            DNSVIZ_FILTER_TABLE_STRUCTURE,
            input.filters as FilterOptions<
              typeof DNSVIZ_FILTER_TABLE_STRUCTURE
            >,
          )
        : undefined;

      // `FILTER (WHERE ...)` runs the COUNT only on rows matching the
      // sub-predicate; combined with GROUP BY status this gives the
      // full status × NS × supportsDnssec breakdown in one round trip.
      // `COUNT(DISTINCT id)` so a 1:N namefi_nft_owners JOIN doesn't
      // inflate counts.
      const id = dnsvizAnalysesTable.id;
      const usingNamefi = sql`${indexedDomainsTable.isUsingNamefiNameservers} = true`;
      const customNs = sql`${indexedDomainsTable.isUsingNamefiNameservers} = false`;
      const unknownNs = sql`${indexedDomainsTable.isUsingNamefiNameservers} IS NULL`;
      const supportsDnssec = sql`(${indexedDomainsTable.dnssecStatus} ->> 'supportsDnssec') = 'true'`;
      const noSupportsDnssec = sql`(${indexedDomainsTable.dnssecStatus} ->> 'supportsDnssec') = 'false'`;
      const unknownSupportsDnssec = sql`(${indexedDomainsTable.dnssecStatus} ->> 'supportsDnssec') IS NULL`;

      const rowsQuery = db
        .with(namefiNftCte)
        .select({
          // Group by effective status so the donut + breakdown match
          // what the table shows. Drop down to the raw enum if you ever
          // need a "before reclassification" view.
          status: effectiveStatusSql.as('effective_status'),
          total: sql<number>`COUNT(DISTINCT ${id})::int`,
          usingNamefiNs: sql<number>`COUNT(DISTINCT ${id}) FILTER (WHERE ${usingNamefi})::int`,
          customNs: sql<number>`COUNT(DISTINCT ${id}) FILTER (WHERE ${customNs})::int`,
          unknownNs: sql<number>`COUNT(DISTINCT ${id}) FILTER (WHERE ${unknownNs})::int`,
          supportsDnssec: sql<number>`COUNT(DISTINCT ${id}) FILTER (WHERE ${supportsDnssec})::int`,
          noSupportsDnssec: sql<number>`COUNT(DISTINCT ${id}) FILTER (WHERE ${noSupportsDnssec})::int`,
          unknownSupportsDnssec: sql<number>`COUNT(DISTINCT ${id}) FILTER (WHERE ${unknownSupportsDnssec})::int`,
        })
        .from(dnsvizAnalysesTable)
        .leftJoin(
          indexedDomainsTable,
          and(
            eq(
              indexedDomainsTable.normalizedDomainName,
              dnsvizAnalysesTable.normalizedDomainName,
            ),
            eq(
              indexedDomainsTable.registrarKey,
              dnsvizAnalysesTable.registrarKey,
            ),
          ),
        )
        .leftJoin(
          namefiNftView,
          eq(
            namefiNftView.normalizedDomainName,
            dnsvizAnalysesTable.normalizedDomainName,
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
        .groupBy(effectiveStatusSql);

      const aggregateRows = await (whereClause
        ? rowsQuery.where(whereClause)
        : rowsQuery);

      const byStatus: Record<DnsvizAnalysisStatus, number> = {
        SECURE: 0,
        INSECURE: 0,
        BOGUS: 0,
        ERROR: 0,
        EXPECTED_ERROR: 0,
        WARN: 0,
      };
      const failureBreakdown = {
        BOGUS: emptyFailureBreakdown(),
        ERROR: emptyFailureBreakdown(),
      };
      let total = 0;
      for (const r of aggregateRows) {
        const effective = r.status as DnsvizAnalysisStatus;
        byStatus[effective] = r.total;
        total += r.total;
        // Failure breakdown stays scoped to the post-reclassification
        // BOGUS/ERROR buckets — those are the rows that actually need
        // operator attention (`EXPECTED_ERROR`/`WARN` were filtered
        // out by the CASE overlay).
        if (effective === 'BOGUS' || effective === 'ERROR') {
          failureBreakdown[effective] = {
            usingNamefiNs: r.usingNamefiNs,
            customNs: r.customNs,
            unknownNs: r.unknownNs,
            supportsDnssec: r.supportsDnssec,
            noSupportsDnssec: r.noSupportsDnssec,
            unknownSupportsDnssec: r.unknownSupportsDnssec,
          };
        }
      }

      return { total, byStatus, failureBreakdown };
    }),

  /**
   * Kick off `dnsvizOnDemandWorkflow` for an admin-supplied domain list
   * (typically the rows the admin has multi-selected on the page).
   * Returns the workflow handle so the UI can link to it / poll status.
   */
  runOnDemandAnalysis: adminProcedure
    .input(adminDnsvizContract.runOnDemandAnalysis.input)
    .output(adminDnsvizContract.runOnDemandAnalysis.output)
    .mutation(async ({ input, ctx }) => {
      const workflowId = `dnsviz-on-demand-admin-${Date.now()}-${randomBytes(4).toString('hex')}`;

      const handle = await temporalClient.workflow.start(
        dnsvizOnDemandWorkflow,
        {
          args: [
            {
              domains: input.domains,
              analysisDate: input.analysisDate,
            },
          ],
          workflowId,
          taskQueue: TEMPORAL_QUEUES.INDEXERS,
        },
      );

      logger.info(
        {
          workflowId,
          runId: handle.firstExecutionRunId,
          domainCount: input.domains.length,
          actorId: ctx.user?.id,
        },
        'started dnsviz on-demand workflow from admin UI',
      );

      return {
        workflowId,
        runId: handle.firstExecutionRunId,
        domains: input.domains,
      };
    }),

  /**
   * Return the raw probe-or-grok JSON blob for a stored analysis,
   * pretty-printed and ready for download. Used by the per-row Download
   * dropdown's `Download probe.json` / `Download grok.json` items.
   */
  getAnalysisJson: adminProcedure
    .input(adminDnsvizContract.getAnalysisJson.input)
    .output(adminDnsvizContract.getAnalysisJson.output)
    .query(async ({ input }) => {
      const [row] = await db
        .select({
          normalizedDomainName: dnsvizAnalysesTable.normalizedDomainName,
          analysisDate: dnsvizAnalysesTable.analysisDate,
          probeData: dnsvizAnalysesTable.probeData,
          grokData: dnsvizAnalysesTable.grokData,
        })
        .from(dnsvizAnalysesTable)
        .where(eq(dnsvizAnalysesTable.id, input.id))
        .limit(1);

      if (!row) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Analysis not found',
        });
      }

      const data = input.kind === 'probe' ? row.probeData : row.grokData;
      if (data == null) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Analysis has no stored ${input.kind}_data`,
        });
      }

      return {
        fileName: `${row.normalizedDomainName}-${row.analysisDate}.${input.kind}.json`,
        contentJson: JSON.stringify(data, null, 2),
      };
    }),

  getAnalysisGraph: adminProcedure
    .input(adminDnsvizContract.getAnalysisGraph.input)
    .output(adminDnsvizContract.getAnalysisGraph.output)
    .query(async ({ input }) => {
      const [row] = await db
        .select({
          normalizedDomainName: dnsvizAnalysesTable.normalizedDomainName,
          analysisDate: dnsvizAnalysesTable.analysisDate,
          probeData: dnsvizAnalysesTable.probeData,
        })
        .from(dnsvizAnalysesTable)
        .where(eq(dnsvizAnalysesTable.id, input.id))
        .limit(1);

      if (!row || row.probeData == null) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Analysis not found or has no probe data',
        });
      }

      const buffer = await runDnsvizGraphBuffered(row.probeData, input.type);

      logger.debug(
        {
          id: input.id,
          type: input.type,
          bytes: buffer.length,
          domain: row.normalizedDomainName,
        },
        'rendered dnsviz graph',
      );

      return {
        contentType: dnsvizGraphContentType(input.type),
        fileName: `${row.normalizedDomainName}-${row.analysisDate}.${input.type}`,
        base64: buffer.toString('base64'),
      };
    }),
});

interface RowForReasoning {
  normalizedDomainName: string;
  status: DnsvizRawAnalysisStatus;
  summary: DnsvizAnalysisSummary | null;
  errorMessage: string | null;
}

/**
 * Maps filter/sort column IDs to drizzle columns / SQL expressions, used
 * by `buildWhereClause` and `buildSortClause`. Boolean and jsonb-extract
 * fields are text-cast (`::text` / `->> 'key'`) so the drizzler
 * `eq`/`neq`/`isNull`/`isNotNull` operators can compare them with
 * `'true'`/`'false'` strings — matches the convention in
 * `apps/backend/src/trpc/routers/admin/nsAndDnssecRouter.ts`.
 *
 * Adding a new filterable column means adding both an entry here
 * (server-side projection) and an entry in the frontend `filterConfig`
 * (UI definition).
 */
const DNSVIZ_FILTER_TABLE_STRUCTURE = {
  // dnsviz_analyses
  id: dnsvizAnalysesTable.id,
  normalizedDomainName: dnsvizAnalysesTable.normalizedDomainName,
  registrarKey: dnsvizAnalysesTable.registrarKey,
  analysisDate: dnsvizAnalysesTable.analysisDate,
  analysisStartedAt: dnsvizAnalysesTable.analysisStartedAt,
  // Filter+sort target the *effective* status (matches what the user
  // sees in the table). Use `rawStatus` for the underlying enum.
  status: effectiveStatusSql,
  rawStatus: dnsvizAnalysesTable.status,
  errorsCount: dnsvizAnalysesTable.errorsCount,
  warningsCount: dnsvizAnalysesTable.warningsCount,
  // indexed_domains
  isUsingNamefiNameservers: sql<
    string | null
  >`${indexedDomainsTable.isUsingNamefiNameservers}::text`,
  supportsDnssec: sql<
    string | null
  >`(${indexedDomainsTable.dnssecStatus} ->> 'supportsDnssec')`,
  dnssecZoneHasActiveDnssec: sql<
    string | null
  >`(${indexedDomainsTable.dnssecStatus} ->> 'zoneHasActiveDnssec')`,
  dnssecHasDelegationSigner: sql<
    string | null
  >`(${indexedDomainsTable.dnssecStatus} ->> 'hasDelegationSigner')`,
  dnssecIsUsingNamefiDelegationSigner: sql<
    string | null
  >`(${indexedDomainsTable.dnssecStatus} ->> 'isUsingNamefiDelegationSigner')`,
  // namefi_nft_owners
  ownerAddress: namefiNftView.ownerAddress,
  chainId: namefiNftView.chainId,
  // users
  userId: usersTable.id,
} as const;

function emptyFailureBreakdown() {
  return {
    usingNamefiNs: 0,
    customNs: 0,
    unknownNs: 0,
    supportsDnssec: 0,
    noSupportsDnssec: 0,
    unknownSupportsDnssec: 0,
  };
}

/**
 * Project the LEFT-JOINed `indexed_domains` columns into the field shape
 * the `DnsvizAnalysisRow` contract expects, with explicit `null` for
 * every field when the join missed (AD_HOC dnsviz rows have no
 * `indexed_domains` match). Centralised so list / details routers stay
 * in sync.
 *
 * Detects a join miss via `nameservers`: that column is `notNull
 * default []` on `indexed_domains`, so a non-null value here means the
 * row exists. `dnssec_status` is independently nullable (the indexer
 * backfills it asynchronously) and projected as null fields if absent.
 */
function indexedSnapshotForRow(joined: {
  nameservers: string[] | null;
  isUsingNamefiNameservers: boolean | null;
  dnssecStatus: IndexedDomainDnssecStatus | null;
}) {
  if (joined.nameservers === null) {
    return {
      supportsDnssec: null,
      nameservers: null,
      isUsingNamefiNameservers: null,
      dnssecHasDelegationSigner: null,
      dnssecIsUsingNamefiDelegationSigner: null,
      dnssecZoneHasActiveDnssec: null,
    };
  }
  const ds = joined.dnssecStatus;
  return {
    supportsDnssec: ds?.supportsDnssec ?? null,
    nameservers: joined.nameservers,
    isUsingNamefiNameservers: joined.isUsingNamefiNameservers,
    dnssecHasDelegationSigner: ds?.hasDelegationSigner ?? null,
    dnssecIsUsingNamefiDelegationSigner:
      ds?.isUsingNamefiDelegationSigner ?? null,
    dnssecZoneHasActiveDnssec: ds?.zoneHasActiveDnssec ?? null,
  };
}

/**
 * Mirrors the per-row reasoning shown in the digest email. Surfaced on the
 * admin table so the verdict is auditable from the UI alone.
 */
function deriveReasoningString(row: RowForReasoning): string {
  const summary = row.summary;
  const leafKey = `${row.normalizedDomainName.toLowerCase()}.`;
  const parents = Object.entries(summary?.parentChainStatuses ?? {})
    .filter(([k]) => k !== '.' && k !== leafKey)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');
  const parentsTail = parents ? `; parents: ${parents}` : '';

  switch (row.status) {
    case 'SECURE':
      return `delegation.status=SECURE for ${leafKey}${parentsTail}`;
    case 'INSECURE':
      return `delegation.status=INSECURE for ${leafKey} (no DS published)${parentsTail}`;
    case 'BOGUS': {
      const firstErr =
        summary?.topErrors?.[0] ?? row.errorMessage ?? '(no error description)';
      return `delegation.status=BOGUS for ${leafKey} — ${firstErr.slice(0, 200)}`;
    }
    case 'ERROR': {
      const detail =
        row.errorMessage ?? summary?.topErrors?.[0] ?? '(no detail captured)';
      const delegStatus = summary?.delegationStatus ?? '(missing)';
      return `derived ERROR (delegation.status=${delegStatus}) — ${detail.slice(0, 200)}`;
    }
  }
}
