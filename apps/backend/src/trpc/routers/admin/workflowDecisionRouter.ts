import { adminWorkflowDecisionContract } from '@namefi-astra/common/contract/admin/admin-workflow-decision-contract';
import { Permission } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { ResourceType } from '#lib/auditor';
import { logger } from '#lib/logger';
import { temporalClient } from '#temporal/client';
import {
  adminProcedureWithPermissions,
  auditedAdminProcedureWithPermissions,
} from '../../base';
import { createContractTRPCRouter } from '../../contract';

/**
 * Generic operator path for resolving a Temporal decision gate
 * (`apps/backend/src/temporal/shared/workflow-helpers/decision-gate.ts`):
 * list/inspect what running workflows are awaiting, then send a decision.
 *
 * Reads require {@link Permission.READ_WORKFLOWS}; `sendDecision` requires
 * {@link Permission.WRITE_WORKFLOWS} and is audited (it can re-run/cancel
 * arbitrary workflows by id).
 */

/** Local mirror of `ArmedGatesSnapshot` for casting untyped query results. */
interface ArmedSnapshot {
  count: number;
  gates: Array<{
    interactionId: string;
    allowedActors: string[];
    allowedActions: string[];
    requiresResponseValidation: boolean;
  }>;
}

/** Memo key the decision-gate registry writes (signal names of its registries). */
const REGISTRY_NAMES_MEMO_KEY = '__decisionGateRegistryNames';

/** `decisionGate[:prefix]` → `decisionGateArmed[:prefix]`. */
function armedQueryNameForSignal(signalName: string): string {
  return signalName.replace(/^decisionGate/, 'decisionGateArmed');
}

export const workflowDecisionRouter = createContractTRPCRouter<
  typeof adminWorkflowDecisionContract
>({
  getArmedGates: adminProcedureWithPermissions(Permission.READ_WORKFLOWS)
    .input(adminWorkflowDecisionContract.getArmedGates.input)
    .output(adminWorkflowDecisionContract.getArmedGates.output)
    .query(async ({ input }) => {
      const { workflowId, armedQueryName } = input;
      try {
        await temporalClient.connection.ensureConnected();
        const handle = temporalClient.workflow.getHandle(workflowId);
        return (await handle.query(armedQueryName)) as ArmedSnapshot;
      } catch (error) {
        logger.error(
          { workflowId, armedQueryName, error },
          'Failed to query armed decision gates for %s',
          workflowId,
        );
        throw new TRPCError({
          code: 'NOT_FOUND',
          message:
            'Could not read decision gates — the workflow may have finished or has no decision gate.',
          cause: error,
        });
      }
    }),

  /**
   * Lists running workflows that currently have an armed decision gate.
   *
   * Narrows by the registry memo first (so only gate-bearing workflows are
   * queried live), then reads each one's armed-gates query. Bounded by
   * `maxScan`. For large namespaces, pass `workflowType` to narrow, or register
   * a custom Search Attribute on the gate registry for server-side filtering.
   */
  listActiveDecisionGates: adminProcedureWithPermissions(
    Permission.READ_WORKFLOWS,
  )
    .input(adminWorkflowDecisionContract.listActiveDecisionGates.input)
    .output(adminWorkflowDecisionContract.listActiveDecisionGates.output)
    .query(async ({ input }) => {
      const maxScan = input.maxScan ?? 500;
      // Escape single quotes (SQL-style doubling) before splicing the
      // admin-supplied value into the Temporal visibility list-filter literal.
      const escapedWorkflowType = input.workflowType?.replace(/'/g, "''");
      const query = escapedWorkflowType
        ? `ExecutionStatus = "Running" AND WorkflowType = '${escapedWorkflowType}'`
        : 'ExecutionStatus = "Running"';

      await temporalClient.connection.ensureConnected();

      const items: Array<{
        workflowId: string;
        runId: string;
        workflowType: string;
        startedAt?: string;
        gates: ArmedSnapshot;
      }> = [];
      let scanned = 0;
      let capped = false;

      for await (const wf of temporalClient.workflow.list({ query })) {
        if (scanned >= maxScan) {
          capped = true;
          break;
        }
        scanned++;

        const registryNames = wf.memo?.[REGISTRY_NAMES_MEMO_KEY];
        if (!Array.isArray(registryNames) || registryNames.length === 0) {
          continue;
        }

        const handle = temporalClient.workflow.getHandle(wf.workflowId);
        const gates: ArmedSnapshot['gates'] = [];
        for (const signalName of registryNames) {
          if (typeof signalName !== 'string') continue;
          try {
            const snapshot = (await handle.query(
              armedQueryNameForSignal(signalName),
            )) as ArmedSnapshot;
            if (snapshot?.gates?.length) gates.push(...snapshot.gates);
          } catch {
            // Gate handler gone / workflow advanced — skip.
          }
        }

        if (gates.length > 0) {
          items.push({
            workflowId: wf.workflowId,
            runId: wf.runId,
            workflowType: wf.type,
            startedAt: wf.startTime?.toISOString(),
            gates: { count: gates.length, gates },
          });
        }
      }

      return { items, scanned, capped };
    }),

  sendDecision: auditedAdminProcedureWithPermissions(
    Permission.WRITE_WORKFLOWS,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.WORKFLOW,
      resourceId: input.workflowId,
      action: 'send_workflow_decision',
      extraInput: input,
    }),
  )
    .input(adminWorkflowDecisionContract.sendDecision.input)
    .output(adminWorkflowDecisionContract.sendDecision.output)
    .mutation(async ({ ctx, input }) => {
      const { workflowId, signalName, action, interactionId, response } = input;

      try {
        await temporalClient.connection.ensureConnected();
        const handle = temporalClient.workflow.getHandle(workflowId);

        // Guard 1: the workflow must be running.
        const description = await handle.describe();
        if (description.status.name !== 'RUNNING') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Workflow is ${description.status.name}, not awaiting a decision.`,
          });
        }

        // Guard 2: a matching gate must be armed AND accept this action —
        // otherwise the dispatcher silently drops the signal and we'd return a
        // false success. (e.g. PROCEED/RETRY sent to a CANCEL/RESPOND-only gate.)
        let armed: ArmedSnapshot | undefined;
        try {
          armed = (await handle.query(
            armedQueryNameForSignal(signalName),
          )) as ArmedSnapshot;
        } catch {
          // No armed-gates query handler — not a decision-gate workflow.
        }
        const matches =
          interactionId === undefined
            ? (armed?.gates.some((g) => g.allowedActions.includes(action)) ??
              false)
            : Boolean(
                armed?.gates.some(
                  (g) =>
                    g.interactionId === interactionId &&
                    g.allowedActions.includes(action),
                ),
              );
        if (!matches) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
              'No matching armed decision gate accepts this action on this workflow (it may have already been resolved, or the action is not allowed).',
          });
        }

        // Matches DecisionSignalPayload in the decision-gate helper.
        await handle.signal(signalName, {
          actor: 'ADMIN',
          actorId: ctx.user.id,
          action,
          interactionId,
          response,
        });

        logger.info(
          {
            workflowId,
            signalName,
            action,
            interactionId,
            actorId: ctx.user.id,
          },
          'Sent decision-gate signal %s to %s',
          action,
          workflowId,
        );

        return { success: true, workflowId };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error(
          { workflowId, signalName, action, error },
          'Failed to send decision-gate signal to %s',
          workflowId,
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send the decision to the workflow.',
          cause: error,
        });
      }
    }),
});
