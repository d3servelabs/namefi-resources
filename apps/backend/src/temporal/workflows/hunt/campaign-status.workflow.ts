import { log } from '@temporalio/workflow';
import { ApplicationFailure } from '@temporalio/workflow';
import { shortRunningOpts, TEMPORAL_ENUMS } from '../../shared';
import { typedProxyActivities } from '../../shared/workflow-helpers/typed-proxy-activities';

const { updateExpiredActiveCampaignsToEnded } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.HUNT,
  options: {
    ...shortRunningOpts,
    retry: {
      initialInterval: '30 seconds',
      maximumInterval: '5 minutes',
      backoffCoefficient: 2,
      maximumAttempts: 3,
    },
  },
});

export type CampaignStatusWorkflowOutput = {
  success: boolean;
  message: string;
  updatedCampaigns: Array<{
    campaignKey: string;
    title: string;
    endDate: Date;
  }>;
  count: number;
  error?: string;
};

/**
 * Workflow to automatically update expired ACTIVE campaigns to ENDED status
 * This workflow should be scheduled to run periodically (e.g., every 15 minutes)
 */
export const campaignStatusWorkflow =
  async (): Promise<CampaignStatusWorkflowOutput> => {
    log.info('Starting campaign status workflow');

    try {
      // Update expired ACTIVE campaigns to ENDED
      const result = await updateExpiredActiveCampaignsToEnded();

      log.info('Campaign status workflow completed', {
        updatedCount: result.count,
        message: result.message,
      });

      return {
        success: result.success,
        message: result.message,
        updatedCampaigns: result.updatedCampaigns,
        count: result.count,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      log.error('Campaign status workflow failed', { error: errorMessage });

      throw ApplicationFailure.create({
        nonRetryable: false,
        message: 'Failed to update campaign statuses',
        cause: error instanceof Error ? error : new Error(String(error)),
      });
    }
  };
