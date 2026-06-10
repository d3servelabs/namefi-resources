import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname } from 'node:path';

type LighthouseManifestEntry = {
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

const commentPath = 'test-results/lighthouse-pr-comment.md';
const marker = '<!-- lighthouse-status:v1 -->';
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

function metricCell(
  summary: Record<string, number> | undefined,
  metric: Metric,
) {
  const score = summary?.[metric.key];
  return `${scoreEmoji(score)} ${formatScore(score)}`;
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

function fallbackSummary(outcome: string) {
  switch (outcome) {
    case 'running':
      return 'Lighthouse is running';
    case 'pending':
      return 'Lighthouse has not started yet';
    case 'skipped':
      return 'Lighthouse was skipped';
    default:
      return 'No Lighthouse manifest found';
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

const outcome = process.env.LIGHTHOUSE_OUTCOME || 'unknown';
const shouldReadReport = !['pending', 'running'].includes(outcome);
const manifest =
  (shouldReadReport
    ? readJson<LighthouseManifestEntry[]>('.lighthouseci/manifest.json')
    : null) ?? [];
const lighthouse = selectLighthouseEntry(manifest);
const lighthouseReport = shouldReadReport
  ? readLighthouseReport(lighthouse)
  : null;
const scoreCells = metrics.map((metric) =>
  metricCell(lighthouse?.summary, metric),
);
const agenticBrowsingCell = formatAgenticBrowsingScore(lighthouseReport);
const summary = lighthouse?.summary
  ? metrics
      .map(
        (metric) => `${metric.label} ${metricCell(lighthouse.summary, metric)}`,
      )
      .concat(`Agent Browsability ${agenticBrowsingCell}`)
      .join(' / ')
  : fallbackSummary(outcome);

const baseUrl = process.env.LIGHTHOUSE_BASE_URL || '';
const target = baseUrl
  ? `[${baseUrl}](${baseUrl})`
  : 'Resolving frontend preview';
const headSha = process.env.LIGHTHOUSE_PR_HEAD_SHA || '';
const shortSha = headSha.slice(0, 7) || 'unknown';
const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
const repository = process.env.GITHUB_REPOSITORY || '';
const commit =
  headSha && repository
    ? `[${shortSha}](${serverUrl}/${repository}/commit/${headSha})`
    : shortSha;
const runUrl = `${serverUrl}/${repository}/actions/runs/${process.env.GITHUB_RUN_ID}`;
const updatedAt = new Date().toISOString();

const comment = [
  marker,
  '### Lighthouse',
  '',
  `- Target: ${target}`,
  `- Commit: ${commit}`,
  `- Run: [Workflow run](${runUrl})`,
  `- Artifacts: [Lighthouse report](${runUrl}#artifacts)`,
  `- Updated: \`${updatedAt}\``,
  '',
  '| Check | Status | Performance | Accessibility | Best Practices | SEO | Agent Browsability |',
  '|---|---|---:|---:|---:|---:|---:|',
  `| Lighthouse | ${statusLabel(outcome)} | ${scoreCells.join(' | ')} | ${agenticBrowsingCell} |`,
  '',
].join('\n');

const summaryMarkdown = [
  '# Lighthouse',
  '',
  `- Target: ${baseUrl || 'Resolving frontend preview'}`,
  `- Commit: ${commit}`,
  `- Lighthouse: ${statusLabel(outcome)} - ${summary}`,
  `- Run: ${runUrl}`,
  '',
].join('\n');

mkdirSync(dirname(commentPath), { recursive: true });
writeFileSync(commentPath, comment);

if (
  process.env.GITHUB_STEP_SUMMARY &&
  process.env.LIGHTHOUSE_PR_APPEND_STEP_SUMMARY !== 'false'
) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, summaryMarkdown);
}
