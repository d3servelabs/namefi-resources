import { config, secrets } from '#lib/env';
import { createLogger } from '#lib/logger';
import { createCoreDNSClient } from '@namefi-astra/coredns-client';

const logger = createLogger({ context: 'DNS_CACHE_FLUSH' });

export type DnsCacheFlushResult = {
  serverName: string;
  success: boolean;
  error?: string;
  totalFlushed?: number;
  successCacheFlushed?: number;
  denialCacheFlushed?: number;
};

/**
 * Flush DNS cache for a zone and optional record type across configured CoreDNS servers
 * @param zone - Domain/zone name (e.g., "example.com"). Will be normalized to FQDN with trailing dot.
 * @param recordType - DNS record type (e.g., "A", "AAAA") or undefined for all types
 * @param serverNames - Optional array of server names to target. If not provided, targets all servers.
 * @returns Array of results per DNS server
 */
export async function flushDnsCache(
  zone: string,
  recordType?: string,
  serverNames?: string[],
): Promise<DnsCacheFlushResult[]> {
  // Get all configured servers and add the shared API key
  const allServers = config.DNS_CACHE_SERVERS.map((server) => ({
    ...server,
    apiKey: secrets.DNS_CACHE_SERVERS_API_KEY,
  }));

  // Filter servers if serverNames provided
  const servers =
    serverNames && serverNames.length > 0
      ? allServers.filter((s) => serverNames.includes(s.name))
      : allServers;

  if (servers.length === 0 || !secrets.DNS_CACHE_SERVERS_API_KEY) {
    logger.warn(
      { requestedServers: serverNames },
      'No DNS cache servers configured or matched, or API key missing',
    );
    return [];
  }

  // Normalize zone to FQDN with trailing dot (required by CoreDNS API)
  const normalizedZone = zone.endsWith('.') ? zone : `${zone}.`;

  const results = await Promise.allSettled(
    servers.map(async (server) => {
      logger.info(
        { serverName: server.name, zone: normalizedZone, recordType },
        'Flushing DNS cache via CoreDNS client',
      );

      // Create CoreDNS client for this server
      const client = createCoreDNSClient({
        baseUrl: server.baseUrl,
        apiKey: server.apiKey,
      });

      // Flush cache using the CoreDNS client POST endpoint
      const { data, error, response } = await client.POST('/cache/flush', {
        body: {
          zone: normalizedZone,
          qtype: recordType, // Optional: if undefined, flushes all types
          cache_type: 'all', // Flush both success and denial caches
        },
      });

      if (error) {
        const errorMsg =
          typeof error === 'object' && 'error' in error
            ? (error as any).error
            : `Failed to flush cache (HTTP ${response.status})`;
        throw new Error(errorMsg);
      }

      if (!data) {
        throw new Error('No response data received from CoreDNS server');
      }

      // Access the response data correctly from openapi-fetch
      const flushResponse = data as any;

      logger.info(
        {
          serverName: server.name,
          zone: normalizedZone,
          recordType,
          totalFlushed: flushResponse.details?.total_flushed,
        },
        'Successfully flushed DNS cache',
      );

      return {
        serverName: server.name,
        success: true,
        totalFlushed: flushResponse.details?.total_flushed,
        successCacheFlushed: flushResponse.details?.success_cache_flushed,
        denialCacheFlushed: flushResponse.details?.denial_cache_flushed,
      };
    }),
  );

  return results.map((result, index) => {
    const serverName = servers[index].name;
    if (result.status === 'fulfilled') {
      return result.value;
    }
    logger.warn(
      { serverName, error: result.reason, zone: normalizedZone, recordType },
      'Failed to flush DNS cache',
    );
    return {
      serverName,
      success: false,
      error: result.reason?.message || String(result.reason),
    };
  });
}
