import { log } from '@temporalio/workflow';
import { ApplicationFailure } from '@temporalio/workflow';
import { shortRunningOpts, TEMPORAL_ENUMS } from '../../shared';
import { typedProxyActivities } from '../../shared/workflow-helpers/typed-proxy-activities';

const {
  getEndedCampaignsForAwarding,
  getCampaignRankingsForAwarding,
  createCampaignAwards,
  updateCampaignStatusToAwarded,
  checkCampaignAwardedStatus,
  getCampaignDetails,
} = typedProxyActivities({
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

type Campaign = Awaited<ReturnType<typeof getCampaignDetails>>;
interface ProcessedCampaign {
  campaignKey: string;
  title: string;
  status: 'success' | 'failed' | 'skipped';
  message: string;
  awardsCreated?: number;
  error?: string;
}

export type CampaignAwardWorkflowInput = {
  campaignKey?: string; // Optional: if provided, award specific campaign
};

export type CampaignAwardWorkflowOutput = {
  processedCampaigns: Array<ProcessedCampaign>;
  totalProcessed: number;
  totalSuccess: number;
  totalFailed: number;
  totalSkipped: number;
};

const getCampaignsToProcess = async (
  campaignKey?: string,
): Promise<Array<Campaign>> => {
  if (campaignKey) {
    try {
      return [await getCampaignDetails(campaignKey)];
    } catch (error) {
      throw ApplicationFailure.create({
        nonRetryable: true,
        message: `Failed to get campaign details for ${campaignKey}`,
        cause: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }
  try {
    return await getEndedCampaignsForAwarding();
  } catch (error) {
    throw ApplicationFailure.create({
      nonRetryable: true,
      message: 'Failed to get ended campaigns',
      cause: error instanceof Error ? error : new Error(String(error)),
    });
  }
};

const processCampaign = async (
  campaign: Campaign,
): Promise<ProcessedCampaign> => {
  try {
    log.info('Processing campaign', {
      campaignKey: campaign.campaignKey,
      title: campaign.title,
    });

    // Check if campaign is already awarded
    const { isAwarded, status } = await checkCampaignAwardedStatus(
      campaign.campaignKey,
    );

    if (isAwarded) {
      return {
        campaignKey: campaign.campaignKey,
        title: campaign.title,
        status: 'skipped',
        message: `Campaign already awarded (status: ${status})`,
      };
    }

    // Get current rankings for the campaign
    const rankings = await getCampaignRankingsForAwarding(campaign.campaignKey);

    if (rankings.length === 0) {
      return {
        campaignKey: campaign.campaignKey,
        title: campaign.title,
        status: 'skipped',
        message: 'No domains found in campaign',
      };
    }

    // Create awards for the campaign
    const awardResult = await createCampaignAwards(
      campaign.campaignKey,
      campaign.title,
      rankings,
    );

    // Update campaign status to AWARDED
    await updateCampaignStatusToAwarded(campaign.campaignKey);

    log.info('Successfully awarded campaign', {
      campaignKey: campaign.campaignKey,
      awardsCreated: awardResult.createdAwards,
    });

    return {
      campaignKey: campaign.campaignKey,
      title: campaign.title,
      status: 'success',
      message: awardResult.message,
      awardsCreated: awardResult.createdAwards,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error('Failed to process campaign', {
      campaignKey: campaign.campaignKey,
      error: errorMessage,
    });

    return {
      campaignKey: campaign.campaignKey,
      title: campaign.title,
      status: 'failed',
      message: 'Failed to process campaign',
      error: errorMessage,
    };
  }
};

/**
 * Workflow to automatically award campaigns that have ended
 * This workflow can be triggered manually for a specific campaign or run automatically to process all ended campaigns
 */
export const campaignAwardWorkflow = async (
  input: CampaignAwardWorkflowInput = {},
): Promise<CampaignAwardWorkflowOutput> => {
  const { campaignKey } = input;

  log.info('Starting campaign award workflow', { campaignKey });

  const campaignsToProcess: Array<Campaign> =
    await getCampaignsToProcess(campaignKey);

  const results: Array<ProcessedCampaign> = await Promise.all(
    campaignsToProcess.map((campaign) => processCampaign(campaign)),
  );

  const totalProcessed = results.length;
  const totalSuccess = results.filter((r) => r.status === 'success').length;
  const totalFailed = results.filter((r) => r.status === 'failed').length;
  const totalSkipped = results.filter((r) => r.status === 'skipped').length;

  const output: CampaignAwardWorkflowOutput = {
    processedCampaigns: results,
    totalProcessed,
    totalSuccess,
    totalFailed,
    totalSkipped,
  };

  log.info('Campaign award workflow completed', {
    totalProcessed,
    totalSuccess,
    totalFailed,
    totalSkipped,
  });

  return output;
};
