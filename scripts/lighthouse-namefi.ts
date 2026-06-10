import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

const outputDir = '.lighthouseci';
const lighthouseVersion = '13.4.0';
const lighthouseCategories = [
  'performance',
  'accessibility',
  'best-practices',
  'seo',
  'agentic-browsing',
] as const;

type LighthouseCategoryKey = (typeof lighthouseCategories)[number];

type LighthouseReport = {
  categories?: Partial<
    Record<
      LighthouseCategoryKey,
      {
        score?: number | null;
      }
    >
  >;
};

type LighthouseManifestEntry = {
  url: string;
  isRepresentativeRun: boolean;
  jsonPath: string;
  htmlPath: string;
  summary: Partial<Record<LighthouseCategoryKey, number>>;
};

type LighthouseAssertion = {
  key: LighthouseCategoryKey;
  label: string;
  minScore: number;
};

const assertions: LighthouseAssertion[] = [
  { key: 'performance', label: 'Performance', minScore: 0.5 },
  { key: 'accessibility', label: 'Accessibility', minScore: 0.8 },
  { key: 'best-practices', label: 'Best Practices', minScore: 0.8 },
  { key: 'seo', label: 'SEO', minScore: 0.8 },
];

function parseNumberOfRuns() {
  const numberOfRuns = Number.parseInt(
    process.env.LIGHTHOUSE_NUMBER_OF_RUNS || '3',
    10,
  );
  return Number.isFinite(numberOfRuns) && numberOfRuns > 0 ? numberOfRuns : 3;
}

function withSkipAuth(pathname: string) {
  const baseUrl = process.env.LIGHTHOUSE_BASE_URL || 'https://namefi.dev';
  const url = new URL(pathname, baseUrl);
  url.searchParams.set('skip_auth', '1');
  return url.toString();
}

function readJson<T>(path: string) {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function reportPath(runNumber: number, extension: 'html' | 'json') {
  return join(outputDir, `namefi-${runNumber}.report.${extension}`);
}

function outputPath(runNumber: number) {
  return join(outputDir, `namefi-${runNumber}`);
}

function summarizeReport(report: LighthouseReport) {
  const summary: Partial<Record<LighthouseCategoryKey, number>> = {};

  for (const category of lighthouseCategories) {
    const score = report.categories?.[category]?.score;
    if (typeof score === 'number') {
      summary[category] = score;
    }
  }

  return summary;
}

function runLighthouse(runNumber: number, targetUrl: string) {
  console.log(
    `Running Lighthouse ${lighthouseVersion} for ${targetUrl} (${runNumber}/${numberOfRuns})`,
  );

  const result = spawnSync(
    'bunx',
    [
      '--yes',
      `lighthouse@${lighthouseVersion}`,
      targetUrl,
      '--preset=desktop',
      `--only-categories=${lighthouseCategories.join(',')}`,
      '--output=json',
      '--output=html',
      `--output-path=${outputPath(runNumber)}`,
      '--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage',
    ],
    { stdio: 'inherit', env: process.env },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  const jsonPath = reportPath(runNumber, 'json');
  const htmlPath = reportPath(runNumber, 'html');

  if (!existsSync(jsonPath)) {
    throw new Error(`Lighthouse JSON report was not created at ${jsonPath}`);
  }

  if (!existsSync(htmlPath)) {
    throw new Error(`Lighthouse HTML report was not created at ${htmlPath}`);
  }

  const report = readJson<LighthouseReport>(jsonPath);
  return {
    url: targetUrl,
    isRepresentativeRun: false,
    jsonPath,
    htmlPath,
    summary: summarizeReport(report),
  } satisfies LighthouseManifestEntry;
}

function formatScore(score: number) {
  return String(Math.round(score * 100));
}

function warnOnLowScores(entry: LighthouseManifestEntry) {
  for (const assertion of assertions) {
    const score = entry.summary[assertion.key];

    if (typeof score !== 'number') {
      console.warn(`[Lighthouse] Missing ${assertion.label} score`);
      continue;
    }

    if (score < assertion.minScore) {
      console.warn(
        `[Lighthouse] ${assertion.label} ${formatScore(score)} is below warning threshold ${formatScore(
          assertion.minScore,
        )}`,
      );
    }
  }
}

const numberOfRuns = parseNumberOfRuns();
const targetUrl = withSkipAuth('/');

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

const manifest = Array.from({ length: numberOfRuns }, (_, index) =>
  runLighthouse(index + 1, targetUrl),
);
const representativeRunIndex = Math.floor(manifest.length / 2);
const representativeRun = manifest[representativeRunIndex];

if (!representativeRun) {
  throw new Error('Lighthouse did not create a representative run');
}

representativeRun.isRepresentativeRun = true;
warnOnLowScores(representativeRun);

writeFileSync(
  join(outputDir, 'manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
