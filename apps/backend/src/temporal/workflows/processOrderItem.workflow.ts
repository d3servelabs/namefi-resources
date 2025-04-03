import { CHAINS, type NamefiNormalizedDomain } from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import { ApplicationFailure } from '@temporalio/workflow';
import { TEMPORAL_QUEUES } from '../shared';
import { registerSubdomainWorkflow } from './register-subdomain.workflow';

export interface ProcessOrderItemWorkflowInput {
  itemId: string;
  orderId: string;
  normalizedDomainName: NamefiNormalizedDomain;
  userAddress: `0x${string}`;
}

/**
 * Process a single order item by registering the domain
 */
export async function processOrderItemWorkflow(
  input: ProcessOrderItemWorkflowInput,
): Promise<void> {
  const { normalizedDomainName, userAddress } = input;

  try {
    // TODO: (sid->Ssamo) Figure out how to get the chainId from the order item
    const chainId = CHAINS.base.id; // Example: Ethereum Mainnet
    // TODO: (sid->sami) Change this if needed to parent domain expiration time
    const expirationTimeInSeconds = 31536000 * 3; // Subdomain will expire in 3 years

    // Register the domain
    await workflow.executeChild(registerSubdomainWorkflow, {
      args: [
        normalizedDomainName,
        chainId,
        userAddress as `0x${string}`,
        expirationTimeInSeconds,
      ],
      taskQueue: TEMPORAL_QUEUES.DOMAINS,
      workflowId: `register-domain-${input.orderId}-${input.itemId}`,
    });
  } catch (e) {
    workflow.log.error(
      `Failed to process order item ${input.itemId} for order ${input.orderId}: ${
        e instanceof Error ? e.message : String(e)
      }`,
    );

    throw ApplicationFailure.create({
      nonRetryable: true,
      message: `Process Order Item Failed: ${
        e instanceof Error ? e.message : String(e)
      }`,
      cause: e instanceof Error ? e : new Error(String(e)),
    });
  }
}
