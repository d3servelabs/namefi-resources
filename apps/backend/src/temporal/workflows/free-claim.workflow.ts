import { orderStatusSchema } from '@namefi-astra/db/types';
import type {
  ChecksumWalletAddress,
  NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import { ApplicationFailure, defineQuery } from '@temporalio/workflow';
import * as workflow from '@temporalio/workflow';
import { resolve } from '../../utils/resolve';
import { TEMPORAL_ENUMS, TEMPORAL_QUEUES, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import {
  acquireDomainWorkflow,
  type AcquireDomainWorkflowInput,
} from './domain-ownership/acquire-domain.workflow';

// Regex for parsing workflow ID
const WORKFLOW_ID_REGEX = /free-claim-\[?(?<domainName>.+)\]?/;

// Define queries
export const getCurrentStepQuery = defineQuery<string>('getCurrentStep');
export const getClaimIdQuery = defineQuery<string | undefined>('getClaimId');
export const getClaimValidationQuery = defineQuery<string | undefined>(
  'getClaimValidation',
);
export const getOrderIdQuery = defineQuery<string | undefined>('getOrderId');
export const getOrderItemIdQuery = defineQuery<string | undefined>(
  'getOrderItemId',
);
export const getErrorQuery = defineQuery<string | undefined>('getError');
export const getWorkflowStateQuery = defineQuery<{
  currentStep: string;
  claimId?: string;
  claimValidation?: string;
  orderId?: string;
  orderItemId?: string;
  error?: string;
  input: ProcessFreeClaimWorkflowInput;
}>('getWorkflowState');

export interface ProcessFreeClaimWorkflowInput {
  userId: string;
  normalizedDomainName: NamefiNormalizedDomain;
  recipientWalletAddress: ChecksumWalletAddress;
  chainId: number;
  durationInYears: number;
  registrarKey: string;
}

/**
 * Process a free claim atomically
 * This workflow ensures that claim eligibility is checked and the claim is used
 * in an atomic transaction to prevent replay attacks and concurrency issues
 */
export async function processFreeClaimWorkflow(
  input: ProcessFreeClaimWorkflowInput,
): Promise<{ success: boolean; orderId?: string; orderItemId?: string }> {
  const {
    userId,
    normalizedDomainName,
    recipientWalletAddress,
    chainId,
    durationInYears,
    registrarKey,
  } = input;

  // Set workflow memo with contextual information
  workflow.upsertMemo({
    freeClaim: {
      domainName: normalizedDomainName,
      userId,
      chainId,
      durationInYears,
      registrarKey,
      recipientWallet: recipientWalletAddress,
      workflowType: 'FREE_CLAIM_PROCESSING',
      description: `Processing free claim for ${normalizedDomainName}`,
    },
  });

  // Set search attributes for easy querying
  workflow.upsertSearchAttributes({
    userId: [userId],
    domainName: [normalizedDomainName],
  });

  const {
    updateOrderAndItemStatusOrThrow,
    validateAndUseClaim,
    createClaimOrder,
    revertClaim,
    updateClaimRecord,
    markClaimAsCompleted,
  } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...shortRunningOpts,
    },
  });

  const { triggerUpdateDomainIndex } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.INDEXERS,
    options: {
      ...shortRunningOpts,
    },
  });

  workflow.log.info('Processing free claim', {
    userId,
    normalizedDomainName,
  });

  let claimId: string | undefined;
  let claimValidation: string | undefined;
  let orderId: string | undefined;
  let orderItemId: string | undefined;
  let currentStep = 'initializing';
  let error: string | undefined;

  // Set up query handlers to expose workflow state
  workflow.setHandler(getCurrentStepQuery, () => currentStep);
  workflow.setHandler(getClaimIdQuery, () => claimId);
  workflow.setHandler(getClaimValidationQuery, () => claimValidation);
  workflow.setHandler(getOrderIdQuery, () => orderId);
  workflow.setHandler(getOrderItemIdQuery, () => orderItemId);
  workflow.setHandler(getErrorQuery, () => error);
  workflow.setHandler(getWorkflowStateQuery, () => ({
    currentStep,
    claimId,
    orderId,
    orderItemId,
    error,
    input: {
      userId,
      normalizedDomainName,
      recipientWalletAddress,
      chainId,
      durationInYears,
      registrarKey,
    },
  }));

  try {
    // Step 1: Atomically validate and mark the claim as used
    currentStep = 'validating_claim';
    const claimValidationResult = await validateAndUseClaim({
      userId,
      normalizedDomainName,
    });

    if (!claimValidationResult.success) {
      currentStep = 'claim_validation_failed';
      claimValidation = 'failed';
      error = claimValidationResult.reason || 'Claim validation failed';
      return {
        success: false,
      };
    }

    claimId = claimValidationResult.claimId;
    claimValidation = 'success';
    currentStep = 'claim_validated';
    workflow.upsertMemo({
      freeClaim: {
        ...(workflow.workflowInfo().memo?.freeClaim || {}),
        claimId,
        claimValidation,
      },
    });

    // Step 2: Create order and order item for the claim (with $0 amount)
    currentStep = 'creating_order';
    const orderResult = await createClaimOrder({
      userId,
      normalizedDomainName,
      durationInYears,
      registrarKey,
      recipientWalletAddress,
      chainId,
      claimId,
    });

    orderId = orderResult.orderId;
    orderItemId = orderResult.orderItemId;
    currentStep = 'order_created';

    // Update the claim record with the order item ID
    currentStep = 'updating_claim_record';
    await updateClaimRecord({
      claimId,
      orderItemId,
    });

    // Step 3: Process the domain acquisition
    currentStep = 'acquiring_domain';
    const acquireDomainInput: AcquireDomainWorkflowInput = {
      normalizedDomainName,
      chainId,
      recipientWalletAddress,
      operationType: 'REGISTER',
      userId,
      registrarKey,
      durationInYears,
    };

    await workflow.executeChild(acquireDomainWorkflow, {
      args: [acquireDomainInput],
      taskQueue: TEMPORAL_QUEUES.DOMAINS,
      workflowId: acquireDomainWorkflow.generateId(acquireDomainInput),
      workflowIdReusePolicy: 'ALLOW_DUPLICATE',
      workflowIdConflictPolicy: 'FAIL',
      parentClosePolicy: 'REQUEST_CANCEL',
    });

    currentStep = 'domain_acquired';

    // Step 4: Update order and order item status to succeeded atomically
    currentStep = 'updating_order_status';
    if (orderItemId && orderId) {
      await updateOrderAndItemStatusOrThrow({
        orderId,
        orderItemId,
        status: orderStatusSchema.Values.SUCCEEDED,
      });
    }

    // Step 5: Mark claim as completed (CLAIMED status)
    currentStep = 'marking_claim_completed';
    await markClaimAsCompleted({
      claimId,
    });

    // Step 6: Trigger domain index update
    currentStep = 'updating_domain_index';
    try {
      await triggerUpdateDomainIndex();
    } catch (e) {
      workflow.log.error(
        `Failed to trigger update domain index for claim ${claimId}. Error: ${e}`,
      );
    }

    currentStep = 'completed';

    workflow.log.info('Free claim processed successfully', {
      userId,
      normalizedDomainName,
      orderId,
      orderItemId,
    });

    return {
      success: true,
      orderId,
      orderItemId,
    };
  } catch (e) {
    currentStep = 'failed';
    error = e instanceof Error ? e.message : String(e);

    workflow.log.error(
      `Failed to process free claim for user ${userId}, domain ${normalizedDomainName}: ${error}`,
    );

    // Revert the claim if it was marked as used
    if (claimId) {
      const [revertError] = await resolve(
        revertClaim({
          claimId,
        }),
      );

      if (revertError) {
        workflow.log.error(
          `Failed to revert free claim ${claimId}: ${
            revertError instanceof Error
              ? revertError.message
              : String(revertError)
          }`,
        );
      }
    }

    // Update order and order item status to failed atomically if they were created
    if (orderItemId && orderId) {
      const [updateStatusError] = await resolve(
        updateOrderAndItemStatusOrThrow({
          orderId,
          orderItemId,
          status: orderStatusSchema.Values.FAILED,
        }),
      );

      if (updateStatusError) {
        workflow.log.error(
          `Failed to update order ${orderId} and order item ${orderItemId} status to FAILED: ${
            updateStatusError instanceof Error
              ? updateStatusError.message
              : String(updateStatusError)
          }`,
        );
      }
    }

    throw ApplicationFailure.create({
      nonRetryable: true,
      message: `Process Free Claim Failed: ${
        e instanceof Error ? e.message : String(e)
      }`,
      cause: e instanceof Error ? e : new Error(String(e)),
    });
  }
}

processFreeClaimWorkflow.generateId = (
  input: ProcessFreeClaimWorkflowInput,
) => {
  return `free-claim-[${input.normalizedDomainName}]`;
};

processFreeClaimWorkflow.attemptParseId = (id: string) => {
  const parsedWorkflowId = WORKFLOW_ID_REGEX.exec(id);
  if (parsedWorkflowId) {
    return {
      normalizedDomainName: parsedWorkflowId.groups?.domainName || '',
    };
  }
  return null;
};
