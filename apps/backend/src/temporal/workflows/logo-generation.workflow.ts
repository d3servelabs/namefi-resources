import * as workflow from '@temporalio/workflow';
import { TEMPORAL_ENUMS } from '../shared/enums';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import type { LogoStyleInput, LogoTypeInput } from '@namefi-astra/ai';

export interface GenerateLogosWorkflowInput {
  // model provider selection
  model:
    | 'gpt-image-1'
    | 'gpt-image-1.5'
    | 'gemini-2.5-flash-image'
    | 'gemini-3-pro-image-preview';
  // optional explicit domains to process; if provided, skip DB pagination
  domains?: NamefiNormalizedDomain[];
  // batching and rate limiting
  pageSize?: number; // per page domains
  startOffset?: number; // start from offset for resumption
  maxPages?: number; // optional cap
  perPageConcurrency?: number; // p-map concurrency per page
  // prompt knobs
  description?: string;
  logoType?: LogoTypeInput;
  logoStyle?: LogoStyleInput;
  // correlation id
  batchId?: string;
  // if true, only generate for domains that don't already have a logo
  skipExisting?: boolean;
}

export interface GenerateLogosWorkflowResult {
  totalProcessed: number;
  totalSuccesses: number;
  totalFailures: number;
}

export async function generateLogosForAliveNftsWorkflow(
  input: GenerateLogosWorkflowInput,
): Promise<GenerateLogosWorkflowResult> {
  const {
    model,
    domains: explicitDomains,
    pageSize = 200,
    startOffset = 0,
    maxPages,
    perPageConcurrency = 5,
    description,
    logoType,
    logoStyle,
    batchId,
    skipExisting = false,
  } = input;

  const { listAliveNftDomains, generateLogosForDomains } = typedProxyActivities(
    {
      temporalEnum: TEMPORAL_ENUMS.DEFAULT,
      options: {
        startToCloseTimeout: '1 hour',
        heartbeatTimeout: '30 seconds',
        retry: {
          initialInterval: '5 seconds',
          backoffCoefficient: 2,
          maximumInterval: '1 minute',
          maximumAttempts: 5,
        },
      },
    },
  );

  let offset = startOffset;
  let page = 0;
  let totalProcessed = 0;
  let totalSuccesses = 0;
  let totalFailures = 0;

  // If explicit domains provided, process them directly and return
  if (explicitDomains && explicitDomains.length > 0) {
    const { processed, successes, failures } = await generateLogosForDomains({
      domains: explicitDomains,
      model,
      concurrency: perPageConcurrency,
      description,
      logoType,
      logoStyle,
      batchId,
    });
    return {
      totalProcessed: processed,
      totalSuccesses: successes,
      totalFailures: failures,
    };
  }

  // Paginate until no more domains or maxPages reached; small delay per page
  while (true) {
    if (maxPages !== undefined && page >= maxPages) break;

    const domains = await listAliveNftDomains({
      limit: pageSize,
      offset,
      skipExisting,
    });
    if (!domains.length) break;

    const { processed, successes, failures } = await generateLogosForDomains({
      domains,
      model,
      concurrency: perPageConcurrency,
      description,
      logoType,
      logoStyle,
      batchId,
    });

    totalProcessed += processed;
    totalSuccesses += successes;
    totalFailures += failures;

    // Advance pagination
    offset += pageSize;
    page += 1;

    // Backoff between pages (tunable if needed later)
    await workflow.sleep(2000);
  }

  return { totalProcessed, totalSuccesses, totalFailures };
}
