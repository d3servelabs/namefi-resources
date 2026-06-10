import * as workflow from '@temporalio/workflow';
import { lockNamefiNftByName } from '../mint.workflow';
import { OperationStatus } from '@namefi-astra/registrars/data/types/operation-status';
import { TEMPORAL_ENUMS, TEMPORAL_QUEUES } from '../../shared';
import { typedProxyActivities } from '../../shared/workflow-helpers';
import { catchAndAlertLocally } from '../../shared/workflow-helpers/catch-and-alert-locally';
import { pollingOpts } from '../../shared';
import type { PunycodeDomainName } from '@namefi-astra/registrars/data/validations';
import { isNil } from 'ramda';
import { criticalAlertWithTicket } from '#temporal/shared/workflow-helpers/critical-alert-with-ticket';
import {
  createDecisionGateRegistry,
  runWithDecisionGate,
} from '../../shared/workflow-helpers/decision-gate';

/**
 * How long the EPP-unlock decision gate waits for an admin before failing the
 * export prep (which leaves the domain in the stuck state it alerts on).
 */
const PREPARE_EXPORT_DECISION_TIMEOUT_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

const { parseDomainName } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: {
    startToCloseTimeout: '10 seconds',
  },
});

const { getEppLockState, getDomainChain, unlockEppDomain } =
  typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      startToCloseTimeout: '10 seconds',
      retry: {
        maximumAttempts: 2, // Not using activity retry. We will retry at flow level
      },
    },
  });

const { pollAndExpectEppLockStateChange } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DOMAINS,
  options: {
    ...pollingOpts,
    retry: {
      ...pollingOpts.retry,
      maximumInterval: '5 minutes',
      backoffCoefficient: 2,
      maximumAttempts: 20,
    },
  },
});
const { pollRegistrarOperationStatus } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DOMAINS,
  options: {
    ...pollingOpts,
    retry: {
      ...pollingOpts.retry,
      maximumAttempts: 20,
    },
  },
});

const { getNamefiNftLock } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.MINT,
  options: {
    startToCloseTimeout: '20 seconds',
    retry: {
      maximumAttempts: 2, // Not using activity retry. We will retry at flow level
    },
  },
});

const { sendStyledEmailNotificationForUser, sendStyledEmailNotification } =
  typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.NOTIFY,
    options: {
      startToCloseTimeout: '20 seconds',
    },
  });

