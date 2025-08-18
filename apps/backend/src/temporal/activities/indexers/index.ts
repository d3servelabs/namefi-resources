/**
 * This file contains the activities for the `TEMPORAL_QUEUES.INDEXERS`.
 */
import { triggerUpdateDomainIndex } from '../../schedules/update-domain-index';
import * as DomainIndexActivities from './domain-index.activities';
import * as NftManagementReportActivities from './reporting/nft-management-report.activities';
import * as NamefiGptDomainProcessingActivities from './namefi-gpt-domain-processing.activities';

export const IndexersActivities = {
  ...DomainIndexActivities,
  ...NftManagementReportActivities,
  triggerUpdateDomainIndex,
  ...NamefiGptDomainProcessingActivities,
};

export type IndexersActivities = typeof IndexersActivities;
