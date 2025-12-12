# Workflow Progress Timeline

A guide for implementing end-to-end progress tracking for Temporal workflows with a frontend timeline UI.

## Overview

This system provides:
- **Backend**: Lightweight progress state management for Temporal workflows
- **Frontend**: Reusable `ProgressTimeline` component with polling hooks

**Design principle**: Workflows store minimal state (step IDs and statuses only). Display labels are mapped on the frontend to reduce workflow state overhead.

## Backend Setup

### 1. Define Step IDs and Progress Query

In your workflow file (e.g., `apps/backend/src/temporal/workflows/my-feature.workflow.ts`):

```typescript
import { defineQuery } from '@temporalio/workflow';
import * as workflow from '@temporalio/workflow';
import {
  createWorkflowProgress,
  type WorkflowProgressState,
} from '../shared/workflow-helpers/workflow-progress';

// 1. Define step IDs as a union type
export type MyFeatureStepId = 'validate' | 'process' | 'finalize';

// 2. Define a query to expose progress state
export const getMyFeatureProgressQuery = defineQuery<
  WorkflowProgressState<MyFeatureStepId>
>('getMyFeatureProgress');

// 3. Define workflow input
export interface MyFeatureWorkflowInput {
  id: string;
  // ... other fields
}

// 4. Implement the workflow
export async function myFeatureWorkflow(
  input: MyFeatureWorkflowInput,
): Promise<void> {
  // Initialize progress tracking with step IDs and workflow type
  const progress = createWorkflowProgress<MyFeatureStepId>(
    ['validate', 'process', 'finalize'],
    { workflowType: 'myFeature' },
  );

  // Expose state via query handler
  workflow.setHandler(getMyFeatureProgressQuery, () => progress.state);

  try {
    // Track each step
    progress.startStep('validate');
    await validateInput(input);
    progress.completeStep('validate');

    progress.startStep('process');
    await processData(input);
    progress.completeStep('process');

    progress.startStep('finalize');
    await finalizeResult(input);
    progress.completeStep('finalize');

    // Mark workflow as complete
    progress.complete();
  } catch (e) {
    // Mark workflow as failed with error message
    progress.fail(e instanceof Error ? e.message : String(e));
    throw e;
  }
}

// 5. Add generateId for consistent workflow IDs (source of truth)
myFeatureWorkflow.generateId = (input: MyFeatureWorkflowInput): string => {
  return `my-feature-[${input.id}]`;
};

// 6. Expose the progress query for external access
myFeatureWorkflow.progressQuery = getMyFeatureProgressQuery;
```

### 2. Add tRPC Endpoint

In your router file (e.g., `apps/backend/src/trpc/routers/myFeatureRouter.ts`):

```typescript
import { z } from 'zod';
import { temporalClient } from '../../temporal/client';
import {
  myFeatureWorkflow,
  getMyFeatureProgressQuery,
  type MyFeatureStepId,
} from '../../temporal/workflows/my-feature.workflow';
import type { WorkflowProgressState } from '../../temporal/shared/workflow-helpers/workflow-progress';
import type { WorkflowExecutionStatusName } from '@temporalio/client';

type MyFeatureProgressSnapshot = {
  workflowStatus: WorkflowExecutionStatusName | 'NOT_FOUND';
  runId: string | null;
  state: WorkflowProgressState<MyFeatureStepId> | null;
};

type MyFeatureProgressPayload = MyFeatureProgressSnapshot & {
  id: string;
  fetchedAt: string;
};

const fetchMyFeatureWorkflowSnapshot = async (
  id: string,
): Promise<MyFeatureProgressSnapshot> => {
  const workflowId = myFeatureWorkflow.generateId({ id });
  const handle = temporalClient.workflow.getHandle(workflowId);

  try {
    const description = await handle.describe();
    const workflowStatus = description.status.name;

    let state: WorkflowProgressState<MyFeatureStepId> | null = null;
    if (workflowStatus === 'RUNNING' || workflowStatus === 'COMPLETED') {
      try {
        state = await handle.query(getMyFeatureProgressQuery);
      } catch {
        state = null;
      }
    }

    return { workflowStatus, runId: description.runId, state };
  } catch {
    return { workflowStatus: 'NOT_FOUND', runId: null, state: null };
  }
};

export const myFeatureRouter = createTRPCRouter({
  getMyFeatureProgress: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }): Promise<MyFeatureProgressPayload> => {
      const snapshot = await fetchMyFeatureWorkflowSnapshot(input.id);
      return {
        ...snapshot,
        id: input.id,
        fetchedAt: new Date().toISOString(),
      };
    }),
});
```

### 3. Start Workflow with Generated ID

When starting the workflow, always use the `generateId` function:

