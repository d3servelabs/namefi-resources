/**
 * Domain check example using the high-level EPP client.
 *
 * Run with:
 *   bunx tsx apps/epp-client/examples/domain-check.ts
 *
 * Required environment variables:
 *   EPP_HOST   - registry EPP host
 *   EPP_PORT   - registry EPP port (default 700)
 *   EPP_TLS    - "true" | "false" (default true)
 *   EPP_USER   - <clID>
 *   EPP_PASS   - <pw>
 *
 * Domain selection:
 *   EPP_DOMAIN  - single domain to check
 *   EPP_DOMAINS - comma-separated list (overrides EPP_DOMAIN)
 *
 * Optional:
 *   EPP_WITH_FEE - "true" to include fee extension for pricing
 */

import {
  withEppClient,
  send,
  sendCommand,
  buildHelloEnvelope,
  buildDomainCheckCommand,
  DOMAIN_NS,
  type Result,
  type SendResult,
} from '../src';

const FEE_NS = 'urn:ietf:params:xml:ns:epp:fee-1.0';

/**
 * Build fee:check extension for domain check command.
 * Queries pricing for create, transfer, and renew operations.
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

async function main() {
  const host = requireEnv('EPP_HOST');
  const port = Number(process.env.EPP_PORT ?? '700');
  const tls = (process.env.EPP_TLS ?? 'true') === 'true';
  const user = requireEnv('EPP_USER');
  const pw = requireEnv('EPP_PASS');
  const names = getDomainList();
  const withFee = (process.env.EPP_WITH_FEE ?? 'false') === 'true';

  await withEppClient(
    {
      connection: { host, port, tls },
      credentials: { clID: user, pw },
      session: {
        version: '1.0',
        lang: 'en',
        services: {
          objURIs: [DOMAIN_NS],
          extURIs: withFee ? [FEE_NS] : undefined,
        },
      },
      logXml: true,
    },
    async (client) => {
      // Optional: Send hello to get greeting
      const helloResult = await send(client, buildHelloEnvelope());
      handleResult('hello', helloResult);

      // Domain check (with optional fee extension)
      const checkOpts = withFee
        ? { extension: buildFeeCheckExtension() }
        : undefined;
      const checkResult = await sendCommand(
        client,
        buildDomainCheckCommand(names, checkOpts),
      );
      handleResult('check', checkResult, (data) => {
        console.log('Response:', JSON.stringify(data.response, null, 2));
      });
    },
  );
}

function handleResult(
  label: string,
  result: Result<SendResult, string | undefined>,
  onOk?: (data: SendResult) => void,
): void {
  if (result.ok) {
    console.log(`[${label}] ok`);
    if (onOk) onOk(result.data);
  } else {
    console.error(`[${label}] error:`, result.error);
    if (result.raw) console.error(`[${label}] raw:`, result.raw);
  }
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var ${key}`);
  }
  return value;
}

function getDomainList(): string[] {
  const list = process.env.EPP_DOMAINS;
  if (list) {
    return list
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }
  const single = process.env.EPP_DOMAIN;
  if (single) return [single];
  throw new Error('Provide EPP_DOMAIN or EPP_DOMAINS');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
