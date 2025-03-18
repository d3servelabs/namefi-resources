import * as workflow from '@temporalio/workflow';
import type { GreetActivities } from '../activities';
import { shortRunningOpts } from '../shared/commonRunningOptions';
import { TEMPORAL_QUEUES } from '../shared/enums';

export async function helloWorldWorkflow(name: string): Promise<string> {
  // Get reference to activities
  const { greet } = workflow.proxyActivities<typeof GreetActivities>({
    ...shortRunningOpts,
    taskQueue: TEMPORAL_QUEUES.DEFAULT,
  });

  // Execute the greeting activity
  await greet(name);

  await workflow.sleep('30 seconds');

  await greet(name);

  // Return a message
  return `Completed greeting workflow for ${name}`;
}
