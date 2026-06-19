import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname } from 'node:path';

type PlaywrightReport = {
  stats?: {
    expected?: number;
    skipped?: number;
    unexpected?: number;
    flaky?: number;
    duration?: number;
  };
};

type LighthouseManifestEntry = {
  url?: string;
  htmlPath?: string;
  jsonPath?: string;
  isRepresentativeRun?: boolean;
  summary?: Record<string, number>;
};

type LighthouseReport = {
  categories?: Record<
    string,
    {
      score?: number | null;
      categoryScoreDisplayMode?: string;
    }
  >;
  timing?: {
    total?: number;
  };
};

type Metric = {
  key: string;
  label: string;
};

type CheckStatus =
  | 'success'
  | 'failed'
  | 'flaky'
  | 'running'
  | 'pending'
  | 'skipped';

const slackPayloadPath = 'test-results/namefi-dev-slack-payload.json';
const markdownSummaryPath = 'test-results/namefi-dev-summary.md';
const metrics: Metric[] = [
  { key: 'performance', label: 'Performance' },
  { key: 'accessibility', label: 'Accessibility' },
  { key: 'best-practices', label: 'Best Practices' },
  { key: 'seo', label: 'SEO' },
];

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch (error) {
    console.warn(`Unable to read JSON report at ${path}:`, error);
    return null;
  }
}

function formatDuration(durationMs?: number) {
  if (durationMs === undefined) {
    return 'n/a';
  }

  return `${Math.round(durationMs / 1000)}s`;
}

function formatScore(score?: number) {
  if (score === undefined) {
    return 'n/a';
  }

  return String(Math.round(score * 100));
}

function scoreEmoji(score?: number) {
  if (score === undefined) {
    return '⚪';
  }

  if (score >= 0.9) {
    return '🟢';
  }

  if (score >= 0.5) {
    return '🟡';
  }

  return '🔴';
}

function metricText(summary: Record<string, number>, metric: Metric) {
  const score = summary[metric.key];
  return `${metric.label} ${scoreEmoji(score)} ${formatScore(score)}`;
}

function metricSlackLine(summary: Record<string, number>, metric: Metric) {
  const score = summary[metric.key];
  return `- ${scoreEmoji(score)} ${metric.label}: \`${formatScore(score)}\``;
}

function agenticBrowsingScore(report: LighthouseReport | null) {
  const category = report?.categories?.['agentic-browsing'];
  const score = category?.score;
  if (typeof score !== 'number') {
    return undefined;
  }

  return score;
}

function formatAgenticBrowsingScore(report: LighthouseReport | null) {
  const score = agenticBrowsingScore(report);
  return `${scoreEmoji(score)} ${formatScore(score)}`;
}

function agenticBrowsingSlackLine(report: LighthouseReport | null) {
  const score = agenticBrowsingScore(report);
  return `- ${scoreEmoji(score)} Agent Browsability: \`${formatScore(score)}\``;
}

function statusFromOutcome(outcome: string): CheckStatus {
  switch (outcome) {
    case 'success':
      return 'success';
    case 'running':
      return 'running';
    case 'pending':
      return 'pending';
    case 'skipped':
      return 'skipped';
    default:
      return 'failed';
  }
}

function e2eCheckStatus(
  outcome: string,
  stats?: PlaywrightReport['stats'],
): CheckStatus {
  const status = statusFromOutcome(outcome);
  if (status !== 'success') {
    return status;
  }

  if (!stats) {
    return 'failed';
  }

  if ((stats?.unexpected ?? 0) > 0) {
    return 'failed';
  }

  if (
    (stats?.expected ?? 0) === 0 &&
    (stats?.flaky ?? 0) === 0 &&
    (stats?.skipped ?? 0) > 0
  ) {
    return 'failed';
  }

  if ((stats?.flaky ?? 0) > 0) {
    return 'flaky';
  }

  return 'success';
}

function lighthouseCheckStatus(
  outcome: string,
  entry: LighthouseManifestEntry | null,
  report: LighthouseReport | null,
): CheckStatus {
  const status = statusFromOutcome(outcome);
  if (status !== 'success') {
    return status;
  }

  if (!entry?.summary || !report) {
    return 'failed';
  }

  return 'success';
}

function overallCheckStatus(
  e2eStatus: CheckStatus,
  lighthouseStatus: CheckStatus,
): CheckStatus {
  if (e2eStatus === 'failed' || lighthouseStatus === 'failed') {
    return 'failed';
  }

  if (e2eStatus === 'skipped' || lighthouseStatus === 'skipped') {
    return 'failed';
  }

  if (
    e2eStatus === 'running' ||
    lighthouseStatus === 'running' ||
    e2eStatus === 'pending' ||
    lighthouseStatus === 'pending'
  ) {
    return 'running';
  }

  if (e2eStatus === 'flaky' || lighthouseStatus === 'flaky') {
    return 'flaky';
  }

  return 'success';
}

