import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config, secrets } from '#lib/env';
import { getBigQueryAuditClient } from '#lib/bigquery_audit_client';

const OUTPUT_PATH = path.resolve('tmp/audit-logs-sample.json');
const PAGE_SIZE = 25;

async function main() {
  const client = getBigQueryAuditClient();
  const allServicesResult = await client.listAuditLogs({
    pageSize: PAGE_SIZE,
    serviceNames: [],
  });
  const configuredServicesResult = await client.listAuditLogs({
    pageSize: PAGE_SIZE,
    serviceNames: config.BIGQUERY_AUDIT_SERVICE_NAMES,
  });

  const output = {
    generatedAt: new Date().toISOString(),
    environment: process.env.ENVIRONMENT ?? null,
    bigQuery: {
      projectId: secrets.BIGQUERY_PROJECT_ID,
      datasetId: secrets.BIGQUERY_AUDIT_DATASET_ID,
      tableId: secrets.BIGQUERY_AUDIT_TABLE_ID,
      useTableSuffix: secrets.BIGQUERY_AUDIT_USE_TABLE_SUFFIX,
      configuredServiceNames: config.BIGQUERY_AUDIT_SERVICE_NAMES,
    },
    allServices: {
      pageSize: PAGE_SIZE,
      rowCount: allServicesResult.rows.length,
      nextPageToken: allServicesResult.nextPageToken ?? null,
      rows: allServicesResult.rows,
    },
    configuredServices: {
      pageSize: PAGE_SIZE,
      rowCount: configuredServicesResult.rows.length,
      nextPageToken: configuredServicesResult.nextPageToken ?? null,
      rows: configuredServicesResult.rows,
    },
  };

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  process.stdout.write(
    JSON.stringify(
      {
        outputPath: OUTPUT_PATH,
        allServicesRowCount: allServicesResult.rows.length,
        configuredServicesRowCount: configuredServicesResult.rows.length,
        configuredServiceNames: config.BIGQUERY_AUDIT_SERVICE_NAMES,
        useTableSuffix: secrets.BIGQUERY_AUDIT_USE_TABLE_SUFFIX,
      },
      null,
      2,
    ),
  );
  process.stdout.write('\n');
}

await main();
