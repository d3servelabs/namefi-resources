import type {
  WorkflowExecutionDescription,
  WorkflowHandle,
} from '@temporalio/client';

// Context system for tracking execution origin
export interface ExecutionContext {
  type: 'temporal-activity' | 'user' | 'system' | 'unknown';
  temporal?: {
    workflowId?: string;
    runId?: string;
    taskQueue?: string;
    activityName?: string;
    $metadata?: {
      workflowHandle?: WorkflowHandle;
      workflowDescription?: WorkflowExecutionDescription;
    };
  };
  user?: {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    privyUserId?: string;
  };
  /**
   * The HTTP route/procedure that produced this context. Populated for
   * Hono routes and tRPC procedures so alerts can surface where a failure
   * originated.
   */
  route?: {
    source?: 'hono' | 'trpc';
    method?: string;
    path?: string;
    url?: string;
    requestId?: string;
    procedureType?: string;
    statusCode?: number;
  };
  trace?: {
    depth: number;
    parentContext?: string;
  };
}
