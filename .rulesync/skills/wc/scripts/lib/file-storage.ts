import { existsSync, statSync } from 'node:fs';
import { readFile, writeFile, mkdir, open, unlink, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IKeyValueStorage, KeyValueStorageOptions } from '@walletconnect/keyvaluestorage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const STORAGE_DIR = resolve(__dirname, '../../.walletconnect-storage');
const STORAGE_FILE = resolve(STORAGE_DIR, 'storage.json');
const LOCK_FILE = resolve(STORAGE_DIR, 'storage.lock');

type StorageData = Record<string, string>;

/**
 * File-based storage implementation for WalletConnect with file locking
 * Persists all key-value pairs to a JSON file with atomic writes
 */
export class FileStorage implements IKeyValueStorage {
  private data: StorageData = {};
  private initialized = false;

  constructor(opts?: KeyValueStorageOptions) {
    // Ignore opts for now, just use fixed file location
  }

  /**
   * Acquire an exclusive lock for file operations
   * Automatically removes stale locks older than 10 seconds
   */
  private async acquireLock(): Promise<() => Promise<void>> {
    // Create storage directory if it doesn't exist
    if (!existsSync(STORAGE_DIR)) {
      await mkdir(STORAGE_DIR, { recursive: true });
    }

    // Check for and remove stale lock
    if (existsSync(LOCK_FILE)) {
      try {
        const stats = await stat(LOCK_FILE);
        const lockAge = Date.now() - stats.mtimeMs;
        const staleLockTimeout = 10000; // 10 seconds

        if (lockAge > staleLockTimeout) {
          // Lock is stale, remove it
          await unlink(LOCK_FILE);
        }
      } catch (err) {
        // Ignore errors checking/removing stale lock
      }
    }

    // Retry lock acquisition with exponential backoff
    let retries = 0;
    const maxRetries = 20;
    const baseDelay = 50; // ms

    while (retries < maxRetries) {
      try {
        // Try to create lock file exclusively
        const lockHandle = await open(LOCK_FILE, 'wx');

        // Return release function
        return async () => {
          await lockHandle.close();
          try {
            await unlink(LOCK_FILE);
          } catch (err) {
            // Ignore errors on cleanup
          }
        };
      } catch (error: any) {
        if (error.code === 'EEXIST') {
          // Lock file exists, wait and retry
          const delay = baseDelay * Math.pow(2, Math.min(retries, 5));
          await new Promise(resolve => setTimeout(resolve, delay));
          retries++;
        } else {
          throw error;
        }
      }
    }

    throw new Error('Failed to acquire storage lock after multiple retries');
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    const releaseLock = await this.acquireLock();

    try {
      // Create storage directory if it doesn't exist
      if (!existsSync(STORAGE_DIR)) {
        await mkdir(STORAGE_DIR, { recursive: true });
      }

      // Load existing data if file exists
      if (existsSync(STORAGE_FILE)) {
        try {
          const content = await readFile(STORAGE_FILE, 'utf-8');
          if (content.trim()) {
            this.data = JSON.parse(content);
          } else {
            this.data = {};
          }
        } catch (error) {
          console.warn('Failed to load storage file, starting fresh:', error);
          this.data = {};
        }
      } else {
        this.data = {};
      }

      this.initialized = true;
    } finally {
      await releaseLock();
    }
  }

  async getKeys(): Promise<string[]> {
    await this.init();
    return Object.keys(this.data);
  }

  async getEntries<T = any>(): Promise<[string, T][]> {
    await this.init();
    return Object.entries(this.data).map(([key, value]) => [
      key,
      JSON.parse(value) as T,
    ]);
  }

  async getItem<T = any>(key: string): Promise<T | undefined> {
    await this.init();
    const value = this.data[key];
    return value ? (JSON.parse(value) as T) : undefined;
  }

  async setItem<T = any>(key: string, value: T): Promise<void> {
    await this.init();
    this.data[key] = JSON.stringify(value);
    await this.persist();
  }

  async removeItem(key: string): Promise<void> {
    await this.init();
    delete this.data[key];
    await this.persist();
  }

  private async persist(): Promise<void> {
    const releaseLock = await this.acquireLock();

    try {
      // Write to temporary file first
      const tempFile = `${STORAGE_FILE}.tmp`;
      const content = JSON.stringify(this.data, null, 2);
      await writeFile(tempFile, content, 'utf-8');

      // Atomic rename (on most systems)
      const fs = await import('node:fs/promises');
      await fs.rename(tempFile, STORAGE_FILE);
    } catch (error) {
      console.error('Failed to persist storage:', error);
      throw error;
    } finally {
      await releaseLock();
    }
  }
}
