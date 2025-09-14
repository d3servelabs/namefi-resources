import {
  Runtime,
  type LogLevel,
  type Worker,
  type Logger as TemporalLogger,
} from '@temporalio/worker';
import { addCategoriesToDomainsWithNoCategories } from '#lib/clubs-categories';
import {
  GreetActivities,
  MigrationActivities,
  MintActivities,
  NotifyActivities,
  OrderActivities,
  PaymentActivities,
  HuntActivities,
  FreeClaimActivities,
  FreeClaimsCorrectionActivities,
  LinkSharesExternalIdentifierMigrationActivities,
  TwitterLinkSharesValidationActivities,
} from '../activities';
import { DomainsActivities } from '../activities/domain';
import {
  getNamefiNftLock,
  getNftExpirationTimeInSeconds,
  getNftFromIndexer,
  getNftsForWallets,
  updateNamefiNftIndex,
} from '../activities/namefi-nft';
import { triggerNamefiGptCronJob } from '../activities/triggerNamefiGptCronJob';
import { triggerUpdateNamefiNftIndex } from '../schedules/update-namefi-nft-index';
import { TEMPORAL_ENUMS } from '../shared';
import { createWorker } from './createWorker';
import { createLogger, logger } from '#lib/logger';
import { db } from '@namefi-astra/db';
import { config } from '#lib/env';
import { IndexersActivities } from '../activities/indexers';
import { defaultTaskQueueActivities } from '../activities/default';
import { LogoGenerationActivities } from '../activities';

export let WORKERS: Partial<Record<TEMPORAL_ENUMS, Worker>> | undefined;

export const ACTIVITIES = {
  [TEMPORAL_ENUMS.DEFAULT]: {
    ...defaultTaskQueueActivities,
    ...GreetActivities,
    ...MigrationActivities,
    ...LinkSharesExternalIdentifierMigrationActivities,
    ...TwitterLinkSharesValidationActivities,
    ...OrderActivities,
    ...PaymentActivities,
    ...LogoGenerationActivities,
    updateNamefiNftIndex,
    triggerUpdateNamefiNftIndex,
    triggerNamefiGptCronJob,
    addCategoriesToDomainsWithNoCategories,
    getNamefiUsers: async () => {
      const users = await db.query.usersTable.findMany();
      return users;
    },
    generalAlertNamefi: async (
      args: { title: string; extraData: any; message: string } & any,
    ) => {
      logger.error(
        {
          context: '[Temporal] generalAlertNamefi',
          ...args,
        },
        'generalAlertNamefi',
      );
    },
    criticalAlertNamefi: async (
      args: { title: string; extraData: any; message: string } & any,
    ) => {
      logger.fatal(
        {
          context: '[Temporal] criticalAlertNamefi',
          ...args,
        },
        'criticalAlertNamefi',
      );
    },
    getConfig: async (key: keyof typeof config) => config[key],
    ...FreeClaimActivities,
    ...FreeClaimsCorrectionActivities,
  },
  [TEMPORAL_ENUMS.MINT]: {
    ...MintActivities,
    getNftExpirationTimeInSeconds,
    getNamefiNftLock,
    getNftFromIndexer,
    getNftsForWallets,
  },
  [TEMPORAL_ENUMS.DOMAINS]: DomainsActivities,
  [TEMPORAL_ENUMS.NOTIFY]: NotifyActivities,
  [TEMPORAL_ENUMS.INDEXERS]: IndexersActivities,
  [TEMPORAL_ENUMS.HUNT]: HuntActivities,
};
export type ACTIVITIES = typeof ACTIVITIES;

export async function initWorkers() {
  const temporalRuntimeLogger = getTemporalLogger();
  Runtime.install({ logger: temporalRuntimeLogger });
  WORKERS = {
    [TEMPORAL_ENUMS.DEFAULT]: await createWorker({
      activities: ACTIVITIES[TEMPORAL_ENUMS.DEFAULT],
      temporalEnum: TEMPORAL_ENUMS.DEFAULT,
      logLabel: TEMPORAL_ENUMS.DEFAULT,
    }),
    [TEMPORAL_ENUMS.MINT]: await createWorker({
      activities: ACTIVITIES[TEMPORAL_ENUMS.MINT],
      temporalEnum: TEMPORAL_ENUMS.MINT,
      logLabel: TEMPORAL_ENUMS.MINT,
      extraWorkerOptions: {
        maxConcurrentActivityTaskExecutions: 1,
      },
    }),
    [TEMPORAL_ENUMS.DOMAINS]: await createWorker({
      activities: ACTIVITIES[TEMPORAL_ENUMS.DOMAINS],
      temporalEnum: TEMPORAL_ENUMS.DOMAINS,
      logLabel: TEMPORAL_ENUMS.DOMAINS,
    }),
    [TEMPORAL_ENUMS.NOTIFY]: await createWorker({
      activities: ACTIVITIES[TEMPORAL_ENUMS.NOTIFY],
      temporalEnum: TEMPORAL_ENUMS.NOTIFY,
      logLabel: TEMPORAL_ENUMS.NOTIFY,
    }),
    [TEMPORAL_ENUMS.INDEXERS]: await createWorker({
      activities: ACTIVITIES[TEMPORAL_ENUMS.INDEXERS],
      temporalEnum: TEMPORAL_ENUMS.INDEXERS,
      logLabel: TEMPORAL_ENUMS.INDEXERS,
    }),
    [TEMPORAL_ENUMS.HUNT]: await createWorker({
      activities: ACTIVITIES[TEMPORAL_ENUMS.HUNT],
      temporalEnum: TEMPORAL_ENUMS.HUNT,
      logLabel: TEMPORAL_ENUMS.HUNT,
    }),
  };
}

function getTemporalLogger(): TemporalLogger {
  const pinoTemporal = createLogger({ component: 'temporal-worker' });
  // Support the SDK's logger via an adapter that preserves levels
  const temporalRuntimeLogger = {
    log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
      switch (level) {
        case 'TRACE':
          return pinoTemporal.trace(meta, message);
        case 'DEBUG':
          return pinoTemporal.debug(meta, message);
        case 'WARN':
          return pinoTemporal.warn(meta, message);
        case 'ERROR':
          return pinoTemporal.error(meta, message);
        case 'INFO':
          return pinoTemporal.info(meta, message);
        default:
          return pinoTemporal.info(meta, message);
      }
    },
    trace(message: string, meta?: Record<string, unknown>) {
      return pinoTemporal.trace(meta, message);
    },
    debug(message: string, meta?: Record<string, unknown>) {
      return pinoTemporal.debug(meta, message);
    },
    info(message: string, meta?: Record<string, unknown>) {
      return pinoTemporal.info(meta, message);
    },
    warn(message: string, meta?: Record<string, unknown>) {
      return pinoTemporal.warn(meta, message);
    },
    error(message: string, meta?: Record<string, unknown>) {
      return pinoTemporal.error(meta, message);
    },
  } satisfies TemporalLogger;
  return temporalRuntimeLogger;
}
