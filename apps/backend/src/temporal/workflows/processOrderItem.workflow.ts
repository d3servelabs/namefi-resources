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

export interface ProcessOrderItemWorkflowInput
  extends AcquireDomainWorkflowInput {
  orderId: string;
  itemId: string;
}

/**
 * Process a single order item by registering the domain
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
    // Register the domain
    await workflow.executeChild(acquireDomainWorkflow, {
      args: [
        {
          normalizedDomainName,
          chainId,
          recipientWalletAddress,
          operationType,
          userId,
          registrarKey,
          encryptedEppAuthorizationCode,
          encryptionKeyId,
          // TODO: (sid->sami) Change this if needed to parent domain expiration time
          durationInYears,
        },
      ],
      taskQueue: TEMPORAL_QUEUES.DOMAINS,
      workflowId: `acquire-domain-${input.orderId}-${input.itemId}`,
    });

    // update orderItem status in db
    const [updateStatusError, _res] = await resolve(
      updateOrderItemStatusOrThrow({
        orderItemId: input.itemId,
        status: orderStatusSchema.Values.SUCCEEDED,
      }),
    );

    if (updateStatusError) {
      workflow.log.error(
        `Failed to update orderItem ${input.itemId} status to ${orderStatusSchema.Values.SUCCEEDED}: ${
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
        status: orderStatusSchema.Values.FAILED,
      }),
    );

    if (updateStatusError) {
      workflow.log.error(
        `Failed to update orderItem ${input.itemId} status to ${orderStatusSchema.Values.FAILED}: ${
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
