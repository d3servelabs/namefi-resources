#!/usr/bin/env node

import { writeFileSync } from 'fs';
import { format } from 'date-fns';
import { utc } from '@date-fns/utc';
import { join } from 'path';
import { secrets } from './lib/env';
import { fileURLToPath } from 'url';

/**
 * Generate timestamped schema name
 */
function generateTimestampedSchema(baseSchema: string): string {
  const timestamp = format(new Date(), 'yyyyMMddHHmm', { in: utc });
  return `${baseSchema}_${timestamp}`;
}

/**
 * Main function to generate and set the DATABASE_SCHEMA
 */
async function main() {
  try {
    const baseSchema = secrets.BASE_SCHEMA;
    const timestampedSchema = generateTimestampedSchema(baseSchema);

    console.log(`Generated schema: ${timestampedSchema}`);

    // Set the environment variable for this process and child processes
    process.env.DATABASE_SCHEMA = timestampedSchema;

    // Write to a .env file that can be sourced by other processes
    const envContent = `DATABASE_SCHEMA=${timestampedSchema}\n`;
    const envFilePath = join(process.cwd(), '.env.schema');

    writeFileSync(envFilePath, envContent);
    console.log(`Schema written to ${envFilePath}`);

    // Also output for shell scripts to source
    console.log(`export DATABASE_SCHEMA=${timestampedSchema}`);
  } catch (error) {
    console.error('Failed to generate schema:', error);
    process.exit(1);
  }
}

// Run if this is the main module
const __filename = fileURLToPath(import.meta.url);
const entrypoint = process.argv[1];

if (__filename === entrypoint) {
  main();
}

export { generateTimestampedSchema };
