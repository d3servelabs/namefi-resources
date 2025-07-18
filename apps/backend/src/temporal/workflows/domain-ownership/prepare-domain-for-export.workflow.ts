import * as workflow from '@temporalio/workflow';
import { lockNamefiNftByName } from '../mint.workflow';
import { OperationStatus } from '@namefi-astra/registrars/lib/abstract-registrar/data/operation-status';
import { TEMPORAL_ENUMS, TEMPORAL_QUEUES } from '../../shared';
import { typedProxyActivities } from '../../shared/workflow-helpers';
import { pollingOpts } from '../../shared';
import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { isNil } from 'ramda';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';

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

const { sendStyledEmailNotification } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.NOTIFY,
  options: {
    startToCloseTimeout: '20 seconds',
  },
});

export async function prepareDomainForExportWorkflow({
  domainName,
  userId,
}: {
  domainName: PunycodeDomainName;
  userId: string;
}) {
  const parsedDomainName = parseDomainName(domainName);
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

  try {
    if (!nftTokenLock) {
      await workflow.executeChild(lockNamefiNftByName, {
        args: [{ chainId, domainName }],
        taskQueue: TEMPORAL_QUEUES.MINT,
        workflowId: lockNamefiNftByName.generateId({ chainId, domainName }),
        workflowIdConflictPolicy: 'USE_EXISTING',
        workflowIdReusePolicy: 'ALLOW_DUPLICATE',
      });
    }

    const eppLockState = await getEppLockState(domainName);
    if (eppLockState.locked) {
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
    }

    try {
      await sendStyledEmailNotification({
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
    workflow.log.error('Error preparing domain for export', error);
    try {
      await sendStyledEmailNotification({
        userId,
        messageMarkdown: `### Error preparing domain for export

        We encountered an error while preparing your domain ${domainName} for export. Please go to the dashboard to retry.
      `,
        showGoToDashboard: true,
        title: '[Namefi] Error preparing domain for export',
      });
    } catch (error: any) {
      workflow.log.error('Error sending email notification', error);
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
