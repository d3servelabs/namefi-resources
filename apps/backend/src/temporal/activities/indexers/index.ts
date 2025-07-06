/**
 * This file contains the activities for the `TEMPORAL_QUEUES.INDEXERS`.
 */
import { triggerUpdateDomainIndex } from '../../schedules/update-domain-index';
import * as DomainIndexActivities from './domain-index.activities';

export const IndexersActivities = {
  ...DomainIndexActivities,
  triggerUpdateDomainIndex,
};

export type IndexersActivities = typeof IndexersActivities;
