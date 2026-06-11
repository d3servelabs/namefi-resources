'use client';

import {
  addRxPlugin,
  createRxDatabase,
  type RxCollection,
  type RxDatabase,
  type RxDocument,
} from 'rxdb';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { getRxStorageLocalstorage } from 'rxdb/plugins/storage-localstorage';
import { Observable } from 'rxjs';

/**
 * Cross-tab reactive store for the in-app notifications coordinator.
 *
 * Holds exactly one document keyed by `key: 'unread'`:
 * - `count`: the latest unread-notifications count, written by whichever
 *   tab currently holds leadership.
 * - `lastUpdatedAt`: epoch ms of the most recent leader write. Useful for
 *   debugging; not consumed by the coordinator.
 * - `pollNonce`: monotonically increasing integer. Follower tabs bump
 *   this after a local mutation (markAsSeen / archive / …) to ask the
 *   leader to refetch immediately instead of waiting for the next 10s
 *   tick.
 *
 * Storage = `localStorage` because (a) all tabs of the same origin see
 * the same data, (b) the dataset is one tiny document so size is a
 * non-issue, (c) it's the lightest of RxDB's `multiInstance: true`
 * storages. Persistence across reloads is incidental — the leader
 * overwrites on its next poll.
 */

export const SHARED_DOC_KEY = 'unread';

export type SharedStateDocType = {
  key: string;
  count: number;
  lastUpdatedAt: number;
  pollNonce: number;
};

type SharedStateCollection = RxCollection<SharedStateDocType>;

type SharedDb = {
  db: RxDatabase<{ state: SharedStateCollection }>;
  state: SharedStateCollection;
};

const sharedStateSchema = {
  version: 0,
  primaryKey: 'key',
  type: 'object',
  properties: {
    key: { type: 'string', maxLength: 32 },
    count: {
      type: 'number',
      minimum: 0,
      maximum: 1_000_000_000,
      multipleOf: 1,
    },
    lastUpdatedAt: {
      type: 'number',
      minimum: 0,
      maximum: 9_999_999_999_999,
      multipleOf: 1,
    },
    pollNonce: {
      type: 'number',
      minimum: 0,
      maximum: 1_000_000_000,
      multipleOf: 1,
    },
  },
  required: ['key', 'count', 'lastUpdatedAt', 'pollNonce'],
} as const;

let pluginAdded = false;
let dbPromise: Promise<SharedDb> | null = null;

async function buildSharedDb(): Promise<SharedDb> {
  if (!pluginAdded) {
    addRxPlugin(RxDBLeaderElectionPlugin);
    pluginAdded = true;
  }
  const db = await createRxDatabase<{ state: SharedStateCollection }>({
    name: 'namefi_notifications_shared',
    storage: getRxStorageLocalstorage(),
    // `multiInstance: true` is what enables the BroadcastChannel-based
    // change-event fan-out and the leader-election plugin's tab election.
    multiInstance: true,
    // HMR re-runs this module in dev; close the stale in-memory instance
    // instead of using `ignoreDuplicate`, which RxDB allows only with its
    // dev-mode plugin enabled.
    closeDuplicates: process.env.NODE_ENV !== 'production',
    // Tab close fires `beforeunload` too late to cleanly close; let RxDB
    // assume the previous instance was killed.
    allowSlowCount: true,
  });
  await db.addCollections({
    state: { schema: sharedStateSchema },
  });
  // Seed the singleton doc so observers always see *something* (even if
  // the leader hasn't polled yet). A duplicate-key collision means
  // another tab already seeded it — benign. Anything else (storage
  // quota, schema mismatch, …) must surface so `getSharedDb()` rejects
  // and the caller can react instead of running on silently broken state.
  try {
    await db.state.insert({
      key: SHARED_DOC_KEY,
      count: 0,
      lastUpdatedAt: 0,
      pollNonce: 0,
    });
  } catch (error) {
    if (!isDuplicateInsertError(error)) throw error;
  }
  return { db, state: db.state };
}

