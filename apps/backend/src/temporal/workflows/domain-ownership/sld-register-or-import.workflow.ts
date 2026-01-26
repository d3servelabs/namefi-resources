import type { DomainRegistration } from '@namefi-astra/registrars/lib/abstract-registrar/data/domain';
import { OperationStatus } from '@namefi-astra/registrars/lib/abstract-registrar/data/operation-status';
import type { LongRunningOperationResult } from '@namefi-astra/registrars/lib/abstract-registrar/registrar-service';
import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import type { Registrars } from '@namefi-astra/registrars/registrars/registrars-keys';
import {
  type ChecksumWalletAddress,
  type NamefiNormalizedDomain,
  notMatchAny,
  matchAny,
} from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import {
  TEMPORAL_ENUMS,
  TEMPORAL_QUEUES,
  shortRunningOpts,
} from '../../shared';
import { typedProxyActivities } from '../../shared/workflow-helpers';
import {
  extendDomainRegistrationWorkflow,
  type ExtendDomainRegistrationWorkflowInput,
} from './extend-registration.workflow';

interface SldRegisterOrImportWorkflowInput {
  operationType: 'REGISTER' | 'IMPORT';
  recipientWalletAddress: ChecksumWalletAddress;
  chainId: number;
  normalizedDomainName: NamefiNormalizedDomain;
  durationInYears: number;
  registrarKey: Registrars;

  encryptionKeyId?: string | null;
  encryptedEppAuthorizationCode?: string | null;
}
export const sldRegisterOrImportProceed =
  workflow.defineSignal<[{ action: 'PROCEED' | 'FAIL' }]>('nextAction');

const { generalAlertNamefi } = typedProxyActivities({
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
  },
});

const { sendRegisterOrImportRequestToNamefiRegistrar } = typedProxyActivities({
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

export async function sldRegisterOrImportWorkflow(
  input: SldRegisterOrImportWorkflowInput,
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

  if (
    isImport &&
    !(input.encryptedEppAuthorizationCode && input.encryptionKeyId)
  ) {
    throw new Error(
      'Authorization code is required for domain import operations',
    );
  }

  try {
    const registrarRes: LongRunningOperationResult =
      await sendRegisterOrImportRequestToNamefiRegistrar(
        input.operationType,
        input,
      );

    // Request domain information from the registrar:
    // If the status is not in progress, submitted or successful, we need to reject the workflow and send an alert
    let registrarOperationStatus = registrarRes.status;

    if (
      notMatchAny(
        registrarOperationStatus,
        OperationStatus.IN_PROGRESS, // for AWS you need to keep polling for result
        OperationStatus.SUBMITTED,
        OperationStatus.SUCCESSFUL,
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

    // Save domain information to the database:
    // If operations are saved -> we are good
    // If operations are not saved -> we need to reject the workflow and send an alert

    registrarOperationStatus = await pollRegisterOrImportDomainOperationStatus(
      input.normalizedDomainName,
      registrarOperationId,
      input.registrarKey,
    );

    workflow.deprecatePatch('add-support-for-requires-action');
    let nextAction: 'PROCEED' | 'FAIL' | null = null;
    let waitingForSignal = false;
    workflow.setHandler(sldRegisterOrImportProceed, (input) => {
      if (!waitingForSignal) return;
      nextAction = input.action;
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
    if (
      matchAny(
        registrarOperationStatus,
        OperationStatus.REQUIRES_ACTION,
        OperationStatus.ERROR,
      )
    ) {
      await criticalAlertNamefi({
        workflowInfo: workflow.workflowInfo(),
        message: 'Action Required',
        registrarOperationStatus,
        input,
        level: 'error',
      });

      waitingForSignal = true;
      await workflow.condition(() => nextAction !== null);

      if (nextAction === 'FAIL') {
        throw workflow.ApplicationFailure.create({
          nonRetryable: true,
          message: `Failed to request ${isImport ? 'import' : 'register'} domain status`,
          details: [
            `Type: ${registrarRes.type}`,
            `Status: ${registrarRes.status}`,
            `Message: ${registrarRes.message}`,
            'Admin Signal',
          ],
        });
      }
    }

    if (registrarOperationStatus === OperationStatus.FAILED) {
      throw workflow.ApplicationFailure.create({
        nonRetryable: true,
        message: `Failed to request ${isImport ? 'import' : 'register'} domain status`,
        details: [
          `Type: ${registrarRes.type}`,
          `Status: ${registrarRes.status}`,
          `Message: ${registrarRes.message}`,
        ],
      });
    }

    // For multi-year imports, EPP transfer only adds 1 year.
    // We need to perform additional renewal operations for years 2+.
    if (isImport && input.durationInYears > 1) {
      const additionalYears = input.durationInYears - 1;
      workflow.log.info(
        `Multi-year import: performing ${additionalYears} additional year(s) of renewal after transfer`,
      );

      const renewalInput: ExtendDomainRegistrationWorkflowInput = {
        ownerAddress: input.recipientWalletAddress,
        normalizedDomainName: input.normalizedDomainName,
        durationInYears: additionalYears,
        userId: '', // Not available in this context, but not required for the renewal operation
        updateDomainIndex: false, // Will be updated after the full import completes
      };

      await workflow.executeChild(extendDomainRegistrationWorkflow, {
        args: [renewalInput],
        taskQueue: TEMPORAL_QUEUES.DOMAINS,
        workflowId: `import-renewal-${input.normalizedDomainName}-${additionalYears}y`,
        workflowIdReusePolicy: 'ALLOW_DUPLICATE',
        parentClosePolicy: 'REQUEST_CANCEL',
      });
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
