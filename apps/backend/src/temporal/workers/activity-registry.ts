import {
  MigrationActivities,
  MintActivities,
  NotifyActivities,
  OrderActivities,
  PaymentActivities,
  HuntActivities,
  FreeClaimActivities,
  FreeClaimsCorrectionActivities,
  PbnIssuanceReservationsActivities,
  LinkSharesExternalIdentifierMigrationActivities,
  TwitterLinkSharesValidationActivities,
  GreetActivities,
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
import { createLogger, logger } from '#lib/logger';
import { db } from '@namefi-astra/db';
import { config } from '#lib/env';
import { IndexersActivities } from '../activities/indexers';
import { defaultTaskQueueActivities } from '../activities/default';
import { LogoGenerationActivities } from '../activities';
import { addCategoriesToDomainsWithNoCategories } from '#lib/clubs-categories';

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
    ...PbnIssuanceReservationsActivities,
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