/**
 * Heuristic for "another tab already seeded this doc." RxDB throws an
 * `RxError` with `code: 'COL19'` (and historically `'CONFLICT'`) on a
 * duplicate-PK insert; check `.code` (newer rxdb versions) plus a
 * message-substring fallback so we stay tolerant across minor releases
 * without swallowing genuine storage failures.
 */
function isDuplicateInsertError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: unknown }).code;
  if (code === 'COL19' || code === 'CONFLICT') return true;
  const message = (error as { message?: unknown }).message;
  if (typeof message !== 'string') return false;
  return /already exists|conflict|duplicate/i.test(message);
}

export function getSharedDb(): Promise<SharedDb> {
  if (!dbPromise) {
    dbPromise = buildSharedDb().catch((error) => {
      // Reset so the next caller can retry instead of being stuck with a
      // rejected promise forever.
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

/**
 * Hot observable of the singleton shared doc. Emits on every cross-tab
 * change including the leader's writes.
 */
export function readSharedDoc$(): Observable<RxDocument<SharedStateDocType> | null> {
  return new Observable((subscriber) => {
    let teardown: (() => void) | null = null;
    let cancelled = false;
    void getSharedDb()
      .then(({ state }) => {
        if (cancelled) return;
        const sub = state
          .findOne(SHARED_DOC_KEY)
          .$.subscribe((doc) => subscriber.next(doc));
        teardown = () => sub.unsubscribe();
      })
      .catch((error) => {
        // Propagate `getSharedDb()` rejections to the subscriber so
        // consumers don't sit on a stalled observable forever.
        if (!cancelled) subscriber.error(error);
      });
    return () => {
      cancelled = true;
      teardown?.();
    };
  });
}

/**
 * Leader-only: overwrite the shared doc with the latest count. Called on
 * every successful `getUnreadCount` poll in the elected tab.
 */
export async function writeSharedCount(count: number): Promise<void> {
  const { state } = await getSharedDb();
  const doc = await state.findOne(SHARED_DOC_KEY).exec();
  // Cold-start window: `buildSharedDb` seeds the doc, but if a caller
  // races ahead of `addCollections` settling we may still see nothing.
  // Insert in that case; otherwise patch atomically.
  if (!doc) {
    await state.insert({
      key: SHARED_DOC_KEY,
      count,
      lastUpdatedAt: Date.now(),
      pollNonce: 0,
    });
    return;
  }
  // `incrementalPatch` re-reads the doc inside RxDB before applying,
  // so a follower's `bumpPollNonce` that lands between our read and
  // write is preserved instead of being clobbered by a stale full
  // upsert. `count` and `lastUpdatedAt` are the only fields we own.
  await doc.incrementalPatch({
    count,
    lastUpdatedAt: Date.now(),
  });
}

/**
 * Anyone-can-call: increment `pollNonce` so the leader picks it up via
 * `readSharedDoc$()` and triggers an immediate refetch. Used after local
 * mutations (`markAsSeen` etc.) so the user doesn't wait up to 10s for
 * the next leader poll to refresh the badge.
 */
export async function bumpPollNonce(): Promise<void> {
  const { state } = await getSharedDb();
  const doc = await state.findOne(SHARED_DOC_KEY).exec();
  if (!doc) return;
  // `incrementalModify` re-reads the doc inside RxDB and runs our
  // callback against the latest state, so two tabs that both bump at
  // the same instant can't read the same `pollNonce` and overwrite
  // each other — the second tab's modify runs against the first tab's
  // already-committed result. (Plain `patch` would lose one bump.)
  await doc.incrementalModify((data) => ({
    ...data,
    pollNonce: data.pollNonce + 1,
  }));
}

/**
 * Resolves to `true` once this tab has been elected leader. Resolves
 * never (well, after the database closes) if another tab keeps winning.
 * RxDB hands leadership to another tab automatically when the leader
 * closes — no explicit handoff needed.
 */
export async function waitForLeadership(): Promise<boolean> {
  const { db } = await getSharedDb();
  return db.waitForLeadership();
}
