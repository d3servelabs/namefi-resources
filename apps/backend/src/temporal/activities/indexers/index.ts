/**
 * This file contains the activities for the `TEMPORAL_QUEUES.INDEXERS`.
 */
import { triggerUpdateDomainIndex } from '../../schedules/update-domain-index';
import { triggerGenerateAndUpdateDataForDomains } from '../../schedules/generate-and-update-data-for-domains';
import { domainExportTrackingSchedule } from '../../schedules/domain-export-tracking';
import { triggerSyncPonderIndex } from '../../schedules/sync-ponder-index';
import * as DomainIndexActivities from './domain-index.activities';
import * as NftManagementReportActivities from './reporting/nft-management-report.activities';
import * as NamefiGptDomainProcessingActivities from './namefi-gpt-domain-processing.activities';
import * as NftMarketplaceActivities from './nft-marketplace.activities';
import * as PrivyCacheActivities from './privy-cache.activities';
import * as PonderSyncActivities from './ponder-sync.activities';
import { addCategoriesToDomainsWithNoCategories } from '#lib/clubs-categories';

export const IndexersActivities = {
  ...DomainIndexActivities,
  ...NftManagementReportActivities,
  triggerUpdateDomainIndex,
  ...NamefiGptDomainProcessingActivities,
  ...NftMarketplaceActivities,
  ...PrivyCacheActivities,
  ...PonderSyncActivities.PonderSyncActivities,
  triggerGenerateAndUpdateDataForDomains,
  triggerSyncPonderIndex,
  addCategoriesToDomainsWithNoCategories,
  triggerDomainExportTracking: async () =>
    domainExportTrackingSchedule.trigger(),
};

export type IndexersActivities = typeof IndexersActivities;
