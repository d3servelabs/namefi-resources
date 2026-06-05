import { db, usersTable, namefiNftCte, namefiNftView } from '@namefi-astra/db';
import { checksumWalletAddressSchema, Permission } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq, notInArray, or, type SQL, sql } from 'drizzle-orm';
import { z } from 'zod';
import {
  adminProcedureWithPermissions,
  auditedAdminProcedureWithPermissions,
} from '../../base';
import { createContractTRPCRouter } from '../../contract';
import { adminUsersContract } from '@namefi-astra/common/contract/admin/admin-users-contract';
import { updateUserDefaultDomainsPreferences } from '#lib/domains/domain-preferences';
import { resolveEnsNameToAddress } from '#lib/crypto/ens';
import {
  getAdminUserDetails,
  getAdminWalletDetails,
  resolveAdminUserReference,
} from './user-details';
import { getAllUsersThatCanAccessAdminPanel } from '../../utils';
import {
  buildWhereClause,
  buildSortClause,
  type FilterOptions,
  type SortOptions,
} from '@samyx/drizzler-filters-sorters';
import {
  buildPrivySearchWhereClause,
  ensurePrivyTableFresh,
  privyUsersTableSchema,
  userNftsCTE,
} from '../../../services/admin/privy-user-cache';
import { triggerUpdatePrivyCache } from '../../../temporal/schedules/update-privy-cache';
import { getPrivyCacheStatus } from '../../../temporal/activities/indexers/privy-cache.activities';
import { logger } from '#lib/logger';

const LEADING_AT_SYMBOL_REGEX = /^@/;

// Helper to resolve ENS name to wallet address
const resolveENSToWallet = resolveEnsNameToAddress;

export const adminUsersRouter = createContractTRPCRouter<
  typeof adminUsersContract
