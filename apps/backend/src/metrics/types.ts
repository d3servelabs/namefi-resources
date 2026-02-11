import type { db } from '@namefi-astra/db';
import type { Logger } from '#lib/logger';
import type Keyv from 'keyv';

export type MetricsContext = {
  now: Date;
  db: typeof db;
  log: Logger;
  cache: Keyv<unknown>;
};
