import type { DomainRegistration } from '@namefi-astra/registrars/lib/abstract-registrar/data/domain';
import { OperationStatus } from '@namefi-astra/registrars/lib/abstract-registrar/data/operation-status';
import type { LongRunningOperationResult } from '@namefi-astra/registrars/lib/abstract-registrar/registrar-service';
import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import type { Registrars } from '@namefi-astra/registrars/registrars/registrars-keys';
import type { OrderItemMetadata } from '@namefi-astra/db';
import type { GetLockStateResponse } from '../../activities/domain/registrar.activities';
import {
  type ChecksumWalletAddress,
  type NamefiNormalizedDomain,
  notMatchAny,
} from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import {
  TEMPORAL_ENUMS,
  TEMPORAL_QUEUES,
  shortRunningOpts,
} from '../../shared';
import {
  catchAndAlertLocally,
  typedProxyActivities,
} from '../../shared/workflow-helpers';
import {
  extendDomainRegistrationWorkflow,
  type ExtendDomainRegistrationWorkflowInput,
} from './extend-registration.workflow';

interface EppRegisterOrImportWorkflowInput {
  operationType: 'REGISTER' | 'IMPORT';
  recipientWalletAddress: ChecksumWalletAddress;
  chainId: number;
  normalizedDomainName: NamefiNormalizedDomain;
  durationInYears: number;
  registrarKey: Registrars;
  userId?: string | null;
  orderId?: string | null;
  orderItemId?: string | null;

  encryptionKeyId?: string | null;
  encryptedEppAuthorizationCode?: string | null;
}

type NextActionType = 'PROCEED' | 'CANCEL';
type NextActionSignal = {
  actor: 'USER' | 'ADMIN';
  actorId: string;
  action: NextActionType;
};
export const eppRegisterOrImportProceed =
  workflow.defineSignal<[NextActionSignal]>('nextAction');

const {
  generalAlertNamefi,
  setOrderItemRequiredAction,
  sendOrderRequiresFurtherActionEmail,
} = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: {
    ...shortRunningOpts,
    retry: {
      maximumInterval: '1 minute',
    },
  },
});

const { getDomainDetails } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DOMAINS,
  options: {
    ...shortRunningOpts,
    retry: {
      ...shortRunningOpts.retry,
      maximumAttempts: 20,
    },
  },
});

const { sendRegisterOrImportRequestToNamefiRegistrar, getEppLockState } =
  typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      startToCloseTimeout: '30 seconds',
      retry: {
        initialInterval: '5 seconds',
        backoffCoefficient: 2,
        maximumInterval: '1 minutes',
        maximumAttempts: 5,
      },
    },
  });

const hourlyPoll = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DOMAINS,
  options: {
    startToCloseTimeout: '30 seconds',
    retry: {
      initialInterval:
        process.env.NODE_ENV === 'production' ? '1 hour' : '2 minutes',
      backoffCoefficient: 1,
      maximumInterval: '1 hour',
    },
  },
});

const { criticalAlertNamefi } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: {
    ...shortRunningOpts,
    retry: {
      maximumInterval: '1 minute',
    },
  },
});

export async function eppRegisterOrImportWorkflow(
  input: EppRegisterOrImportWorkflowInput,
): Promise<DomainRegistration> {
  if (notMatchAny(input.operationType, 'REGISTER', 'IMPORT')) {
    throw new Error(`Invalid operation type "${input.operationType}"`);
  }

  const isImport = input.operationType === 'IMPORT';

  const { pollRegisterOrImportDomainOperationStatus } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      startToCloseTimeout: '30 seconds',
      retry: isImport
        ? {
            initialInterval: '1 minute',
            backoffCoefficient: 4,
            maximumInterval: '4 hours',
            // no max attempts
          }
        : {
            initialInterval: '5 seconds',
            backoffCoefficient: 2,
            maximumInterval: '15 minutes',
          },
    },
  });

  try {
    await preSubmitRequirements({
      input,
    });

    const { registrarOperationId } = await submitRequestOrFail({
      input,
    });

    let registrarOperationResult =
      await pollRegisterOrImportDomainOperationStatus(
        input.normalizedDomainName,
        registrarOperationId,
        input.registrarKey,
      );
    let registrarOperationStatus = registrarOperationResult.status;

    // Loop until the registrar no longer requires user action.
    if (registrarOperationStatus === OperationStatus.REQUIRES_ACTION) {
      registrarOperationResult = await handleOperationRequiresFurtherAction({
        input,
        registrarOperationResult,
      });
      registrarOperationStatus = registrarOperationResult.status;
    }

    if (registrarOperationStatus === OperationStatus.ERROR) {
      // Errors are reported to admins only; user-facing action is handled via REQUIRES_ACTION.
      await criticalAlertNamefi({
        workflowInfo: workflow.workflowInfo(),
        message: 'Registrar reported error during operation',
        registrarOperationStatus,
        input,
        level: 'error',
      });
    }

    if (registrarOperationStatus === OperationStatus.FAILED) {
      throw workflow.ApplicationFailure.create({
        nonRetryable: true,
        message: `Failed to request ${isImport ? 'import' : 'register'} domain status`,
        details: [
          `Type: ${registrarOperationResult.type}`,
          `Status: ${registrarOperationResult.status}`,
          `Message: ${registrarOperationResult.message}`,
        ],
      });
    }

    if (registrarOperationStatus === OperationStatus.SUCCESSFUL) {
      await extendDomainRegistrationIfNeeded(input);
    }
    return getDomainDetails(input.normalizedDomainName as PunycodeDomainName);
  } catch (error: any) {
    workflow.log.error(error);

    const info = workflow.workflowInfo();

    await generalAlertNamefi({
      title: `Workflow Failed (${info.workflowId})`,
      message: 'Domain Acquire Not Successful',
      workflowId: info.workflowId,
      runId: info.runId,
      operation: 'DOMAIN_ACQUIRE',
      input,
      error,
    });

    throw error;
  }
}

