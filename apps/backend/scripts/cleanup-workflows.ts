import { createLogger } from '#lib/logger';
import { config } from '#lib/env';
import { temporalClient } from '#temporal/client';
import { setTimeout } from 'node:timers/promises';

const logger = createLogger({ context: 'cleanup-workflows' });

async function getWorkflows(pageSize = 10, pageToken?: Uint8Array) {
  const workflows =
    await temporalClient.workflowService.listClosedWorkflowExecutions({
      namespace: config.TEMPORAL_NAMESPACE,
      typeFilter: {
        name: 'updateNamefiNftIndexWorkflow', //updateDomainIndexWorkflow
      },
      maximumPageSize: pageSize,
      nextPageToken: pageToken,
    });
  return workflows;
}

async function deleteWorkflows(
  workflows: Awaited<ReturnType<typeof getWorkflows>>['executions'],
) {
  for (const workflow of workflows) {
    if (!workflow.execution) {
      logger.warn({ workflow }, 'Workflow has no execution');
      continue;
    }
    try {
      await temporalClient.workflowService.deleteWorkflowExecution({
        namespace: config.TEMPORAL_NAMESPACE,
        workflowExecution: {
          workflowId: workflow.execution.workflowId,
          runId: workflow.execution.runId,
        },
      });
    } catch (error) {
      logger.error(
        { err: error },
        `Error deleting workflow ${workflow.execution.workflowId}`,
      );
    }
  }
}

async function cleanup() {
  const { executions, nextPageToken } = await getWorkflows(1000);
  console.log(`Deleting ${executions.length} workflows`);
  await deleteWorkflows(executions);
  console.log('Finished deleting workflows');
  console.log('Waiting 4 seconds');
  await setTimeout(15000);
  if (executions.length === 1000 && nextPageToken) {
    return cleanup();
  }
  console.log('Done');
}

cleanup();
