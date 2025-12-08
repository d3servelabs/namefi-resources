/**
 * Stress test for EPP connection pooling.
 *
 * Tests the pool under heavy load by sending 10,000 concurrent domain check
 * requests, each checking 100 domains with fee extension.
 *
 * Run with:
 *   bunx tsx packages/epp-client/examples/stress-test.ts
 *
 * Required environment variables:
 *   EPP_HOST   - registry EPP host
 *   EPP_PORT   - registry EPP port (default 700)
 *   EPP_TLS    - "true" | "false" (default true)
 *   EPP_USER   - <clID>
 *   EPP_PASS   - <pw>
 *
 * Optional:
 *   POOL_MIN         - minimum pool connections (default 5)
 *   POOL_MAX         - maximum pool connections (default 10)
 *   TOTAL_REQUESTS   - total requests to send (default 10000)
 *   DOMAINS_PER_REQ  - domains per check request (default 100)
 *   TLD              - TLD to use for domains (default "com")
 */

import {
  createEppClient,
  closeClient,
  sendCommand,
  buildDomainCheckCommand,
  DOMAIN_NS,
  type EppClientRuntime,
} from '../src';

const FEE_NS = 'urn:ietf:params:xml:ns:epp:fee-1.0';

// Stats tracking
interface Stats {
  total: number;
  success: number;
  failed: number;
  minLatency: number;
  maxLatency: number;
  totalLatency: number;
  errors: Map<string, number>;
}

function createStats(): Stats {
  return {
    total: 0,
    success: 0,
    failed: 0,
    minLatency: Number.POSITIVE_INFINITY,
    maxLatency: 0,
    totalLatency: 0,
    errors: new Map(),
  };
}

/**
 * Generate random domain names for testing
 */
function generateDomains(count: number, tld: string): string[] {
  const domains: string[] = [];
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < count; i++) {
    let name = '';
    const len = 8 + Math.floor(Math.random() * 8); // 8-15 chars
    for (let j = 0; j < len; j++) {
      name += chars[Math.floor(Math.random() * chars.length)];
    }
    domains.push(`${name}.${tld}`);
  }
  return domains;
}

/**
 * Build fee:check extension for domain check command.
 */
function buildFeeCheckExtension(): Record<string, unknown> {
  return {
    'fee:check': {
      '@_xmlns:fee': FEE_NS,
      'fee:currency': 'USD',
      'fee:command': [
        { '@_name': 'create' },
        { '@_name': 'transfer' },
        { '@_name': 'renew' },
      ],
    },
  };
}

/**
 * Send a single domain check request with fee extension
 */
async function sendCheckRequest(
  client: EppClientRuntime,
  domains: string[],
  stats: Stats,
  requestId: number,
): Promise<void> {
  const start = performance.now();

  try {
    const result = await sendCommand(
      client,
      buildDomainCheckCommand(domains, { extension: buildFeeCheckExtension() }),
      { timeoutMs: 30_000 },
    );

    const latency = performance.now() - start;
    stats.total++;
    stats.totalLatency += latency;
    stats.minLatency = Math.min(stats.minLatency, latency);
    stats.maxLatency = Math.max(stats.maxLatency, latency);

    if (result.ok) {
      stats.success++;
    } else {
      stats.failed++;
      const errKey = result.error.message || 'unknown';
      stats.errors.set(errKey, (stats.errors.get(errKey) || 0) + 1);
    }
  } catch (err) {
    const latency = performance.now() - start;
    stats.total++;
    stats.totalLatency += latency;
    stats.failed++;

    const errKey = err instanceof Error ? err.message : 'unknown';
    stats.errors.set(errKey, (stats.errors.get(errKey) || 0) + 1);
  }

  // Progress logging every 100 requests
  if (stats.total % 100 === 0) {
    const avgLatency = stats.totalLatency / stats.total;
    console.log(
      `[Progress] ${stats.total} requests | ` +
        `${stats.success} ok | ${stats.failed} failed | ` +
        `avg latency: ${avgLatency.toFixed(1)}ms`,
    );
  }
}

async function main() {
  const host = requireEnv('EPP_HOST');
  const port = Number(process.env.EPP_PORT ?? '700');
  const tls = (process.env.EPP_TLS ?? 'true') === 'true';
  const user = requireEnv('EPP_USER');
  const pw = requireEnv('EPP_PASS');

  const poolMin = Number(process.env.POOL_MIN ?? '100');
  const poolMax = Number(process.env.POOL_MAX ?? '100');
  const totalRequests = Number(process.env.TOTAL_REQUESTS ?? '10000');
  const domainsPerReq = Number(process.env.DOMAINS_PER_REQ ?? '100');
  const tld = process.env.TLD ?? 'com';

  console.log('=== EPP Pool Stress Test ===');
  console.log(`Host: ${host}:${port} (TLS: ${tls})`);
  console.log(`Pool: min=${poolMin}, max=${poolMax}`);
  console.log(
    `Requests: ${totalRequests} total, ${domainsPerReq} domains each`,
  );
  console.log(`TLD: ${tld}`);
  console.log('');

  // Create client with pool configuration
  console.log('Creating EPP client with pool...');
  const client = await createEppClient({
    connection: { host, port, tls },
    credentials: { clID: user, pw },
    session: {
      version: '1.0',
      lang: 'en',
      services: {
        objURIs: [DOMAIN_NS],
        extURIs: [FEE_NS],
      },
    },
    pool: {
      min: poolMin,
      max: poolMax,
      acquireTimeoutMs: 60_000,
      idleTimeoutMs: 300_000,
    },
    logXml: false,
    logParsed: false,
  });

  console.log('Client created. Starting stress test...\n');

  const stats = createStats();
  const startTime = performance.now();

  // Generate all requests upfront
  const requests: Promise<void>[] = [];

  for (let i = 0; i < totalRequests; i++) {
    const domains = generateDomains(domainsPerReq, tld);
    requests.push(sendCheckRequest(client, domains, stats, i));
  }

  // Wait for all requests to complete
  await Promise.all(requests);

  const totalTime = performance.now() - startTime;

  // Print results
  console.log('\n=== Results ===');
  console.log(`Total time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`Total requests: ${stats.total}`);
  console.log(
    `Successful: ${stats.success} (${((stats.success / stats.total) * 100).toFixed(1)}%)`,
  );
  console.log(
    `Failed: ${stats.failed} (${((stats.failed / stats.total) * 100).toFixed(1)}%)`,
  );
  console.log(
    `Throughput: ${(stats.total / (totalTime / 1000)).toFixed(1)} req/s`,
  );
  console.log('');
  console.log('Latency:');
  console.log(`  Min: ${stats.minLatency.toFixed(1)}ms`);
  console.log(`  Max: ${stats.maxLatency.toFixed(1)}ms`);
  console.log(`  Avg: ${(stats.totalLatency / stats.total).toFixed(1)}ms`);

  if (stats.errors.size > 0) {
    console.log('\nError breakdown:');
    for (const [err, count] of stats.errors.entries()) {
      console.log(`  ${err}: ${count}`);
    }
  }

  // Pool stats
  console.log('\nPool stats:');
  console.log(`  Size: ${client.pool.size}`);
  console.log(`  Available: ${client.pool.available}`);
  console.log(`  Pending: ${client.pool.pending}`);

  // Cleanup
  console.log('\nClosing client...');
  await closeClient(client);
  console.log('Done.');
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var ${key}`);
  }
  return value;
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exitCode = 1;
});
