import * as workflow from '@temporalio/workflow';
import { ApplicationFailure } from '@temporalio/workflow';
import { TEMPORAL_QUEUES } from '../shared';

type Address = string;

export interface ProcessOrderItemWorkflowInput {
  itemId: string;
  orderId: string;
  normalizedDomainName: string;
  userAddress: Address;
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
    const chainId = 1; // Example: Ethereum Mainnet
    const expirationTimeInSeconds = 31536000; // 1 year in seconds

    // Register the domain
    await workflow.executeChild('registerSubdomainWorkflow', {
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
