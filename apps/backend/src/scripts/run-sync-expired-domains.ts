#!/usr/bin/env tsx

/**
 * Test runner for the sync expired domains script
 */

import { syncExpiredDomainsWithNftDates } from '../lib/sync-expired-domains-with-nft-dates';
import { fileURLToPath } from 'node:url';

async function runSync() {
  // Check if this is a dry run
  const isDryRun =
    process.argv.includes('--dry-run') || process.argv.includes('--dry');

  console.log('=== Starting Expired Domains Sync ===');
  console.log(isDryRun ? '*** DRY RUN MODE ***' : '*** LIVE MODE ***');
  console.log('This script will:');
  console.log('1. Get expired domains from all registrars');
  console.log(
    '2. Find domains missing expiration dates in indexed_domains table',
  );
  console.log(
    isDryRun
      ? '3. Show what would be updated (no actual changes)'
      : '3. Update those domains with NFT expiration dates where available',
  );
  console.log('');

  if (!isDryRun) {
    console.log('⚠️  WARNING: This will make actual database changes!');
    console.log(
      '   Add --dry-run flag to see what would be changed without making updates',
    );
    console.log('');
  }

  try {
    const result = await syncExpiredDomainsWithNftDates({ dryRun: isDryRun });

    console.log('\n=== Final Results ===');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('\n=== Sync Failed ===');
    console.error(error);
    process.exit(1);
  }
}

// Run if this is the main module
const __filename = fileURLToPath(import.meta.url);
const entrypoint = process.argv[1];

if (__filename === entrypoint) {
  runSync();
}