type OrderRequiredAction = NonNullable<OrderItemMetadata['requiredAction']>;

async function requireUnlockBeforeImportOrFail({
  input,
}: {
  input: EppRegisterOrImportWorkflowInput;
}) {
  let nextAction: NextActionType | null = null;
  let waitingForSignal = false;
  let signalReceived: NextActionSignal | null = null;
  workflow.setHandler(eppRegisterOrImportProceed, (signalInput) => {
    if (!waitingForSignal) return;
    waitingForSignal = false;
    nextAction = signalInput.action;
    signalReceived = signalInput;
  });

  let lockState: GetLockStateResponse;
  let count = 0;

  do {
    nextAction = null;
    lockState = await getEppLockState(
      input.normalizedDomainName as PunycodeDomainName,
    );
    if (!lockState.locked) break;

    await notifyUserRequiredAction({
      input,
      requiredAction: 'EPP_UNLOCK_REQUIRED',
      extraMessage:
        count > 0
          ? 'The domain is still locked. Please unlock the domain before proceeding with the import.'
          : 'Please unlock the domain before proceeding with the import.',
    });

    waitingForSignal = true;
    await Promise.race([
      workflow.condition(() => nextAction !== null),
      hourlyPoll.pollAndExpectEppLockStateChange(input.normalizedDomainName, {
        locked: false,
      }),
    ]);

    if (nextAction === 'CANCEL') {
      throw workflow.ApplicationFailure.create({
        nonRetryable: true,
        message: 'Import requires EPP unlock confirmation',
        details: [
          {
            signalReceived,
          },
        ],
      });
    }

    count++;
  } while (lockState.locked);

  await clearRequiredAction({
    input,
  });
}

async function preSubmitRequirements({
  input,
}: {
  input: EppRegisterOrImportWorkflowInput;
}) {
  const isImport = input.operationType === 'IMPORT';
  if (
    isImport &&
    !(input.encryptedEppAuthorizationCode && input.encryptionKeyId)
  ) {
    throw new workflow.ApplicationFailure(
      'Authorization code is required for domain import operations',
    );
  }

  if (isImport) {
    // Require the domain to be unlocked before starting the transfer.
    await requireUnlockBeforeImportOrFail({
      input,
    });
  }
}

async function submitRequestOrFail({
  input,
}: {
  input: EppRegisterOrImportWorkflowInput;
}) {
  const isImport = input.operationType === 'IMPORT';
  const registrarRes: LongRunningOperationResult =
    await sendRegisterOrImportRequestToNamefiRegistrar(
      input.operationType,
      input,
    );

  // Request domain information from the registrar:
  // If the status is not in progress, submitted or successful, we need to reject the workflow and send an alert
  const initialRegistrarStatus = registrarRes.status;

  if (
    notMatchAny(
      initialRegistrarStatus,
      OperationStatus.IN_PROGRESS, // for AWS you need to keep polling for result
      OperationStatus.SUBMITTED,
      OperationStatus.SUCCESSFUL,
      OperationStatus.REQUIRES_ACTION,
    )
  ) {
    throw workflow.ApplicationFailure.create({
      nonRetryable: true,
      message: `Failed to request ${isImport ? 'import' : 'register'} domain information`,
      details: [
        `Type: ${registrarRes.type}`,
        `Status: ${registrarRes.status}`,
        `Message: ${registrarRes.message}`,
      ],
    });
  }

  const registrarOperationId = registrarRes.operationId;
  if (!registrarOperationId) {
    throw workflow.ApplicationFailure.create({
      nonRetryable: true,
      message: `Failed to request ${isImport ? 'import' : 'register'} domain information`,
    });
  }
  return { registrarOperationId, operationDetails: registrarRes };
}

