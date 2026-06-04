import { adminWorkflowSignalContract } from '@namefi-astra/common/contract/admin/admin-workflow-signal-contract';
import { Permission } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { ResourceType } from '#lib/auditor';
import { logger } from '#lib/logger';
import { temporalClient } from '#temporal/client';
import { auditedAdminProcedureWithPermissions } from '../../base';
import { createContractTRPCRouter } from '../../contract';

/**
 * Generic operator path for sending a signal to a running workflow by id + name
 * — separate from `workflowDecision.sendDecision`, which only targets an armed
 * decision gate. Its main use is firing the `runWithTestHarness` fail-signal at
 * an in-flight poll to force the decision gate to open during testing.
 *
 * Because it can signal arbitrary workflows, it requires
 * {@link Permission.WRITE_WORKFLOWS}, is audited, and is **blocked outside
 * local/development** (mirrors the skip-auth gate).
 */
export const workflowSignalRouter = createContractTRPCRouter<
  typeof adminWorkflowSignalContract
>({
  sendSignal: auditedAdminProcedureWithPermissions(
    Permission.WRITE_WORKFLOWS,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.WORKFLOW,
      resourceId: input.workflowId,
      action: 'send_workflow_signal',
      extraInput: input,
    }),
  )
    .input(adminWorkflowSignalContract.sendSignal.input)
    .output(adminWorkflowSignalContract.sendSignal.output)
    .mutation(async ({ ctx, input }) => {
      const { workflowId, signalName, payload } = input;

      // Testing-only tool — never expose arbitrary signalling in preview/prod.
      const environment = process.env.ENVIRONMENT;
      if (environment !== 'local' && environment !== 'development') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message:
            'Sending arbitrary workflow signals is only available in local/development.',
        });
      }

      try {
        await temporalClient.connection.ensureConnected();
        const handle = temporalClient.workflow.getHandle(workflowId);

        const description = await handle.describe();
        if (description.status.name !== 'RUNNING') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Workflow is ${description.status.name}, not running.`,
          });
        }

        // `signal(name)` with no second arg sends an empty-args signal; with a
        // payload it becomes the signal's single argument.
        if (payload === undefined) {
          await handle.signal(signalName);
        } else {
          await handle.signal(signalName, payload);
        }

        logger.info(
          { workflowId, signalName, actorId: ctx.user.id },
          'Sent admin signal %s to %s',
          signalName,
          workflowId,
        );

        return { success: true, workflowId };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error(
          { workflowId, signalName, error },
          'Failed to send admin signal to %s',
          workflowId,
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send the signal to the workflow.',
          cause: error,
        });
      }
    }),
});