function slackStatusLabel(status: CheckStatus) {
  switch (status) {
    case 'success':
      return '🟢 Success';
    case 'flaky':
      return '🟡 Flaky';
    case 'running':
      return '🟡 Running';
    case 'pending':
      return '🟡 Pending';
    case 'skipped':
      return '⚪ Skipped';
    case 'failed':
      return '🔴 Failed';
  }
}

function headingForStatus(status: CheckStatus) {
  switch (status) {
    case 'success':
      return 'Namefi.dev nightly succeeded';
    case 'flaky':
      return 'Namefi.dev nightly flaky';
    case 'running':
    case 'pending':
      return 'Namefi.dev nightly running';
    case 'failed':
    case 'skipped':
      return 'Namefi.dev nightly failed';
  }
}

function fallbackSummary(outcome: string, label: string) {
  switch (outcome) {
    case 'running':
      return `${label} is running`;
    case 'pending':
      return `${label} has not started yet`;
    case 'skipped':
      return `${label} was skipped`;
    default:
      return `No ${label} report found`;
  }
}

function selectLighthouseEntry(entries: LighthouseManifestEntry[]) {
  const entriesWithSummary = entries.filter((entry) => entry.summary);
  return (
    entriesWithSummary.find((entry) => entry.isRepresentativeRun) ??
    entriesWithSummary[Math.floor(entriesWithSummary.length / 2)] ??
    null
  );
}

function readLighthouseReport(entry: LighthouseManifestEntry | null) {
  if (!entry?.jsonPath) {
    return null;
  }

  return readJson<LighthouseReport>(entry.jsonPath);
}

function readLighthouseReports(entries: LighthouseManifestEntry[]) {
  return entries
    .map((entry) => readLighthouseReport(entry))
    .filter((report): report is LighthouseReport => report !== null);
}

function formatAverageLighthouseDuration(reports: LighthouseReport[]) {
  const durations = reports
    .map((report) => report.timing?.total)
    .filter((duration): duration is number => typeof duration === 'number');
  if (durations.length === 0) {
    return 'n/a';
  }

  const averageDuration =
    durations.reduce((total, duration) => total + duration, 0) /
    durations.length;
  return formatDuration(averageDuration);
}

function e2eSlackText(
  status: CheckStatus,
  summary: string,
  stats?: PlaywrightReport['stats'],
) {
  if (!stats) {
    return [`*E2E:* ${slackStatusLabel(status)}`, `- ${summary}`].join('\n');
  }

  return `*E2E (${formatDuration(stats.duration)}):* ${slackStatusLabel(status)}`;
}

function lighthouseSlackHeading(status: CheckStatus, averageDuration: string) {
  const durationText =
    averageDuration === 'n/a' ? '' : ` (~${averageDuration})`;

  return status === 'success'
    ? `*Lighthouse${durationText}:*`
    : `*Lighthouse${durationText}:* ${slackStatusLabel(status)}`;
}

function lighthouseSlackText(
  status: CheckStatus,
  summary: string,
  averageDuration: string,
  lighthouseSummary?: Record<string, number>,
  report?: LighthouseReport | null,
) {
  if (!lighthouseSummary) {
    return [
      lighthouseSlackHeading(status, averageDuration),
      `- ${summary}`,
    ].join('\n');
  }

  return [
    lighthouseSlackHeading(status, averageDuration),
    ...metrics.map((metric) => metricSlackLine(lighthouseSummary, metric)),
    agenticBrowsingSlackLine(report ?? null),
  ].join('\n');
}

const rawE2eOutcome = process.env.E2E_OUTCOME || 'unknown';
const e2ePrerequisiteOutcome = process.env.E2E_PREREQUISITE_OUTCOME;
const e2ePrerequisiteSummary = process.env.E2E_PREREQUISITE_SUMMARY;
const e2ePrerequisiteFailed = Boolean(
  e2ePrerequisiteOutcome && e2ePrerequisiteOutcome !== 'success',
);
const e2eOutcome = e2ePrerequisiteFailed
  ? e2ePrerequisiteOutcome
  : rawE2eOutcome;
