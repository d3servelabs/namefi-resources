#!/usr/bin/env tsx

/**
 * Script to trigger the NFT updates schedule
 *
 * Usage:
 *   bun run command:trigger-nft-updates-schedule
 */
import { submitScheduleForUpdateNamefiNftIndex } from '../temporal/schedules/update-namefi-nft-index';

// Start the process
async function main(): Promise<void> {
  await submitScheduleForUpdateNamefiNftIndex();
}

main().catch((err) => {
  const error = err as Error;
  console.error('Unhandled error:', error);
  process.exit(1);
});
