import { log } from '@temporalio/workflow';
import { shortRunningOpts, TEMPORAL_ENUMS } from '../../shared';
import { typedProxyActivities } from '../../shared/workflow-helpers/typed-proxy-activities';
import { HUNT_PERIOD_AWARD_LIMITS } from '../../../lib/env/consts';

const {
  getPeriodRankingsForAwarding,
  createPeriodAwards,
  checkPeriodAwardsExist,
  generatePeriodKey,
  generateLatestPeriodKey,
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

type PeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

interface PeriodToProcess {
  type: PeriodType;
  periodKey: string;
}
interface ProcessedPeriod {
  type: PeriodType;
  periodKey: string;
  status: 'success' | 'failed' | 'skipped';
  message: string;
  awardsCreated?: number;
  error?: string;
}

export type PeriodAwardWorkflowInput = {
  type?: PeriodType; // Optional: if provided, award specific period type
  date?: string; // Optional: if provided, award specific period
};

export type PeriodAwardWorkflowOutput = {
  processedPeriods: Array<ProcessedPeriod>;
  totalProcessed: number;
  totalSuccess: number;
  totalFailed: number;
  totalSkipped: number;
};

const getPeriodsToProcess = async (
  type?: PeriodType,
  date?: string,
): Promise<Array<PeriodToProcess>> => {
  const periodsToProcess: Array<PeriodToProcess> = [];

  if (type && date) {
    // Process specific period
    const periodKey = await generatePeriodKey(type, new Date(date));
    periodsToProcess.push({ type, periodKey });
    log.info('Processing specific period', { type, periodKey });
  } else if (type) {
    // Process latest period of specific type
    const latestPeriodKey = await generateLatestPeriodKey(type);
    periodsToProcess.push({ type, periodKey: latestPeriodKey });
    log.info('Processing latest period', {
      type,
      periodKey: latestPeriodKey,
    });
  } else {
    // Process all latest periods
    const types: Array<PeriodType> = ['WEEKLY', 'MONTHLY'];
    for (const periodType of types) {
      const latestPeriodKey = await generateLatestPeriodKey(periodType);
      periodsToProcess.push({ type: periodType, periodKey: latestPeriodKey });
    }
    log.info('Processing all last periods', {
      count: periodsToProcess.length,
    });
  }

  return periodsToProcess;
};

const processPeriod = async (
  period: PeriodToProcess,
): Promise<ProcessedPeriod> => {
  try {
    log.info('Processing period', {
      type: period.type,
      periodKey: period.periodKey,
    });

    // Check if awards already exist
    const { exists } = await checkPeriodAwardsExist(
      period.type,
      period.periodKey,
    );
    if (exists) {
      return {
        type: period.type,
        periodKey: period.periodKey,
        status: 'skipped',
        message: `Awards already exist for ${period.type} period ${period.periodKey}`,
      };
    }

    // Get current rankings for the period
    const limit = HUNT_PERIOD_AWARD_LIMITS[period.type];
    const rankings = await getPeriodRankingsForAwarding(
      period.type,
      period.periodKey,
      limit,
    );

    if (rankings.length === 0) {
      return {
        type: period.type,
        periodKey: period.periodKey,
        status: 'skipped',
        message: 'No domains found for this period',
      };
    }

    // Create awards for the period
    const awardResult = await createPeriodAwards(
      period.type,
      period.periodKey,
      rankings,
    );

    log.info('Successfully awarded period', {
      type: period.type,
      periodKey: period.periodKey,
      awardsCreated: awardResult.createdAwards,
    });

    return {
      type: period.type,
      periodKey: period.periodKey,
      status: 'success',
      message: awardResult.message,
      awardsCreated: awardResult.createdAwards,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error('Failed to process period', {
      type: period.type,
      periodKey: period.periodKey,
      error: errorMessage,
    });

    return {
      type: period.type,
      periodKey: period.periodKey,
      status: 'failed',
      message: 'Failed to process period',
      error: errorMessage,
    };
  }
};

/**
 * Workflow to automatically award periods (daily, weekly, monthly, yearly)
 * This workflow can be triggered manually for a specific period or run automatically to process current periods
 */
export const periodAwardWorkflow = async (
  input: PeriodAwardWorkflowInput = {},
): Promise<PeriodAwardWorkflowOutput> => {
  const { type, date } = input;

  log.info('Starting period award workflow', { type, date });

  const periodsToProcess: Array<PeriodToProcess> = await getPeriodsToProcess(
    type,
    date,
  );

  const results: Array<ProcessedPeriod> = await Promise.all(
    periodsToProcess.map((period) => processPeriod(period)),
  );

  const totalProcessed = results.length;
  const totalSuccess = results.filter((r) => r.status === 'success').length;
  const totalFailed = results.filter((r) => r.status === 'failed').length;
  const totalSkipped = results.filter((r) => r.status === 'skipped').length;

  const output: PeriodAwardWorkflowOutput = {
    processedPeriods: results,
    totalProcessed,
    totalSuccess,
    totalFailed,
    totalSkipped,
  };

  log.info('Period award workflow completed', {
    totalProcessed,
    totalSuccess,
    totalFailed,
    totalSkipped,
  });

  return output;
};
