import * as workflow from '@temporalio/workflow';

import { shortRunningOpts, TEMPORAL_ENUMS } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';

export interface LeadgenWorkflowInput {
  runId: string;
  userId: string;
  domain: string;
  reasoningEffort: 'low' | 'medium' | 'high';
  askingPriceUsd?: number;
  runProfile?: 'full' | 'campaign_short';
  selectedRecipeLimit?: number;
  rawCandidateLimit?: number;
  contactDiscoveryLimit?: number;
}

export interface LeadgenWorkflowResult {
  leadCount: number;
  contactCount: number;
  draftCount: number;
}

interface WorkflowErrorSummary {
  name: string;
  message: string;
  stack?: string;
  cause?: WorkflowErrorSummary;
}

const SLACK_FIELD_LIMIT = 1800;

const { sendOutboundWorkflowFailureAlertToSlack } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: {
    ...shortRunningOpts,
    retry: {
      ...shortRunningOpts.retry,
      maximumInterval: '1 minute',
      maximumAttempts: 10,
    },
  },
});

function resolveLeadgenRunLimits(input: LeadgenWorkflowInput) {
  const isCampaignShortRun = input.runProfile === 'campaign_short';
  const toLimit = (value: number | undefined, fallback: number) =>
    value == null ? fallback : Math.max(0, Math.floor(value));
  const effortDefaults = {
    low: {
      maxTheses: 2,
      rawCandidateLimit: 20,
      contactDiscoveryLimit: 2,
      earlyContactDiscoveryLimit: 1,
      selectedRecipeLimit: 1,
    },
    medium: {
      maxTheses: 3,
      rawCandidateLimit: 45,
      contactDiscoveryLimit: 5,
      earlyContactDiscoveryLimit: 2,
      selectedRecipeLimit: 3,
    },
    high: {
      maxTheses: 5,
      rawCandidateLimit: 90,
      contactDiscoveryLimit: 8,
      earlyContactDiscoveryLimit: 3,
      selectedRecipeLimit: 5,
    },
  }[input.reasoningEffort];

  const selectedRecipeLimit = toLimit(
    input.selectedRecipeLimit,
    isCampaignShortRun ? 1 : effortDefaults.selectedRecipeLimit,
  );
  const rawCandidateLimit = toLimit(
    input.rawCandidateLimit,
    isCampaignShortRun ? 20 : effortDefaults.rawCandidateLimit,
  );
  const contactDiscoveryLimit = toLimit(
    input.contactDiscoveryLimit,
    isCampaignShortRun ? 5 : effortDefaults.contactDiscoveryLimit,
  );

  return {
    maxTheses: effortDefaults.maxTheses,
    selectedRecipeLimit,
    rawCandidateLimit,
    contactDiscoveryLimit,
    earlyContactDiscoveryLimit: isCampaignShortRun
      ? Math.min(2, contactDiscoveryLimit)
      : Math.min(
          effortDefaults.earlyContactDiscoveryLimit,
          contactDiscoveryLimit,
        ),
  };
}

