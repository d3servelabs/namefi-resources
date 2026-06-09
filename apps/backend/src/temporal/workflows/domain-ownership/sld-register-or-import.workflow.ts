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
import {
  createDecisionGateRegistry,
  runWithKnownGate,
  typedProxyActivities,
} from '../../shared/workflow-helpers';
import { operationStatusSchema } from '@namefi-astra/common/contract/admin/decision-gate-response-schemas';
import {
  extendDomainRegistrationWorkflow,
  type ExtendDomainRegistrationWorkflowInput,
} from './extend-registration.workflow';

/**
 * Decision-gate timeouts for the register/import status poll. Mirror the epp
 * workflow's values, sized to stay under the same child run timeouts set in
 * `acquire-domain.workflow.ts` (REGISTER `4 hours`, IMPORT `21 days`). The
 * `ACTION_TIMEOUT` bounds the poll (the gate cancels it on deadline); the
 * `DECISION_TIMEOUT` is the admin window once the gate is open.
 */
const REGISTER_POLL_ACTION_TIMEOUT_MS = 90 * 60 * 1000; // 90 minutes
const REGISTER_POLL_DECISION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours
const IMPORT_POLL_ACTION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours
const IMPORT_POLL_DECISION_TIMEOUT_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

/** Caps IMPORT's RETRY cycles under the 21-day run timeout (see epp workflow). */
const POLL_GATE_MAX_RETRIES = 3;

interface SldRegisterOrImportWorkflowInput {
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
/**
 *
 * @deprecated please user eppRegisterOrImportWorkflow
 */
export async function sldRegisterOrImportWorkflow(
  input: SldRegisterOrImportWorkflowInput,
): ReturnType<typeof getDomainDetails> {
  if (notMatchAny(input.operationType, 'REGISTER', 'IMPORT')) {
    throw new Error(`Invalid operation type "${input.operationType}"`);
  }

  const isImport = input.operationType === 'IMPORT';

  const { pollRegisterOrImportDomainOperationStatus } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      startToCloseTimeout: '30 seconds',
      retry: {
        initialInterval: '3 minutes',
        backoffCoefficient: 1,
        maximumInterval: '3 minutes',
      },
    },
  });

  // New runs wrap the (otherwise unbounded) status poll in a decision gate: on a
  // poll timeout the operation is still queued at the registrar, so alert + wait
  // for an admin instead of dead-ending. In-flight (pre-patch) runs keep the
  // original direct-poll path.
  const pollGateRegistry = workflow.patched(
    'sld-register-or-import-poll-decision-gate',
  )
    ? createDecisionGateRegistry({ prefix: 'sld-register-or-import' })
    : undefined;

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

    const poll = () =>
      pollRegisterOrImportDomainOperationStatus(
        input.normalizedDomainName,
        registrarOperationId,
        input.registrarKey,
      );
    const polledResult = pollGateRegistry
      ? await runWithKnownGate<
          LongRunningOperationResult,
          LongRunningOperationResult
        >({
          registry: pollGateRegistry,
          gateKind: 'register-or-import-poll',
          interactionId: 'register-or-import-poll',
          // Lets the admin side gather evidence (registrar details, is-it-in-our-
          // system, RDAP/WHOIS) for this domain when the gate opens.
          evidenceParams: {
            normalizedDomainName: input.normalizedDomainName,
            registrarKey: input.registrarKey,
          },
          // Auto-retry the poll once before opening the gate — but only for
          // IMPORT (21-day run timeout has room for a second poll window).
          // REGISTER's 4 h child run timeout can't absorb another full
          // actionTimeoutMs, so it gets no auto-retry (mirrors the RETRY split
          // below).
          autoRetry: isImport ? { maxAttempts: 1 } : undefined,
          // The poll retries unboundedly; the gate's own action deadline cancels
          // it and opens the gate so an admin can verify the registrar.
          action: poll,
          actionTimeoutMs: isImport
            ? IMPORT_POLL_ACTION_TIMEOUT_MS
            : REGISTER_POLL_ACTION_TIMEOUT_MS,
          // The admin verifies the registrar and supplies the terminal status;
          // the workflow continues with the submit result carrying that status.
          validateResponse: (raw) =>
            ({
              ...registrarRes,
              status: operationStatusSchema.parse(raw),
            }) as LongRunningOperationResult,
          allowedActors: ['ADMIN'],
          // RETRY re-polls — only offered for IMPORT (21-day run timeout). A
          // REGISTER child has a 4 h run timeout that a re-poll after the gate
          // wait can't fit, so REGISTER offers only RESPOND / CANCEL.
          allowedActions: isImport
            ? ['RETRY', 'RESPOND', 'CANCEL']
            : ['RESPOND', 'CANCEL'],
          // Bound IMPORT's RETRY cycles under the 21-day run timeout (REGISTER
          // offers no RETRY, so this is inert there).
          maxRetries: POLL_GATE_MAX_RETRIES,
          timeoutMs: isImport
            ? IMPORT_POLL_DECISION_TIMEOUT_MS
            : REGISTER_POLL_DECISION_TIMEOUT_MS,
          onTimeout: { kind: 'throw' },
          alertTitle: `We're ${isImport ? 'importing' : 'registering'} ${input.normalizedDomainName} via ${input.registrarKey}, but it's taking longer than expected`,
          alertMessage: `The registrar operation poll exceeded its deadline (operationId=${registrarOperationId}). Verify the registrar's state.`,
          alertDetails: {
            normalizedDomainName: input.normalizedDomainName,
            operationId: registrarOperationId,
            registrarKey: input.registrarKey,
            operationType: input.operationType,
            userId: input.userId,
            orderId: input.orderId,
          },
        })
      : await poll();
    registrarOperationStatus = polledResult.status;

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
    // If the renewal fails, we alert admins but still return success for the transfer portion.
    // The domain will have 1 year instead of the requested duration - admins must manually resolve.
    if (isImport && input.durationInYears > 1) {
      const additionalYears = input.durationInYears - 1;
      workflow.log.info(
        `Multi-year import: performing ${additionalYears} additional year(s) of renewal after transfer`,
      );

      const renewalInput: ExtendDomainRegistrationWorkflowInput = {
        ownerAddress: input.recipientWalletAddress,
        normalizedDomainName: input.normalizedDomainName,
        durationInYears: additionalYears,
        userId: '', // TODO: userId is required by ExtendDomainRegistrationWorkflowInput but unused in helper functions. Consider making it optional in the type definition.
        updateDomainIndex: true, // Update index after renewal to reflect the new expiration
      };

      try {
        await workflow.executeChild(extendDomainRegistrationWorkflow, {
          args: [renewalInput],
          taskQueue: TEMPORAL_QUEUES.DOMAINS,
          workflowId: `import-renewal-${input.normalizedDomainName}-${additionalYears}y-${Date.now()}`,
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

    // Fetch and return domain details. This also ensures the domain index is updated
    // with the current state from the registrar.
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
