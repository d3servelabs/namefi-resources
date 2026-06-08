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
import {
  resolveWorkflowCheckoutTracking,
  type WorkflowCheckoutTrackingInput,
} from '../shared/workflow-helpers/checkout-tracking';
import { createDecisionGateRegistry } from '../shared/workflow-helpers/decision-gate';
import { runWithKnownGate } from '../shared/workflow-helpers/known-gates';
import { processOrderItemGateResponseSchema } from '@namefi-astra/common/contract/admin/decision-gate-response-schemas';

/**
 * How long an order item's decision gate waits for an admin decision before
 * timing out and failing the item. Kept short because the user is already
 * charged and the held item blocks the parent order's settlement/refund.
 */
const PROCESS_ORDER_ITEM_DECISION_TIMEOUT_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

export interface ProcessOrderItemWorkflowInput
  extends Omit<AcquireDomainWorkflowInput, 'operationType'> {
  operationType: 'REGISTER' | 'IMPORT' | 'RENEW';
  orderId: string;
  itemId: string;
  gaEventTracking?: WorkflowCheckoutTrackingInput;
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
  const gaTracking = resolveWorkflowCheckoutTracking(input.gaEventTracking);
  const {
    trackGaEvents,
    reason: gaEventTrackingReason,
    identity: gaEventIdentity,
  } = gaTracking;

  const {
    updateOrderItemStatusOrThrow,
    recordOrderMintTransaction,
    criticalAlertNamefi,
    logGaEventDomainAcquisitionFinished,
    logGaEventDomainAcquisitionStarted,
    logGaEventOrderItemProcessingStarted,
    logGaEventOrderItemProcessingFinished,
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

    if (workflow.patched('track-new-events-for-order-v1')) {
      if (trackGaEvents) {
        try {
          await logGaEventOrderItemProcessingStarted({
            userId,
            orderId: input.orderId,
            orderItemId: input.itemId,
            itemType: operationType,
            domainName: normalizedDomainName,
            ...gaEventIdentity,
          });
        } catch (error) {
          workflow.log.warn(
            `Failed to track order_item_processing_started event for order item ${input.itemId}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      } else {
        logGaEventSkipped('order_item_processing_started');
      }
    }

    // Each item type runs under a decision gate (new runs only): on failure,
    // alert the team and wait for an admin to CANCEL (fail the item → refund) or
    // RESPOND (the admin completed it out-of-band; the item resolves as done).
    // RETRY/PROCEED are intentionally NOT offered: re-running acquire/renew is
    // not idempotent — the child uses `workflowIdReusePolicy: ALLOW_DUPLICATE`,
    // so a retry could launch a second registrar run. Resolved via
    // admin.workflowDecision.sendDecision targeting this workflow's id (default
    // `decisionGate` signal — this is the only registry in the execution; the
    // acquire/renew children run as separate executions). In-flight (pre-patch)
    // runs take the original direct path so their replay is unaffected.
    const decisionRegistry = workflow.patched(
      'process-order-item-decision-gate',
    )
      ? createDecisionGateRegistry()
      : undefined;

    const runItemOperation = <T>(
      action: () => Promise<T>,
      // Validates/parses a RESPOND payload into the action's result type.
      // The wire schema lives in the admin contract so the frontend uses the
      // same shape (decision-gate-response-schemas.ts).
      validateResponse?: (raw: unknown) => T,
    ): Promise<T> =>
      decisionRegistry
        ? runWithKnownGate({
            registry: decisionRegistry,
            gateKind: 'process-order-item',
            interactionId: 'process-order-item',
            action,
            validateResponse,
            // Lets the admin side gather domain evidence (registered / minted /
            // in our registrar accounts?) for this order item when the gate opens.
            evidenceParams: {
              normalizedDomainName,
              registrarKey,
            },
            alertMessage: `Order item processing failed for ${normalizedDomainName} (${operationType})`,
            alertSeverity: 'general',
            alertDetails: {
              orderId: input.orderId,
              orderItemId: input.itemId,
              operationType,
              normalizedDomainName,
            },
            allowedActors: ['ADMIN'],
            allowedActions: ['CANCEL', 'RESPOND'],
            timeoutMs: PROCESS_ORDER_ITEM_DECISION_TIMEOUT_MS,
            onTimeout: { kind: 'throw' },
          })
        : action();

    if (operationType === 'RENEW') {
      const workflowInput: ExtendDomainRegistrationWorkflowInput = {
        ownerAddress: recipientWalletAddress,
        normalizedDomainName,
        durationInYears,
        userId,
      };
      // Extend/renew the domain registration
      await runItemOperation(() =>
        workflow.executeChild(extendDomainRegistrationWorkflow, {
          args: [workflowInput],
          taskQueue: TEMPORAL_QUEUES.DOMAINS,
          workflowId:
            extendDomainRegistrationWorkflow.generateId(workflowInput),
          workflowIdReusePolicy: 'ALLOW_DUPLICATE',
          parentClosePolicy: 'REQUEST_CANCEL',
        }),
      );
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
            ...gaEventIdentity,
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
        domainSetupOptions: input.domainSetupOptions,
      };
      // Register or import the domain. The RESPOND payload mirrors the acquire
      // output ({ mintTxHash? }) so an admin can complete it out-of-band.
      const acquireResult = await runItemOperation(
        () =>
          workflow.executeChild(acquireDomainWorkflow, {
            args: [workflowInput],
            taskQueue: TEMPORAL_QUEUES.DOMAINS,
            workflowId: acquireDomainWorkflow.generateId(workflowInput),
            workflowIdReusePolicy: 'ALLOW_DUPLICATE',
            parentClosePolicy: 'REQUEST_CANCEL',
          }),
        (raw) => processOrderItemGateResponseSchema.parse(raw),
      );

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
            ...gaEventIdentity,
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

    if (workflow.patched('track-new-events-for-order-v1')) {
      if (trackGaEvents) {
        try {
          await logGaEventOrderItemProcessingFinished({
            userId,
            orderId: input.orderId,
            orderItemId: input.itemId,
            itemType: operationType,
            domainName: normalizedDomainName,
            itemStatus: 'SUCCEEDED',
            ...gaEventIdentity,
          });
        } catch (error) {
          workflow.log.warn(
            `Failed to track order_item_processing_finished event for order item ${input.itemId}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      } else {
        logGaEventSkipped('order_item_processing_finished');
      }
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
    if (workflow.patched('track-new-events-for-order-v1')) {
      if (trackGaEvents) {
        try {
          await logGaEventOrderItemProcessingFinished({
            userId,
            orderId: input.orderId,
            orderItemId: input.itemId,
            itemType: operationType,
            domainName: normalizedDomainName,
            itemStatus: 'FAILED',
            ...gaEventIdentity,
          });
        } catch (error) {
          workflow.log.warn(
            `Failed to track order_item_processing_finished event for order item ${input.itemId}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      } else {
        logGaEventSkipped('order_item_processing_finished');
      }
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
            ...gaEventIdentity,
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
