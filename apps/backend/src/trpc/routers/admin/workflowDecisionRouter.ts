import { adminWorkflowDecisionContract } from '@namefi-astra/common/contract/admin/admin-workflow-decision-contract';
import { Permission } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { logger } from '#lib/logger';
import { temporalClient } from '#temporal/client';
import { adminProcedureWithPermissions } from '../../base';
import { createContractTRPCRouter } from '../../contract';

/**
 * Generic operator path for resolving a Temporal decision gate
 * (`apps/backend/src/temporal/shared/workflow-helpers/decision-gate.ts`):
 * inspect what a running workflow is awaiting, then send the decision.
 *
 * Gated behind {@link Permission.HIGH_RISK} because it can signal ANY workflow
 * by id. Finer-grained, per-workflow-type authorization can be layered on top
 * with dedicated endpoints later.
 */
export const workflowDecisionRouter = createContractTRPCRouter<
  typeof adminWorkflowDecisionContract
>({
  getArmedGates: adminProcedureWithPermissions(Permission.HIGH_RISK)
    .input(adminWorkflowDecisionContract.getArmedGates.input)
    .output(adminWorkflowDecisionContract.getArmedGates.output)
    .query(async ({ input }) => {
      const { workflowId, armedQueryName } = input;
      try {
        await temporalClient.connection.ensureConnected();
        const handle = temporalClient.workflow.getHandle(workflowId);
        return await handle.query(armedQueryName);
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

  sendDecision: adminProcedureWithPermissions(Permission.HIGH_RISK)
    .input(adminWorkflowDecisionContract.sendDecision.input)
    .output(adminWorkflowDecisionContract.sendDecision.output)
    .mutation(async ({ ctx, input }) => {
      const { workflowId, signalName, action, interactionId, response } = input;

      try {
        await temporalClient.connection.ensureConnected();
        const handle = temporalClient.workflow.getHandle(workflowId);

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
