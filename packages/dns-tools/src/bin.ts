import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { getDsRecordFromKey } from './computeDsDigest';
import { DIGEST_TYPE, DNSKEY_FLAGS } from './consts';
import { parseDnskeyRecord } from './parseDnskeyRecord';

export function main() {
  const program = new Command();

  program
    .name('dns-tools')
    .description('DNS utility tools')
    .helpOption('-h, --help', 'Show help')
    .version(process.env.npm_package_version || '0.0.0');

  program
    .command('create-ds')
    .description('Create a DS record from key parameters')
    .requiredOption('-d, --domain <domain>', 'Domain name')
    .requiredOption('-p, --pubkey <pubkey>', 'Public key')
    .requiredOption('-k, --keyTag <keyTag>', 'Key tag number', Number.parseInt)
    .option(
      '-a, --algorithm <algorithm>',
      'Algorithm (default: 13)',
      Number.parseInt,
      13,
    )
    .option(
      '--protocol <protocol>',
      'Protocol (default: 3)',
      Number.parseInt,
      3,
    )
    .option('-t, --ttl <ttl>', 'TTL (default: 3600)', Number.parseInt, 3600)
    .option(
      '-f, --flags <flags>',
      'DNSKEY flags (default: 257 KSK)',
      Number.parseInt,
      DNSKEY_FLAGS.KSK,
    )
    .option(
      '--digestType <digestType>',
      'Digest type (default: 2 SHA-256)',
      Number.parseInt,
      DIGEST_TYPE.sha256,
    )
    .addHelpText(
      'after',
      '\n Example: dns-tools create-ds --domain example.com --pubkey 1234567890 --keyTag 1234567890 --algorithm 13 --protocol 3 --ttl 3600 --flags 257 --digestType 2',
    )
    .action((options) => {
      const dsRecord = getDsRecordFromKey(
        options.domain,
        options.pubkey,
        options.keyTag,
        options.algorithm,
        options.protocol,
        options.ttl,
        options.flags,
        options.digestType,
      );
      process.stdout.write(dsRecord);
    });

  program
    .command('create-ds-from-dnskey')
    .description('Create a DS record from a full DNSKEY record string')
    .requiredOption('-r, --record <record>', 'Full DNSKEY record string')
    .requiredOption('-k, --keyTag <keyTag>', 'Key tag number', Number.parseInt)
    .option('-t, --ttl <ttl>', 'Override TTL (optional)', Number.parseInt)
    .option(
      '--digestType <digestType>',
      'Digest type (default: 2 SHA-256)',
      Number.parseInt,
      DIGEST_TYPE.sha256,
    )
    .addHelpText(
      'after',
      '\n Example: dns-tools create-ds-from-dnskey --record "example.com. 3600 IN DNSKEY 257 3 13 g2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w=="',
    )
    .action((options) => {
      try {
        const parsed = parseDnskeyRecord(options.record);

        // Extract domain from record name (remove trailing dot if present)
        const domain = parsed.recordName.replace(/\.$/g, '');

        // Use provided TTL or the one from the record
        const ttl = options.ttl !== undefined ? options.ttl : parsed.recordTtl;

        const dsRecord = getDsRecordFromKey(
          domain,
          parsed.publicKey,
          options.keyTag,
          parsed.algorithm,
          parsed.protocol,
          ttl,
          parsed.flags,
          options.digestType,
        );

        process.stdout.write(dsRecord);
      } catch (error: unknown) {
        process.stderr.write(
          `Error parsing DNSKEY record: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        process.exit(1);
      }
    });

  program.parse(process.argv);
}

// main.mjs or main.js (in ESM mode)
const __filename = fileURLToPath(import.meta.url);
const entrypoint = process.argv[1];

if (__filename === entrypoint) {
  main();
}
