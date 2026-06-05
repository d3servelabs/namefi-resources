import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import type { Registrars } from '@namefi-astra/registrars/registrars/registrars-keys';
import type {
  ChecksumWalletAddress,
  NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import { typedProxyActivities } from '../../shared/workflow-helpers/typed-proxy-activities';
import {
  TEMPORAL_ENUMS,
  TEMPORAL_QUEUES,
  shortRunningOpts,
} from '../../shared';
import { resetNameserversWorkflow } from '../reset-nameservers.workflow';
import type { OrderItemDomainSetupOptions } from '@namefi-astra/common/contract/entity-schemas';

export interface DomainSetupWorkflowInput {
  operationType: 'IMPORT' | 'REGISTER';
  normalizedDomainName: NamefiNormalizedDomain;
  userId: string;
  recipientWalletAddress: ChecksumWalletAddress;
  registrarKey: Registrars;
  options: OrderItemDomainSetupOptions;
}

const { generalAlertNamefi, parseDomainName } = typedProxyActivities({
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
    const parseResult = await parseDomainName(input.normalizedDomainName);
    const { autoPark, autoEns, autoRenew, dnssec, keepExistingNameservers } =
      input.options;

    try {
      // Only include explicitly-provided overrides so unset options keep
      // fillDefaultDomainConfig's own defaults (and we never write `undefined`
      // over a NOT NULL column).
      await fillDefaultDomainConfig(input.normalizedDomainName, input.userId, {
        ...(autoPark !== undefined && { autoParkEnabled: autoPark }),
        ...(autoEns !== undefined && { autoEnsEnabled: autoEns }),
        ...(autoRenew !== undefined && { autoRenewEnabled: autoRenew }),
        ...(dnssec !== undefined && { dnssecEnabled: dnssec }),
      });
    } catch (e: any) {
      workflow.log.error(
        `Failed to set defaults ${input.normalizedDomainName}`,
        e,
      );
    }
    if (parseResult.valid && parseResult.registryType === 'traditional') {
      if (keepExistingNameservers) {
        // Import-only: keep the domain's current DNS provider by skipping the
        // nameserver reset entirely. The flag is only ever set for IMPORT items
        // (enforced at order-item / cart-item creation).
        workflow.log.info(
          `Keeping existing nameservers for ${input.normalizedDomainName}; skipping reset`,
        );
      } else {
        await workflow.executeChild(resetNameserversWorkflow, {
          taskQueue: TEMPORAL_QUEUES.DOMAINS,
          args: [
            {
              domainName: input.normalizedDomainName as PunycodeDomainName, // TODO: Add validation or type guard
              // Skip enabling DNSSEC when the item opted out (dnssec === false);
              // undefined keeps the default behavior (enable if supported).
              enableDnssec: dnssec,
            },
          ],
          workflowId: resetNameserversWorkflow.generateId({
            domainName: input.normalizedDomainName as PunycodeDomainName,
          }),
          workflowIdReusePolicy: 'ALLOW_DUPLICATE',
        });
      }
    } else if (parseResult.valid && parseResult.registryType === 'subdomain') {
      // TODO: Implement domain setup for 3 levels
      return;
    } else {
      throw workflow.ApplicationFailure.create({
        message: `Invalid domain name "${input.normalizedDomainName}"`,
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
