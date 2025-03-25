import type { Worker } from '@temporalio/worker';
import { GreetActivities, MintActivities } from '../activities';
import { TEMPORAL_ENUMS } from '../shared';
import { createWorker } from './createWorker';

export let WORKERS: Partial<Record<TEMPORAL_ENUMS, Worker>> | undefined;

export async function initWorkers() {
  WORKERS = {
    [TEMPORAL_ENUMS.DEFAULT]: await createWorker({
      activities: {
        ...GreetActivities,
      },
      temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    }),
    [TEMPORAL_ENUMS.MINT]: await createWorker({
      activities: {
        ...MintActivities,
      },
      temporalEnum: TEMPORAL_ENUMS.MINT,
    }),
  };
}
