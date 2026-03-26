#!/usr/bin/env bun
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSession, clearSession } from './lib/session-store';
import { createSignClient } from './lib/create-sign-client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const STORAGE_DIR = resolve(__dirname, '../.walletconnect-storage');

async function main() {
  const session = await loadSession();

  if (!session) {
    console.log('No active session to disconnect.');

    // Clean up storage directory even if no session metadata
    if (existsSync(STORAGE_DIR)) {
      await rm(STORAGE_DIR, { recursive: true, force: true });
      console.log('Cleaned up WalletConnect storage.');
    }

    process.exit(0);
  }

  console.log(`Disconnecting session for ${session.address} (${session.peerName})...`);

  // Initialize SignClient with persistent storage
  const signClient = await createSignClient();

  // Disconnect the session
  try {
    await signClient.disconnect({
      topic: session.topic,
      reason: {
        code: 6000,
        message: 'User disconnected',
      },
    });
  } catch (error) {
    // Session might already be expired or invalid, continue with cleanup
    console.warn('Warning: Failed to disconnect session on WalletConnect side:', error instanceof Error ? error.message : error);
  }

  // Clear local session file and WalletConnect storage
  await clearSession();

  if (existsSync(STORAGE_DIR)) {
    await rm(STORAGE_DIR, { recursive: true, force: true });
  }

  console.log('✓ Session disconnected and cleared.');
  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
