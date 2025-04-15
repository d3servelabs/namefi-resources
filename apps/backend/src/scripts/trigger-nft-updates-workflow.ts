#!/usr/bin/env tsx

/**
 * Script to trigger the NFT updates workflow
 *
 * Usage:
 *   bun run command:trigger-nft-updates-workflow
 */
import { triggerUpdateNamefiNftIndex } from '../temporal/schedules/update-namefi-nft-index';

// Start the process
async function main(): Promise<void> {
  await triggerUpdateNamefiNftIndex();
}

main().catch((err) => {
  const error = err as Error;
  console.error('Unhandled error:', error);
  process.exit(1);
});
