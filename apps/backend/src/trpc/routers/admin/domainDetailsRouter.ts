import {
  db,
  domainConfigTable,
  domainUserPreferencesTable,
  indexedDomainsTable,
  namefiNftCte,
  namefiNftView,
  transferLogsCte,
  transferLogsView,
  usersTable,
} from '@namefi-astra/db';
import { Permission } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, eq, sql } from 'drizzle-orm';
import { adminProcedureWithPermissions } from '../../base';
import { createContractTRPCRouter } from '../../contract';
import { adminDomainDetailsContract } from '@namefi-astra/common/contract/admin/admin-domain-details-contract';
import { logger } from '#lib/logger';
import {
  ensurePrivyTableFresh,
  privyUsersTableSchema,
} from '../../../services/admin/privy-user-cache';

/**
 * Single read-only query that aggregates everything the admin
 * domain-details modal needs in one round-trip:
 *   - registration / NFT (namefiNftView + indexedDomainsTable +
 *     transferLogsView lateral for `dateTokenized`)
 *   - owning user (privy → users)
 *   - preferences (domainConfigTable + domainUserPreferencesTable)
 *   - cached NS / DNSSEC indexed snapshot
 *
 * Mutations stay on the existing `admin.nsAndDnssec.*` and
 * `admin.domainPreferences.*` sub-routers; this router is read-only.
 */
export const domainDetailsRouter = createContractTRPCRouter<
  typeof adminDomainDetailsContract
>({
  getDomainAdminDetails: adminProcedureWithPermissions(
    Permission.READ_NS_DNSSEC,
  )
    .input(adminDomainDetailsContract.getDomainAdminDetails.input)
    .output(adminDomainDetailsContract.getDomainAdminDetails.output)
    .query(async ({ input }) => {
      const { domainName } = input;
      await ensurePrivyTableFresh();

      // Latest mint event for this NFT — same lateral pattern as
      // `usersRouter.ts:817-832`. `latest` rather than `earliest` so
      // that re-mints after a burn surface the most recent mint, which
      // matches the user's current ownership.
      const mintEventLateral = db
        .with(transferLogsCte)
        .select({
          dateTokenized: transferLogsView.blockTime,
        })
        .from(transferLogsView)
        .where(
          and(
            eq(transferLogsView.tokenId, namefiNftView.tokenId),
            eq(transferLogsView.chainId, namefiNftView.chainId),
            eq(transferLogsView.isMint, true),
          ),
        )
        .orderBy(sql`${transferLogsView.blockTimestamp} DESC`)
        .limit(1)
        .as('mint_event_lateral');

      try {
        const rows = await db
          .with(namefiNftCte, transferLogsCte)
          .select({
            // registration / NFT
            chainId: namefiNftView.chainId,
            tokenId: namefiNftView.tokenId,
            normalizedDomainName: namefiNftView.normalizedDomainName,
            ownerAddress: namefiNftView.ownerAddress,
            registrarKey: indexedDomainsTable.registrarKey,
            expirationTime: indexedDomainsTable.expirationTime,
            lastUpdatedTimestamp: namefiNftView.lastUpdatedTimestamp,
            dateTokenized: mintEventLateral.dateTokenized,
            // owning user
            userId: usersTable.id,
            privyUserId: usersTable.privyUserId,
            // preferences
            autoRenewEnabled: domainUserPreferencesTable.autoRenewEnabled,
            autoEnsEnabled: domainConfigTable.autoEnsEnabled,
            autoParkEnabled: domainConfigTable.autoParkEnabled,
            forwardTo: domainConfigTable.forwardTo,
            // cached NS + DNSSEC
            nameservers: indexedDomainsTable.nameservers,
            isUsingNamefiNameservers:
              indexedDomainsTable.isUsingNamefiNameservers,
            dnssecStatus: indexedDomainsTable.dnssecStatus,
            dnssecLastUpdatedAt: indexedDomainsTable.dnssecLastUpdatedAt,
          })
          .from(namefiNftView)
          .leftJoin(
            indexedDomainsTable,
            eq(
              indexedDomainsTable.normalizedDomainName,
              namefiNftView.normalizedDomainName,
            ),
          )
          .leftJoin(
            domainConfigTable,
            eq(
              domainConfigTable.normalizedDomainName,
              namefiNftView.normalizedDomainName,
            ),
          )
          .leftJoin(
            privyUsersTableSchema,
            sql`LOWER(${namefiNftView.ownerAddress}) = ANY( array_lowercase(${privyUsersTableSchema.wallets}))`,
          )
          .leftJoin(
            usersTable,
            eq(usersTable.privyUserId, privyUsersTableSchema.privyUserId),
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
          .leftJoinLateral(mintEventLateral, sql`TRUE`)
          .where(eq(namefiNftView.normalizedDomainName, domainName))
          .limit(1);

        const row = rows[0];
        if (!row) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Domain "${domainName}" not found`,
          });
        }

        const dnssec = row.dnssecStatus ?? null;

        return {
          registration: {
            chainId: Number(row.chainId),
            tokenId: String(row.tokenId),
            normalizedDomainName: row.normalizedDomainName,
            ownerAddress: row.ownerAddress ?? null,
            registrarKey: row.registrarKey ?? null,
            expirationTime: row.expirationTime ?? null,
            // `namefiNftView.lastUpdatedTimestamp` is a bigint of
            // milliseconds since epoch; consumers (e.g. domainConfigRouter)
            // unwrap with `new Date(Number(...))`. Mirror that here.
            lastUpdatedTimestamp:
              row.lastUpdatedTimestamp != null
                ? new Date(Number(row.lastUpdatedTimestamp))
                : null,
            dateTokenized: row.dateTokenized ?? null,
          },
          user: row.userId
            ? { id: row.userId, privyUserId: row.privyUserId ?? null }
            : null,
          preferences: {
            autoRenewEnabled: row.autoRenewEnabled ?? null,
            autoEnsEnabled: row.autoEnsEnabled ?? null,
            autoParkEnabled: row.autoParkEnabled ?? null,
            forwardTo: row.forwardTo ?? null,
          },
          nsCached: row.nameservers
            ? {
                nameservers: row.nameservers,
                isUsingNamefiNameservers: !!row.isUsingNamefiNameservers,
              }
            : null,
          dnssecCached: dnssec
            ? {
                supportsDnssec: dnssec.supportsDnssec,
                hasDelegationSigner: dnssec.hasDelegationSigner,
                isUsingNamefiDelegationSigner:
                  dnssec.isUsingNamefiDelegationSigner,
                zoneHasActiveDnssec: dnssec.zoneHasActiveDnssec,
              }
            : null,
          dnssecLastUpdatedAt: row.dnssecLastUpdatedAt ?? null,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error(
          { error, domainName },
          'Failed to load admin domain details',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to load domain details',
        });
      }
    }),
});
