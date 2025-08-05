#!/usr/bin/env node

import { Client } from 'pg';
import { secrets } from './lib/env';
import { fileURLToPath } from 'url';

interface MigrationOptions {
  oldSchema: string;
  newSchema: string;
  readyEndpoint: string;
  maxWaitMinutes?: number;
  isDryRun?: boolean;
}

/**
 * Wait for the /ready endpoint to return "OK"
 */
async function waitForReady(
  endpoint: string,
  maxWaitMinutes = 30,
): Promise<void> {
  const maxWaitMs = maxWaitMinutes * 60 * 1000;
  const startTime = Date.now();

  console.log(`Waiting for ${endpoint} to return "OK"...`);

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const response = await fetch(endpoint);
      const status = await response.text();

      console.log(`Health check status: ${status}`);

      if (status === 'OK') {
        console.log('Service is ready!');
        return;
      }

      // Wait 5 seconds before checking again
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error) {
      console.log(`Health check failed: ${error}. Retrying...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  throw new Error(
    `Service did not become ready within ${maxWaitMinutes} minutes`,
  );
}

/**
 * Execute the schema migration using the rewrite_views_with_new_schema procedure
 */
async function migrateSchema(options: MigrationOptions): Promise<void> {
  const client = new Client({
    connectionString: secrets.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // First wait for the service to be ready
    await waitForReady(options.readyEndpoint, options.maxWaitMinutes);

    // Execute the schema migration
    console.log(
      `Migrating views from schema "${options.oldSchema}" to "${options.newSchema}"...`,
    );

    const result = await client.query(
      'CALL rewrite_views_with_new_schema($1, $2, $3)',
      [options.oldSchema, options.newSchema, options.isDryRun || false],
    );

    console.log('Schema migration completed successfully');
  } catch (error) {
    console.error('Schema migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

/**
 * Get the current schema from the indexer API
 */
async function getCurrentSchema(endpoint: string): Promise<string> {
  const schemaEndpoint = endpoint.replace('/ready', '/schema');

  try {
    const response = await fetch(schemaEndpoint);
    if (!response.ok) {
      throw new Error(`Schema endpoint returned ${response.status}`);
    }

    const data = await response.json();
    if (!data.currentSchema) {
      throw new Error('Schema endpoint did not return currentSchema');
    }

    console.log(
      `Retrieved schema: ${data.currentSchema} (source: ${data.source || 'unknown'})`,
    );
    return data.currentSchema;
  } catch (error) {
    console.error('Failed to get current schema from API:', error);
    throw new Error('Unable to determine current schema from indexer API');
  }
}

/**
 * Extract the base schema name from a timestamped schema
 */
function getBaseSchema(timestampedSchema: string): string {
  // Extract base schema by removing the timestamp suffix (_YYYYMMDDHHMM)
  const match = timestampedSchema.match(/^(.+)_\d{12}$/);
  return match?.[1] ?? timestampedSchema;
}

/**
 * Main migration function
 */
async function main() {
  try {
    const readyEndpoint =
      process.env.READY_ENDPOINT || 'http://localhost:42069/ready';
    const isDryRun = process.env.DRY_RUN === 'true';

    // Get current schema from the API
    const currentSchema = await getCurrentSchema(readyEndpoint);
    const baseSchema = getBaseSchema(currentSchema);

    // For this implementation, we assume the old schema is the base schema
    // In production, you might want to query the database to find the actual old schema
    const oldSchema = baseSchema;
    const newSchema = currentSchema;

    console.log('Migration configuration:');
    console.log(`  Old schema: ${oldSchema}`);
    console.log(`  New schema: ${newSchema}`);
    console.log(`  Ready endpoint: ${readyEndpoint}`);
    console.log(`  Dry run: ${isDryRun}`);

    if (oldSchema === newSchema) {
      console.log('Old and new schema are the same, skipping migration');
      return;
    }

    await migrateSchema({
      oldSchema,
      newSchema,
      readyEndpoint,
      maxWaitMinutes: 30,
      isDryRun,
    });

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run if this is the main module
const __filename = fileURLToPath(import.meta.url);
const entrypoint = process.argv[1];

if (__filename === entrypoint) {
  main();
}

export { migrateSchema, waitForReady };