```typescript
import { myFeatureWorkflow } from '../temporal/workflows/my-feature.workflow';
import { temporalClient } from '../temporal/client';
import { TEMPORAL_QUEUES } from '../temporal/shared';

export async function startMyFeatureWorkflow(input: MyFeatureWorkflowInput) {
  await temporalClient.workflow.start(myFeatureWorkflow, {
    taskQueue: TEMPORAL_QUEUES.DEFAULT,
    workflowId: myFeatureWorkflow.generateId(input),
    args: [input],
  });
}
```

## Frontend Setup

### 1. Create Progress Hook

In `apps/frontend/src/hooks/use-my-feature-progress.ts`:

```typescript
'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTRPC, type AppRouterOutput } from '@/lib/trpc';
import type { StepDisplayInfo } from '@/components/ui/progress-timeline';
import {
  getProgressPhase,
  isTerminalStatus,
  type UseWorkflowProgressOptions,
} from './use-workflow-progress';

type MyFeatureProgressResponse =
  AppRouterOutput['myFeature']['getMyFeatureProgress'];

type MyFeatureStepId = NonNullable<
  MyFeatureProgressResponse['state']
>['steps'][number]['id'];

// Map step IDs to display labels
export const myFeatureStepDisplayInfo: Record<MyFeatureStepId, StepDisplayInfo> = {
  validate: {
    label: 'Validating input',
    helper: 'Checking your data is correct.',
  },
  process: {
    label: 'Processing data',
    helper: 'Running the main operation.',
  },
  finalize: {
    label: 'Finalizing',
    helper: 'Completing the operation.',
  },
};

export function useMyFeatureProgress(
  id: string | undefined,
  options: UseWorkflowProgressOptions = {},
) {
  const { enabled = true, pollIntervalMs = 1500 } = options;
  const trpc = useTRPC();
  const isEnabled = Boolean(id) && enabled;

  const query = useQuery({
    ...trpc.myFeature.getMyFeatureProgress.queryOptions(
      { id: id ?? '' },
      { trpc: { context: { skipBatch: true } } },
    ),
    enabled: isEnabled,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: (queryInstance) => {
      if (!isEnabled) return false;
      const data = queryInstance.state.data as MyFeatureProgressResponse | undefined;
      if (!data) return pollIntervalMs;
      return isTerminalStatus(data.workflowStatus) ? false : pollIntervalMs;
    },
    refetchIntervalInBackground: true,
  });

  const progress = query.data ?? null;
  const latestState = progress?.state ?? null;
  const steps = useMemo(() => latestState?.steps ?? [], [latestState?.steps]);

  const activeStep = useMemo(() => {
    return (
      steps.find((step) => step.status === 'IN_PROGRESS') ??
      steps.find((step) => step.status === 'PENDING') ??
      null
    );
  }, [steps]);

  const hasCompleted = useMemo(() => {
    if (!progress) return false;
    return isTerminalStatus(progress.workflowStatus);
  }, [progress]);

  const isPolling =
    query.fetchStatus === 'fetching' &&
    query.data !== undefined &&
    !query.isLoading;

  const phase = useMemo(() => getProgressPhase(progress), [progress]);

  return {
    data: progress,
    state: latestState,
    steps,
    activeStep,
    isLoading: query.isLoading,
    isPolling,
    isError: query.isError,
    error: query.error,
    hasCompleted,
    workflowStatus: progress?.workflowStatus ?? null,
    phase,
    refreshedAt: progress?.fetchedAt ?? null,
    refetch: query.refetch,
  } as const;
}
```

### 2. Use ProgressTimeline Component

```tsx
import { ProgressTimeline } from '@/components/ui/progress-timeline';
import {
  useMyFeatureProgress,
  myFeatureStepDisplayInfo,
} from '@/hooks/use-my-feature-progress';

function MyFeatureProgressView({ id }: { id: string }) {
  const { steps, isLoading } = useMyFeatureProgress(id);

  return (
    <ProgressTimeline
      loading={isLoading}
      steps={steps}
      stepDisplayInfo={myFeatureStepDisplayInfo}
      title="Processing Your Request"
      subtitle={`Operation ID: ${id}`}
    />
  );
}
```

### 3. Use in a Dialog/Modal

```tsx
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { ProgressTimeline } from '@/components/ui/progress-timeline';
import {
  useMyFeatureProgress,
  myFeatureStepDisplayInfo,
} from '@/hooks/use-my-feature-progress';

function MyFeatureProgressModal({ id }: { id: string }) {
  const [open, setOpen] = useState(false);

  // Only poll when dialog is open
  const { steps, isLoading } = useMyFeatureProgress(id, {
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Progress Details</DialogTitle>
        </DialogHeader>
        <ProgressTimeline
          loading={isLoading}
          steps={steps}
          stepDisplayInfo={myFeatureStepDisplayInfo}
        />
      </DialogContent>
    </Dialog>
  );
}
```