>({
  searchUsers: adminProcedureWithPermissions(Permission.READ_USERS)
    .input(adminUsersContract.searchUsers.input)
    .output(adminUsersContract.searchUsers.output)
    .query(async ({ input }) => {
      const { searchTerm, limit } = input;

      try {
        const trimmedSearchTerm = searchTerm.trim();
        const lowerSearchTerm = trimmedSearchTerm.toLowerCase();
        const lowerLikeTerm = `%${lowerSearchTerm}%`;
        const twitterSearchTerm = lowerSearchTerm.replace(
          LEADING_AT_SYMBOL_REGEX,
          '',
        );
        const twitterLikeTerm = `%${twitterSearchTerm}%`;

        await ensurePrivyTableFresh();

        const buildBaseSearchQuery = () =>
          db
            .with(namefiNftCte)
            .select({
              id: usersTable.id,
              privyUserId: usersTable.privyUserId,
              primaryEmail: sql<
                string | null
              >`COALESCE(${usersTable.primaryEmail}, ${privyUsersTableSchema.email})`.as(
                'primary_email',
              ),
              walletAddresses: sql<
                string[]
              >`COALESCE(${privyUsersTableSchema.wallets}, ARRAY[]::text[])`.as(
                'wallet_addresses',
              ),
              displayName: privyUsersTableSchema.displayName,
              twitterUsername: privyUsersTableSchema.twitterUsername,
            })
            .from(usersTable)
            .leftJoin(
              privyUsersTableSchema,
              eq(privyUsersTableSchema.privyUserId, usersTable.privyUserId),
            )
            .$dynamic();

        const searchByWhereClause = async (whereClause: SQL) => {
          return await buildBaseSearchQuery()
            .where(whereClause)
            .orderBy(
              asc(
                sql`COALESCE(${usersTable.primaryEmail}, ${privyUsersTableSchema.email}, ${privyUsersTableSchema.displayName}, ${usersTable.id}::text)`,
              ),
            )
            .limit(limit);
        };

        const searchByWalletAddress = async (walletAddress: string) => {
          return await searchByWhereClause(
            sql`${walletAddress.toLowerCase()} = ANY(COALESCE(array_lowercase(${privyUsersTableSchema.wallets}), ARRAY[]::text[]))`,
          );
        };

        const searchByOwnedDomain = async ({
          domainName,
          operator,
        }: {
          domainName: string;
          operator: '=' | 'ILIKE';
        }) => {
          const comparisonValue =
            operator === '='
              ? domainName.toLowerCase()
              : `%${domainName.toLowerCase()}%`;

          return await searchByWhereClause(sql`EXISTS (
            SELECT 1
            FROM ${namefiNftView}
            WHERE LOWER(${namefiNftView.ownerAddress}) = ANY(COALESCE(array_lowercase(${privyUsersTableSchema.wallets}), ARRAY[]::text[]))
              AND LOWER(${namefiNftView.normalizedDomainName}) ${sql.raw(operator)} ${comparisonValue}
          )`);
        };

        let exactMatches: Array<{
          id: string;
          privyUserId: string;
          primaryEmail: string | null;
          walletAddresses: string[];
          displayName: string | null;
          twitterUsername: string | null;
        }> = [];

        const uuidValidation = z.string().uuid().safeParse(trimmedSearchTerm);
        if (uuidValidation.success) {
          exactMatches = await searchByWhereClause(
            eq(usersTable.id, trimmedSearchTerm),
          );
        } else if (trimmedSearchTerm.startsWith('did:privy:')) {
          exactMatches = await searchByWhereClause(
            eq(usersTable.privyUserId, trimmedSearchTerm),
          );
        } else {
          const walletValidation =
            checksumWalletAddressSchema.safeParse(trimmedSearchTerm);
          if (walletValidation.success) {
            exactMatches = await searchByWalletAddress(walletValidation.data);
          } else {
            const emailValidation = z
              .string()
              .email()
              .safeParse(trimmedSearchTerm);
            if (emailValidation.success) {
              exactMatches = await searchByWhereClause(
                sql`LOWER(COALESCE(${usersTable.primaryEmail}, ${privyUsersTableSchema.email}, '')) = ${lowerSearchTerm}`,
              );
            } else if (
              trimmedSearchTerm.includes('.') &&
              !trimmedSearchTerm.includes('@')
            ) {
              try {
                const resolvedAddress =
                  await resolveENSToWallet(trimmedSearchTerm);
                if (resolvedAddress) {
                  exactMatches = await searchByWalletAddress(resolvedAddress);
                }
              } catch (error) {
                logger.warn(
                  { ensName: trimmedSearchTerm, error },
                  'Failed to resolve ENS and fetch user',
                );
              }
              if (exactMatches.length === 0) {
                exactMatches = await searchByOwnedDomain({
                  domainName: trimmedSearchTerm,
                  operator: '=',
                });
              }
            }
          }
        }

        if (exactMatches.length > 0) {
          return exactMatches.slice(0, limit);
        }

        const genericSearchCondition = or(
          sql`LOWER(COALESCE(${usersTable.primaryEmail}, ${privyUsersTableSchema.email}, '')) LIKE ${lowerLikeTerm}`,
          sql`LOWER(COALESCE(${privyUsersTableSchema.displayName}, '')) LIKE ${lowerLikeTerm}`,
          sql`LOWER(${usersTable.privyUserId}) LIKE ${lowerLikeTerm}`,
          sql`LOWER(COALESCE(${privyUsersTableSchema.twitterUsername}, '')) LIKE ${twitterLikeTerm}`,
          sql`EXISTS (
            SELECT 1
            FROM unnest(COALESCE(array_lowercase(${privyUsersTableSchema.wallets}), ARRAY[]::text[])) AS wallet
            WHERE wallet LIKE ${lowerLikeTerm}
          )`,
          sql`EXISTS (
            SELECT 1
            FROM ${namefiNftView}
            WHERE LOWER(${namefiNftView.ownerAddress}) = ANY(COALESCE(array_lowercase(${privyUsersTableSchema.wallets}), ARRAY[]::text[]))
              AND LOWER(${namefiNftView.normalizedDomainName}) LIKE ${lowerLikeTerm}
          )`,
        );

        if (!genericSearchCondition) {
          return [];
        }

        return await searchByWhereClause(genericSearchCondition);
      } catch (error) {
        logger.error({ error, searchTerm }, 'Failed to search users');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search users',
        });
      }
    }),

  /**
   * Server-side search backing the admin `UserSelectComboBox` picker.
   *
   * Differences vs. `searchUsers`:
   *  - No exact-match short-circuit (UUID/wallet/ENS) — the picker is a
   *    free-form autocomplete, so we run a single OR-WHERE over all
   *    searchable fields and let SQL rank by an alphabetical fallback.
   *  - Domain matches go through a *separate* query against
   *    `namefiNftView` (collects owner wallets, then folds them back into
   *    the wallet-array filter) instead of an inline EXISTS subquery,
   *    so the planner doesn't re-run the view per row.
   *  - Honors `excludeUserIds` so already-selected chips disappear from
   *    the dropdown.
   *  - Returns DISTINCT rows.
   */
  searchUsersForPicker: adminProcedureWithPermissions(Permission.READ_USERS)
    .input(adminUsersContract.searchUsersForPicker.input)
    .output(adminUsersContract.searchUsersForPicker.output)
    .query(async ({ input }) => {
      const { searchTerm, limit, excludeUserIds } = input;

      try {
        const trimmedSearchTerm = searchTerm.trim();
        if (trimmedSearchTerm.length === 0) {
          return [];
        }
        const lowerSearchTerm = trimmedSearchTerm.toLowerCase();
        const lowerLikeTerm = `%${lowerSearchTerm}%`;

        await ensurePrivyTableFresh();

        // Step 1 — separate query: find owner wallet addresses for any
        // domain whose name ILIKE-matches the term. Skipped for short
        // terms and obvious wallet-looking inputs to avoid wasting a
        // full-name view scan on every keystroke.
        //
        // `namefiNftView` is a `pgView` aliased to the CTE name
        // `namefi_nft_cte`; it is only usable when the query also
        // declares the CTE via `.with(namefiNftCte)` (same pattern as
        // the existing `searchUsers` procedure).
        const looksLikeWallet = /^0x[a-f0-9]+$/.test(lowerSearchTerm);
        let ownerAddresses: string[] = [];
        if (lowerSearchTerm.length >= 3 && !looksLikeWallet) {
          const domainOwnerRows = await db
            .with(namefiNftCte)
            .selectDistinct({
              ownerAddress:
                sql<string>`LOWER(${namefiNftView.ownerAddress})`.as(
                  'owner_address',
                ),
            })
            .from(namefiNftView)
            .where(
              sql`LOWER(${namefiNftView.normalizedDomainName}) ILIKE ${lowerLikeTerm}`,
            )
            .limit(200);
          ownerAddresses = domainOwnerRows
            .map((row) => row.ownerAddress)
            .filter((addr): addr is string => Boolean(addr));
        }

        const orClauses: SQL[] = [
          sql`LOWER(${usersTable.id}::text) LIKE ${lowerLikeTerm}`,
          sql`LOWER(${usersTable.privyUserId}) LIKE ${lowerLikeTerm}`,
          sql`LOWER(COALESCE(${privyUsersTableSchema.email}, '')) LIKE ${lowerLikeTerm}`,
          sql`LOWER(COALESCE(${privyUsersTableSchema.displayName}, '')) LIKE ${lowerLikeTerm}`,
          sql`EXISTS (
            SELECT 1
            FROM unnest(COALESCE(array_lowercase(${privyUsersTableSchema.wallets}), ARRAY[]::text[])) AS wallet
            WHERE wallet LIKE ${lowerLikeTerm}
          )`,
        ];
        if (ownerAddresses.length > 0) {
          // Build `ARRAY[$1, $2, …]::text[]` explicitly via `sql.join` so
          // each address is a bound parameter — directly casting a JS
          // array parameter to `text[]` is brittle across pg drivers.
          const ownerArraySql = sql`ARRAY[${sql.join(
            ownerAddresses.map((addr) => sql`${addr}`),
            sql`, `,
          )}]::text[]`;
          orClauses.push(
            sql`array_lowercase(${privyUsersTableSchema.wallets}) && ${ownerArraySql}`,
          );
        }

        const orClause = or(...orClauses);
        if (!orClause) {
          return [];
        }
        const hasExclusions =
          Array.isArray(excludeUserIds) && excludeUserIds.length > 0;
        const whereClause = hasExclusions
          ? and(orClause, notInArray(usersTable.id, excludeUserIds))
          : orClause;

        // The `users LEFT JOIN privy_users` shape is 1:1 (privy_users PK
        // is privyUserId), so each users row appears at most once — no
        // DISTINCT is needed, and dropping it sidesteps the SELECT
        // DISTINCT / ORDER BY interaction.
        const rows = await db
          .select({
            id: usersTable.id,
            privyUserId: usersTable.privyUserId,
            primaryEmail: sql<
              string | null
            >`COALESCE(${usersTable.primaryEmail}, ${privyUsersTableSchema.email})`.as(
              'primary_email',
            ),
            walletAddresses: sql<
              string[]
            >`COALESCE(${privyUsersTableSchema.wallets}, ARRAY[]::text[])`.as(
              'wallet_addresses',
            ),
            displayName: privyUsersTableSchema.displayName,
            twitterUsername: privyUsersTableSchema.twitterUsername,
          })
          .from(usersTable)
          .leftJoin(
            privyUsersTableSchema,
            eq(privyUsersTableSchema.privyUserId, usersTable.privyUserId),
          )
          .where(whereClause)
          .orderBy(
            asc(
              sql`COALESCE(${usersTable.primaryEmail}, ${privyUsersTableSchema.email}, ${privyUsersTableSchema.displayName}, ${usersTable.id}::text)`,
            ),
          )
          .limit(limit);

        return rows.map((row) => ({
          id: row.id,
          privyUserId: row.privyUserId,
          primaryEmail: row.primaryEmail ?? null,
          walletAddresses: row.walletAddresses ?? [],
          displayName: row.displayName ?? null,
          twitterUsername: row.twitterUsername ?? null,
        }));
      } catch (error) {
        // Admin-only procedure — surface the raw Postgres / Drizzle
        // message unconditionally so SQL bugs in this still-young
        // procedure aren't masked by a generic 500.
        const rawMessage =
          error instanceof Error ? error.message : String(error);
        logger.error(
          { error, searchTerm },
          'Failed to search users for picker',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `searchUsersForPicker failed: ${rawMessage}`,
          cause: error instanceof Error ? error : undefined,
        });
      }
    }),

  resolveUserReference: adminProcedureWithPermissions(Permission.READ_USERS)
    .input(adminUsersContract.resolveUserReference.input)
    .output(adminUsersContract.resolveUserReference.output)
    .query(async ({ input }) => {
      return await resolveAdminUserReference(input);
    }),

  getUserDetails: adminProcedureWithPermissions(Permission.READ_USERS)
    .input(adminUsersContract.getUserDetails.input)
    .output(adminUsersContract.getUserDetails.output)
    .query(async ({ input }) => {
      return await getAdminUserDetails(input);
    }),

  updateUserPreferences: auditedAdminProcedureWithPermissions(
    Permission.WRITE_USERS,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'user',
      resourceId: (input as { userId: string }).userId,
      action: 'update_user_preferences',
      extraInput: input,
    }),
  )
    .input(adminUsersContract.updateUserPreferences.input)
    .output(adminUsersContract.updateUserPreferences.output)
    .mutation(async ({ input }) => {
      const preferences = await updateUserDefaultDomainsPreferences(
        input.userId,
        input.preferences,
      );
      return { success: true, preferences };
    }),

  getWalletDetails: adminProcedureWithPermissions(Permission.READ_USERS)
    .input(adminUsersContract.getWalletDetails.input)
    .output(adminUsersContract.getWalletDetails.output)
    .query(async ({ input }) => {
      return await getAdminWalletDetails(input);
    }),

  listUsers: adminProcedureWithPermissions(Permission.READ_USERS)
    .input(adminUsersContract.listUsers.input)
    .output(adminUsersContract.listUsers.output)
    .query(async ({ input }) => {
      const {
        page,
        pageSize,
        searchTerm,
        domainSearchTerm,
        ensSearchTerm,
        columnFilters,
        sorting,
      } = input;
      const offset = (page - 1) * pageSize;

      // Fetch admin users once to avoid per-user checks
      const adminIdsSet = await getAllUsersThatCanAccessAdminPanel();

      // Trigger Privy cache refresh workflow (non-blocking, respects 15-min cache)
      // and get the current cache status concurrently
      const [cacheRefreshResult, cacheStatus] = await Promise.all([
        triggerUpdatePrivyCache(false).catch((error) => {
          logger.warn({ error }, 'Failed to trigger Privy cache refresh');
          return null;
        }),
        getPrivyCacheStatus().catch((error) => {
          logger.warn({ error }, 'Failed to get Privy cache status');
          return null;
        }),
      ]);

      // Build base query using the CTE
      const baseQuery = db
        .with(userNftsCTE)
        .select({
          id: usersTable.id,
          privyUserId: usersTable.privyUserId,
          createdAt: usersTable.createdAt,
          updatedAt: usersTable.updatedAt,
          lastSignInAt: usersTable.lastSignInAt,
          twitterUsername: privyUsersTableSchema.twitterUsername,
          twitterDetails: privyUsersTableSchema.twitterDetails,
          primaryEmail: sql<
            string | null
          >`COALESCE(${usersTable.primaryEmail}, ${privyUsersTableSchema.email})`.as(
            'primary_email',
          ),
          displayName: privyUsersTableSchema.displayName,
          wallets: privyUsersTableSchema.wallets,
          nfts: userNftsCTE.nfts,
          nftCount: userNftsCTE.nftCount,
        })
        .from(usersTable)
        .leftJoin(
          privyUsersTableSchema,
          eq(privyUsersTableSchema.privyUserId, usersTable.privyUserId),
        )
        .leftJoin(userNftsCTE, eq(userNftsCTE.userId, usersTable.id))
        .$dynamic();

      // Build WHERE clause based on search terms and column filters
      const whereClauses: SQL[] = [];

      // Add general search term filter (email, name, id only)
      const term = (searchTerm ?? '').trim().toLowerCase();

      // Build Privy user search clause (no wallet or domain search)
      const privySearchClause = buildPrivySearchWhereClause(
        term,
        privyUsersTableSchema,
      );
      if (privySearchClause) {
        whereClauses.push(privySearchClause);
      }

      // Add domain-specific search
      const domainTerm = (domainSearchTerm ?? '').trim().toLowerCase();
      if (domainTerm.length > 0) {
        const domainLikeTerm = `%${domainTerm}%`;
        const domainOnlySearchClause = sql`EXISTS (
          SELECT 1 FROM json_array_elements(
            COALESCE(${userNftsCTE.nfts}, '[]'::json)
          ) AS nft
          WHERE nft->>'normalizedDomainName' ILIKE ${domainLikeTerm}
        )`;
        whereClauses.push(domainOnlySearchClause);
      }

      // Add ENS-specific search
      const ensTerm = (ensSearchTerm ?? '').trim().toLowerCase();
      if (ensTerm.length > 0) {
        let ensResolvedWallet: string | null = null;
        // Try to resolve ENS name to wallet address
        if (ensTerm.includes('.')) {
          try {
            const addr = await resolveENSToWallet(ensTerm);
            if (addr) ensResolvedWallet = addr.toLowerCase();
          } catch {}
        }

        if (ensResolvedWallet) {
          // Search by resolved wallet address
          const ensWalletClause = sql`${privyUsersTableSchema.wallets} @> ARRAY[${ensResolvedWallet}]::text[]`;
          whereClauses.push(ensWalletClause);
        }
      }

      // Add column filters
      if (columnFilters && columnFilters.length > 0) {
        for (const filter of columnFilters) {
          const { id, value } = filter;
          const { operator, value: filterValue } = value;

          // Map column IDs to SQL columns
          let columnSql: SQL | undefined;
          switch (id) {
            case 'id':
              columnSql = sql`${usersTable.id}::text`;
              break;
            case 'displayName':
              columnSql = sql`${privyUsersTableSchema.displayName}`;
              break;
            case 'primaryEmail':
              columnSql = sql`COALESCE(${usersTable.primaryEmail}, ${privyUsersTableSchema.email})`;
              break;
            case 'privyUserId':
              columnSql = sql`${usersTable.privyUserId}`;
              break;
            case 'createdAt':
              columnSql = sql`${usersTable.createdAt}`;
              break;
            case 'updatedAt':
              columnSql = sql`${usersTable.updatedAt}`;
              break;
            case 'lastSignInAt':
              columnSql = sql`${usersTable.lastSignInAt}`;
              break;
            case 'twitterUsername':
              columnSql = sql`${privyUsersTableSchema.twitterUsername}`;
              break;
            case 'nftCount':
              columnSql = sql`${userNftsCTE.nftCount}`;
              break;
            case 'primaryWallet':
              // Primary wallet is the first element in the wallets array
              columnSql = sql`${privyUsersTableSchema.wallets}[1]`;
              break;
            case 'walletCount':
              columnSql = sql`COALESCE(array_length(${privyUsersTableSchema.wallets}, 1), 0)`;
              break;
            case 'allWallets':
              // For allWallets, we need to search within the array
              // This will be handled specially in the operator switch
              break;
          }
          const TextFilterableColumns = new Set([
            'id',
            'displayName',
            'primaryEmail',
            'privyUserId',
            'primaryWallet',
            'allWallets',
            'twitterUsername',
          ]);
          const NumberFilterableColumns = new Set(['nftCount', 'walletCount']);
          const DateFilterableColumns = new Set([
            'createdAt',
            'updatedAt',
            'lastSignInAt',
          ]);

          // Special handling for allWallets (array search)
          if (id === 'allWallets') {
            if (typeof filterValue !== 'string') {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'allWallets filter expects a string value',
              });
            }
            const lowerFilterValue = String(filterValue).trim().toLowerCase();
            switch (operator) {
              case 'like':
                // Search for wallet containing the value in any element of the array (case-insensitive)
                whereClauses.push(
                  sql`EXISTS (
                    SELECT 1
                    FROM unnest(array_lowercase(${privyUsersTableSchema.wallets})) AS w
                    WHERE w LIKE ${`%${lowerFilterValue}%`}
                  )`,
                );
                break;
              case 'eq':
                // Check if any wallet matches exactly (case-insensitive)
                whereClauses.push(
                  sql`${lowerFilterValue} = ANY(array_lowercase(${privyUsersTableSchema.wallets}))`,
                );
                break;
              case 'neq':
                // Check that no wallet matches (case-insensitive)
                whereClauses.push(
                  sql`NOT (${lowerFilterValue} = ANY(array_lowercase(${privyUsersTableSchema.wallets})))`,
                );
                break;
              default:
                throw new TRPCError({
                  code: 'BAD_REQUEST',
                  message: `Operator "${operator}" is not supported for allWallets column`,
                });
            }
          } else if (id === 'primaryWallet') {
            if (typeof filterValue !== 'string') {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'primaryWallet filter expects a string value',
              });
            }
            // Special handling for primaryWallet to ensure lowercase comparison
            const lowerFilterValue = String(filterValue).trim().toLowerCase();
            switch (operator) {
              case 'like':
                whereClauses.push(
                  sql`LOWER(${columnSql}) LIKE ${`%${lowerFilterValue}%`}`,
                );
                break;
              case 'eq':
                whereClauses.push(
                  sql`LOWER(${columnSql}) = ${lowerFilterValue}`,
                );
                break;
              case 'neq':
                whereClauses.push(
                  sql`LOWER(${columnSql}) != ${lowerFilterValue}`,
                );
                break;
              default:
                throw new TRPCError({
                  code: 'BAD_REQUEST',
                  message: `Operator "${operator}" is not supported for primaryWallet column`,
                });
            }
          } else if (columnSql) {
            switch (operator) {
              case 'like':
                if (!TextFilterableColumns.has(id)) {
                  throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Column "${id}" does not support LIKE filters`,
                  });
                }
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
                if (
                  !(
                    NumberFilterableColumns.has(id) ||
                    DateFilterableColumns.has(id)
                  )
                ) {
                  throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Column "${id}" does not support 'gt'`,
                  });
                }
                whereClauses.push(sql`${columnSql} > ${filterValue}`);
                break;
              case 'gte':
                if (
                  !(
                    NumberFilterableColumns.has(id) ||
                    DateFilterableColumns.has(id)
                  )
                ) {
                  throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Column "${id}" does not support 'gte'`,
                  });
                }
                whereClauses.push(sql`${columnSql} >= ${filterValue}`);
                break;
              case 'lt':
                if (
                  !(
                    NumberFilterableColumns.has(id) ||
                    DateFilterableColumns.has(id)
                  )
                ) {
                  throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Column "${id}" does not support 'lt'`,
                  });
                }
                whereClauses.push(sql`${columnSql} < ${filterValue}`);
                break;
              case 'lte':
                if (
                  !(
                    NumberFilterableColumns.has(id) ||
                    DateFilterableColumns.has(id)
                  )
                ) {
                  throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Column "${id}" does not support 'lte'`,
                  });
                }
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
            case 'id':
              columnSql = sql`${usersTable.id}`;
              break;
            case 'displayName':
              columnSql = sql`${privyUsersTableSchema.displayName}`;
              break;
            case 'primaryEmail':
              columnSql = sql`COALESCE(${usersTable.primaryEmail}, ${privyUsersTableSchema.email})`;
              break;
            case 'privyUserId':
              columnSql = sql`${usersTable.privyUserId}`;
              break;
            case 'createdAt':
              columnSql = sql`${usersTable.createdAt}`;
              break;
            case 'updatedAt':
              columnSql = sql`${usersTable.updatedAt}`;
              break;
            case 'lastSignInAt':
              columnSql = sql`${usersTable.lastSignInAt}`;
              break;
            case 'twitterUsername':
              columnSql = sql`${privyUsersTableSchema.twitterUsername}`;
              break;
            case 'nftCount':
              columnSql = sql`${userNftsCTE.nftCount}`;
              break;
            case 'primaryWallet':
              columnSql = sql`${privyUsersTableSchema.wallets}[1]`;
              break;
            case 'walletCount':
              columnSql = sql`COALESCE(array_length(${privyUsersTableSchema.wallets}, 1), 0)`;
              break;
            case 'allWallets':
              // For allWallets, we can sort by the array as a whole (sorts by first element, then second, etc.)
              columnSql = sql`${privyUsersTableSchema.wallets}`;
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
        orderByClauses.push(sql`${usersTable.createdAt} DESC`);
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

        const items = rows.map((r) => ({
          id: r.id,
          privyUserId: r.privyUserId,
          primaryEmail: r.primaryEmail,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          lastSignInAt: r.lastSignInAt ?? null,
          twitterUsername: r.twitterUsername ?? null,
          twitterDetails: r.twitterDetails ?? null,
          isAdmin: adminIdsSet.has(r.id),
          displayName: r.displayName ?? null,
          wallets: r.wallets ?? [],
          nfts: r.nfts ?? [],
          nftCount: r.nftCount ?? 0,
        }));

        const total = countRow[0]?.count ?? 0;
        return {
          items,
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
          cacheLastRefresh: cacheStatus?.lastRefresh || null,
          cacheExpiresAt: cacheStatus?.expiresAt || null,
        };
      } catch (error) {
        logger.error({ error }, 'Failed to list users');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to list users',
        });
      }
    }),

  listUsersV2: adminProcedureWithPermissions(Permission.READ_USERS)
    .input(adminUsersContract.listUsersV2.input)
    .output(adminUsersContract.listUsersV2.output)
    .query(async ({ input }) => {
      const {
        page,
        pageSize,
        searchTerm,
        domainSearchTerm,
        ensSearchTerm,
        filters,
        sorting,
      } = input;
      const offset = (page - 1) * pageSize;

      // Fetch admin users once
      const adminIdsSet = await getAllUsersThatCanAccessAdminPanel();

      // Trigger cache refresh (non-blocking)
      const [cacheRefreshResult, cacheStatus] = await Promise.all([
        triggerUpdatePrivyCache(false).catch((error) => {
          logger.warn({ error }, 'Failed to trigger Privy cache refresh');
          return null;
        }),
        getPrivyCacheStatus().catch((error) => {
          logger.warn({ error }, 'Failed to get Privy cache status');
          return null;
        }),
      ]);

      // Define table structure for drizzler
      const tableStructure = {
        id: usersTable.id,
        privyUserId: usersTable.privyUserId,
        createdAt: usersTable.createdAt,
        updatedAt: usersTable.updatedAt,
        lastSignInAt: usersTable.lastSignInAt,
        displayName: privyUsersTableSchema.displayName,
        primaryEmail: sql<
          string | null
        >`TRIM(LOWER(${privyUsersTableSchema.email}))`.as('primary_email'),
        twitterUsername: privyUsersTableSchema.twitterUsername,
        nftCount: userNftsCTE.nftCount,
        wallets: privyUsersTableSchema.wallets,
        walletCount:
          sql`COALESCE(array_length(${privyUsersTableSchema.wallets}, 1), 0)`.as(
            'wallet_count',
          ),
        primaryWallet: sql`${privyUsersTableSchema.wallets}[1]`.as(
          'primary_wallet',
        ),
      };

      // Build base query
      const baseQuery = db
        .with(userNftsCTE)
        .select({
          id: usersTable.id,
          privyUserId: usersTable.privyUserId,
          createdAt: usersTable.createdAt,
          updatedAt: usersTable.updatedAt,
          lastSignInAt: usersTable.lastSignInAt,
          twitterUsername: privyUsersTableSchema.twitterUsername,
          twitterDetails: privyUsersTableSchema.twitterDetails,
          primaryEmail: sql<
            string | null
          >`TRIM(LOWER(${privyUsersTableSchema.email}))`.as('primary_email'),
          displayName: privyUsersTableSchema.displayName,
          wallets: privyUsersTableSchema.wallets,
          nfts: userNftsCTE.nfts,
          nftCount: userNftsCTE.nftCount,
        })
        .from(usersTable)
        .leftJoin(
          privyUsersTableSchema,
          eq(privyUsersTableSchema.privyUserId, usersTable.privyUserId),
        )
        .leftJoin(userNftsCTE, eq(userNftsCTE.userId, usersTable.id))
        .$dynamic();

      // Build WHERE clauses
      const whereClauses: SQL[] = [];

      // Add general search term filter (same as before)
      const term = (searchTerm ?? '').trim().toLowerCase();
      const privySearchClause = buildPrivySearchWhereClause(
        term,
        privyUsersTableSchema,
      );
      if (privySearchClause) {
        whereClauses.push(privySearchClause);
      }

      // Add domain-specific search (same as before)
      const domainTerm = (domainSearchTerm ?? '').trim().toLowerCase();
      if (domainTerm.length > 0) {
        const domainLikeTerm = `%${domainTerm}%`;
        whereClauses.push(sql`EXISTS (
          SELECT 1 FROM json_array_elements(
            COALESCE(${userNftsCTE.nfts}, '[]'::json)
          ) AS nft
          WHERE nft->>'normalizedDomainName' ILIKE ${domainLikeTerm}
        )`);
      }

      // Add ENS-specific search (same as before)
      const ensTerm = (ensSearchTerm ?? '').trim().toLowerCase();
      if (ensTerm.length > 0) {
        let ensResolvedWallet: string | null = null;
        if (ensTerm.includes('.')) {
          try {
            const addr = await resolveENSToWallet(ensTerm);
            if (addr) ensResolvedWallet = addr.toLowerCase();
          } catch {}
        }
        if (ensResolvedWallet) {
          whereClauses.push(
            sql`${privyUsersTableSchema.wallets} @> ARRAY[${ensResolvedWallet}]::text[]`,
          );
        }
      }

      // Add column filters using drizzler buildWhereClause
      if (filters) {
        const drizzlerWhere = buildWhereClause(
          tableStructure,
          filters as FilterOptions<any>,
        );

        if (drizzlerWhere) {
          whereClauses.push(drizzlerWhere);
        }
      }

      // Apply WHERE clauses
      let query = baseQuery;
      if (whereClauses.length > 0) {
        query = query.where(and(...whereClauses));
      }
      // Build ORDER BY using drizzler buildSortClause or default
      const orderByClauses = sorting
        ? buildSortClause(tableStructure, sorting as SortOptions<any>)
        : [sql`${usersTable.createdAt} DESC`];

      try {
        // Build count query
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

        const items = rows.map((r) => ({
          id: r.id,
          privyUserId: r.privyUserId,
          primaryEmail: r.primaryEmail,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          lastSignInAt: r.lastSignInAt ?? null,
          twitterUsername: r.twitterUsername ?? null,
          twitterDetails: r.twitterDetails ?? null,
          isAdmin: adminIdsSet.has(r.id),
          displayName: r.displayName ?? null,
          wallets: r.wallets ?? [],
          nfts: r.nfts ?? [],
          nftCount: r.nftCount ?? 0,
        }));

        const total = countRow[0]?.count ?? 0;
        return {
          items,
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
          cacheLastRefresh: cacheStatus?.lastRefresh || null,
          cacheExpiresAt: cacheStatus?.expiresAt || null,
        };
      } catch (error) {
        logger.error({ error }, 'Failed to list users v2');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to list users',
        });
      }
    }),

  forceRefreshPrivyCache: adminProcedureWithPermissions(Permission.READ_USERS)
    .input(adminUsersContract.forceRefreshPrivyCache.input)
    .output(adminUsersContract.forceRefreshPrivyCache.output)
    .mutation(async () => {
      try {
        logger.debug('Force refreshing Privy cache');

        // Trigger the workflow with forceRefresh=true
        const result = await triggerUpdatePrivyCache(true);

        // Get the updated status
        const status = await getPrivyCacheStatus();

        return {
          success: true,
          lastRefresh: status?.lastRefresh || null,
          expiresAt: status?.expiresAt || null,
          recordCount: status?.recordCount || 0,
        };
      } catch (error) {
        logger.error({ error }, 'Failed to force refresh Privy cache');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to force refresh Privy cache',
        });
      }
    }),
});