const lighthouseOutcome = process.env.LIGHTHOUSE_OUTCOME || 'unknown';
const domain = process.env.NAMEFI_E2E_DOMAIN || 'unknown';
const baseUrl = process.env.NAMEFI_DEV_BASE_URL || 'https://namefi.dev';
const runUrl = `${process.env.GITHUB_SERVER_URL || 'https://github.com'}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
const commitUrl = `${process.env.GITHUB_SERVER_URL || 'https://github.com'}/${process.env.GITHUB_REPOSITORY}/commit/${process.env.GITHUB_SHA}`;
const shortSha = (process.env.GITHUB_SHA || '').slice(0, 7) || 'unknown';
const branch = process.env.GITHUB_REF_NAME || 'unknown';
const runContext = `*Branch:* ${branch} | *Commit:* <${commitUrl}|${shortSha}> | *Run:* <${runUrl}|View details> | <${runUrl}#artifacts|Artifacts>`;

const shouldReadPlaywrightReport = !['pending', 'running'].includes(e2eOutcome);
const shouldReadLighthouseReport = !['pending', 'running'].includes(
  lighthouseOutcome,
);
const playwright = shouldReadPlaywrightReport
  ? readJson<PlaywrightReport>('test-results/namefi-dev/results.json')
  : null;
const lighthouseManifest =
  (shouldReadLighthouseReport
    ? readJson<LighthouseManifestEntry[]>('.lighthouseci/manifest.json')
    : null) ?? [];
const lighthouse = selectLighthouseEntry(lighthouseManifest);
const lighthouseReport = shouldReadLighthouseReport
  ? readLighthouseReport(lighthouse)
  : null;
const lighthouseReports = shouldReadLighthouseReport
  ? readLighthouseReports(lighthouseManifest)
  : [];

const e2eSummary =
  e2ePrerequisiteFailed && e2ePrerequisiteSummary
    ? e2ePrerequisiteSummary
    : playwright?.stats
      ? `${playwright.stats.expected ?? 0} passed, ${
          playwright.stats.unexpected ?? 0
        } failed, ${playwright.stats.flaky ?? 0} flaky, ${
          playwright.stats.skipped ?? 0
        } skipped in ${formatDuration(playwright.stats.duration)}`
      : fallbackSummary(e2eOutcome, 'Playwright');

const lighthouseSummary = lighthouse?.summary
  ? metrics.map((metric) => metricText(lighthouse.summary, metric)).join(' / ')
  : fallbackSummary(lighthouseOutcome, 'Lighthouse');
const lighthouseSummaryWithAgentic = lighthouse?.summary
  ? `${lighthouseSummary} / Agent Browsability ${formatAgenticBrowsingScore(lighthouseReport)}`
  : lighthouseSummary;
const lighthouseAverageDuration =
  formatAverageLighthouseDuration(lighthouseReports);
const e2eSlackStatus = e2eCheckStatus(e2eOutcome, playwright?.stats);
const lighthouseSlackStatus = lighthouseCheckStatus(
  lighthouseOutcome,
  lighthouse,
  lighthouseReport,
);
const overallSlackStatus = overallCheckStatus(
  e2eSlackStatus,
  lighthouseSlackStatus,
);
const e2eSlackSummary = e2eSlackText(
  e2eSlackStatus,
  e2eSummary,
  playwright?.stats,
);
const lighthouseSlackSummary = lighthouseSlackText(
  lighthouseSlackStatus,
  lighthouseSummary,
  lighthouseAverageDuration,
  lighthouse?.summary,
  lighthouseReport,
);

const heading = headingForStatus(overallSlackStatus);

const payload = {
  text: `${heading}: E2E ${slackStatusLabel(e2eSlackStatus)}${
    lighthouseSlackStatus === 'success'
      ? ''
      : `, Lighthouse ${slackStatusLabel(lighthouseSlackStatus)}`
  } for ${domain}`,
  blocks: [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: heading,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Checkout smoke for \`${domain}\` on <${baseUrl}|namefi.dev>.`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: e2eSlackSummary,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: lighthouseSlackSummary,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: runContext,
        },
      ],
    },
  ],
};

const markdown = [
  `# ${heading}`,
  '',
  `- Domain: \`${domain}\``,
  `- Base URL: ${baseUrl}`,
  `- E2E: ${slackStatusLabel(e2eSlackStatus)} - ${e2eSummary}`,
  `- Lighthouse: ${slackStatusLabel(lighthouseSlackStatus)} - ${lighthouseSummaryWithAgentic}`,
  `- Lighthouse average duration: ${lighthouseAverageDuration}`,
  `- Run: ${runUrl}`,
  '',
].join('\n');

mkdirSync(dirname(slackPayloadPath), { recursive: true });
writeFileSync(slackPayloadPath, `${JSON.stringify(payload, null, 2)}\n`);
writeFileSync(markdownSummaryPath, markdown);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
}
