import type { Worker } from '@temporalio/worker';
import { addCategoriesToDomainsWithNoCategories } from '#lib/clubs-categories';
import {
  GreetActivities,
  MigrationActivities,
  MintActivities,
  NotifyActivities,
  OrderActivities,
  PaymentActivities,
} from '../activities';
import { DomainsActivities } from '../activities/domain';
import {
  getNftExpirationTimeInSeconds,
  getNftFromIndexer,
  getNftsForWallets,
  updateNamefiNftIndex,
} from '../activities/namefi-nft';
import { triggerNamefiGptCronJob } from '../activities/triggerNamefiGptCronJob';
import { triggerUpdateNamefiNftIndex } from '../schedules/update-namefi-nft-index';
import { TEMPORAL_ENUMS } from '../shared';
import { createWorker } from './createWorker';
import { logger } from '#lib/logger';
import { db } from '@namefi-astra/db';
import { config } from '#lib/env';
import { IndexersActivities } from '../activities/indexers';

export let WORKERS: Partial<Record<TEMPORAL_ENUMS, Worker>> | undefined;

export const ACTIVITIES = {
  [TEMPORAL_ENUMS.DEFAULT]: {
    ...GreetActivities,
    ...MigrationActivities,
    ...OrderActivities,
    ...PaymentActivities,
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
      logger
        .child({
          context: '[Temporal] generalAlertNamefi',
        })
        .error(args);
    },
    criticalAlertNamefi: async (
      args: { title: string; extraData: any; message: string } & any,
    ) => {
      logger
        .child({
          context: '[Temporal] criticalAlertNamefi',
        })
        .fatal(args);
    },
    getConfig: async (key: keyof typeof config) => config[key],
  },
  [TEMPORAL_ENUMS.MINT]: {
    ...MintActivities,
    getNftExpirationTimeInSeconds,
    getNftFromIndexer,
    getNftsForWallets,
  },
  [TEMPORAL_ENUMS.DOMAINS]: DomainsActivities,
  [TEMPORAL_ENUMS.NOTIFY]: NotifyActivities,
  [TEMPORAL_ENUMS.INDEXERS]: IndexersActivities,
};
export type ACTIVITIES = typeof ACTIVITIES;

export async function initWorkers() {
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
  };
}
