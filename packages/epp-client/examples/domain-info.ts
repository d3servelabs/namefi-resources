/**
 * Domain info example using the high-level EPP client.
 *
 * Run with:
 *   bunx tsx apps/epp-client/examples/domain-info.ts
 *
 * Required environment variables:
 *   EPP_HOST   - registry EPP host
 *   EPP_PORT   - registry EPP port (default 700)
 *   EPP_TLS    - "true" | "false" (default true)
 *   EPP_USER   - <clID>
 *   EPP_PASS   - <pw>
 *   EPP_DOMAIN - domain name to query
 *
 * Optional:
 *   EPP_DOMAIN_AUTH - authInfo pw for the domain (required for full info)
 */

import {
  withEppClient,
  sendCommand,
  buildDomainInfoCommand,
  DOMAIN_NS,
  type Result,
  type SendResult,
} from '../src';

async function main() {
  const host = requireEnv('EPP_HOST');
  const port = Number(process.env.EPP_PORT ?? '700');
  const tls = (process.env.EPP_TLS ?? 'true') === 'true';
  const user = requireEnv('EPP_USER');
  const pw = requireEnv('EPP_PASS');
  const domain = requireEnv('EPP_DOMAIN');
  const domainAuth = process.env.EPP_DOMAIN_AUTH;

  await withEppClient(
    {
      connection: { host, port, tls },
      credentials: { clID: user, pw },
      session: {
        version: '1.0',
        lang: 'en',
        services: { objURIs: [DOMAIN_NS] },
      },
      logXml: true,
    },
    async (client) => {
      const infoResult = await sendCommand(
        client,
        buildDomainInfoCommand({
          name: domain,
          hosts: 'all',
          authInfo: domainAuth,
        }),
      );

      handleResult('info', infoResult, (data) => {
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

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
