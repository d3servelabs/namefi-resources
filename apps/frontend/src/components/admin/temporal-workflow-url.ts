/**
 * Builds a link into the Temporal Web UI for a workflow execution.
 *
 * The backend exposes `temporal.apiUrl` and `temporal.namespace` on
 * admin queries. We translate the (gRPC) API URL into the corresponding
 * UI URL — Temporal Cloud serves the UI at https://cloud.temporal.io
 * and a local dev server runs the UI at http://localhost:8233.
 */
export function getTemporalWorkflowUrl(args: {
  apiUrl: string;
  namespace: string;
  workflowId: string;
  runId?: string;
}): string {
  const { apiUrl, namespace, workflowId, runId } = args;
  const uiUrl = apiUrl.includes('localhost')
    ? 'http://localhost:8233'
    : 'https://cloud.temporal.io';
  const base = `${uiUrl}/namespaces/${encodeURIComponent(namespace)}/workflows/${encodeURIComponent(workflowId)}`;
  return runId ? `${base}/${encodeURIComponent(runId)}` : base;
}
