import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import type { Registrars } from '@namefi-astra/registrars/registrars/registrars-keys';
import type {
  ChecksumWalletAddress,
  NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import { typedProxyActivities } from '../../shared/workflow-helpers/typed-proxy-activities';
import { getDomainLevels } from '#lib/get-domain-levels';
import {
  TEMPORAL_ENUMS,
  TEMPORAL_QUEUES,
  shortRunningOpts,
} from '../../shared';
import { resetNameserversWorkflow } from '../reset-nameservers.workflow';

export interface DomainSetupWorkflowInput {
  operationType: 'IMPORT' | 'REGISTER';
  normalizedDomainName: NamefiNormalizedDomain;
  userId: string;
  recipientWalletAddress: ChecksumWalletAddress;
  registrarKey: Registrars;
  options: {
    autoPark: boolean;
  };
}

const { generalAlertNamefi } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: shortRunningOpts,
});

const { fillDefaultDomainConfig } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DOMAINS,
  options: shortRunningOpts,
});

export async function domainSetupWorkflow(
  input: DomainSetupWorkflowInput,
): Promise<void> {
  try {
    const { levels } = getDomainLevels(input.normalizedDomainName);

    try {
      await fillDefaultDomainConfig(input.normalizedDomainName, input.userId, {
        autoParkEnabled: input.options.autoPark,
      });
    } catch (e: any) {
      workflow.log.error(
        `Failed to set defaults ${input.normalizedDomainName}`,
        e,
      );
    }
    if (levels.length === 2) {
      await workflow.executeChild(resetNameserversWorkflow, {
        taskQueue: TEMPORAL_QUEUES.DOMAINS,
        args: [
          {
            domainName: input.normalizedDomainName as PunycodeDomainName, // TODO: Add validation or type guard
          },
        ],
        workflowId: resetNameserversWorkflow.generateId({
          domainName: input.normalizedDomainName as PunycodeDomainName,
        }),
        workflowIdReusePolicy: 'ALLOW_DUPLICATE',
      });
    } else if (levels.length >= 3) {
      // TODO: Implement domain setup for 3 levels
      return;
    } else {
      throw workflow.ApplicationFailure.create({
        message: `Invalid domain name "${input.normalizedDomainName}", unsupported number of levels: ${levels.length}`,
        nonRetryable: true,
      });
    }
  } catch (error: any) {
    try {
      await generalAlertNamefi({
        title: 'Domain Setup Failed',
        message: `Domain setup failed for ${input.normalizedDomainName}`,
        error,
        operation: 'DOMAIN_SETUP',
        input,
      });
    } catch (notificationError: any) {
      // Log but don't throw - we don't want notification failures to mask the original error
      workflow.log.error(
        'Failed to send failure notifications:',
        notificationError,
      );
    }
    throw workflow.ApplicationFailure.create({
      nonRetryable: true,
      message: 'Domain setup failed',
      details: error,
    });
  }
}
