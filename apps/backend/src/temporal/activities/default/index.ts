import * as EmailSubscriptionSyncActivities from './email-subscription-sync.activities';
import * as CampaignCandidateCollectionActivities from './campaign-candidate-collection.activities';
import * as CampaignAutoGrantClaimsActivities from './campaign-grant-claims.activities';

export const defaultTaskQueueActivities = {
  ...EmailSubscriptionSyncActivities,
  ...CampaignCandidateCollectionActivities,
  ...CampaignAutoGrantClaimsActivities,
};
