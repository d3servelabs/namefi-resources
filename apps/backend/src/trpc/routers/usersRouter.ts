import {
  db,
  usersTable,
  userLoginHistoryTable,
  namefiNftOwnersView,
  namefiNftOwnersCte,
  namefiNftView,
  namefiNftCte,
  burnedNamefiNftCte,
  transferLogsCte,
  indexedDomainsTable,
  domainConfigTable,
  dnsRecordsTable,
  domainUserPreferencesTable,
  orderItemsTable,
} from '@namefi-astra/db';
import {
  checksumWalletAddressSchema,
  namefiNormalizedDomainSchema,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import type {
  LinkedAccountWithMetadata,
  User as PrivyUser,
} from '@privy-io/server-auth';
import { TRPCError } from '@trpc/server';
import { and, eq, sql, inArray, ilike, gte, or } from 'drizzle-orm';
import { isEmpty, isNil, isNotEmpty, isNotNil, pluck } from 'ramda';
import { z } from 'zod';
import { config, secrets } from '#lib/env';
import { verifySolution } from 'altcha-lib';
import {
  getQualifyingPromoDomainNamesFromPrivyLinkedAccount,
  userQualifiesForDomainNamePromo,
} from '#lib/user-promo';
import { resolve } from '@namefi-astra/utils/promises/resolve';
import { usersContract } from '@namefi-astra/common/contract/users-contract';
import {
  authedOrPublicProcedure,
  protectedProcedure,
  publicProcedure,
  auditedAdminProcedureWithPermissions,
  withAudit,
} from '../base';
import { createContractTRPCRouter } from '../contract';
import { Permission } from '@namefi-astra/utils';
import {
  getPrivyUserLinkedEthereumChecksumWalletAddresses,
  privyClient,
} from '../utils';
import { canUserAccessAdminPanel } from '../utils';
import {
  privyCustomMetadataSchema,
  privyCustomMetadataToPrivyStorage,
  privyStorageToPrivyCustomMetadata,
} from '../types';

import { nftIdFromDomainName } from '@namefi-astra/utils/nft-hash';

import { logger } from '#lib/logger';
import { IsUserDomainOwner } from '../guards/assert-domain-owner';
import { syncSingleUserToListmonkActivity } from '../../temporal/activities/default/email-subscription-sync.activities';
import { audit, createAuditRecord } from '#lib/auditor';
import { deleteCookie, setCookie } from 'hono/cookie';
import { getDomainsExpirationDatesFromIndex } from '../../temporal/activities/domain/renew.activities';
import { resolveEnsNameToAddress } from '#lib/crypto/ens';
import { requestNfscFaucet } from '#lib/faucet/nfsc-faucet';
import { temporalClient } from '#temporal/client';
import { getAllowedChainsForNft } from '#lib/env/allowed-chains';
import { defaultKeyv } from '#lib/keyv';
import { setTimeout } from 'node:timers/promises';

if (!secrets.ALCHEMY_API_KEY) {
  throw new Error('Cannot create Ethereum public client');
}

const ONLY_SHOW_SUBDOMAINS_FOR_CURRENT_USER = false;

const PREVIOUSLY_OWNED_REMOVAL_LABELS = {
  domain_exported: 'Domain Exported',
  domain_expired: 'Domain Expired',
  transferred_to_another_wallet: 'Transferred To Another Wallet',
} as const;

type PreviouslyOwnedRemovalType = keyof typeof PREVIOUSLY_OWNED_REMOVAL_LABELS;

type PreviouslyOwnedDomainEvent = {
  eventId: string;
  tokenId: string;
  normalizedDomainName: NamefiNormalizedDomain;
  chainId: number;
  fromAddress: string;
  toAddress: string | null;
  removalType: PreviouslyOwnedRemovalType;
  removalReason: (typeof PREVIOUSLY_OWNED_REMOVAL_LABELS)[PreviouslyOwnedRemovalType];
  removedAt: Date;
  removalTimestamp: bigint;
  removalBlock: bigint;
  transactionHash: string;
  expirationTimeAtRemoval: Date | null;
};

type ImpersonationProfile = {
  id: string;
  privyUserId: string;
  primaryEmail: string | null;
  displayName: string | null;
  walletAddresses: string[];
  mainWalletAddress: string | null;
};
const _buildProfileForImpersonation = async (
  userId: string,
): Promise<ImpersonationProfile | null> => {
  const dbUser = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });
  if (!dbUser) return null;
  let displayName: string | null = null;
  let primaryEmail: string | null = null;
  let walletAddresses: string[] = [];
  let mainWalletAddress: string | null = null;
  try {
    const privyUser = await privyClient.getUserById(dbUser.privyUserId);
    primaryEmail = privyUser?.email?.address ?? null;
    const custom = privyStorageToPrivyCustomMetadata.parse(
      privyUser?.customMetadata,
    );
    const fullName = custom?.fullName;
    displayName =
      fullName || (primaryEmail ? primaryEmail.split('@')[0] : null) || null;
    walletAddresses = getPrivyUserLinkedEthereumChecksumWalletAddresses({
      privyUser,
    });
    mainWalletAddress = walletAddresses[0] ?? null;
  } catch (error) {
    logger.error(
      { error, context: '_buildProfileForImpersonation', userId },
      'Failed to enrich impersonation profile from Privy for %s',
      userId,
    );
  }
  return {
    id: dbUser.id,
    privyUserId: dbUser.privyUserId,
    primaryEmail,
    displayName,
    walletAddresses,
    mainWalletAddress,
  };
};
export const usersRouter = createContractTRPCRouter<typeof usersContract>({
  getImpersonationStatus: protectedProcedure
    .input(usersContract.getImpersonationStatus.input)
    .output(usersContract.getImpersonationStatus.output)
    .query(async ({ ctx }) => {
      try {
        const sleepMsRaw = await defaultKeyv.get<number | string>(
          'IMPERSONATION_SLEEP_MS',
        );
        const sleepMs = z.coerce.number().optional().parse(sleepMsRaw);
        if (sleepMs) {
          await setTimeout(sleepMs);
        }
      } catch (e) {
        logger.trace(
          { error: e },
          'getImpersonationStatus: failed to get sleep ms',
        );
      }
      if (ctx.impersonation) {
        const actor = await _buildProfileForImpersonation(
          ctx.impersonation.actorUserId,
        );
        const target = await _buildProfileForImpersonation(
          ctx.impersonation.targetUserId,
        );
        let targetPrivyUser: PrivyUser | null = null;
        try {
          if (target?.privyUserId) {
            targetPrivyUser = await privyClient.getUserById(target.privyUserId);
          }
        } catch (error) {
          logger.error(
            {
              error,
              context: 'getImpersonationStatus:loadTargetPrivyUser',
              actorUserId: ctx.impersonation.actorUserId,
              targetUserId: ctx.impersonation.targetUserId,
            },
            'Failed to load/redact target Privy user for impersonation',
          );
        }
        return {
          impersonating: true as const,
          actorUserId: ctx.impersonation.actorUserId,
          targetUserId: ctx.impersonation.targetUserId,
          actor,
          target,
          targetPrivyUser,
          effectiveUser: ctx.user,
        };
      }
      return {
        impersonating: false as const,
        actorUserId: ctx.user.id,
        targetUserId: null as null,
        actor: null as null,
        target: null as null,
        targetPrivyUser: null as null,
        effectiveUser: ctx.user,
      };
    }),
  impersonateUser: auditedAdminProcedureWithPermissions(
    Permission.IMPERSONATE_USERS,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'user',
      actorId: ctx.user.id,
      resourceType: 'user',
      resourceId: input.targetUserId,
      action: 'impersonate_start',
      extraInput: { ...input, auditActorExtraInfo },
    }),
  )
    .input(usersContract.impersonateUser.input)
    .output(usersContract.impersonateUser.output)
    .mutation(async ({ ctx, input }) => {
      // Validate target user exists
      const target = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, input.targetUserId),
      });
      if (!target) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Target user not found',
        });
      }
      // Forbid impersonating admins
      const targetIsAdmin = await canUserAccessAdminPanel(target);
      if (targetIsAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot impersonate an admin user',
        });
      }
      // Set cookie via Hono context (HttpOnly so client JS can't modify)
      try {
        const url = new URL(ctx.req.url);
        const forwardedProto = ctx.req.header('x-forwarded-proto');
        const secure =
          forwardedProto?.toLowerCase?.() === 'https' ||
          url.protocol === 'https:';
        await setCookie(
          ctx.honoCtx as any,
          'impersonate-user-id',
          input.targetUserId,
          {
            httpOnly: true,
            sameSite: 'Lax',
            secure,
            path: '/',
          },
        );
      } catch (error) {
        logger.error(
          { error, actorUserId: ctx.user.id, targetUserId: input.targetUserId },
          'Failed to set impersonation cookie',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to start impersonation',
        });
      }
      return { ok: true as const };
    }),

  stopImpersonating: protectedProcedure
    .input(usersContract.stopImpersonating.input)
    .output(usersContract.stopImpersonating.output)
    .mutation(async ({ ctx }) => {
      // Determine the original actor (not the effective impersonated user)
      const actorUserId = ctx.impersonation?.actorUserId ?? ctx.user.id;
      const originalUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, actorUserId),
        columns: { id: true, privyUserId: true },
      });
      if (!originalUser) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Actor not found',
        });
      }

      // Check original user's admin access and permissions
      const isAdmin = await canUserAccessAdminPanel(originalUser);
      const hasImpersonatePerm = (ctx.userPermissions ?? []).includes(
        Permission.IMPERSONATE_USERS,
      );
      if (!isAdmin || !hasImpersonatePerm) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not allowed' });
      }

      // Clear cookie via Hono context
      try {
        const url = new URL(ctx.req.url);
        const forwardedProto = ctx.req.header('x-forwarded-proto');
        const secure =
          forwardedProto?.toLowerCase?.() === 'https' ||
          url.protocol === 'https:';
        deleteCookie(ctx.honoCtx as any, 'impersonate-user-id', {
          path: '/',
          secure,
        });
      } catch (error) {
        logger.error(
          { error, actorUserId: ctx.user.id },
          'Failed to delete impersonation cookie',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to stop impersonation',
        });
      }

      // Manual audit (actor is original admin, resource is the previously impersonated target if present)
      try {
        audit(
          createAuditRecord({
            actorType: 'user',
            actorId: originalUser.id,
            resourceType: 'user',
            resourceId: ctx.impersonation?.targetUserId ?? originalUser.id,
            action: 'impersonate_stop',
            extraInput: {
              requestId: ctx.honoVars?.requestId,
              sessionId: ctx.sessionId,
            },
          }),
        );
      } catch (error) {
        logger.error(
          { error, actorUserId: ctx.user.id },
          'Failed to create audit record',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to stop impersonation',
        });
      }

      return { ok: true as const };
    }),
  getUser: protectedProcedure
    .input(usersContract.getUser.input)
    .output(usersContract.getUser.output)
    .query(async ({ ctx }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.user.id),
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return user;
    }),

  getMyPermissions: protectedProcedure
    .input(usersContract.getMyPermissions.input)
    .output(usersContract.getMyPermissions.output)
    .query(async ({ ctx }) => {
      return (ctx.userPermissions ?? []) as Permission[];
    }),

  requestNfscFaucet: publicProcedure
    .input(usersContract.requestNfscFaucet.input)
    .output(usersContract.requestNfscFaucet.output)
    .mutation(async ({ input }) => {
      if (!input.altcha) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Altcha verification is required',
        });
      }

      const verified = await verifySolution(
        input.altcha,
        secrets.ALTCHA_HMAC_KEY,
      );
      if (!verified) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid Altcha payload',
        });
      }

      const result = await requestNfscFaucet({
        walletAddress: input.walletAddress,
      });

      if (result.status === 'rate_limited') {
        return {
          status: 'rate_limited' as const,
          walletAddress: result.walletAddress,
          nextEligibleAt: result.nextEligibleAt,
        };
      }

      return {
        status: 'started' as const,
        workflowId: result.workflowId,
        walletAddress: result.walletAddress,
        nextEligibleAt: result.nextEligibleAt,
      };
    }),

  getNfscFaucetStatus: publicProcedure
    .input(usersContract.getNfscFaucetStatus.input)
    .output(usersContract.getNfscFaucetStatus.output)
    .query(async ({ input }) => {
      const { workflowId } = input;

      if (!workflowId.startsWith('faucet-mint-nfsc-')) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid workflow id',
        });
      }

      try {
        const handle = temporalClient.workflow.getHandle(workflowId);
        const description = await handle.describe();
        const status = description.status?.name ?? 'UNKNOWN';

        if (status === 'COMPLETED') {
          const txHash = await handle.result();
          return { status, txHash };
        }

        return { status, txHash: null };
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return { status: 'NOT_FOUND', txHash: null };
        }
        logger.error(
          { error, workflowId },
          'Failed to fetch NFSC faucet workflow status',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch faucet status',
        });
      }
    }),

  updatePrivyCustomMetadata: withAudit(
    protectedProcedure,
    ({
      ctx,
      input,
      auditActorExtraInfo,
      path,
      meta,
    }: {
      ctx: any;
      input: any;
      auditActorExtraInfo: any;
      path?: string;
      meta?: object;
    }) => ({
      actorType: 'user',
      actorId: ctx.user?.id || 'unknown',
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'user',
      resourceId: ctx.user?.id || 'unknown',
      action: 'update_privy_metadata',
      extraInput: input,
    }),
  )
    .input(usersContract.updatePrivyCustomMetadata.input)
    .output(usersContract.updatePrivyCustomMetadata.output)
    .mutation(async ({ input, ctx }: any) => {
      const serializedMetadata = privyCustomMetadataToPrivyStorage.parse(input);

      const updatedPrivyUser = await privyClient.setCustomMetadata(
        ctx.user.privyUserId,
        serializedMetadata,
      );

      return privyStorageToPrivyCustomMetadata.parse(
        updatedPrivyUser.customMetadata,
      );
    }),

  getUserQualifiesForDomainNamePromo: protectedProcedure
    .input(usersContract.getUserQualifiesForDomainNamePromo.input)
    .output(usersContract.getUserQualifiesForDomainNamePromo.output)
    .query(async ({ input, ctx }) => {
      const { user } = ctx;

      return await userQualifiesForDomainNamePromo({
        normalizedDomainName: input.normalizedDomainName,
        user,
      });
    }),

  // TODO: add tests for this procedure
  getCurrentUserDomainsV1: protectedProcedure
    .input(usersContract.getCurrentUserDomainsV1.input)
    .output(usersContract.getCurrentUserDomainsV1.output)
    .query(async ({ ctx }) => {
      const { user, poweredByNamefiDomain } = ctx;
      const [error, privyUser] = await resolve(
        privyClient.getUserById(user.privyUserId),
      );

      if (error || isNil(privyUser)) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'could not find user details',
        });
      }

      const privyUserLinkedEthereumChecksumWalletAddresses =
        getPrivyUserLinkedEthereumChecksumWalletAddresses({
          privyUser,
        });

      if (isEmpty(privyUserLinkedEthereumChecksumWalletAddresses)) {
        return [];
      }

      const whereConditions = [
        inArray(
          namefiNftOwnersView.ownerAddress,
          privyUserLinkedEthereumChecksumWalletAddresses,
        ),
      ];

      if (poweredByNamefiDomain) {
        whereConditions.push(
          ilike(
            namefiNftOwnersView.normalizedDomainName,
            `%.${poweredByNamefiDomain}`,
          ),
        );
      }

      if (ONLY_SHOW_SUBDOMAINS_FOR_CURRENT_USER) {
        whereConditions.push(
          gte(
            sql`array_length(string_to_array(${namefiNftOwnersView.normalizedDomainName}, '.'), 1)`,
            3,
          ),
        );
      }

      const nfts = (
        await db
          .with(namefiNftOwnersCte)
          .select()
          .from(namefiNftOwnersView)
          .where(and(...whereConditions))
      ).map((nft) => ({
        ...nft,
        tokenId: nftIdFromDomainName(nft.normalizedDomainName),
        expirationDate: null,
      }));

      const domainNames = pluck('normalizedDomainName', nfts);

      // If no domains, return early
      if (isEmpty(domainNames)) {
        return [];
      }

      try {
        const [
          expirationDates,
          indexedDomains,
          domainConfigs,
          dnsRecords,
          userPreferences,
          orderItems,
        ] = await Promise.all([
          getDomainsExpirationDatesFromIndex(domainNames),
          db
            .select({
              normalizedDomainName: indexedDomainsTable.normalizedDomainName,
              isUsingNamefiNameservers:
                indexedDomainsTable.isUsingNamefiNameservers,
              nameservers: indexedDomainsTable.nameservers,
            })
            .from(indexedDomainsTable)
            .where(
              inArray(indexedDomainsTable.normalizedDomainName, domainNames),
            ),
          db
            .select({
              normalizedDomainName: domainConfigTable.normalizedDomainName,
              autoParkEnabled: domainConfigTable.autoParkEnabled,
              autoEnsEnabled: domainConfigTable.autoEnsEnabled,
              forwardTo: domainConfigTable.forwardTo,
            })
            .from(domainConfigTable)
            .where(
              inArray(domainConfigTable.normalizedDomainName, domainNames),
            ),
          db
            .select({
              zoneName: dnsRecordsTable.zoneName,
              type: dnsRecordsTable.type,
              rdata: dnsRecordsTable.rdata,
              name: dnsRecordsTable.name,
            })
            .from(dnsRecordsTable)
            .where(inArray(dnsRecordsTable.zoneName, domainNames)),
          db
            .select({
              normalizedDomainName:
                domainUserPreferencesTable.normalizedDomainName,
              autoRenewEnabled: domainUserPreferencesTable.autoRenewEnabled,
            })
            .from(domainUserPreferencesTable)
            .where(
              and(
                inArray(
                  domainUserPreferencesTable.normalizedDomainName,
                  domainNames,
                ),
                eq(domainUserPreferencesTable.userId, user.id),
              ),
            ),
          db
            .select({
              normalizedDomainName: orderItemsTable.normalizedDomainName,
              createdAt: orderItemsTable.createdAt,
            })
            .from(orderItemsTable)
            .where(
              and(
                inArray(orderItemsTable.normalizedDomainName, domainNames),
                eq(orderItemsTable.status, 'SUCCEEDED'),
              ),
            ),
        ]);

        // Create lookup maps
        const indexedDomainsMap = new Map(
          indexedDomains.map((d) => [d.normalizedDomainName, d]),
        );
        const domainConfigsMap = new Map(
          domainConfigs.map((d) => [d.normalizedDomainName, d]),
        );
        const userPreferencesMap = new Map(
          userPreferences.map((d) => [d.normalizedDomainName, d]),
        );

        // Create orderItems map - get the earliest createdAt for each domain
        const orderItemsMap = new Map<string, Date>();
        for (const item of orderItems) {
          const domainName = item.normalizedDomainName;
          const existingDate = orderItemsMap.get(domainName);
          if (!existingDate || item.createdAt < existingDate) {
            orderItemsMap.set(domainName, item.createdAt);
          }
        }

        // Group DNS records by zone
        const dnsRecordsMap = new Map<string, typeof dnsRecords>();
        for (const record of dnsRecords) {
          const records = dnsRecordsMap.get(record.zoneName) || [];
          records.push(record);
          dnsRecordsMap.set(record.zoneName, records);
        }

        return nfts.map((nft) => {
          const domainName = nft.normalizedDomainName;
          const indexedDomain = indexedDomainsMap.get(domainName);
          const config = domainConfigsMap.get(domainName);
          const records = dnsRecordsMap.get(domainName) || [];
          const preferences = userPreferencesMap.get(domainName);
          const dateTokenized = orderItemsMap.get(domainName) ?? null;

          const hasWebRecords = records.some((r) =>
            ['A', 'AAAA', 'CNAME'].includes(r.type),
          );
          const hasMxRecords = records.some((r) => r.type === 'MX');
          const ensRecord = records.find(
            (r) =>
              r.type === 'TXT' && r.rdata.startsWith('ENS1') && r.name === '@',
          );

          return {
            ...nft,
            expirationDate: expirationDates[domainName],
            autoRenewEnabled: preferences?.autoRenewEnabled ?? false,
            autoEnsEnabled: config?.autoEnsEnabled ?? false,
            dateTokenized,
            dnsStatus: {
              nameservers: indexedDomain?.nameservers ?? [],
              isUsingNamefiNameservers:
                indexedDomain?.isUsingNamefiNameservers ?? false,
              isParkingEnabled: config?.autoParkEnabled ?? false,
              forwardTo: config?.forwardTo ?? null,
              hasWebRecords,
              hasMxRecords,
              ensRecord: ensRecord?.rdata ?? null,
            },
          };
        });
      } catch (error) {
        logger.error(
          { context: 'getCurrentUserDomainsV1', error },
          'Failed to fetch domain details',
        );
        // Fallback to minimal data if something fails
        return nfts.map((nft) => ({
          ...nft,
          autoRenewEnabled: false,
          autoEnsEnabled: false,
          dateTokenized: null,
          dnsStatus: {
            nameservers: [],
            isUsingNamefiNameservers: false,
            isParkingEnabled: false,
            forwardTo: null,
            hasWebRecords: false,
            hasMxRecords: false,
            ensRecord: null,
          },
        }));
      }
    }),

  getCurrentUserDomains: protectedProcedure
    .input(usersContract.getCurrentUserDomains.input)
    .output(usersContract.getCurrentUserDomains.output)
    .query(async ({ ctx }) => {
      const { user, poweredByNamefiDomain } = ctx;
      const [error, privyUser] = await resolve(
        privyClient.getUserById(user.privyUserId),
      );

      if (error || isNil(privyUser)) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'could not find user details',
        });
      }

      const privyUserLinkedEthereumChecksumWalletAddresses =
        getPrivyUserLinkedEthereumChecksumWalletAddresses({
          privyUser,
        });

      if (isEmpty(privyUserLinkedEthereumChecksumWalletAddresses)) {
        return [];
      }

      const whereConditions = [
        inArray(
          namefiNftView.ownerAddress,
          privyUserLinkedEthereumChecksumWalletAddresses,
        ),
        inArray(
          namefiNftView.chainId,
          getAllowedChainsForNft(poweredByNamefiDomain ?? undefined),
        ),
      ];

      if (poweredByNamefiDomain) {
        whereConditions.push(
          ilike(
            namefiNftView.normalizedDomainName,
            `%.${poweredByNamefiDomain}`,
          ),
        );
      }

      if (ONLY_SHOW_SUBDOMAINS_FOR_CURRENT_USER) {
        whereConditions.push(
          gte(
            sql`array_length(string_to_array(${namefiNftView.normalizedDomainName}, '.'), 1)`,
            3,
          ),
        );
      }

      const dnsFlagsLateral = db
        .select({
          hasWebRecords:
            sql<boolean>`bool_or(${dnsRecordsTable.type} IN ('A', 'AAAA', 'CNAME'))`.as(
              'has_web_records',
            ),
          hasMxRecords:
            sql<boolean>`bool_or(${dnsRecordsTable.type} = 'MX')`.as(
              'has_mx_records',
            ),
        })
        .from(dnsRecordsTable)
        .where(
          and(
            eq(dnsRecordsTable.zoneName, namefiNftView.normalizedDomainName),
            inArray(dnsRecordsTable.type, ['A', 'AAAA', 'CNAME', 'MX']),
          ),
        )
        .as('dns_flags');

      const dateTokenizedLateral = db
        .select({
          dateTokenized: sql<Date | null>`MIN(${orderItemsTable.createdAt})`.as(
            'date_tokenized',
          ),
        })
        .from(orderItemsTable)
        .where(
          and(
            eq(
              orderItemsTable.normalizedDomainName,
              namefiNftView.normalizedDomainName,
            ),
            eq(orderItemsTable.status, 'SUCCEEDED'),
          ),
        )
        .as('date_tokenized_lateral');

      const rows = await db
        .with(namefiNftCte)
        .select({
          normalizedDomainName: namefiNftView.normalizedDomainName,
          tokenId: namefiNftView.tokenId,
          chainId: namefiNftView.chainId,
          ownerAddress: namefiNftView.ownerAddress,
          expirationDate: indexedDomainsTable.expirationTime,
          nameservers: indexedDomainsTable.nameservers,
          isUsingNamefiNameservers:
            indexedDomainsTable.isUsingNamefiNameservers,
          autoEnsEnabled: domainConfigTable.autoEnsEnabled,
          autoParkEnabled: domainConfigTable.autoParkEnabled,
          dnssecEnabled: domainConfigTable.dnssecEnabled,
          forwardTo: domainConfigTable.forwardTo,
          autoRenewEnabled: domainUserPreferencesTable.autoRenewEnabled,
          hasWebRecords: dnsFlagsLateral.hasWebRecords,
          hasMxRecords: dnsFlagsLateral.hasMxRecords,
          hasEffectiveWebPresence: sql<boolean>`
            COALESCE(${dnsFlagsLateral.hasWebRecords}, false)
            OR COALESCE(${domainConfigTable.autoParkEnabled}, false)
            OR (${domainConfigTable.forwardTo} IS NOT NULL)
          `,
          dateTokenized: dateTokenizedLateral.dateTokenized,
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
          domainUserPreferencesTable,
          and(
            eq(
              domainUserPreferencesTable.normalizedDomainName,
              namefiNftView.normalizedDomainName,
            ),
            eq(domainUserPreferencesTable.userId, user.id),
          ),
        )
        .leftJoinLateral(dnsFlagsLateral, sql`true`)
        .leftJoinLateral(dateTokenizedLateral, sql`true`)
        .where(and(...whereConditions))
        .$withCache({
          config: { ex: 15 },
          autoInvalidate: true,
          tag: `getCurrentUserDomains(userId:${user.id},poweredByNamefiDomain:${poweredByNamefiDomain ?? 'undefined'})`,
        });

      return rows.map((row) => ({
        normalizedDomainName: row.normalizedDomainName,
        chainId: row.chainId,
        ownerAddress: row.ownerAddress,
        tokenId: row.tokenId,
        expirationDate: row.expirationDate,
        autoRenewEnabled: row.autoRenewEnabled ?? false,
        autoEnsEnabled: row.autoEnsEnabled ?? false,
        dnssecEnabled: row.dnssecEnabled ?? false,
        dateTokenized: row.dateTokenized ?? null,
        dnsStatus: {
          nameservers: row.nameservers ?? [],
          isUsingNamefiNameservers: row.isUsingNamefiNameservers ?? false,
          isParkingEnabled: row.autoParkEnabled ?? false,
          forwardTo: row.forwardTo ?? null,
          hasWebRecords: row.hasWebRecords ?? false,
          hasMxRecords: row.hasMxRecords ?? false,
          hasEffectiveWebPresence: row.hasEffectiveWebPresence ?? false,
        },
      }));
    }),

  isDomainOwnedByCurrentUser: protectedProcedure
    .input(usersContract.isDomainOwnedByCurrentUser.input)
    .output(usersContract.isDomainOwnedByCurrentUser.output)
    .query(async ({ input, ctx }) => {
      const { user } = ctx;
      const [error, privyUser] = await resolve(
        privyClient.getUserById(user.privyUserId),
      );

      if (error || isNil(privyUser)) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'could not find user details',
        });
      }
      return IsUserDomainOwner(input.normalizedDomainName, user);
    }),

  getManagerPageEntrypointViewable: authedOrPublicProcedure
    .input(usersContract.getManagerPageEntrypointViewable.input)
    .output(usersContract.getManagerPageEntrypointViewable.output)
    .query(async ({ ctx }) => {
      const { user, poweredByNamefiDomain } = ctx;

      if (!user) {
        return { viewable: false };
      }

      const [error, privyUser] = await resolve(
        privyClient.getUserById(user.privyUserId),
      );

      if (error || isNil(privyUser) || isNil(privyUser.email?.address)) {
        return { viewable: false };
      }

      const userOwnedParentDomains =
        config.EMAIL_ADDRESS_TO_OWNED_HOSTNAMES_MAP[
          privyUser.email.address
        ]?.filter(
          (domain) =>
            isNil(poweredByNamefiDomain) || domain === poweredByNamefiDomain,
        ) ?? [];

      return { viewable: isNotEmpty(userOwnedParentDomains) };
    }),

  getRegisteredSubdomainsForParentDomainOwner: protectedProcedure
    .input(usersContract.getRegisteredSubdomainsForParentDomainOwner.input)
    .output(usersContract.getRegisteredSubdomainsForParentDomainOwner.output)
    .query(async ({ ctx }) => {
      const { user, poweredByNamefiDomain } = ctx;
      const [error, privyUser] = await resolve(
        privyClient.getUserById(user.privyUserId),
      );

      if (error || isNil(privyUser)) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'could not find user details',
        });
      }

      if (isNil(privyUser.email?.address)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'missing email',
        });
      }

      // #region get all issued subdomains for parent domains owned by user
      const userOwnedParentDomains =
        config.EMAIL_ADDRESS_TO_OWNED_HOSTNAMES_MAP[privyUser.email.address] ??
        [];

      const parentDomains = poweredByNamefiDomain
        ? userOwnedParentDomains.filter(
            (domain) => domain === poweredByNamefiDomain,
          )
        : userOwnedParentDomains;

      if (isEmpty(parentDomains)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
        });
      }

      const issuedSubdomainNfts = await db
        .with(namefiNftOwnersCte)
        .select()
        .from(namefiNftOwnersView)
        .where(
          and(
            or(
              ...parentDomains.map((poweredByNamefiDomain) =>
                ilike(
                  namefiNftOwnersView.normalizedDomainName,
                  `%.${poweredByNamefiDomain}`,
                ),
              ),
            ),
            gte(
              sql`array_length(string_to_array(${namefiNftOwnersView.normalizedDomainName}, '.'), 1)`,
              3,
            ),
          ),
        );

      const subdomainNftsMap: Record<
        NamefiNormalizedDomain,
        (typeof issuedSubdomainNfts)[number]
      > = {};
      const subdomainNftDomainNames: NamefiNormalizedDomain[] = [];

      for (const nft of issuedSubdomainNfts) {
        subdomainNftDomainNames.push(nft.normalizedDomainName);
        subdomainNftsMap[nft.normalizedDomainName] = nft;
      }
      // #endregion get all parent domains and subdomains

      // #region get successfully processed orderItems for issued subdomains
      const successfulOrderItems = await db.query.orderItemsTable.findMany({
        where: (table, { inArray, and }) =>
          and(
            inArray(table.normalizedDomainName, subdomainNftDomainNames),
            eq(table.status, 'SUCCEEDED'),
          ),
        columns: {
          normalizedDomainName: true,
          amountInUSDCents: true,
          updatedAt: true,
        },
      });
      // #endregion get successfully processed orderItems for issued subdomains

      const res = successfulOrderItems.map((orderItem) => {
        return {
          normalizedDomainName: orderItem.normalizedDomainName,
          ownerAddress:
            subdomainNftsMap[orderItem.normalizedDomainName]?.ownerAddress,
          updatedAt: orderItem.updatedAt,
          priceInUsdCents: orderItem.amountInUSDCents,
        };
      });

      return res;
    }),

  getUserQualifyingDomainNamesForPromo: protectedProcedure
    .input(usersContract.getUserQualifyingDomainNamesForPromo.input)
    .output(usersContract.getUserQualifyingDomainNamesForPromo.output)
    .query(async ({ ctx }) => {
      const { user, poweredByNamefiDomain } = ctx;

      if (poweredByNamefiDomain !== '0x.city') {
        //promo is only available for 0x.city
        return [];
      }

      // Check privyUser exists
      const [error, privyUser] = await resolve(
        privyClient.getUserById(user.privyUserId),
      );

      if (error || isNil(privyUser)) {
        return [];
      }

      type QualifyingDomainNameForPromoWithLinkedAccountType = {
        qualifyingDomainName: string;
        linkedAccountType:
          | 'email'
          | 'github_oauth'
          | 'twitter_oauth'
          | 'wallet';
      };

      const results: QualifyingDomainNameForPromoWithLinkedAccountType[] = [];
      const qualifyingDomainNamesSet = new Set<string>();
      const maybeAddToResults = ({
        qualifyingDomainName,
        linkedAccountType,
      }: QualifyingDomainNameForPromoWithLinkedAccountType) => {
        if (!qualifyingDomainNamesSet.has(qualifyingDomainName)) {
          results.push({ qualifyingDomainName, linkedAccountType });
        }
        qualifyingDomainNamesSet.add(qualifyingDomainName);
      };

      // check email address
      const qualifyingDomainNamesFromEmail = isNotNil(privyUser.email)
        ? await getQualifyingPromoDomainNamesFromPrivyLinkedAccount({
            privyLinkedAccount: {
              ...privyUser.email,
              type: 'email',
            } as LinkedAccountWithMetadata,
          })
        : [];

      for (const domainName of qualifyingDomainNamesFromEmail) {
        maybeAddToResults({
          qualifyingDomainName: domainName,
          linkedAccountType: 'email',
        });
      }

      // check github
      const qualifyingDomainNamesFromGitHub = isNotNil(privyUser.github)
        ? await getQualifyingPromoDomainNamesFromPrivyLinkedAccount({
            privyLinkedAccount: {
              ...privyUser.github,
              type: 'github_oauth',
            } as LinkedAccountWithMetadata,
          })
        : [];

      for (const domainName of qualifyingDomainNamesFromGitHub) {
        maybeAddToResults({
          qualifyingDomainName: domainName,
          linkedAccountType: 'github_oauth',
        });
      }

      // check twitter
      const qualifyingDomainNamesFromTwitter = isNotNil(privyUser.twitter)
        ? await getQualifyingPromoDomainNamesFromPrivyLinkedAccount({
            privyLinkedAccount: {
              ...privyUser.twitter,
              type: 'twitter_oauth',
            } as LinkedAccountWithMetadata,
          })
        : [];

      for (const domainName of qualifyingDomainNamesFromTwitter) {
        maybeAddToResults({
          qualifyingDomainName: domainName,
          linkedAccountType: 'twitter_oauth',
        });
      }

      // check ENS for all user wallets
      const walletDomainPromises = await Promise.allSettled(
        privyUser.linkedAccounts
          .filter((linkedAccount) => linkedAccount.type === 'wallet')
          .map((linkedWallet) =>
            getQualifyingPromoDomainNamesFromPrivyLinkedAccount({
              privyLinkedAccount: linkedWallet as LinkedAccountWithMetadata,
            }),
          ),
      );

      for (const result of walletDomainPromises) {
        if (result.status === 'rejected') {
          continue;
        }

        const [domainName] = result.value;
        if (isNil(domainName)) {
          continue;
        }

        maybeAddToResults({
          qualifyingDomainName: domainName,
          linkedAccountType: 'wallet',
        });
      }

      return results;
    }),

  doesUserSubscribeToEmails: protectedProcedure
    .input(usersContract.doesUserSubscribeToEmails.input)
    .output(usersContract.doesUserSubscribeToEmails.output)
    .query(async ({ ctx }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.user.id),
        columns: {
          subscribeToEmails: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return user.subscribeToEmails;
    }),

  setSubscribeToEmails: withAudit(
    protectedProcedure,
    ({
      ctx,
      input,
      auditActorExtraInfo,
      path,
      meta,
    }: {
      ctx: any;
      input: any;
      auditActorExtraInfo: any;
      path?: string;
      meta?: object;
    }) => ({
      actorType: 'user',
      actorId: ctx.user?.id || 'unknown',
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'user',
      resourceId: ctx.user?.id || 'unknown',
      action: input.optIn ? 'subscribe_to_emails' : 'unsubscribe_from_emails',
      extraInput: input,
    }),
  )
    .input(usersContract.setSubscribeToEmails.input)
    .output(usersContract.setSubscribeToEmails.output)
    .mutation(async ({ input, ctx }: any) => {
      // Update the user's opt-in status
      await db
        .update(usersTable)
        .set({ subscribeToEmails: input.optIn })
        .where(eq(usersTable.id, ctx.user.id));

      // Sync this user to Listmonk directly
      try {
        await syncSingleUserToListmonkActivity(ctx.user.id);

        logger.debug(
          { userId: ctx.user.id, optIn: input.optIn },
          'Successfully synced user to Listmonk after opt-in change',
        );
      } catch (error) {
        logger.error(
          { error, userId: ctx.user.id, optIn: input.optIn },
          `Failed to sync user to Listmonk after opt-${input.optIn ? 'in' : 'out'} change`,
        );
        // Don't throw error since the opt-in status was already updated successfully
      }

      return { success: true, optIn: input.optIn };
    }),

  getCurrentUserBurnedDomains: protectedProcedure
    .input(usersContract.getCurrentUserBurnedDomains.input)
    .output(usersContract.getCurrentUserBurnedDomains.output)
    .query(async ({ ctx }) => {
      const { user } = ctx;
      const [error, privyUser] = await resolve(
        privyClient.getUserById(user.privyUserId),
      );

      if (error || isNil(privyUser)) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'could not find user details',
        });
      }

      const privyUserLinkedEthereumChecksumWalletAddresses =
        getPrivyUserLinkedEthereumChecksumWalletAddresses({
          privyUser,
        });

      if (isEmpty(privyUserLinkedEthereumChecksumWalletAddresses)) {
        return [];
      }

      const walletAddressesLowercase =
        privyUserLinkedEthereumChecksumWalletAddresses.map((address) =>
          address.toLowerCase(),
        );
      const walletAddressesLowercaseSet = new Set(walletAddressesLowercase);
      const buildOwnershipKey = (
        domainName: NamefiNormalizedDomain,
        chainId: number,
      ) => `${chainId}:${domainName}`;

      const [currentOwnershipRecords, burnedDomains, transferLogs] =
        await Promise.all([
          db
            .with(namefiNftOwnersCte)
            .select({
              normalizedDomainName: namefiNftOwnersView.normalizedDomainName,
              chainId: namefiNftOwnersView.chainId,
            })
            .from(namefiNftOwnersView)
            .where(
              inArray(
                sql`LOWER(${namefiNftOwnersView.ownerAddress})`,
                walletAddressesLowercase,
              ),
            ),
          db
            .with(burnedNamefiNftCte)
            .select()
            .from(burnedNamefiNftCte)
            .where(
              inArray(
                sql`LOWER(${burnedNamefiNftCte.fromAddress})`,
                walletAddressesLowercase,
              ),
            )
            .orderBy(sql`${burnedNamefiNftCte.burnedTime} DESC`),
          db
            .with(transferLogsCte)
            .select()
            .from(transferLogsCte)
            .where(
              and(
                inArray(
                  sql`LOWER(${transferLogsCte.fromAddress})`,
                  walletAddressesLowercase,
                ),
                eq(transferLogsCte.isBurn, false),
                eq(transferLogsCte.isMint, false),
              ),
            )
            .orderBy(sql`${transferLogsCte.blockTime} DESC`),
        ]);

      // If a domain is owned currently, it is not considered previously owned (even if it was transferred at some point )
      const currentlyOwnedDomainKeys = new Set(
        currentOwnershipRecords.map((record) =>
          buildOwnershipKey(record.normalizedDomainName, record.chainId),
        ),
      );

      const burnedDomainEvents: PreviouslyOwnedDomainEvent[] = burnedDomains
        .filter((domain) => {
          const key = buildOwnershipKey(
            domain.normalizedDomainName,
            domain.chainId,
          );
          return !currentlyOwnedDomainKeys.has(key);
        })
        .map((domain) => {
          const expirationTimeAtRemoval =
            domain.expirationTimeAtBurnDate ?? null;
          const removalType: PreviouslyOwnedRemovalType =
            expirationTimeAtRemoval &&
            expirationTimeAtRemoval.getTime() > domain.burnedTime.getTime()
              ? 'domain_exported'
              : 'domain_expired';

          return {
            eventId: `burn:${domain.chainId}:${domain.tokenId.toString()}:${domain.transactionHash}`,
            tokenId: domain.tokenId.toString(),
            normalizedDomainName: domain.normalizedDomainName,
            chainId: domain.chainId,
            fromAddress: domain.fromAddress,
            toAddress: null,
            removalType,
            removalReason: PREVIOUSLY_OWNED_REMOVAL_LABELS[removalType],
            removedAt: domain.burnedTime,
            removalTimestamp: domain.burnedTimestamp,
            removalBlock: domain.burnedBlock,
            transactionHash: domain.transactionHash,
            expirationTimeAtRemoval,
          };
        });

      const transferEvents: PreviouslyOwnedDomainEvent[] = transferLogs
        .filter((transfer) => {
          if (transfer.isBurn || transfer.isMint) {
            return false;
          }
          const toAddressLower = transfer.toAddress?.toLowerCase() ?? null;
          if (
            !toAddressLower ||
            walletAddressesLowercaseSet.has(toAddressLower)
          ) {
            return false;
          }
          const key = buildOwnershipKey(
            transfer.normalizedDomainName,
            transfer.chainId,
          );
          return !currentlyOwnedDomainKeys.has(key);
        })
        .map((transfer) => ({
          eventId: `transfer:${transfer.chainId}:${transfer.tokenId.toString()}:${transfer.transactionHash}`,
          tokenId: transfer.tokenId.toString(),
          normalizedDomainName: transfer.normalizedDomainName,
          chainId: transfer.chainId,
          fromAddress: transfer.fromAddress,
          toAddress: transfer.toAddress,
          removalType: 'transferred_to_another_wallet',
          removalReason:
            PREVIOUSLY_OWNED_REMOVAL_LABELS.transferred_to_another_wallet,
          removedAt: transfer.blockTime,
          removalTimestamp: transfer.blockTimestamp,
          removalBlock: transfer.blockNumber,
          transactionHash: transfer.transactionHash,
          expirationTimeAtRemoval: null,
        }));

      const previouslyOwnedEvents = [
        ...burnedDomainEvents,
        ...transferEvents,
      ].sort((a, b) => b.removedAt.getTime() - a.removedAt.getTime());

      return previouslyOwnedEvents;
    }),
  resolveEnsName: protectedProcedure
    .input(usersContract.resolveEnsName.input)
    .output(usersContract.resolveEnsName.output)
    .mutation(async ({ input }) => {
      const ensName = input.ensName.trim();
      const normalizedEnsName = ensName.toLowerCase();
      const address = await resolveEnsNameToAddress(normalizedEnsName);
      return {
        ensName,
        normalizedEnsName,
        address,
      };
    }),

  listMyLoginHistory: protectedProcedure
    .input(usersContract.listMyLoginHistory.input)
    .output(usersContract.listMyLoginHistory.output)
    .query(async ({ ctx, input }) => {
      const rows = await db
        .select({
          id: userLoginHistoryTable.id,
          sessionId: userLoginHistoryTable.sessionId,
          signedInAt: userLoginHistoryTable.signedInAt,
          lastAccessedAt: userLoginHistoryTable.lastAccessedAt,
          ipAddress: userLoginHistoryTable.ipAddress,
          os: userLoginHistoryTable.os,
          browser: userLoginHistoryTable.browser,
          device: userLoginHistoryTable.device,
          loginMethod: userLoginHistoryTable.loginMethod,
          geoCity: userLoginHistoryTable.geoCity,
          geoSubdivision: userLoginHistoryTable.geoSubdivision,
          geoRegionCode: userLoginHistoryTable.geoRegionCode,
          isNewIp: userLoginHistoryTable.isNewIp,
          isNewLocation: userLoginHistoryTable.isNewLocation,
          isNewFingerprint: userLoginHistoryTable.isNewFingerprint,
          isFirstSession: userLoginHistoryTable.isFirstSession,
          systemRecognizedSessionDetails:
            userLoginHistoryTable.systemRecognizedSessionDetails,
          userRecognizedSessionDetails:
            userLoginHistoryTable.userRecognizedSessionDetails,
        })
        .from(userLoginHistoryTable)
        .where(eq(userLoginHistoryTable.userId, ctx.user.id))
        .orderBy(
          sql`${userLoginHistoryTable.signedInAt} DESC`,
          // Stable tiebreaker so rows with identical signedInAt return in
          // a deterministic order (matches the admin-side router pattern).
          sql`${userLoginHistoryTable.id} DESC`,
        )
        .limit(input.limit);

      return { items: rows };
    }),

  acknowledgeLoginSession: protectedProcedure
    .input(usersContract.acknowledgeLoginSession.input)
    .output(usersContract.acknowledgeLoginSession.output)
    .mutation(async ({ ctx, input }) => {
      // Ownership-scoped UPDATE: a user can only acknowledge their own
      // login-history rows. The WHERE userId = ctx.user.id clause is the
      // entire authorization layer for this mutation; an arbitrary id
      // owned by someone else simply matches no rows.
      const updated = await db
        .update(userLoginHistoryTable)
        .set({ userRecognizedSessionDetails: input.recognized })
        .where(
          and(
            eq(userLoginHistoryTable.id, input.id),
            eq(userLoginHistoryTable.userId, ctx.user.id),
          ),
        )
        .returning({ id: userLoginHistoryTable.id });

      if (updated.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Login session not found',
        });
      }

      return { ok: true as const };
    }),
});
