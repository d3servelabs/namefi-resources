import path from 'node:path';
import {
  NativeConnection,
  type NativeConnectionOptions,
  Worker,
  type WorkerOptions,
} from '@temporalio/worker';
import { isNotNil } from 'ramda';
import { config, secrets } from '#lib/env';
import { createLogger } from '#lib/logger';
import { type TEMPORAL_ENUMS, TEMPORAL_QUEUES } from '../shared/enums';
import { wrapActivities } from '#lib/execution-context/temporal/wrappers';

export async function createWorker({
  activities,
  logLabel,
  temporalEnum,
  extraWorkerOptions,
}: {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  activities: Record<string, (...args: any[]) => any>;
  logLabel?: string;
  temporalEnum: TEMPORAL_ENUMS;
  extraWorkerOptions?: Omit<
    WorkerOptions,
    'activities' | 'namespace' | 'taskQueue'
  >;
}) {
  // Create worker-specific logger with context
  const workerLogger = createLogger({
    component: 'temporal-worker',
    workerType: temporalEnum,
    taskQueue: TEMPORAL_QUEUES[temporalEnum],
    logLabel: logLabel || temporalEnum,
  });

  workerLogger.info('Creating Worker');

  const workflowOption =
    process.env.NODE_ENV === 'production'
      ? {
          workflowBundle: {
            codePath: '/app/dist/workflow-bundle.js',
          },
        }
      : {
          workflowsPath: path.join(
            import.meta.dirname || __dirname,
            '../workflows/index.ts',
          ),
        };

  let connection: NativeConnection | undefined;
  workerLogger.info('Creating Connection');
  try {
    // Step 1: Establish a connection with Temporal server.
    const connectionConfig: NativeConnectionOptions = {
      address: config.TEMPORAL_API_URL,
      metadata: {
        'temporal-namespace': config.TEMPORAL_NAMESPACE,
      },
    };
    const apiKey = secrets.TEMPORAL_API_KEY;
    if (apiKey) {
      connectionConfig.apiKey = apiKey;
      connectionConfig.tls = true;
    }
    connection = await NativeConnection.connect(connectionConfig);

    workerLogger.info('Connected to Temporal server', {
      url: config.TEMPORAL_API_URL,
      namespace: config.TEMPORAL_NAMESPACE,
    });

    // Step 2: Register Workflows and Activities with the Worker.
    const worker = await Worker.create({
      ...(extraWorkerOptions || {}),
      connection,
      namespace: config.TEMPORAL_NAMESPACE,

      taskQueue: TEMPORAL_QUEUES[temporalEnum],
      ...workflowOption,
      activities: wrapActivities(activities),
      bundlerOptions: {
        ignoreModules: ['process', 'inspector'],
      },
    });

    // Step 3: Start accepting tasks on the Task Queue specified in TASK_QUEUE_NAME
    worker.run().finally(async () => {
      workerLogger.info('Worker shutdown initiated');
      await connection?.close();
    });

    workerLogger.info({
      taskQueue: TEMPORAL_QUEUES[temporalEnum],
      message: 'Worker started successfully',
    });

    return worker;
  } catch (e) {
    workerLogger.error({
      error: e,
      temporalUrl: config.TEMPORAL_API_URL,
      namespace: config.TEMPORAL_NAMESPACE,
      message: 'Worker Connection Failed',
    });
    if (isNotNil(connection)) {
      await connection.close();
    }
  }
}
