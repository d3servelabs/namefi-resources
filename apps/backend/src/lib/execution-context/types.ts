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
  trace?: {
    depth: number;
    parentContext?: string;
  };
}