async function handleOperationRequiresFurtherAction({
  input,
  registrarOperationResult: _registrarOperationResult,
}: {
  input: EppRegisterOrImportWorkflowInput;
  registrarOperationResult: Awaited<
    ReturnType<typeof sendRegisterOrImportRequestToNamefiRegistrar>
  >;
}) {
  const isImport = input.operationType === 'IMPORT';

  const { pollRegisterOrImportDomainOperationStatus } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      startToCloseTimeout: '30 seconds',
      retry: isImport
        ? {
            initialInterval: '1 minute',
            backoffCoefficient: 4,
            maximumInterval: '4 hours',
            // no max attempts
          }
        : {
            initialInterval: '5 seconds',
            backoffCoefficient: 2,
            maximumInterval: '15 minutes',
          },
    },
  });

  let registrarOperationResult = _registrarOperationResult;
  let registrarOperationStatus = registrarOperationResult.status;
  const registrarOperationId = registrarOperationResult.operationId;
  if (!registrarOperationId) {
    throw new workflow.ApplicationFailure(
      'Impossible state: Registrar operation ID is missing in handleOperationRequiresFurtherAction',
    );
  }

  let nextAction: NextActionType | null = null;
  let waitingForSignal = false;
  let signalReceived: NextActionSignal | null = null;

  workflow.setHandler(eppRegisterOrImportProceed, (signalInput) => {
    if (!waitingForSignal) return;

    waitingForSignal = false;
    nextAction = signalInput.action;
    signalReceived = signalInput;
  });

  let count = 0;
  do {
    const requiredAction = await determineRequiredAction({
      input,
      operationResult: registrarOperationResult,
    });

    if (requiredAction) {
      await notifyUserRequiredAction({
        input,
        requiredAction,
        extraMessage: count > 0 ? `Attempt ${count}` : '',
      });
    }

    waitingForSignal = true;
    await Promise.race([
      workflow.condition(() => nextAction !== null),
      requiredAction === 'EPP_UNLOCK_REQUIRED'
        ? hourlyPoll.pollAndExpectEppLockStateChange(
            input.normalizedDomainName,
            {
              locked: false,
            },
          )
        : new Promise(() => {}),
    ]);

    if (nextAction === 'CANCEL') {
      throw workflow.ApplicationFailure.create({
        nonRetryable: true,
        message: `Failed to request ${isImport ? 'import' : 'register'} domain status`,
        details: [
          `Type: ${registrarOperationResult.type}`,
          `Status: ${registrarOperationResult.status}`,
          `Message: ${registrarOperationResult.message}`,
          signalReceived,
        ],
      });
    }

    nextAction = null;
    await clearRequiredAction({
      input,
    });

    registrarOperationResult = await pollRegisterOrImportDomainOperationStatus(
      input.normalizedDomainName,
      registrarOperationId,
      input.registrarKey,
    );
    registrarOperationStatus = registrarOperationResult.status;
    count++;
  } while (registrarOperationStatus === 'REQUIRES_ACTION');
  return registrarOperationResult;
}

/** Done
 * Check if order tracking information is present in the input
 */
function hasOrderTracking(
  input: EppRegisterOrImportWorkflowInput,
): input is EppRegisterOrImportWorkflowInput & {
  userId: string;
  orderId: string;
  orderItemId: string;
} {
  return Boolean(input.userId && input.orderId && input.orderItemId);
}

/** Done
 * Notify user about required action
 */
async function notifyUserRequiredAction({
  input,
  requiredAction,
  extraMessage,
}: {
  input: EppRegisterOrImportWorkflowInput;
  requiredAction: OrderRequiredAction;
  extraMessage?: string;
}) {
  if (!hasOrderTracking(input)) return;

  await setOrderItemRequiredAction({
    orderId: input.orderId,
    orderItemId: input.orderItemId,
    requiredAction,
  });

  await sendOrderRequiresFurtherActionEmail({
    userId: input.userId,
    orderId: input.orderId,
    orderItemId: input.orderItemId,
    normalizedDomainName: input.normalizedDomainName,
    requiredAction,
    extraMessage,
  });
}

/** Done
 * Clear required action for domain registration or import.
 */
