import { orderStatusSchema } from '@namefi-astra/db/types';
import * as workflow from '@temporalio/workflow';
import { ApplicationFailure } from '@temporalio/workflow';
import { resolve } from '../../utils/resolve';
import { TEMPORAL_ENUMS, TEMPORAL_QUEUES, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import {
  acquireDomainWorkflow,
  type AcquireDomainWorkflowInput,
} from './domain-ownership/acquire-domain.workflow';
import {
  extendDomainRegistrationWorkflow,
  type ExtendDomainRegistrationWorkflowInput,
} from './domain-ownership/extend-registration.workflow';

export interface ProcessOrderItemWorkflowInput
  extends Omit<AcquireDomainWorkflowInput, 'operationType'> {
  operationType: 'REGISTER' | 'IMPORT' | 'RENEW';
  orderId: string;
  itemId: string;
}

/**
 * Process a single order item by registering, importing, or renewing the domain
 */
export async function processOrderItemWorkflow(
  input: ProcessOrderItemWorkflowInput,
): Promise<void> {
  const {
    normalizedDomainName,
    recipientWalletAddress,
    chainId,
    durationInYears,
    operationType,
    userId,
    registrarKey,
    encryptedEppAuthorizationCode,
    encryptionKeyId,
  } = input;
  const { updateOrderItemStatusOrThrow } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...shortRunningOpts,
    },
  });

  try {
    if (operationType === 'RENEW') {
      const workflowInput: ExtendDomainRegistrationWorkflowInput = {
        ownerAddress: recipientWalletAddress,
        normalizedDomainName,
        durationInYears,
        userId,
      };
      // Extend/renew the domain registration
      await workflow.executeChild(extendDomainRegistrationWorkflow, {
        args: [workflowInput],
        taskQueue: TEMPORAL_QUEUES.DOMAINS,
        workflowId: extendDomainRegistrationWorkflow.generateId(workflowInput),
        workflowIdReusePolicy: 'ALLOW_DUPLICATE',
        workflowIdConflictPolicy: 'FAIL',
        parentClosePolicy: 'REQUEST_CANCEL',
      });
    } else {
      const workflowInput: AcquireDomainWorkflowInput = {
        normalizedDomainName,
        chainId,
        recipientWalletAddress,
        operationType,
        userId,
        registrarKey,
        encryptedEppAuthorizationCode,
        encryptionKeyId,
        durationInYears,
      };
      // Register or import the domain
      await workflow.executeChild(acquireDomainWorkflow, {
        args: [workflowInput],
        taskQueue: TEMPORAL_QUEUES.DOMAINS,
        workflowId: acquireDomainWorkflow.generateId(workflowInput),
        workflowIdReusePolicy: 'ALLOW_DUPLICATE',
        workflowIdConflictPolicy: 'FAIL',
        parentClosePolicy: 'REQUEST_CANCEL',
      });
    }

    // update orderItem status in db
    const [updateStatusError, _res] = await resolve(
      updateOrderItemStatusOrThrow({
        orderItemId: input.itemId,
        status: orderStatusSchema.enum.SUCCEEDED,
      }),
    );

    if (updateStatusError) {
      workflow.log.error(
        `Failed to update orderItem ${input.itemId} status to ${orderStatusSchema.enum.SUCCEEDED}: ${
          updateStatusError instanceof Error
            ? updateStatusError.message
            : String(updateStatusError)
        }`,
      );
    }
  } catch (e) {
    workflow.log.error(
      `Failed to process order item ${input.itemId} for order ${input.orderId}: ${
        e instanceof Error ? e.message : String(e)
      }`,
    );

    // update orderItem status in db
    const [updateStatusError, _res] = await resolve(
      updateOrderItemStatusOrThrow({
        orderItemId: input.itemId,
        status: orderStatusSchema.enum.FAILED,
      }),
    );

    if (updateStatusError) {
      workflow.log.error(
        `Failed to update orderItem ${input.itemId} status to ${orderStatusSchema.enum.FAILED}: ${
          updateStatusError instanceof Error
            ? updateStatusError.message
            : String(updateStatusError)
        }`,
      );
    }

    throw ApplicationFailure.create({
      nonRetryable: true,
      message: `Process Order Item Failed: ${
        e instanceof Error ? e.message : String(e)
      }`,
      cause: e instanceof Error ? e : new Error(String(e)),
    });
  }
}
