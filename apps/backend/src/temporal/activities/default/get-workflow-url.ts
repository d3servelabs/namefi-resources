import { config } from '#lib/env';

const LOCAL_TEMPORAL_UI_URL = 'http://localhost:8233';
const TEMPORAL_CLOUD_UI_URL = 'https://cloud.temporal.io';

export function getTemporalWorkflowUrl({
  workflowId,
  runId,
}: {
  workflowId: string;
  runId?: string | null;
}) {
  const uiBaseUrl = config.TEMPORAL_API_URL.includes('localhost')
    ? LOCAL_TEMPORAL_UI_URL
    : TEMPORAL_CLOUD_UI_URL;
  const workflowUrl = `${uiBaseUrl}/namespaces/${encodeURIComponent(
    config.TEMPORAL_NAMESPACE,
  )}/workflows/${encodeURIComponent(workflowId)}`;
  return runId
    ? `${workflowUrl}/${encodeURIComponent(runId)}/history`
    : workflowUrl;
}

export async function getTemporalWorkflowRunUrl(
  workflowId: string,
  runId: string,
) {
  return getTemporalWorkflowUrl({
    workflowId,
    runId,
  });
}
