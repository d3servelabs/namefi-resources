import { db, dnsvizAnalysesTable, indexedDomainsTable } from '@namefi-astra/db';
import type {
  DnsvizAnalysisStatus,
  DnsvizAnalysisSummary,
  IndexedDomainDnssecStatus,
} from '@namefi-astra/db/schema';
import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq, ilike, type SQL, sql } from 'drizzle-orm';
import { adminProcedure } from '../../base';
import { createContractTRPCRouter } from '../../contract';
import { adminDnsvizContract } from '@namefi-astra/common/contract/admin/admin-dnsviz-contract';
import {
  dnsvizGraphContentType,
  extractAllDnsvizMessages,
  runDnsvizGraphBuffered,
} from '#lib/dnsviz';
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
      const { page, pageSize, domainSearch, status, analysisDate, sorting } =
        input;
      const offset = (page - 1) * pageSize;

      const whereClauses: SQL[] = [];

      if (status) {
        whereClauses.push(eq(dnsvizAnalysesTable.status, status));
      }
      if (analysisDate) {
        whereClauses.push(eq(dnsvizAnalysesTable.analysisDate, analysisDate));
      }
      const trimmedSearch = domainSearch?.trim().toLowerCase();
      if (trimmedSearch) {
        whereClauses.push(
          ilike(dnsvizAnalysesTable.normalizedDomainName, `%${trimmedSearch}%`),
        );
      }

      const whereClause =
        whereClauses.length > 0 ? and(...whereClauses) : undefined;

      const orderByClauses: SQL[] = [];
      if (sorting && sorting.length > 0) {
        for (const sort of sorting) {
          let columnSql: SQL | undefined;
          switch (sort.id) {
            case 'analysisDate':
              columnSql = sql`${dnsvizAnalysesTable.analysisDate}`;
              break;
            case 'analysisStartedAt':
              columnSql = sql`${dnsvizAnalysesTable.analysisStartedAt}`;
              break;
            case 'normalizedDomainName':
              columnSql = sql`${dnsvizAnalysesTable.normalizedDomainName}`;
              break;
            case 'status':
              columnSql = sql`${dnsvizAnalysesTable.status}`;
              break;
            case 'errorsCount':
              columnSql = sql`${dnsvizAnalysesTable.errorsCount}`;
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
        orderByClauses.push(desc(dnsvizAnalysesTable.analysisDate));
        orderByClauses.push(asc(dnsvizAnalysesTable.normalizedDomainName));
      }
      // Stable tie-breaker for deterministic pagination.
      orderByClauses.push(asc(dnsvizAnalysesTable.id));

      // LEFT JOIN `indexed_domains` so nameservers + cached DNSSEC
      // status come back in one query and become first-class columns
      // for future drizzler-filter wiring (filter / sort by
      // `is_using_namefi_nameservers`, `dnssec_status->>...`, etc.).
      // The `(registrar_key, normalized_domain_name)` unique constraint
      // means at most one match per dnsviz row, so no row-multiplication
      // worry. AD_HOC dnsviz rows (third-party domains run via on-demand)
      // are never in `indexed_domains`, so LEFT JOIN gives nulls there
      // and `indexedSnapshotForRow` projects them as nulls in the
      // contract output.
      const baseQuery = db
        .select({
          id: dnsvizAnalysesTable.id,
          normalizedDomainName: dnsvizAnalysesTable.normalizedDomainName,
          registrarKey: dnsvizAnalysesTable.registrarKey,
          analysisDate: dnsvizAnalysesTable.analysisDate,
          analysisStartedAt: dnsvizAnalysesTable.analysisStartedAt,
          durationMs: dnsvizAnalysesTable.durationMs,
          status: dnsvizAnalysesTable.status,
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
        );

      const rowsQuery = whereClause ? baseQuery.where(whereClause) : baseQuery;
      const rows = await rowsQuery
        .orderBy(...orderByClauses)
        .limit(pageSize)
        .offset(offset);

      // The COUNT can stay against the base table — the LEFT JOIN never
      // multiplies rows (1:1 via the registrar_key + domain unique
      // constraint), and we don't filter on joined columns yet, so an
      // un-joined COUNT is faster.
      const totalQuery = db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(dnsvizAnalysesTable);
      const [{ count: total }] = whereClause
        ? await totalQuery.where(whereClause)
        : await totalQuery;

      return {
        rows: rows.map(
          ({
            joinedNameservers,
            joinedIsUsingNamefiNameservers,
            joinedDnssecStatus,
            ...r
          }) => ({
            ...r,
            reasoning: deriveReasoningString(r),
            ...indexedSnapshotForRow({
              nameservers: joinedNameservers,
              isUsingNamefiNameservers: joinedIsUsingNamefiNameservers,
              dnssecStatus: joinedDnssecStatus,
            }),
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
      // LEFT JOIN to indexed_domains for the same reason as
      // listAnalyses — keeps both procedures projecting the same shape
      // off the same source.
      const [row] = await db
        .select({
          id: dnsvizAnalysesTable.id,
          normalizedDomainName: dnsvizAnalysesTable.normalizedDomainName,
          registrarKey: dnsvizAnalysesTable.registrarKey,
          analysisDate: dnsvizAnalysesTable.analysisDate,
          analysisStartedAt: dnsvizAnalysesTable.analysisStartedAt,
          durationMs: dnsvizAnalysesTable.durationMs,
          status: dnsvizAnalysesTable.status,
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
        ...rowWithoutGrok
      } = row;
      return {
        row: {
          ...rowWithoutGrok,
          reasoning: deriveReasoningString(rowWithoutGrok),
          ...indexedSnapshotForRow({
            nameservers: joinedNameservers,
            isUsingNamefiNameservers: joinedIsUsingNamefiNameservers,
            dnssecStatus: joinedDnssecStatus,
          }),
        },
        messages,
        counts,
        grokData,
      };
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
  status: DnsvizAnalysisStatus;
  summary: DnsvizAnalysisSummary | null;
  errorMessage: string | null;
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
