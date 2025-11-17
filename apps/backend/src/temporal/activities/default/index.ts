import * as EmailSubscriptionSyncActivities from './email-subscription-sync.activities';
import * as CampaignCandidateCollectionActivities from './campaign-candidate-collection.activities';
import * as CampaignAutoGrantClaimsActivities from './campaign-grant-claims.activities';
import { config } from '#lib/env';
import { logger } from '#lib/logger';
import { db } from '@namefi-astra/db';
import { updateNamefiNftIndex } from '../mint/namefi-nft';
import { triggerNamefiGptCronJob } from './triggerNamefiGptCronJob';
import { triggerUpdateNamefiNftIndex } from '../../schedules/update-namefi-nft-index';
import { addCategoriesToDomainsWithNoCategories } from '#lib/clubs-categories';
import { getTemporalWorkflowRunUrl } from './get-workflow-url';

export const defaultTaskQueueActivities = {
  ...EmailSubscriptionSyncActivities,
  ...CampaignCandidateCollectionActivities,
  ...CampaignAutoGrantClaimsActivities,
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
  updateNamefiNftIndex,
  triggerUpdateNamefiNftIndex,
  triggerNamefiGptCronJob,
  addCategoriesToDomainsWithNoCategories,
  getTemporalWorkflowRunUrl,
};
