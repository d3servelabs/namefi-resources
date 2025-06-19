import type { DomainRegistration } from '@namefi-astra/registrars/lib/abstract-registrar/data/domain';
import { OperationStatus } from '@namefi-astra/registrars/lib/abstract-registrar/data/operation-status';
import type { LongRunningOperationResult } from '@namefi-astra/registrars/lib/abstract-registrar/registrar-service';
import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import type { Registrars } from '@namefi-astra/registrars/registrars/registrars-keys';
import {
  type ChecksumWalletAddress,
  type NamefiNormalizedDomain,
  notMatchAny,
} from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import { TEMPORAL_ENUMS, shortRunningOpts } from 'src/temporal/shared';
import { typedProxyActivities } from 'src/temporal/shared/workflow-helpers';

interface SldRegisterOrImportWorkflowInput {
  operationType: 'REGISTER' | 'IMPORT';
  recipientWalletAddress: ChecksumWalletAddress;
  chainId: number;
  normalizedDomainName: NamefiNormalizedDomain;
  durationInYears: number;
  registrarKey: Registrars;

  encryptionKeyId?: string;
  encryptedEppAuthorizationCode?: string;
}

export async function sldRegisterOrImportWorkflow(
  input: SldRegisterOrImportWorkflowInput,
): Promise<DomainRegistration> {
  if (notMatchAny(input.operationType, 'REGISTER', 'IMPORT')) {
    throw new Error(`Invalid operation type "${input.operationType}"`);
  }

  const isImport = input.operationType === 'IMPORT';

  if (
    isImport &&
    !(input.encryptedEppAuthorizationCode && input.encryptionKeyId)
  ) {
    throw new Error(
      'Authorization code is required for domain import operations',
    );
  }

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

  const { sendRegisterOrImportRequestToNamefiRegistrar } = typedProxyActivities(
    {
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
    },
  );

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
    );

    if (registrarOperationStatus !== OperationStatus.SUCCESSFUL) {
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