async function clearRequiredAction({
  input,
}: {
  input: EppRegisterOrImportWorkflowInput;
}) {
  if (!hasOrderTracking(input)) return;
  await setOrderItemRequiredAction({
    orderId: input.orderId,
    orderItemId: input.orderItemId,
    requiredAction: null,
  });
}

async function determineRequiredAction({
  input,
  operationResult,
}: {
  input: EppRegisterOrImportWorkflowInput;
  operationResult: LongRunningOperationResult;
}): Promise<OrderRequiredAction | null> {
  if (!hasOrderTracking(input)) return null;
  const operationMetadata = operationResult.metadata;
  if (
    operationMetadata &&
    'actionType' in operationMetadata &&
    operationMetadata.actionType
  ) {
    return operationMetadata.actionType;
  }

  //In the case the actionType is not set (which shouldn't happend), alert team, then decuce type from message
  catchAndAlertLocally(async () => {
    await criticalAlertNamefi({
      message:
        'Registrar Reported Requires Action, but actionType is not specified',
      title: 'Inconsistent Response from registrar',
      extraData: {
        workflowInfo: workflow.workflowInfo(),

        operationResult,
        level: 'error',
      },
    });
  });

  const message = operationResult.message?.toLowerCase() ?? '';

  if (message.includes('authcode') || message.includes('auth code')) {
    return 'EPP_AUTH_CODE_UPDATE_REQUIRED';
  }

  if (message.includes('lock')) {
    return 'EPP_UNLOCK_REQUIRED';
  }

  const lockState = await getEppLockState(
    input.normalizedDomainName as PunycodeDomainName,
  );
  if (lockState.locked) {
    return 'EPP_UNLOCK_REQUIRED';
  }

  return 'EPP_AUTH_CODE_UPDATE_REQUIRED';
}

/**
 *
 * From Devin
 */
async function extendDomainRegistrationIfNeeded(
  input: EppRegisterOrImportWorkflowInput,
) {
  const isImport = input.operationType === 'IMPORT';
  // For multi-year imports, EPP transfer only adds 1 year.
  // We need to perform additional renewal operations for years 2+.
  // If the renewal fails, we alert admins but still return success for the transfer portion.
  // The domain will have 1 year instead of the requested duration - admins must manually resolve.
  if (isImport && input.durationInYears > 1) {
    const additionalYears = input.durationInYears - 1;
    workflow.log.info(
      `Multi-year import: performing ${additionalYears} additional year(s) of renewal after transfer`,
    );

    try {
      const renewalInput: ExtendDomainRegistrationWorkflowInput = {
        ownerAddress: input.recipientWalletAddress,
        normalizedDomainName: input.normalizedDomainName,
        durationInYears: additionalYears,
        userId: input.userId ?? '', // TODO(Devin): userId is required by ExtendDomainRegistrationWorkflowInput but unused in helper functions. Consider making it optional in the type definition.
        updateDomainIndex: true, // Update index after renewal to reflect the new expiration
      };

      await workflow.executeChild(extendDomainRegistrationWorkflow, {
        args: [renewalInput],
        taskQueue: TEMPORAL_QUEUES.DOMAINS,
        workflowId: extendDomainRegistrationWorkflow.generateId(renewalInput),
        workflowIdReusePolicy: 'ALLOW_DUPLICATE',
        parentClosePolicy: 'REQUEST_CANCEL',
      });
    } catch (renewalError: any) {
      // Transfer succeeded but renewal failed - this is a partial success scenario.
      // Alert admins so they can manually extend the domain or issue a refund for the renewal portion.
      workflow.log.error(
        `Multi-year import partial failure: transfer succeeded but renewal failed for ${input.normalizedDomainName}`,
        { renewalError },
      );

      // Wrap alert in try-catch to ensure alerting errors don't fail the workflow.
      // The transfer succeeded, so we must preserve that outcome.
      try {
        await criticalAlertNamefi({
          workflowInfo: workflow.workflowInfo(),
          message: 'Multi-year Import Partial Failure',
          level: 'error',
          input,
          transferSucceeded: true,
          renewalsSucceeded: false,
          requestedYears: input.durationInYears,
          completedYears: 1,
          failedRenewalYears: additionalYears,
          renewalError: renewalError?.message || String(renewalError),
        });
      } catch (alertError: any) {
        workflow.log.error(
          'Failed to send critical alert for multi-year import partial failure',
          {
            alertError: alertError?.message || String(alertError),
            renewalError: renewalError?.message || String(renewalError),
            normalizedDomainName: input.normalizedDomainName,
          },
        );
      }

      // Continue to return domain details - the transfer succeeded so the domain exists with 1 year.
      // Admins will be notified to manually resolve the missing renewal years.
    }
  }
}
