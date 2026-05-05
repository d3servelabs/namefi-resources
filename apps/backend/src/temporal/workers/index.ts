import {
  Runtime,
  type LogLevel,
  type Worker,
  type Logger as TemporalLogger,
} from '@temporalio/worker';

import { TEMPORAL_ENUMS } from '../shared';
import { createWorker } from './createWorker';
import { createLogger, logger } from '#lib/logger';
import { ACTIVITIES } from './activity-registry';
import pProps from 'p-props';
import { fromPairs } from 'ramda';

type ExtraWorkerOptions = Parameters<
  typeof createWorker
>[0]['extraWorkerOptions'];

export let WORKERS: Partial<Record<TEMPORAL_ENUMS, Worker>> | undefined;
const workersExtraConfig: Partial<Record<TEMPORAL_ENUMS, ExtraWorkerOptions>> =
  {
    ...fromPairs(
      Object.values(TEMPORAL_ENUMS).map((temporalEnum) => [temporalEnum, {}]),
    ), // default empty object for each worker
    [TEMPORAL_ENUMS.MINT]: {
      maxConcurrentActivityTaskExecutions: 1,
    },
  };

export async function initWorkers() {
  const temporalRuntimeLogger = getTemporalLogger();
  Runtime.install({ logger: temporalRuntimeLogger });
  WORKERS = await pProps(workersExtraConfig, (extraConfig, key) =>
    createWorker({
      activities: ACTIVITIES[key],
      temporalEnum: key,
      logLabel: key,
      extraWorkerOptions: extraConfig,
    }),
  );
}

function getTemporalLogger(): TemporalLogger {
  const pinoTemporal = createLogger({ component: 'temporal-worker' });
  // Support the SDK's logger via an adapter that preserves levels
  const temporalRuntimeLogger = {
    log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
      switch (level) {
        case 'TRACE':
          return pinoTemporal.trace(meta, message);
        case 'DEBUG':
          return pinoTemporal.debug(meta, message);
        case 'WARN':
          return pinoTemporal.warn(meta, message);
        case 'ERROR':
          return pinoTemporal.error(meta, message);
        case 'INFO':
          return pinoTemporal.info(meta, message);
        default:
          return pinoTemporal.info(meta, message);
      }
    },
    trace(message: string, meta?: Record<string, unknown>) {
      return pinoTemporal.trace(meta, message);
    },
    debug(message: string, meta?: Record<string, unknown>) {
      return pinoTemporal.debug(meta, message);
    },
    info(message: string, meta?: Record<string, unknown>) {
      return pinoTemporal.info(meta, message);
    },
    warn(message: string, meta?: Record<string, unknown>) {
      return pinoTemporal.warn(meta, message);
    },
    error(message: string, meta?: Record<string, unknown>) {
      return pinoTemporal.error(meta, message);
    },
  } satisfies TemporalLogger;
  return temporalRuntimeLogger;
}
