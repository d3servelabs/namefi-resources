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
  gaEventTracking?: {
    trackGaEvents: boolean;
    reason?: string;
  };
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
  const trackGaEvents = workflow.patched('toggle-tracking')
    ? (input.gaEventTracking?.trackGaEvents ?? true)
    : true;
  const gaEventTrackingReason = workflow.patched('toggle-tracking')
    ? (input.gaEventTracking?.reason ?? 'DEFAULT')
    : null;
  const {
    updateOrderItemStatusOrThrow,
    recordOrderMintTransaction,
    criticalAlertNamefi,
    logGaEventDomainAcquisitionFinished,
    logGaEventDomainAcquisitionStarted,
  } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...shortRunningOpts,
    },
  });

  const logGaEventSkipped = (eventName: string) => {
    workflow.log.info('Skipping GA event because tracking is disabled', {
      orderId: input.orderId,
      orderItemId: input.itemId,
      eventName,
      gaEventTrackingReason,
    });
  };

  try {
    if (workflow.patched('lifecycle-timestamps')) {
      const [markProcessingError] = await resolve(
        updateOrderItemStatusOrThrow({
          orderItemId: input.itemId,
          status: orderStatusSchema.enum.PROCESSING,
        }),
      );

      if (markProcessingError) {
        workflow.log.error(
          `Failed to update orderItem ${input.itemId} status to ${orderStatusSchema.enum.PROCESSING}: ${
            markProcessingError instanceof Error
              ? markProcessingError.message
              : String(markProcessingError)
          }`,
        );
      }
    }

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
        parentClosePolicy: 'REQUEST_CANCEL',
      });
    } else {
      if (trackGaEvents) {
        try {
          await logGaEventDomainAcquisitionStarted({
            userId,
            orderId: input.orderId,
            orderItemId: input.itemId,
            normalizedDomainName,
            operationType,
            registrarKey,
            durationInYears,
            chainId,
          });
        } catch (error) {
          workflow.log.warn(
            `Failed to track domain_acquisition_started event for order item ${input.itemId}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      } else {
        logGaEventSkipped('domain_acquisition_started');
      }
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
        orderId: input.orderId,
        orderItemId: input.itemId,
        gaEventTracking: input.gaEventTracking,
      };
      // Register or import the domain
      const acquireResult = await workflow.executeChild(acquireDomainWorkflow, {
        args: [workflowInput],
        taskQueue: TEMPORAL_QUEUES.DOMAINS,
        workflowId: acquireDomainWorkflow.generateId(workflowInput),
        workflowIdReusePolicy: 'ALLOW_DUPLICATE',
        parentClosePolicy: 'REQUEST_CANCEL',
      });

      if (acquireResult?.mintTxHash) {
        const [mintMetadataError] = await resolve(
          recordOrderMintTransaction({
            orderId: input.orderId,
            orderItemId: input.itemId,
            txHash: acquireResult.mintTxHash,
          }),
        );

        if (mintMetadataError) {
          await criticalAlertNamefi({
            workflowInfo: workflow.workflowInfo(),
            message:
              'Failed to record mint transaction metadata for order item',
            operation: 'PROCESS_ORDER_ITEM',
            error: mintMetadataError.message,
          });
        }
      }

      if (trackGaEvents) {
        try {
          await logGaEventDomainAcquisitionFinished({
            userId,
            orderId: input.orderId,
            orderItemId: input.itemId,
            normalizedDomainName,
            operationType,
            registrarKey,
            durationInYears,
            chainId,
            status: 'SUCCESS',
          });
        } catch (error) {
          workflow.log.warn(
            `Failed to track domain_acquisition_finished event for order item ${input.itemId}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      } else {
        logGaEventSkipped('domain_acquisition_finished');
      }
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
    if (operationType !== 'RENEW') {
      if (trackGaEvents) {
        try {
          await logGaEventDomainAcquisitionFinished({
            userId,
            orderId: input.orderId,
            orderItemId: input.itemId,
            normalizedDomainName,
            operationType,
            registrarKey,
            durationInYears,
            chainId,
            status: 'FAILURE',
          });
        } catch (error) {
          workflow.log.warn(
            `Failed to track domain_acquisition event for order item ${input.itemId}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      } else {
        logGaEventSkipped('domain_acquisition_finished');
      }
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
