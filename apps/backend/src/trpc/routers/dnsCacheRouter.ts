import { publicProcedure, adminProcedureWithPermissions } from '../base';
import { createContractTRPCRouter } from '../contract';
import { dnsCacheContract } from '@namefi-astra/common/contract/dns-cache-contract';
import { TRPCError } from '@trpc/server';
import { secrets, config } from '#lib/env';
import { verifySolution } from 'altcha-lib';
import { flushDnsCache } from '#lib/dns-cache-flush';
import { createLogger } from '#lib/logger';
import { createAuditRecord, audit, ResourceType } from '#lib/auditor';
import { Permission } from '@namefi-astra/utils';
import { createCoreDNSClient } from '@namefi-astra/coredns-client';
import pMap from 'p-map';

const logger = createLogger({ context: 'DNS_CACHE_ROUTER' });

export const dnsCacheRouter = createContractTRPCRouter<typeof dnsCacheContract>(
  {
    /**
     * List configured CoreDNS servers (names and base URLs only, no API keys)
     */
    listServers: publicProcedure
      .input(dnsCacheContract.listServers.input)
      .output(dnsCacheContract.listServers.output)
      .query(async () => {
        const servers = config.DNS_CACHE_SERVERS;
        return servers.map((server) => ({
          name: server.name,
          baseUrl: server.baseUrl,
        }));
      }),

    /**
     * PUBLIC endpoint - Flush DNS cache with Altcha verification
     */
    flushCache: publicProcedure
      .input(dnsCacheContract.flushCache.input)
      .output(dnsCacheContract.flushCache.output)
      .mutation(async ({ input }) => {
        const { zone, recordType, altcha } = input;

        if (!altcha) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Altcha verification is required',
          });
        }

        const verified = await verifySolution(altcha, secrets.ALTCHA_HMAC_KEY);
        if (!verified) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid Altcha payload',
          });
        }

        logger.debug({ zone, recordType }, 'Public DNS cache flush request');

        const actualRecordType = recordType === 'ALL' ? undefined : recordType;
        const results = await flushDnsCache(zone, actualRecordType);

        const successCount = results.filter((r) => r.success).length;
        const failureCount = results.filter((r) => !r.success).length;

        return {
          success: successCount > 0,
          message:
            failureCount === 0
              ? `Successfully flushed DNS cache across ${successCount} server(s)`
              : `Flushed ${successCount} server(s), ${failureCount} failed`,
          results,
        };
      }),

    /**
     * ADMIN endpoint - Flush DNS cache with audit logging
     */
    flushCacheAdmin: adminProcedureWithPermissions(Permission.FLUSH_DNS_CACHE)
      .input(dnsCacheContract.flushCacheAdmin.input)
      .output(dnsCacheContract.flushCacheAdmin.output)
      .mutation(async ({ input, ctx }) => {
        const { zone, recordType, serverNames } = input;

        logger.debug(
          { userId: ctx.user.id, zone, recordType, serverNames },
          'Admin DNS cache flush request',
        );

        const actualRecordType = recordType === 'ALL' ? undefined : recordType;
        const results = await flushDnsCache(
          zone,
          actualRecordType,
          serverNames,
        );

        const successCount = results.filter((r) => r.success).length;
        const failureCount = results.filter((r) => !r.success).length;

        audit(
          createAuditRecord({
            actorType: 'admin',
            actorId: ctx.user.id,
            resourceType: ResourceType.DNS_CACHE,
            resourceId: zone,
            action: 'flush',
            extraInput: {
              zone,
              recordType: recordType || 'ALL',
              serverNames,
              successCount,
              failureCount,
              results,
            },
          }),
        );

        return {
          success: successCount > 0,
          message:
            failureCount === 0
              ? `Successfully flushed DNS cache across ${successCount} server(s)`
              : `Flushed ${successCount} server(s), ${failureCount} failed`,
          results,
        };
      }),

    /**
     * Get cache statistics for a specific server
     */
    getServerStats: adminProcedureWithPermissions(Permission.FLUSH_DNS_CACHE)
      .input(dnsCacheContract.getServerStats.input)
      .output(dnsCacheContract.getServerStats.output)
      .query(async ({ input }) => {
        const server = config.DNS_CACHE_SERVERS.find(
          (s) => s.name === input.serverName,
        );
        if (!server) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Server not found',
          });
        }

        const client = createCoreDNSClient({
          baseUrl: server.baseUrl,
          apiKey: secrets.DNS_CACHE_SERVERS_API_KEY,
        });
        const { data, error } = await client.GET('/cache/stats');

        return {
          stats: data || null,
          error: error ? String(error) : null,
          timestamp: Date.now(),
        };
      }),

    /**
     * Dump cache contents from a specific server
     */
    dumpServerCache: adminProcedureWithPermissions(Permission.FLUSH_DNS_CACHE)
      .input(dnsCacheContract.dumpServerCache.input)
      .output(dnsCacheContract.dumpServerCache.output)
      .query(async ({ input }) => {
        const server = config.DNS_CACHE_SERVERS.find(
          (s) => s.name === input.serverName,
        );
        if (!server) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Server not found',
          });
        }

        const client = createCoreDNSClient({
          baseUrl: server.baseUrl,
          apiKey: secrets.DNS_CACHE_SERVERS_API_KEY,
        });
        const { data, error } = await client.GET('/cache/dump', {
          params: {
            query: {
              page: input.page,
              limit: input.limit,
              cache_type: input.cacheType,
            },
          },
        });

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: String(error),
          });
        }
        return data;
      }),

    /**
     * Flush all cache on a specific server
     */
    flushAllOnServer: adminProcedureWithPermissions(Permission.FLUSH_DNS_CACHE)
      .input(dnsCacheContract.flushAllOnServer.input)
      .output(dnsCacheContract.flushAllOnServer.output)
      .mutation(async ({ input, ctx }) => {
        const server = config.DNS_CACHE_SERVERS.find(
          (s) => s.name === input.serverName,
        );
        if (!server) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Server not found',
          });
        }

        const client = createCoreDNSClient({
          baseUrl: server.baseUrl,
          apiKey: secrets.DNS_CACHE_SERVERS_API_KEY,
        });
        const { data, error } = await client.POST('/cache/flush', {
          body: { cache_type: 'all' },
        });

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: String(error),
          });
        }

        audit(
          createAuditRecord({
            actorType: 'admin',
            actorId: ctx.user.id,
            resourceType: ResourceType.DNS_CACHE,
            resourceId: input.serverName,
            action: 'flush_all',
            extraInput: { serverName: input.serverName, result: data },
          }),
        );

        return data;
      }),

    /**
     * Flush all cache on all configured servers
     */
    flushAllServers: adminProcedureWithPermissions(Permission.FLUSH_DNS_CACHE)
      .input(dnsCacheContract.flushAllServers.input)
      .output(dnsCacheContract.flushAllServers.output)
      .mutation(async ({ ctx }) => {
        const servers = config.DNS_CACHE_SERVERS;

        const results = await pMap(servers, async (server) => {
          const client = createCoreDNSClient({
            baseUrl: server.baseUrl,
            apiKey: secrets.DNS_CACHE_SERVERS_API_KEY,
          });
          const { data, error } = await client.POST('/cache/flush', {
            body: { cache_type: 'all' },
          });
          return [data, error];
        });

        if (results.some(([_, error]) => !!error)) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            cause: results.map(([_, error]) => error),
          });
        }

        audit(
          createAuditRecord({
            actorType: 'admin',
            actorId: ctx.user.id,
            resourceType: ResourceType.DNS_CACHE,
            resourceId: '*',
            action: 'flush_all',
            extraInput: {},
          }),
        );
        return results.map(([data]) => data);
      }),

    /**
     * Get combined stats for selected servers
     */
    getCombinedStats: adminProcedureWithPermissions(Permission.FLUSH_DNS_CACHE)
      .input(dnsCacheContract.getCombinedStats.input)
      .output(dnsCacheContract.getCombinedStats.output)
      .query(async ({ input }) => {
        const results = await Promise.allSettled(
          input.serverNames.map(async (serverName) => {
            const server = config.DNS_CACHE_SERVERS.find(
              (s) => s.name === serverName,
            );
            if (!server) return null;

            const client = createCoreDNSClient({
              baseUrl: server.baseUrl,
              apiKey: secrets.DNS_CACHE_SERVERS_API_KEY,
            });
            const { data } = await client.GET('/cache/stats');

            return { serverName, stats: data, timestamp: Date.now() };
          }),
        );

        return results.map((r, i) => ({
          serverName: input.serverNames[i] ?? '',
          stats: r.status === 'fulfilled' ? (r.value?.stats ?? null) : null,
          error: r.status === 'rejected' ? String(r.reason) : null,
          timestamp:
            r.status === 'fulfilled' ? (r.value?.timestamp ?? null) : null,
        }));
      }),

    /**
     * Test connectivity to selected servers
     */
    testConnectivity: adminProcedureWithPermissions(Permission.FLUSH_DNS_CACHE)
      .input(dnsCacheContract.testConnectivity.input)
      .output(dnsCacheContract.testConnectivity.output)
      .query(async ({ input }) => {
        const results = await Promise.allSettled(
          input.serverNames.map(async (serverName) => {
            const server = config.DNS_CACHE_SERVERS.find(
              (s) => s.name === serverName,
            );
            if (!server) throw new Error('Server not found');

            const client = createCoreDNSClient({
              baseUrl: server.baseUrl,
              apiKey: secrets.DNS_CACHE_SERVERS_API_KEY,
            });
            const start = Date.now();
            const { data, error } = await client.GET('/cache/stats');
            const responseTime = Date.now() - start;

            if (error) throw new Error(String(error));
            void data;

            return { serverName, healthy: true, responseTime };
          }),
        );

        return results.map((r, i) => ({
          serverName: input.serverNames[i] ?? '',
          healthy: r.status === 'fulfilled',
          responseTime: r.status === 'fulfilled' ? r.value.responseTime : null,
          error: r.status === 'rejected' ? String(r.reason) : null,
        }));
      }),
  },
);
