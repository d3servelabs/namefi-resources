import { recordTypeValues } from '@namefi-astra/zod-dns';
import { z } from 'zod';

import { createContract } from './create-contract';
import type { RouterContract } from './trpc-contract';

/**
 * Contract for the DNS cache router.
 *
 * The router (`apps/backend/src/trpc/routers/dnsCacheRouter.ts`) is
 * type-checked against this contract via
 * `createContractTRPCRouter<typeof dnsCacheContract>`. Middleware varies
 * per procedure — `listServers` and `flushCache` are `publicProcedure`,
 * everything else is `adminProcedureWithPermissions(Permission.FLUSH_DNS_CACHE)`.
 * The contract doesn't care which base the router picks.
 *
 * Upstream CoreDNS responses are typed by `@namefi-astra/coredns-client`
 * but not imported into common to avoid pulling its deps — the frontend
 * reads just a handful of fields, and the rest flow through passthrough.
 */

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

const recordTypeWithAll = [...recordTypeValues, 'ALL'] as const;
const recordTypeEnumWithAll = z.enum(recordTypeWithAll);

const zoneSchema = z
  .string()
  .min(1, 'Zone is required')
  .regex(
    /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i,
    'Invalid domain/zone format',
  );

const flushCacheInputSchema = z.object({
  zone: zoneSchema,
  recordType: recordTypeEnumWithAll.optional(),
  altcha: z.string().nullable(),
});

const flushCacheAdminInputSchema = z.object({
  zone: zoneSchema,
  recordType: recordTypeEnumWithAll.optional(),
  serverNames: z.array(z.string()).optional(),
});

const serverNameInputSchema = z.object({ serverName: z.string() });

const dumpServerCacheInputSchema = z.object({
  serverName: z.string(),
  page: z.number().optional().default(1),
  limit: z.number().optional().default(100),
  cacheType: z.enum(['all', 'success', 'denial']).optional().default('all'),
});

const serverNamesInputSchema = z.object({
  serverNames: z.array(z.string()),
});

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

const serverInfoSchema = z.object({
  name: z.string(),
  baseUrl: z.string(),
});

const flushResultRowSchema = z
  .object({
    serverName: z.string(),
    success: z.boolean(),
    error: z.string().nullable().optional(),
  })
  .passthrough();

const flushCacheOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  results: z.array(flushResultRowSchema),
});

const getServerStatsOutputSchema = z.object({
  stats: z.any().nullable(),
  error: z.string().nullable(),
  timestamp: z.number(),
});

/** CoreDNS dump response — opaque structural type. */
const dumpServerCacheOutputSchema = z.any();

const flushAllOnServerOutputSchema = z.any();

const flushAllServersOutputSchema = z.array(z.any());

const getCombinedStatsOutputSchema = z.array(
  z.object({
    serverName: z.string(),
    stats: z.any().nullable(),
    error: z.string().nullable(),
    timestamp: z.number().nullable(),
  }),
);

const testConnectivityOutputSchema = z.array(
  z.object({
    serverName: z.string(),
    healthy: z.boolean(),
    responseTime: z.number().nullable(),
    error: z.string().nullable(),
  }),
);

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export const dnsCacheContract = createContract(
  { softOutput: true },
  {
    listServers: {
      type: 'query',
      input: z.void(),
      output: z.array(serverInfoSchema),
    },
    flushCache: {
      type: 'mutation',
      input: flushCacheInputSchema,
      output: flushCacheOutputSchema,
    },
    flushCacheAdmin: {
      type: 'mutation',
      input: flushCacheAdminInputSchema,
      output: flushCacheOutputSchema,
    },
    getServerStats: {
      type: 'query',
      input: serverNameInputSchema,
      output: getServerStatsOutputSchema,
    },
    dumpServerCache: {
      type: 'query',
      input: dumpServerCacheInputSchema,
      output: dumpServerCacheOutputSchema,
    },
    flushAllOnServer: {
      type: 'mutation',
      input: serverNameInputSchema,
      output: flushAllOnServerOutputSchema,
    },
    flushAllServers: {
      type: 'mutation',
      input: z.void(),
      output: flushAllServersOutputSchema,
    },
    getCombinedStats: {
      type: 'query',
      input: serverNamesInputSchema,
      output: getCombinedStatsOutputSchema,
    },
    testConnectivity: {
      type: 'query',
      input: serverNamesInputSchema,
      output: testConnectivityOutputSchema,
    },
  },
);

export type DnsCacheContract = typeof dnsCacheContract;
