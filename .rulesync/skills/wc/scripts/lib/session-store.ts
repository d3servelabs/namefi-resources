import { existsSync } from 'node:fs';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Address } from 'viem';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SESSION_FILE = resolve(__dirname, '../../sessions.json');

export type StoredSession = {
  topic: string;
  address: Address;
  chainId: number;
  peerName: string;
  createdAt: number;
};

export type SessionStore = {
  active: StoredSession | null;
};

/**
 * Load the active session from sessions.json
 * Returns null if no session exists or file doesn't exist
 */
export async function loadSession(): Promise<StoredSession | null> {
  if (!existsSync(SESSION_FILE)) {
    return null;
  }

  try {
    const content = await readFile(SESSION_FILE, 'utf-8');
    const store: SessionStore = JSON.parse(content);
    return store.active;
  } catch (error) {
    console.error('Failed to load session:', error);
    return null;
  }
}

/**
 * Save a session to sessions.json
 */
export async function saveSession(session: StoredSession): Promise<void> {
  const store: SessionStore = {
    active: session,
  };

  await writeFile(SESSION_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

/**
 * Clear the active session
 */
export async function clearSession(): Promise<void> {
  if (existsSync(SESSION_FILE)) {
    await unlink(SESSION_FILE);
  }
}
