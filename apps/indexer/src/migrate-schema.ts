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
      const status = await response.status;

      if (status === 200) {
        console.log('Service is ready!');
        return;
      }

      console.log('Service is not ready yet. Retrying in 5 seconds...');
    } catch (error) {
      console.log(`Health check failed: ${error}. Retrying in 5 seconds...`);
    }
    // Wait 5 seconds before checking again
    await new Promise((resolve) => setTimeout(resolve, 5000));
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

  process.on('SIGINT', async () => {
    console.log('SIGINT signal received, shutting down...');
    await client.end();
    process.exit(130);
  });

  process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received, shutting down...');
    await client.end();
    process.exit(143);
  });

  try {
    // First wait for the service to be ready
    await waitForReady(options.readyEndpoint, options.maxWaitMinutes);

    await client.connect();
    console.log('Connected to database');

    // Execute the schema migration
    console.log(
      `Migrating views from schema "${options.oldSchema}" to "${options.newSchema}"...`,
    );

    // Run transactional steps as separate statements to avoid leaving the connection in a failed state
    try {
      await client.query('BEGIN');
      await client.query(
        "CALL create_constant_function('current_indexer_schema', 'TEXT', $1)",
        [options.newSchema],
      );
      await client.query('CALL rewrite_views_with_new_schema($1, $2, $3)', [
        options.oldSchema,
        options.newSchema,
        options.isDryRun || false,
      ]);
      await client.query('COMMIT');
    } catch (txError) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
      throw txError;
    }

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
async function getActiveSchema(endpoint: string): Promise<string> {
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

async function getExistingSchema(): Promise<string> {
  const client = new Client({
    connectionString: secrets.DATABASE_URL,
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT signal received, shutting down...');
    await client.end();
    process.exit(130);
  });

  process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received, shutting down...');
    await client.end();
    process.exit(143);
  });

  try {
    await client.connect();
    const result = await client.query('SELECT current_indexer_schema()');
    if (
      !result.rows ||
      result.rows.length === 0 ||
      !result.rows[0].current_indexer_schema
    ) {
      throw new Error(
        'Unable to retrieve current indexer schema from database',
      );
    }
    return result.rows[0].current_indexer_schema;
  } finally {
    await client.end();
  }
}

/**
 * Main migration function
 */
async function main() {
  try {
    const readyEndpoint =
      process.env.READY_ENDPOINT || 'http://localhost:42069/ready';
    const isDryRun = process.env.DRY_RUN === 'true';
    await waitForReady(readyEndpoint, 30);

    // Get current schema from the API
    const activeSchema = await getActiveSchema(readyEndpoint);
    const existingSchema = await getExistingSchema();

    console.log('Migration configuration:');
    console.log(`  Old schema: ${existingSchema}`);
    console.log(`  New schema: ${activeSchema}`);
    console.log(`  Ready endpoint: ${readyEndpoint}`);
    console.log(`  Dry run: ${isDryRun}`);

    if (existingSchema === activeSchema) {
      console.log('Old and new schema are the same, skipping migration');
      return;
    }

    await migrateSchema({
      oldSchema: existingSchema,
      newSchema: activeSchema,
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
