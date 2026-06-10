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
      auditRefs?: Array<{
        id?: string;
        weight?: number;
      }>;
    }
  >;
  audits?: Record<string, { score?: number | null }>;
};

type Metric = {
  key: string;
  label: string;
};

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

function formatAgenticBrowsingScore(report: LighthouseReport | null) {
  const category = report?.categories?.['agentic-browsing'];
  const score = category?.score;
  if (typeof score !== 'number') {
    return `${scoreEmoji(undefined)} n/a`;
  }

  const scoredAuditRefs =
    category.auditRefs?.filter((auditRef) => (auditRef.weight ?? 0) > 0) ?? [];
  if (scoredAuditRefs.length === 0) {
    return `${scoreEmoji(score)} ${formatScore(score)}`;
  }

  const auditScores = scoredAuditRefs
    .map((auditRef) => report?.audits?.[auditRef.id ?? '']?.score)
    .filter(
      (auditScore): auditScore is number => typeof auditScore === 'number',
    );
  if (auditScores.length !== scoredAuditRefs.length) {
    return `${scoreEmoji(score)} ${formatScore(score)}`;
  }

  const total = scoredAuditRefs.length;
  const passed = auditScores.filter((auditScore) => auditScore === 1).length;
  return `${scoreEmoji(score)} ${passed}/${total}`;
}

function statusLabel(outcome: string) {
  switch (outcome) {
    case 'success':
      return '🟢 Passed';
    case 'running':
      return '🟡 Running';
    case 'pending':
      return '🟡 Pending';
    case 'skipped':
      return '⚪ Skipped';
    default:
      return '🔴 Failed';
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

const e2eOutcome = process.env.E2E_OUTCOME || 'unknown';
const lighthouseOutcome = process.env.LIGHTHOUSE_OUTCOME || 'unknown';
const domain = process.env.NAMEFI_E2E_DOMAIN || 'unknown';
const baseUrl = process.env.NAMEFI_DEV_BASE_URL || 'https://namefi.dev';
const runUrl = `${process.env.GITHUB_SERVER_URL || 'https://github.com'}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
const commitUrl = `${process.env.GITHUB_SERVER_URL || 'https://github.com'}/${process.env.GITHUB_REPOSITORY}/commit/${process.env.GITHUB_SHA}`;
const shortSha = (process.env.GITHUB_SHA || '').slice(0, 7) || 'unknown';
const branch = process.env.GITHUB_REF_NAME || 'unknown';
const runContext = `*Branch:* ${branch} | *Commit:* <${commitUrl}|${shortSha}> | *Run:* <${runUrl}|View details> | <${runUrl}#artifacts|Artifacts>`;
const overallOutcome =
  e2eOutcome === 'success' && lighthouseOutcome === 'success'
    ? 'success'
    : e2eOutcome === 'running' || lighthouseOutcome === 'running'
      ? 'running'
      : 'failed';

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

const e2eSummary = playwright?.stats
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

const heading =
  overallOutcome === 'success'
    ? 'Namefi.dev nightly passed'
    : overallOutcome === 'running'
      ? 'Namefi.dev nightly running'
      : 'Namefi.dev nightly failed';

const payload = {
  text: `${heading}: ${domain}`,
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${heading}*\nCheckout smoke for \`${domain}\` on <${baseUrl}|namefi.dev>.`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*E2E*\n${statusLabel(e2eOutcome)} - ${e2eSummary}`,
        },
        {
          type: 'mrkdwn',
          text: `*Lighthouse*\n${statusLabel(lighthouseOutcome)} - ${lighthouseSummaryWithAgentic}`,
        },
      ],
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
  `- E2E: ${statusLabel(e2eOutcome)} - ${e2eSummary}`,
  `- Lighthouse: ${statusLabel(lighthouseOutcome)} - ${lighthouseSummaryWithAgentic}`,
  `- Run: ${runUrl}`,
  '',
].join('\n');

mkdirSync(dirname(slackPayloadPath), { recursive: true });
writeFileSync(slackPayloadPath, `${JSON.stringify(payload, null, 2)}\n`);
writeFileSync(markdownSummaryPath, markdown);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
}
