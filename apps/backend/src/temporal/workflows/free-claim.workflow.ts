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
export type FreeClaimWorkflowState = {
  currentStep: string;
  claimId?: string;
  claimValidation?: string;
  orderId?: string;
  orderItemId?: string;
  error?: string;
  input: ProcessFreeClaimWorkflowInput;
};

export const getWorkflowStateQuery =
  defineQuery<FreeClaimWorkflowState>('getWorkflowState');

export type FreeClaimWorkflowMemo = {
  freeClaim: {
    domainName: NamefiNormalizedDomain;
    userId: string;
    chainId: number;
    durationInYears: number;
    registrarKey: string;
    recipientWallet: ChecksumWalletAddress;
    description: string;
    claimId?: string;
    claimValidation?: string;
  };
};
export interface ProcessFreeClaimWorkflowInput {
  userId: string;
  normalizedDomainName: NamefiNormalizedDomain;
  recipientWalletAddress: ChecksumWalletAddress;
  chainId: number;
  durationInYears: number;
  registrarKey: string;
  claimId?: string; // Optional claimId for pre-created claims
  orderId?: string; // Optional orderId when claim and order are already created
  orderItemId?: string; // Optional orderItemId when claim and order are already created
}

// Shared state interface for private functions
interface WorkflowState {
  claimId: string | undefined;
  claimValidation: string | undefined;
  orderId: string | undefined;
  orderItemId: string | undefined;
  currentStep: string;
  error: string | undefined;
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
    claimId: inputClaimId,
    orderId: inputOrderId,
    orderItemId: inputOrderItemId,
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
      description: `Processing free claim for ${normalizedDomainName}`,
    },
  } satisfies FreeClaimWorkflowMemo);

  // Set search attributes for easy querying
  workflow.upsertSearchAttributes({
    userId: [userId],
    domainName: [normalizedDomainName],
  });

  const {
    updateOrderAndItemStatusOrThrow,
    validateAndUseClaim,
    validateClaimAndOrder,
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

  // Create shared state object for private functions
  const state: WorkflowState = {
    claimId: inputClaimId,
    claimValidation: inputClaimId ? 'success' : undefined,
    orderId: inputOrderId,
    orderItemId: inputOrderItemId,
    currentStep: 'initializing',
    error: undefined,
  };

  // Set up query handlers to expose workflow state
  workflow.setHandler(getCurrentStepQuery, () => state.currentStep);
  workflow.setHandler(getClaimIdQuery, () => state.claimId);
  workflow.setHandler(getClaimValidationQuery, () => state.claimValidation);
  workflow.setHandler(getOrderIdQuery, () => state.orderId);
  workflow.setHandler(getOrderItemIdQuery, () => state.orderItemId);
  workflow.setHandler(getErrorQuery, () => state.error);
  workflow.setHandler(getWorkflowStateQuery, () => ({
    currentStep: state.currentStep,
    claimId: state.claimId,
    orderId: state.orderId,
    orderItemId: state.orderItemId,
    error: state.error,
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
    // Check if we're starting with a pre-existing claim and order
    if (inputClaimId && inputOrderId && inputOrderItemId) {
      const result = await _processExistingClaim(input, state, {
        validateClaimAndOrder,
      });

      if (!result.success) {
        return {
          success: false,
        };
      }
    } else {
      const result = await _processNewClaim(input, state, {
        validateAndUseClaim,
        createClaimOrder,
        updateClaimRecord,
      });

      if (!result.success) {
        return {
          success: false,
        };
      }
    }

    // Step 3: Process the domain acquisition
    state.currentStep = 'acquiring_domain';
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

    state.currentStep = 'domain_acquired';

    // Step 4: Update order and order item status to succeeded atomically
    state.currentStep = 'updating_order_status';
    if (state.orderItemId && state.orderId) {
      await updateOrderAndItemStatusOrThrow({
        orderId: state.orderId,
        orderItemId: state.orderItemId,
        status: orderStatusSchema.Values.SUCCEEDED,
      });
    }

    // Step 5: Mark claim as completed (CLAIMED status)
    state.currentStep = 'marking_claim_completed';
    if (!state.claimId) {
      throw new Error(
        'ClaimId is undefined when trying to mark claim as completed',
      );
    }
    await markClaimAsCompleted({
      claimId: state.claimId,
    });

    // Step 6: Trigger domain index update
    state.currentStep = 'updating_domain_index';
    try {
      await triggerUpdateDomainIndex();
    } catch (e) {
      workflow.log.error(
        `Failed to trigger update domain index for claim ${state.claimId}. Error: ${e}`,
      );
    }

    state.currentStep = 'completed';

    workflow.log.info('Free claim processed successfully', {
      userId,
      normalizedDomainName,
      orderId: state.orderId,
      orderItemId: state.orderItemId,
    });

    return {
      success: true,
      orderId: state.orderId,
      orderItemId: state.orderItemId,
    };
  } catch (e) {
    state.currentStep = 'failed';
    state.error = e instanceof Error ? e.message : String(e);

    workflow.log.error(
      `Failed to process free claim for user ${userId}, domain ${normalizedDomainName}: ${state.error}`,
    );

    // Revert the claim if it was marked as used
    if (state.claimId) {
      const [revertError] = await resolve(
        revertClaim({
          claimId: state.claimId,
        }),
      );

      if (revertError) {
        workflow.log.error(
          `Failed to revert free claim ${state.claimId}: ${
            revertError instanceof Error
              ? revertError.message
              : String(revertError)
          }`,
        );
      }
    }

    // Update order and order item status to failed atomically if they were created
    if (state.orderItemId && state.orderId) {
      const [updateStatusError] = await resolve(
        updateOrderAndItemStatusOrThrow({
          orderId: state.orderId,
          orderItemId: state.orderItemId,
          status: orderStatusSchema.Values.FAILED,
        }),
      );

      if (updateStatusError) {
        workflow.log.error(
          `Failed to update order ${state.orderId} and order item ${state.orderItemId} status to FAILED: ${
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

/**
 * Private function to handle pre-existing claim and order validation
 */
async function _processExistingClaim(
  input: ProcessFreeClaimWorkflowInput,
  state: WorkflowState,
  activities: any,
): Promise<{ success: boolean; reason?: string }> {
  const {
    normalizedDomainName,
    claimId: inputClaimId,
    orderId: inputOrderId,
    orderItemId: inputOrderItemId,
  } = input;
  const { validateClaimAndOrder } = activities;

  if (!inputClaimId) {
    throw new workflow.ApplicationFailure(
      'ClaimId is undefined when trying to validate existing claim and order',
    );
  }

  // Step 1: Validate the existing claim and order
  state.currentStep = 'validating_existing_claim_and_order';
  const claimValidationResult = await validateClaimAndOrder({
    claimId: inputClaimId,
    normalizedDomainName,
    orderId: inputOrderId,
    orderItemId: inputOrderItemId,
  });

  if (!claimValidationResult.success) {
    state.currentStep = 'claim_validation_failed';
    state.claimValidation = 'failed';
    state.error = claimValidationResult.reason || 'Claim validation failed';
    return {
      success: false,
      reason: state.error,
    };
  }

  state.currentStep = 'existing_claim_and_order_validated';
  const memo = (workflow.workflowInfo().memo ?? {}) as FreeClaimWorkflowMemo;
  workflow.upsertMemo({
    freeClaim: {
      ...memo.freeClaim,
      claimId: state.claimId,
      claimValidation: state.claimValidation,
      orderId: state.orderId,
      orderItemId: state.orderItemId,
    },
  });

  return { success: true };
}

/**
 * Private function to handle new claim validation and order creation
 */
async function _processNewClaim(
  input: ProcessFreeClaimWorkflowInput,
  state: WorkflowState,
  activities: any,
): Promise<{ success: boolean; reason?: string }> {
  const {
    userId,
    normalizedDomainName,
    durationInYears,
    registrarKey,
    recipientWalletAddress,
    chainId,
  } = input;
  const { validateAndUseClaim, createClaimOrder, updateClaimRecord } =
    activities;

  // Step 1: Atomically validate and mark the claim as used
  state.currentStep = 'validating_claim';
  const claimValidationResult = await validateAndUseClaim({
    userId,
    normalizedDomainName,
  });

  if (!claimValidationResult.success) {
    state.currentStep = 'claim_validation_failed';
    state.claimValidation = 'failed';
    state.error = claimValidationResult.reason || 'Claim validation failed';
    return {
      success: false,
      reason: state.error,
    };
  }

  state.claimId = claimValidationResult.claimId;
  state.claimValidation = 'success';
  state.currentStep = 'claim_validated';
  const memo = (workflow.workflowInfo().memo ?? {}) as FreeClaimWorkflowMemo;
  workflow.upsertMemo({
    freeClaim: {
      ...memo.freeClaim,
      claimId: state.claimId,
      claimValidation: state.claimValidation,
    },
  });

  // Step 2: Create order and order item for the claim (with $0 amount)
  state.currentStep = 'creating_order';
  const orderResult = await createClaimOrder({
    userId,
    normalizedDomainName,
    durationInYears,
    registrarKey,
    recipientWalletAddress,
    chainId,
    claimId: state.claimId,
  });

  state.orderId = orderResult.orderId;
  state.orderItemId = orderResult.orderItemId;
  state.currentStep = 'order_created';

  // Update the claim record with the order item ID
  state.currentStep = 'updating_claim_record';
  await updateClaimRecord({
    claimId: state.claimId,
    orderItemId: state.orderItemId,
  });

  return { success: true };
}