## Progress Manager API

The `createWorkflowProgress` function returns a manager with these methods:

| Method | Description |
|--------|-------------|
| `startStep(id, message?)` | Mark step as `IN_PROGRESS` |
| `completeStep(id, message?)` | Mark step as `COMPLETED` |
| `failStep(id, message?)` | Mark step as `FAILED` |
| `skipStep(id, message?)` | Mark step as `SKIPPED` |
| `updateMessage(id, message)` | Update step message without changing status |
| `setStepNestedWorkflow(id, info)` | Associate a nested workflow with a step |
| `complete()` | Mark entire workflow as completed |
| `fail(error)` | Mark entire workflow as failed |
| `state` | Current progress state (use in query handler) |

## Step Statuses

| Status | Description |
|--------|-------------|
| `PENDING` | Step has not started |
| `IN_PROGRESS` | Step is currently executing |
| `COMPLETED` | Step finished successfully |
| `FAILED` | Step failed |
| `SKIPPED` | Step was skipped |

## Workflow Phases

| Phase | Description |
|-------|-------------|
| `RUNNING` | Workflow is still executing |
| `COMPLETED` | Workflow finished successfully |
| `FAILED` | Workflow failed |

## Frontend Phase States

| Phase | Description |
|-------|-------------|
| `loading` | Initial load, no data yet |
| `processing` | Workflow is running |
| `terminal` | Workflow has finished (completed, failed, etc.) |

## Nested Workflows

Steps can contain nested workflows (embedded or child workflows). Use `setStepNestedWorkflow` to associate a nested workflow with a step, allowing the frontend to query and display substeps.

### Types of Nested Workflows

1. **Embedded workflows**: Direct function calls that share the same workflowId/runId as the parent
2. **Child workflows**: Started via `workflow.executeChild()` with their own workflowId

### Example: Embedded Workflow

```typescript
import { disableDnssecWorkflow, getDisableDnssecProgressQuery } from './disable-dnssec.workflow';

export async function changeNameserversWorkflow(input: ChangeNameserversWorkflowInput) {
  const progress = createWorkflowProgress<ChangeNameserversStepId>(
    ['disable-dnssec', 'set-nameservers', 'verify-change'],
    { workflowType: 'changeNameservers' },
  );

  const workflowInfo = workflow.workflowInfo();
  workflow.setHandler(getChangeNameserversProgressQuery, () => progress.state);

  // Step 1: Disable DNSSEC (embedded workflow)
  progress.startStep('disable-dnssec');
  // For embedded workflows, use the same workflowId/runId as parent
  progress.setStepNestedWorkflow('disable-dnssec', {
    workflowId: workflowInfo.workflowId,
    runId: workflowInfo.firstExecutionRunId,
    progressQueryName: getDisableDnssecProgressQuery.name,
  });

  await disableDnssecWorkflow({ domainName: input.domainName });
  progress.completeStep('disable-dnssec');

  // ... rest of workflow
}
```

### Example: Child Workflow

```typescript
import { enableDnssecWorkflow, getEnableDnssecProgressQuery } from './enable-dnssec.workflow';

export async function resetNameserversWorkflow(input: ResetNameserversWorkflowInput) {
  const progress = createWorkflowProgress<ResetNameserversStepId>(
    ['change-nameservers', 'enable-dnssec'],
    { workflowType: 'resetNameservers' },
  );

  // ... change nameservers step ...

  // Step 2: Enable DNSSEC (child workflow)
  progress.startStep('enable-dnssec');
  const childWorkflowId = `enable-dnssec-${input.domainName}`;
  // For child workflows, use the child's workflowId
  progress.setStepNestedWorkflow('enable-dnssec', {
    workflowId: childWorkflowId,
    runId: '', // Resolved by the client using workflowId
    progressQueryName: getEnableDnssecProgressQuery.name,
  });

  await workflow.executeChild(enableDnssecWorkflow, {
    taskQueue: TEMPORAL_QUEUES.DOMAINS,
    workflowId: childWorkflowId,
    args: [{ domainName: input.domainName }],
  });
  progress.completeStep('enable-dnssec');
}
```

### Querying Substeps in tRPC

The tRPC endpoint should query nested workflows and populate substeps:

```typescript
async function populateSubsteps(state: WorkflowProgressState<string>) {
  const stepsWithSubsteps = await Promise.all(
    state.steps.map(async (step) => {
      // Skip substep queries for PENDING or SKIPPED steps
      if (step.status === 'PENDING' || step.status === 'SKIPPED' || !step.nestedWorkflow) {
        return step;
      }

      const { workflowId, runId, progressQueryName } = step.nestedWorkflow;
      const handle = temporalClient.workflow.getHandle(workflowId, runId || undefined);
      const queryDef = progressQueryMap[progressQueryName];

      try {
        const nestedState = await handle.query(queryDef);
        return { ...step, substeps: nestedState?.steps ?? [] };
      } catch {
        return step;
      }
    }),
  );

  return { ...state, steps: stepsWithSubsteps };
}
```

