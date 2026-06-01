import type { LogoStyleInput, LogoTypeInput } from '@namefi-astra/ai';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { TEMPORAL_ENUMS } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';

export interface GenerateNamefiFeedListingLogosWorkflowInput {
  domains: NamefiNormalizedDomain[];
  concurrency?: number;
  batchId?: string;
  logoType?: LogoTypeInput;
  logoStyle?: LogoStyleInput;
}

export interface GenerateNamefiFeedListingLogosWorkflowResult {
  processed: number;
  successes: number;
  failures: number;
  reusedExisting: number;
  skipped: number;
}

const { generateNamefiFeedListingLogosForDomains } = typedProxyActivities({
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
});

export async function generateNamefiFeedListingLogosWorkflow(
  input: GenerateNamefiFeedListingLogosWorkflowInput,
): Promise<GenerateNamefiFeedListingLogosWorkflowResult> {
  const domains = Array.from(new Set(input.domains));
  if (domains.length === 0) {
    return {
      processed: 0,
      successes: 0,
      failures: 0,
      reusedExisting: 0,
      skipped: 0,
    };
  }

  return await generateNamefiFeedListingLogosForDomains({
    domains,
    concurrency: input.concurrency,
    batchId: input.batchId,
    logoType: input.logoType,
    logoStyle: input.logoStyle,
  });
}
