import { workflowInfo } from '@temporalio/workflow';

import { TEMPORAL_ENUMS } from '../shared/enums';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';

export interface LeadgenWorkflowInput {
  runId: string;
  userId: string;
  domain: string;
  reasoningEffort: 'low' | 'medium' | 'high';
  runProfile?: 'full' | 'campaign_short';
  maxIntentQueries?: number;
  maxResultsPerQuery?: number;
  contactDiscoveryLimit?: number;
}

export interface LeadgenWorkflowResult {
  leadCount: number;
  contactCount: number;
  draftCount: number;
}

export async function runLeadgenWorkflow(
  input: LeadgenWorkflowInput,
): Promise<LeadgenWorkflowResult> {
  const isCampaignShortRun = input.runProfile === 'campaign_short';
  const maxIntentQueries =
    input.maxIntentQueries ?? (isCampaignShortRun ? 3 : undefined);
  const maxResultsPerQuery =
    input.maxResultsPerQuery ?? (isCampaignShortRun ? 5 : undefined);
  const contactDiscoveryLimit =
    input.contactDiscoveryLimit ?? (isCampaignShortRun ? 5 : undefined);
  const {
    initializeLeadgenRun,
    generateLeadgenIntentsActivity,
    searchLeadgenProspectsActivity,
    completeLeadgenRun,
    failLeadgenRun,
  } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      startToCloseTimeout: '20 minutes',
      heartbeatTimeout: '1 minute',
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

    const { queries } = await generateLeadgenIntentsActivity({
      runId: input.runId,
      domain: input.domain,
      reasoningEffort: input.reasoningEffort,
      ...(maxIntentQueries ? { maxQueries: maxIntentQueries } : {}),
    });

    const searchTasks = [
      searchLeadgenProspectsActivity({
        runId: input.runId,
        sourceDomain: input.domain,
        bucket: 'substring',
        queries: [input.domain],
        reasoningEffort: input.reasoningEffort,
        ...(maxResultsPerQuery ? { maxResultsPerQuery } : {}),
        ...(contactDiscoveryLimit ? { contactDiscoveryLimit } : {}),
      }),
    ];

    if (queries.length > 0) {
      searchTasks.push(
        searchLeadgenProspectsActivity({
          runId: input.runId,
          sourceDomain: input.domain,
          bucket: 'general',
          queries,
          reasoningEffort: input.reasoningEffort,
          ...(maxResultsPerQuery ? { maxResultsPerQuery } : {}),
          ...(contactDiscoveryLimit ? { contactDiscoveryLimit } : {}),
        }),
      );
    }

    await Promise.all(searchTasks);

    return await completeLeadgenRun({ runId: input.runId });
  } catch (error) {
    await failLeadgenRun({
      runId: input.runId,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
