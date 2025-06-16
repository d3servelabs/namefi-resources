import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import type { Worker } from '@temporalio/worker';
import { addCategoriesToDomainsWithNoCategories } from '#lib/clubs-categories';
import * as DnssecLib from '#lib/domains/dnssec';
import * as NameserversLib from '#lib/domains/nameservers';
import { sldRegistrar } from '#lib/namefi-registry';
import { isDomainParked, parkDomain } from '#services/dns/parking';
import {
  GreetActivities,
  MintActivities,
  NotifyActivities,
  OrderActivities,
  PaymentActivities,
} from '../activities';
import * as DnssecActivities from '../activities/dnssec.activties';
import { updateNamefiNftIndex } from '../activities/namefi-nft';
import { triggerNamefiGptCronJob } from '../activities/triggerNamefiGptCronJob';
import { triggerUpdateNamefiNftIndex } from '../schedules/update-namefi-nft-index';
import { TEMPORAL_ENUMS } from '../shared';
import { createWorker } from './createWorker';

export let WORKERS: Partial<Record<TEMPORAL_ENUMS, Worker>> | undefined;

export const ACTIVITIES = {
  [TEMPORAL_ENUMS.DEFAULT]: {
    ...GreetActivities,
    ...OrderActivities,
    ...PaymentActivities,
    updateNamefiNftIndex,
    triggerUpdateNamefiNftIndex,
    triggerNamefiGptCronJob,
    addCategoriesToDomainsWithNoCategories,
  },
  [TEMPORAL_ENUMS.MINT]: {
    ...MintActivities,
  },
  [TEMPORAL_ENUMS.DOMAINS]: {
    parkDomain,
    isDomainParked,
    getDomainDetails: (domainName: PunycodeDomainName) =>
      sldRegistrar.getDomainDetails(domainName), //TODO
    ...NameserversLib,
    ...DnssecActivities,
    ...DnssecLib,
  },
  [TEMPORAL_ENUMS.NOTIFY]: {
    ...NotifyActivities,
  },
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
  };
}
