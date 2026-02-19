import { pgView, timestamp } from 'drizzle-orm/pg-core';

/**
 * A temporary view to map a timestamp to a timestamp
 */
export const mapper = pgView('mapper', {
  time: timestamp('time_mapper').notNull(),
}).existing();
