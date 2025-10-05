import type { Client as TemporalClient } from '@temporalio/client';
import { logger } from '#lib/logger';

export type WorkflowService = TemporalClient['workflowService'];
export type ListWorkflowExecutionsFunction =
  WorkflowService['listWorkflowExecutions'];
export type ListWorkflowExecutionsRequest =
  Parameters<ListWorkflowExecutionsFunction>[0];
export type ListWorkflowExecutionsResponse = Awaited<
  ReturnType<ListWorkflowExecutionsFunction>
>['executions'][0];

export type WorkflowExecution = ListWorkflowExecutionsResponse['execution'];

export type Memo = ListWorkflowExecutionsResponse['memo'];
export type SearchAttributes =
  ListWorkflowExecutionsResponse['searchAttributes'];
export type WorkflowExecutionStatus = ListWorkflowExecutionsResponse['status'];

export function encodeNextPageToken(
  nextPageToken: string | Uint8Array | undefined | null,
) {
  if (!nextPageToken) {
    return undefined;
  }
  if (typeof nextPageToken === 'string') {
    return new TextEncoder().encode(nextPageToken);
  }
  return nextPageToken;
}

export function decodeNextPageToken(
  nextPageToken: Uint8Array | string | undefined | null,
) {
  if (!nextPageToken) {
    return undefined;
  }
  if (typeof nextPageToken === 'string') {
    return nextPageToken;
  }
  if (nextPageToken instanceof Uint8Array) {
    return new TextDecoder().decode(nextPageToken);
  }
  return new Uint8Array(nextPageToken);
}

export function buildListWorkflowExecutionsQuery({
  query,
  nextPageToken,
  pageSize,
  namespace,
}: {
  namespace: string;
  query: string;
  nextPageToken?: string;
  pageSize?: number;
}): ListWorkflowExecutionsRequest {
  return {
    namespace,
    query,
    nextPageToken: nextPageToken
      ? encodeNextPageToken(nextPageToken)
      : undefined,
    pageSize,
  };
}

export function convertWorkflowStatusToString(
  status: WorkflowExecutionStatus | null | undefined,
) {
  // Convert protobuf status to string
  let statusString = 'UNKNOWN';
  const statusAny = status as any;
  if (typeof statusAny === 'number') {
    const statusMap: Record<number, string> = {
      0: 'UNSPECIFIED',
      1: 'RUNNING',
      2: 'COMPLETED',
      3: 'FAILED',
      4: 'CANCELLED',
      5: 'TERMINATED',
      6: 'CONTINUED_AS_NEW',
      7: 'TIMED_OUT',
    };
    statusString = statusMap[statusAny] || 'UNKNOWN';
  } else if (typeof statusAny === 'string') {
    statusString = statusAny;
  } else if (statusAny?.name) {
    statusString = statusAny.name;
  }
  return statusString;
}

export function parseMemo(memo: Memo) {
  const memoData: Record<string, unknown> = {};
  if (memo?.fields) {
    for (const [key, value] of Object.entries(memo.fields)) {
      try {
        // Temporal stores memo as JSON encoded values
        const jsonPayload = value?.data;
        if (jsonPayload) {
          memoData[key] = JSON.parse(
            Buffer.from(jsonPayload).toString('utf-8'),
          );
        }
      } catch (e) {
        logger.warn({ key, error: e }, 'Failed to parse memo field');
      }
    }
  }
  return memoData;
}

export function parseSearchAttributes(searchAttributes: SearchAttributes) {
  // Parse search attributes
  const searchAttributesData: Record<string, unknown> = {};
  if (searchAttributes) {
    for (const [key, value] of Object.entries(searchAttributes)) {
      try {
        const payloads = value?.payloads;
        if (payloads && payloads.length > 0) {
          const data = payloads[0]?.data;
          if (data) {
            searchAttributesData[key] = JSON.parse(
              Buffer.from(data).toString('utf-8'),
            );
          }
        }
      } catch (e) {
        logger.warn({ key, error: e }, 'Failed to parse search attribute');
      }
    }
  }
  return searchAttributesData;
}
