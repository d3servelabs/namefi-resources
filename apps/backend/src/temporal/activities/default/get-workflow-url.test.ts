import { describe, expect, it } from 'vitest';
import {
  getTemporalWorkflowRunUrl,
  getTemporalWorkflowUrl,
} from './get-workflow-url';

describe('getTemporalWorkflowUrl', () => {
  it('builds config-based workflow history links with workflow and run ids', () => {
    expect(
      getTemporalWorkflowUrl({
        workflowId: 'process-order-ac02171e-2ada-4e8a-bc3e-0abd1f22685d',
        runId: '019eb2de-4a96-7890-9cf7-11f02b287e67',
      }),
    ).toBe(
      'https://cloud.temporal.io/namespaces/test-temporal-namespace/workflows/process-order-ac02171e-2ada-4e8a-bc3e-0abd1f22685d/019eb2de-4a96-7890-9cf7-11f02b287e67/history',
    );
  });

  it('falls back to a config-based workflow link when a run id is not available', () => {
    expect(
      getTemporalWorkflowUrl({ workflowId: 'namefi-feed-ingestion' }),
    ).toBe(
      'https://cloud.temporal.io/namespaces/test-temporal-namespace/workflows/namefi-feed-ingestion',
    );
  });

  it('keeps the existing async run-url helper on the same path', async () => {
    await expect(
      getTemporalWorkflowRunUrl('namefi-feed-digest', 'run-1'),
    ).resolves.toBe(
      getTemporalWorkflowUrl({
        workflowId: 'namefi-feed-digest',
        runId: 'run-1',
      }),
    );
  });
});
