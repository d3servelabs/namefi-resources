import { sql } from 'drizzle-orm';
import { pgView, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * A temporary view to map a timestamp to a timestamp
 */
export const mapper = pgView('mapper', {
  time: timestamp('time_mapper').notNull(),
}).existing();

/**
 * Common table columns for timestamp tracking
 * @property {timestamp} createdAt - When the record was created
 * @property {timestamp} updatedAt - When the record was last updated
 */
export const timestamps = {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/**
 * Lifecycle timestamps for long-running business entities.
 * startedAt tracks when processing begins; finishedAt tracks terminal completion.
 */
export const lifecycleTimestamps = {
  startedAt: timestamp('started_at'),
  finishedAt: timestamp('finished_at'),
};

export const randomUuid = {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
};