const NOTIFY_ERRORS = false;
export async function prepareDomainForExportWorkflow({
  domainName,
  userId,
}: {
  domainName: PunycodeDomainName;
  userId: string;
}) {
  const parsedDomainName = await parseDomainName(domainName);
  if (!parsedDomainName.valid) {
    throw new workflow.ApplicationFailure('Invalid domain name');
  }
  if (parsedDomainName.registryType !== 'traditional') {
    throw new workflow.ApplicationFailure(
      'Export is only supported for traditional domains',
    );
  }

  const chainId = await getDomainChain(domainName);
  const nftTokenLock = await getNamefiNftLock(chainId, domainName);

  // Track whether we locked the NFT in this run, so we can roll back on failure.
  let nftLockedByThisRun = false;

  try {
    if (!nftTokenLock) {
      await workflow.executeChild(lockNamefiNftByName, {
        args: [{ chainId, domainName }],
        taskQueue: TEMPORAL_QUEUES.MINT,
        workflowId: lockNamefiNftByName.generateId({ chainId, domainName }),
        workflowIdReusePolicy: 'ALLOW_DUPLICATE',
      });
      nftLockedByThisRun = true;
    }

    const ensureDomainUnlocked = async (): Promise<void> => {
      const eppLockState = await getEppLockState(domainName);
      if (!eppLockState.locked) return;
      // unlock the domain
      const res = await unlockEppDomain(domainName);
      let status: OperationStatus;
      if (isNil(res.operationId)) {
        if (res.status !== OperationStatus.SUCCESSFUL) {
          throw new workflow.ApplicationFailure(
            'domain eppLock failed to unlock',
          );
        }
        status = res.status;
      } else {
        status = await pollRegistrarOperationStatus({
          domainName,
          registrarOperationId: res.operationId,
        });
      }

      if (status !== OperationStatus.SUCCESSFUL) {
        throw new workflow.ApplicationFailure(
          'domain eppLock failed to unlock',
        );
      }

      // confirm that the domain is unlocked
      await pollAndExpectEppLockStateChange(domainName, { locked: false });
    };

    // On unlock failure, alert + wait for an admin instead of dead-ending in the
    // stuck state (NFT locked + EPP locked). RETRY re-checks the lock first, so
    // it self-resolves if the domain was unlocked out-of-band; RESPOND lets the
    // admin confirm a manual unlock; CANCEL gives up. In-flight (pre-patch) runs
    // keep the original direct path so their replay is unaffected.
    if (workflow.patched('prepare-export-decision-gate')) {
      const decisionRegistry = createDecisionGateRegistry();
      await runWithDecisionGate({
        registry: decisionRegistry,
        interactionId: 'epp-unlock',
        action: ensureDomainUnlocked,
        alertMessage: `EPP unlock failed while preparing ${domainName} for export${
          nftLockedByThisRun ? ' (NFT locked → stuck state)' : ''
        }`,
        alertSeverity: 'general',
        alertDetails: { domainName, chainId, nftLockedByThisRun },
        allowedActors: ['ADMIN'],
        allowedActions: ['PROCEED', 'RETRY', 'CANCEL', 'RESPOND'],
        timeoutMs: PREPARE_EXPORT_DECISION_TIMEOUT_MS,
        maxRetries: 10,
        onTimeout: { kind: 'throw' },
      });
    } else {
      await ensureDomainUnlocked();
    }

    try {
      await sendStyledEmailNotificationForUser({
        userId,
        messageMarkdown: `### Domain is ready for export

        Your domain ${domainName} is ready for export. Please go to the dashboard to export it.
      `,
        showGoToDashboard: true,
        title: '[Namefi] Domain ready for export',
      });
    } catch (error: any) {
      workflow.log.error('Error sending email notification', error);
    }
  } catch (error: any) {
    workflow.log.error('Error preparing domain for export', {
      domainName,
      nftLockedByThisRun,
      errorMessage: error.message,
    });

    // If we locked the NFT in this run but EPP unlock failed, the domain is
    // stuck (NFT locked + EPP locked). Alert the dev team with full context
    // so they can manually remediate.
    const stuckState = nftLockedByThisRun;
    if (stuckState) {
      workflow.log.error(
        'STUCK STATE: NFT was locked but EPP unlock failed. Domain requires manual intervention.',
        { domainName, chainId },
      );
    }

    await criticalAlertWithTicket({
      message: `### ${stuckState ? 'STUCK STATE: ' : ''}Error preparing domain for export

        ${stuckState ? '**The NFT was locked but the EPP unlock failed. The domain is stuck and requires manual intervention.**\n' : ''}
        Domain: ${domainName}
        Chain ID: ${chainId}
        Error: ${error.message}
      `,
      title: `[Minor] ${stuckState ? 'STUCK STATE: ' : ''}Error preparing domain for export`,
    });

    if (NOTIFY_ERRORS) {
      await catchAndAlertLocally(
        async () => {
          await sendStyledEmailNotificationForUser({
            userId,
            messageMarkdown: `### Error preparing domain for export

            We encountered an error while preparing your domain ${domainName} for export. Please go to the dashboard to retry.
          `,
            showGoToDashboard: true,
            title: '[Namefi] Error preparing domain for export',
            inAppNotification: {
              priority: 'high',
              relatedResources: [{ type: 'domain', identifier: domainName }],
              source: 'workflow:prepare-domain-for-export:failure',
            },
          });
        },
        {
          message: `Failed to send user notification for export failure of ${domainName}`,
        },
      );
    }

    throw error;
  }
}

prepareDomainForExportWorkflow.generateId = (input: {
  domainName: PunycodeDomainName;
  userId: string;
}) => {
  return `prepare-domain-export-${input.domainName}`;
};
