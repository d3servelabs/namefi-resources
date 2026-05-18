import { workflowInfo } from '@temporalio/workflow';

import { TEMPORAL_ENUMS } from '../shared/enums';
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

function resolveLeadgenRunLimits(input: LeadgenWorkflowInput) {
  const isCampaignShortRun = input.runProfile === 'campaign_short';
  const toLimit = (value: number | undefined, fallback: number) =>
    value == null ? fallback : Math.max(0, Math.floor(value));
  const effortDefaults = {
    low: {
      rawCandidateLimit: 20,
      contactDiscoveryLimit: 2,
      earlyContactDiscoveryLimit: 1,
      selectedRecipeLimit: 1,
    },
    medium: {
      rawCandidateLimit: 45,
      contactDiscoveryLimit: 5,
      earlyContactDiscoveryLimit: 2,
      selectedRecipeLimit: 3,
    },
    high: {
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
    maxTheses: input.reasoningEffort === 'low' ? 2 : 3,
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
      workflowId: workflowInfo().workflowId,
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
    await failLeadgenRun({
      runId: input.runId,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
