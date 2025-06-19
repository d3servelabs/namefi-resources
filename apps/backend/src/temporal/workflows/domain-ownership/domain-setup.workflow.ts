import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import type { Registrars } from '@namefi-astra/registrars/registrars/registrars-keys';
import type {
  ChecksumWalletAddress,
  NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import { typedProxyActivities } from 'src/temporal/shared/workflow-helpers/typed-proxy-activities';
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
}

const { generalAlertNamefi } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: shortRunningOpts,
});

export async function domainSetupWorkflow(
  input: DomainSetupWorkflowInput,
): Promise<void> {
  try {
    const { levels } = getDomainLevels(input.normalizedDomainName);

    if (levels.length === 2) {
      await workflow.executeChild(resetNameserversWorkflow, {
        taskQueue: TEMPORAL_QUEUES.DOMAINS,
        args: [
          {
            domainName: input.normalizedDomainName as PunycodeDomainName, // TODO: Add validation or type guard
          },
        ],
        workflowId: `reset-nameservers-${input.normalizedDomainName}`,
        workflowIdConflictPolicy: 'USE_EXISTING',
        workflowIdReusePolicy: 'ALLOW_DUPLICATE',
      });
    } else if (levels.length === 3) {
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
