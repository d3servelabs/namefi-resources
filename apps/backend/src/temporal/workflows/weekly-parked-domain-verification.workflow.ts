import * as workflow from '@temporalio/workflow';
import { shortRunningOpts, TEMPORAL_ENUMS } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { catchAndAlertLocally } from '../shared/workflow-helpers/catch-and-alert-locally';

const {
  collectParkedDomains,
  verifyParkedDomainsChunk,
  sendParkedDomainVerificationReportEmail,
} = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.INDEXERS,
  options: {
    ...shortRunningOpts,
    // A chunk runs concurrency-limited live network probes; give it room.
    startToCloseTimeout: '15m',
  },
});

export interface WeeklyParkedDomainVerificationInput {
  /** Domains probed in parallel within a chunk. */
  concurrency?: number;
  /** Domains per verification activity. */
  chunkSize?: number;
  /** Max warn/fail domains included in the report — caps the email table AND the CSV attachment. */
  maxProblemsInReport?: number;
}

export interface WeeklyParkedDomainVerificationOutput {
  totalParked: number;
  totalChecked: number;
  counts: { pass: number; warn: number; fail: number; skipped: number };
  problemsReported: number;
  emailSent: boolean;
  executionTimeMs: number;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export async function weeklyParkedDomainVerificationWorkflow({
  concurrency = 8,
  chunkSize = 100,
  maxProblemsInReport = 200,
}: WeeklyParkedDomainVerificationInput = {}): Promise<WeeklyParkedDomainVerificationOutput> {
  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new Error(`Invalid chunkSize: ${chunkSize}. Expected integer >= 1.`);
  }
  if (!Number.isInteger(concurrency) || concurrency <= 0) {
    throw new Error(
      `Invalid concurrency: ${concurrency}. Expected integer >= 1.`,
    );
  }
  if (!Number.isInteger(maxProblemsInReport) || maxProblemsInReport < 0) {
    throw new Error(
      `Invalid maxProblemsInReport: ${maxProblemsInReport}. Expected integer >= 0.`,
    );
  }

  const startTime = Date.now();
  workflow.log.info('Starting weekly parked-domain verification', {
    concurrency,
    chunkSize,
  });

  const { domains, totalParked } = await collectParkedDomains();

  const counts = { pass: 0, warn: 0, fail: 0, skipped: 0 };
  // Derive the problem type from the activity's return type so the workflow
  // bundle needs no import from the (react-email) mail template module.
  type ChunkReport = Awaited<ReturnType<typeof verifyParkedDomainsChunk>>;
  const problems: ChunkReport['problems'] = [];
  let totalChecked = 0;

  // Sequential chunks: each activity already bounds intra-chunk concurrency, so
  // this avoids hammering DoH / parked hosts (and keeps history small).
  for (const batch of chunk(domains, chunkSize)) {
    const report = await verifyParkedDomainsChunk({
      domains: batch,
      concurrency,
    });
    totalChecked += report.total;
    counts.pass += report.counts.pass;
    counts.warn += report.counts.warn;
    counts.fail += report.counts.fail;
    counts.skipped += report.counts.skipped;
    for (const problem of report.problems) {
      if (problems.length < maxProblemsInReport) problems.push(problem);
    }
  }

  const totalProblems = counts.warn + counts.fail;
  const problemsTruncated = totalProblems > problems.length;

  let emailSent = false;
  await catchAndAlertLocally(
    async () => {
      await sendParkedDomainVerificationReportEmail({
        generatedAt: new Date(startTime).toISOString(),
        totalParked,
        totalChecked,
        counts,
        problems,
        problemsTruncated,
      });
      emailSent = true;
    },
    {
      message: 'Failed to send weekly parked-domain verification report email',
    },
  );

  const executionTimeMs = Date.now() - startTime;
  workflow.log.info('Finished weekly parked-domain verification', {
    totalParked,
    totalChecked,
    counts,
    problemsReported: problems.length,
    emailSent,
    executionTimeMs,
  });

  return {
    totalParked,
    totalChecked,
    counts,
    problemsReported: problems.length,
    emailSent,
    executionTimeMs,
  };
}