export async function runLeadgenWorkflow(
  input: LeadgenWorkflowInput,
): Promise<LeadgenWorkflowResult> {
  const {
    maxTheses,
    selectedRecipeLimit,
    rawCandidateLimit,
    contactDiscoveryLimit,
    earlyContactDiscoveryLimit,
  } = resolveLeadgenRunLimits(input);
  const reservedRecipeCandidateLimit =
    selectedRecipeLimit > 0 && rawCandidateLimit > 1 ? 1 : 0;
  const seedCandidateLimit =
    rawCandidateLimit === 0
      ? 0
      : Math.min(
          12,
          Math.max(0, rawCandidateLimit - reservedRecipeCandidateLimit),
          Math.max(6, Math.ceil(rawCandidateLimit * 0.35)),
        );
  const recipeCandidateLimit = Math.max(
    0,
    rawCandidateLimit - seedCandidateLimit,
  );
  const {
    initializeLeadgenRun,
    generateLeadgenDomainProfileActivity,
    discoverLeadgenSeedCandidatesActivity,
    discoverLeadgenRecipeCandidatesActivity,
    discoverLeadgenEarlyContactsActivity,
    finalizeLeadgenOpportunitiesActivity,
    completeLeadgenRun,
    failLeadgenRun,
  } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      startToCloseTimeout: '20 minutes',
      heartbeatTimeout: '2 minutes',
      retry: {
        initialInterval: '10 seconds',
        backoffCoefficient: 2,
        maximumInterval: '2 minutes',
        maximumAttempts: 2,
      },
    },
  });

  try {
    await initializeLeadgenRun({
      runId: input.runId,
      workflowId: workflow.workflowInfo().workflowId,
    });

    const profileTask = generateLeadgenDomainProfileActivity({
      runId: input.runId,
      domain: input.domain,
      reasoningEffort: input.reasoningEffort,
      maxTheses,
    });

    const seedDiscoveryTask = discoverLeadgenSeedCandidatesActivity({
      runId: input.runId,
      sourceDomain: input.domain,
      reasoningEffort: input.reasoningEffort,
      rawCandidateLimit: seedCandidateLimit,
      askingPriceUsd: input.askingPriceUsd,
    });

    const { domainProfile } = await profileTask;
    const recipeDiscoveryTask =
      recipeCandidateLimit > 0 && selectedRecipeLimit > 0
        ? discoverLeadgenRecipeCandidatesActivity({
            runId: input.runId,
            sourceDomain: input.domain,
            domainProfile,
            reasoningEffort: input.reasoningEffort,
            selectedRecipeLimit,
            rawCandidateLimit: recipeCandidateLimit,
            askingPriceUsd: input.askingPriceUsd,
          })
        : Promise.resolve({ inserted: 0 });

    await seedDiscoveryTask;
    const earlyContactTask = discoverLeadgenEarlyContactsActivity({
      runId: input.runId,
      sourceDomain: input.domain,
      reasoningEffort: input.reasoningEffort,
      contactDiscoveryLimit: earlyContactDiscoveryLimit,
    });

    await Promise.all([recipeDiscoveryTask, earlyContactTask]);

    await finalizeLeadgenOpportunitiesActivity({
      runId: input.runId,
      sourceDomain: input.domain,
      domainProfile,
      reasoningEffort: input.reasoningEffort,
      askingPriceUsd: input.askingPriceUsd,
      contactDiscoveryLimit,
    });

    return await completeLeadgenRun({ runId: input.runId });
  } catch (error) {
    const failure = summarizeWorkflowError(error);
    let statusUpdateFailure: WorkflowErrorSummary | null = null;

    try {
      await failLeadgenRun({
        runId: input.runId,
        errorMessage: failure.message,
      });
    } catch (statusError) {
      statusUpdateFailure = summarizeWorkflowError(statusError);
      workflow.log.error('Failed to mark leadgen run as failed', {
        runId: input.runId,
        error: statusUpdateFailure,
      });
    }

    await alertOutboundWorkflowFailure({
      input,
      failure,
      statusUpdateFailure,
    });

    throw error;
  }
}

async function alertOutboundWorkflowFailure({
  input,
  failure,
  statusUpdateFailure,
}: {
  input: LeadgenWorkflowInput;
  failure: WorkflowErrorSummary;
  statusUpdateFailure: WorkflowErrorSummary | null;
}) {
  const info = workflow.workflowInfo();

  try {
    await sendOutboundWorkflowFailureAlertToSlack({
      title: `Leadgen workflow failed for ${input.domain}`,
      message: `Outbound workflow failed for ${input.domain}: ${failure.message}`,
      extraData: {
        outboundRunId: input.runId,
        userId: input.userId,
        domain: input.domain,
        workflowId: info.workflowId,
        runId: info.runId,
        reasoningEffort: input.reasoningEffort,
        runProfile: input.runProfile ?? 'full',
        askingPriceUsd: input.askingPriceUsd ?? 'not provided',
        selectedRecipeLimit: input.selectedRecipeLimit ?? 'default',
        rawCandidateLimit: input.rawCandidateLimit ?? 'default',
        contactDiscoveryLimit: input.contactDiscoveryLimit ?? 'default',
        error: truncateSlackField(formatWorkflowErrorChain(failure)),
        errorStack: failure.stack ?? 'not available',
        statusUpdateError: statusUpdateFailure
          ? truncateSlackField(formatWorkflowErrorChain(statusUpdateFailure))
          : 'none',
      },
    });
  } catch (alertError) {
    workflow.log.warn('Failed to send outbound workflow failure Slack alert', {
      runId: input.runId,
      error: summarizeWorkflowError(alertError),
    });
  }
}

function summarizeWorkflowError(
  error: unknown,
  depth = 0,
): WorkflowErrorSummary {
  if (depth > 4) {
    return {
      name: 'Error',
      message: 'Nested error depth limit reached',
    };
  }

  if (error instanceof Error) {
    const errorWithCause = error as Error & { cause?: unknown };
    return {
      name: error.name || 'Error',
      message: error.message || String(error),
      ...(error.stack ? { stack: truncateSlackField(error.stack) } : {}),
      ...(errorWithCause.cause
        ? { cause: summarizeWorkflowError(errorWithCause.cause, depth + 1) }
        : {}),
    };
  }

  return {
    name: typeof error,
    message: String(error),
  };
}

function formatWorkflowErrorChain(error: WorkflowErrorSummary): string {
  const chain: string[] = [];
  let current: WorkflowErrorSummary | undefined = error;

  while (current) {
    chain.push(`${current.name}: ${current.message}`);
    current = current.cause;
  }

  return chain.join('\nCaused by: ');
}

function truncateSlackField(value: string) {
  if (value.length <= SLACK_FIELD_LIMIT) {
    return value;
  }

  return `${value.slice(0, SLACK_FIELD_LIMIT - 24)}... [truncated]`;
}
