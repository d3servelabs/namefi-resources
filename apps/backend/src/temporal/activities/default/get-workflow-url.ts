import { config } from '#lib/env';

export async function getTemporalWorkflowRunUrl(
  workflowId: string,
  runId: string,
) {
  return `https://cloud.temporal.io/namespaces/${encodeURIComponent(config.TEMPORAL_NAMESPACE)}/workflows/${encodeURIComponent(workflowId)}/${encodeURIComponent(runId)}/history`;
}
