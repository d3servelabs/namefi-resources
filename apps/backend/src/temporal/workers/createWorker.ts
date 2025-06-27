import path from 'node:path';
import {
  NativeConnection,
  type NativeConnectionOptions,
  Worker,
  type WorkerOptions,
} from '@temporalio/worker';
import { isNotNil } from 'ramda';
import { config, secrets } from '#lib/env';
import { type TEMPORAL_ENUMS, TEMPORAL_QUEUES } from '../shared/enums';

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
  console.log(`[${logLabel}]: Creating Worker`);

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
  console.log(`[${logLabel}]: Creating Connection`);
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

    console.log(`[${logLabel}]: Connected to ${config.TEMPORAL_API_URL}`);
    // Step 2: Register Workflows and Activities with the Worker.
    const worker = await Worker.create({
      ...(extraWorkerOptions || {}),
      connection,
      namespace: config.TEMPORAL_NAMESPACE,
      taskQueue: TEMPORAL_QUEUES[temporalEnum],
      ...workflowOption,
      activities,
      bundlerOptions: {
        ignoreModules: ['process', 'inspector'],
      },
    });

    // Step 3: Start accepting tasks on the Task Queue specified in TASK_QUEUE_NAME
    worker.run().finally(async () => {
      await connection?.close();
    });
    console.log(`[${logLabel}]: Started worker!`);

    return worker;
  } catch (e) {
    console.error(`[${logLabel}]: Worker Connection Failed error`);
    console.error(e);
    if (isNotNil(connection)) {
      await connection.close();
    }
  }
}
