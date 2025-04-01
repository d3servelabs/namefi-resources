#!/usr/bin/env tsx

/**
 * Script to get domain name owner updates between blockchain blocks
 *
 * Usage:
 *   bun run command:get-nft-updates
 */
import { updateNamefiNftIndex } from '../temporal/activities/namefi-nft';

// Start the process
async function main(): Promise<void> {
  await updateNamefiNftIndex();
}

main().catch((err) => {
  const error = err as Error;
  console.error('Unhandled error:', error);
  process.exit(1);
});
