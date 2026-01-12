import { z } from 'zod';
import {
  createTRPCRouter,
  publicProcedure,
  adminProcedureWithPermissions,
} from '../base';
import { TRPCError } from '@trpc/server';
import { secrets, config } from '#lib/env';
import { verifySolution } from 'altcha-lib';
import { recordTypeValues } from '@namefi-astra/zod-dns';
import { flushDnsCache } from '#lib/dns-cache-flush';
import { createLogger } from '#lib/logger';
import { createAuditRecord, audit, ResourceType } from '#lib/auditor';
import { Permission } from '@namefi-astra/utils';
import { createCoreDNSClient } from '@namefi-astra/coredns-client';
import pMap from 'p-map';

const logger = createLogger({ context: 'DNS_CACHE_ROUTER' });

// Record types + "ALL" option
const recordTypeWithAll = [...recordTypeValues, 'ALL'] as const;
const recordTypeEnumWithAll = z.enum(recordTypeWithAll);

const flushCacheInputSchema = z.object({
  zone: z
    .string()
    .min(1, 'Zone is required')
    .regex(
      /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i,
      'Invalid domain/zone format',
    ),
  recordType: recordTypeEnumWithAll.optional(),
});

export const dnsCacheRouter = createTRPCRouter({
  /**
   * List configured CoreDNS servers (names and base URLs only, no API keys)
   */
  listServers: publicProcedure.query(async () => {
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
    .input(
      flushCacheInputSchema.extend({
        altcha: z.string().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const { zone, recordType, altcha } = input;

      // Verify Altcha
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

      logger.info({ zone, recordType }, 'Public DNS cache flush request');

      // Flush cache
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
   * Requires FLUSH_DNS_CACHE permission
   */
  flushCacheAdmin: adminProcedureWithPermissions(Permission.FLUSH_DNS_CACHE)
    .input(
      flushCacheInputSchema.extend({
        serverNames: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { zone, recordType, serverNames } = input;

      logger.info(
        { userId: ctx.user.id, zone, recordType, serverNames },
        'Admin DNS cache flush request',
      );

      // Flush cache
      const actualRecordType = recordType === 'ALL' ? undefined : recordType;
      const results = await flushDnsCache(zone, actualRecordType, serverNames);

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      // Create audit record
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
    .input(z.object({ serverName: z.string() }))
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
    .input(
      z.object({
        serverName: z.string(),
        page: z.number().optional().default(1),
        limit: z.number().optional().default(100),
        cacheType: z
          .enum(['all', 'success', 'denial'])
          .optional()
          .default('all'),
      }),
    )
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
    .input(z.object({ serverName: z.string() }))
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

      // Audit log
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
   * Flush all cache on a specific server
   */
  flushAllServers: adminProcedureWithPermissions(
    Permission.FLUSH_DNS_CACHE,
  ).mutation(async ({ input, ctx }) => {
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

    // Audit log
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
    .input(z.object({ serverNames: z.array(z.string()) }))
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
        serverName: input.serverNames[i],
        stats: r.status === 'fulfilled' ? r.value?.stats : null,
        error: r.status === 'rejected' ? String(r.reason) : null,
        timestamp: r.status === 'fulfilled' ? r.value?.timestamp : null,
      }));
    }),

  /**
   * Test connectivity to selected servers
   */
  testConnectivity: adminProcedureWithPermissions(Permission.FLUSH_DNS_CACHE)
    .input(z.object({ serverNames: z.array(z.string()) }))
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

          return { serverName, healthy: true, responseTime };
        }),
      );

      return results.map((r, i) => ({
        serverName: input.serverNames[i],
        healthy: r.status === 'fulfilled',
        responseTime: r.status === 'fulfilled' ? r.value.responseTime : null,
        error: r.status === 'rejected' ? String(r.reason) : null,
      }));
    }),
});
