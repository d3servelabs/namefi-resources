/**
 * This file contains the activities for the `TEMPORAL_QUEUES.INDEXERS`.
 */
import { triggerUpdateDomainIndex } from '../../schedules/update-domain-index';
import * as DomainIndexActivities from './domain-index.activities';
import * as NftManagementReportActivities from './reporting/nft-management-report.activities';

export const IndexersActivities = {
  ...DomainIndexActivities,
  ...NftManagementReportActivities,
  triggerUpdateDomainIndex,
};

export type IndexersActivities = typeof IndexersActivities;
