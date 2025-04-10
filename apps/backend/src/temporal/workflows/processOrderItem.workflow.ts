import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import { ApplicationFailure } from '@temporalio/workflow';
import { TEMPORAL_QUEUES } from '../shared';
import { registerSubdomainWorkflow } from './register-subdomain.workflow';

export interface ProcessOrderItemWorkflowInput {
  itemId: string;
  orderId: string;
  normalizedDomainName: NamefiNormalizedDomain;
  nftWalletAddress: `0x${string}`;
  nftChainId: number;
}

/**
 * Process a single order item by registering the domain
 */
export async function processOrderItemWorkflow(
  input: ProcessOrderItemWorkflowInput,
): Promise<void> {
  const { normalizedDomainName, nftWalletAddress, nftChainId } = input;

  try {
    // Register the domain
    await workflow.executeChild(registerSubdomainWorkflow, {
      args: [
        {
          normalizedDomainName,
          chainId: nftChainId,
          toAddress: nftWalletAddress as `0x${string}`,
          // TODO: (sid->sami) Change this if needed to parent domain expiration time
          durationInYears: 3,
        },
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