## Memo Persistence

Progress state is automatically persisted to the workflow's memo on every update. This allows querying progress even after the workflow completes.

### How It Works

1. Progress state is stored in memo under the key `progress-<workflowType>` (e.g., `progress-enableDnssec`)
2. This unique key prevents conflicts when embedded workflows share the same memo
3. Every call to `startStep`, `completeStep`, etc. updates the memo
4. After workflow completion, query memo via `handle.describe()` instead of `handle.query()`

### Querying Completed Workflows

```typescript
import { getProgressMemoKey } from '../shared/workflow-helpers/workflow-progress';

async function getProgressSnapshot(workflowId: string, workflowType: string) {
  const handle = temporalClient.workflow.getHandle(workflowId);
  const description = await handle.describe();

  if (description.status.name === 'RUNNING') {
    // Query live state for running workflows
    return await handle.query(getMyFeatureProgressQuery);
  }

  // For completed workflows, read from memo using workflowType-specific key
  const memo = description.memo;
  const memoKey = getProgressMemoKey(workflowType); // e.g., 'progress-myFeature'
  if (memo && memoKey in memo) {
    return memo[memoKey] as WorkflowProgressState<MyFeatureStepId>;
  }

  return null;
}
```

## Workflow Static Properties

Each workflow should expose two static properties for consistent access patterns:

| Property | Description |
|----------|-------------|
| `generateId(input)` | Generate a deterministic workflow ID |
| `progressQuery` | The progress query definition |

### Example

```typescript
export async function myFeatureWorkflow(input: MyFeatureWorkflowInput) {
  // ... workflow implementation
}

myFeatureWorkflow.generateId = (input: MyFeatureWorkflowInput): string => {
  return `my-feature-[${input.id}]`;
};

myFeatureWorkflow.progressQuery = getMyFeatureProgressQuery;
```

### Usage

```typescript
// Starting a workflow
const workflowId = myFeatureWorkflow.generateId(input);
await temporalClient.workflow.start(myFeatureWorkflow, {
  workflowId,
  args: [input],
});

// Querying progress
const handle = temporalClient.workflow.getHandle(workflowId);
const state = await handle.query(myFeatureWorkflow.progressQuery);
```

## Best Practices

1. **Use `generateId` and `progressQuery` everywhere**: Define both static properties on workflow functions for consistent access patterns.

2. **Always provide `workflowType`**: Use a unique camelCase identifier (e.g., `enableDnssec`, `changeNameservers`) to prevent memo key conflicts in embedded workflows.

3. **Keep step IDs simple**: Use kebab-case IDs like `check-support`, `process-data`. Put human-readable labels in the frontend `stepDisplayInfo`.

4. **Handle errors gracefully**: Always wrap workflow logic in try/catch and call `progress.fail()` before re-throwing.

5. **Conditional polling**: Pass `enabled: false` to the hook when the progress view is not visible to save resources.

6. **Type safety**: Export step ID types from workflows and use them in frontend hooks for compile-time checking.

7. **Skip substeps for non-active parents**: When querying nested workflows, skip substep queries for steps with `PENDING` or `SKIPPED` status to avoid unnecessary API calls.

8. **Use memo for completed workflows**: Query progress from memo after workflow completion instead of relying on the query handler.

## Example Implementations

### DNSSEC Workflows

Simple workflows without nested steps:

- Backend: `apps/backend/src/temporal/workflows/enable-dnssec.workflow.ts`
- Backend: `apps/backend/src/temporal/workflows/disable-dnssec.workflow.ts`
- Frontend: `apps/frontend/src/hooks/use-dnssec-progress.ts`
- Frontend: `apps/frontend/src/components/domain-and-dns-managment/panels/dnssec/dnssec-panel.tsx`

### Nameservers Workflows (with Nested Workflows)

Workflows that use nested/embedded workflows:

- Backend: `apps/backend/src/temporal/workflows/change-nameservers.workflow.ts` (embedded `disableDnssecWorkflow`)
- Backend: `apps/backend/src/temporal/workflows/reset-nameservers.workflow.ts` (embedded + child workflows)
- Backend: `apps/backend/src/trpc/routers/dnsRecordsRouter.ts` (substep querying)
- Frontend: `apps/frontend/src/hooks/use-change-nameservers-progress.ts`
- Frontend: `apps/frontend/src/components/domain-and-dns-managment/panels/nameservers/nameservers-panel.tsx`
