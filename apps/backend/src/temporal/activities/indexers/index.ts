/**
 * This file contains the activities for the `TEMPORAL_QUEUES.INDEXERS`.
 */
import { triggerUpdateDomainIndex } from '../../schedules/update-domain-index';
import { triggerGenerateAndUpdateDataForDomains } from '../../schedules/generate-and-update-data-for-domains';
import * as DomainIndexActivities from './domain-index.activities';
import * as NftManagementReportActivities from './reporting/nft-management-report.activities';
import * as NamefiGptDomainProcessingActivities from './namefi-gpt-domain-processing.activities';
import * as NftMarketplaceActivities from './nft-marketplace.activities';
import * as PrivyCacheActivities from './privy-cache.activities';
import { addCategoriesToDomainsWithNoCategories } from '#lib/clubs-categories';

export const IndexersActivities = {
  ...DomainIndexActivities,
  ...NftManagementReportActivities,
  triggerUpdateDomainIndex,
  ...NamefiGptDomainProcessingActivities,
  ...NftMarketplaceActivities,
  ...PrivyCacheActivities,
  triggerGenerateAndUpdateDataForDomains,
  addCategoriesToDomainsWithNoCategories,
};

export type IndexersActivities = typeof IndexersActivities;
