import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';

const DATADOG_SERVICE = 'namefi-astra-frontend';
const DATADOG_DEFAULT_CI_PACKAGE = '@datadog/datadog-ci@5.19.0';
const DATADOG_SOURCEMAP_PATH = '/_next/static';
const DATADOG_DEFAULT_SITE = 'us5.datadoghq.com';
const DATADOG_CI_SKIPPED_SOURCEMAP_PATTERN =
  /Some sourcemaps have been skipped|[1-9]\d*\s+sourcemaps?\s+(?:was|were|have been)\s+skipped|Failed upload sourcemap/i;
const DATADOG_CI_ZERO_SUCCESS_PATTERN =
  /No sourcemaps detected|(?:Handled|Uploaded)\s+0\s+sourcemaps?\s+(?:with success|in\b)|0\s+sourcemaps?\s+successfully uploaded/i;

/**
 * Resolves the deploy commit SHA used for Datadog release versioning.
 * Values are normalized via toTrimmedString; returns an empty string when
 * neither the CI-provided deploy SHA nor Vercel's git SHA is available.
 */
export const resolveDeployCommitSha = () =>
  toTrimmedString(process.env.DEPLOY_COMMIT_SHA) ||
  toTrimmedString(process.env.VERCEL_GIT_COMMIT_SHA);

/**
 * @param {string | undefined} value
 */
const toPathname = (value) => {
  if (!value) {
    return '';
  }

  try {
    return new URL(value, 'https://namefi.invalid').pathname.replace(/\/$/, '');
  } catch {
    return value.replace(/\/$/, '');
  }
};

/**
 * Mirrors Sentry's behavior: prefer assetPrefix, then basePath.
 * @param {import('next').NextConfig} config
 */
const resolveDatadogMinifiedPathPrefix = (config) => {
  const prefix = toPathname(
    typeof config.assetPrefix === 'string' && config.assetPrefix.length > 0
      ? config.assetPrefix
      : config.basePath,
  );
  return `${prefix}${DATADOG_SOURCEMAP_PATH}`;
};

/**
 * @param {string} rootDir
 * @returns {number}
 */
const cleanupSourceMaps = (rootDir) => {
  if (!existsSync(rootDir)) {
    return 0;
  }

  let deletedCount = 0;
  const entries = readdirSync(rootDir);
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      deletedCount += cleanupSourceMaps(fullPath);
      continue;
    }

    if (entry.endsWith('.map')) {
      rmSync(fullPath);
      deletedCount += 1;
    }
  }

  return deletedCount;
};

/**
 * Next may provide distDir as absolute, project-relative, or an absolute path
 * with a stripped leading slash in some build environments (observed on Vercel).
 * Resolve a set of candidate dist roots and use the first one that exists.
 *
 * @param {{ projectDir: string, distDir: string }} options
 * @returns {string[]}
 */
const resolveDistRootCandidates = ({ projectDir, distDir }) => {
  const candidates = new Set();
  const projectRoot = path.resolve(projectDir);

  candidates.add(path.resolve(projectRoot, distDir));

  if (path.isAbsolute(distDir)) {
    candidates.add(path.normalize(distDir));
  } else if (path.isAbsolute(projectRoot)) {
    const root = path.parse(projectRoot).root;
    const projectWithoutRoot = path.relative(root, projectRoot);
    if (
      projectWithoutRoot &&
      (distDir === projectWithoutRoot ||
        distDir.startsWith(`${projectWithoutRoot}${path.sep}`))
    ) {
      candidates.add(path.join(root, distDir));
    }
  }

  // Fallback for default Next.js distDir.
  candidates.add(path.join(projectRoot, '.next'));

  return [...candidates].map((candidate) => path.normalize(candidate));
};

/**
 * @param {unknown} value
 * @returns {string}
 */
const toTrimmedString = (value) => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value == null) {
    return '';
  }
  return String(value).trim();
};

/**
 * @returns {string}
 */
const resolveDatadogCiPackage = () =>
  toTrimmedString(process.env.DATADOG_CI_PACKAGE) || DATADOG_DEFAULT_CI_PACKAGE;

/**
 * @returns {string}
 */
const resolveDatadogRepositoryUrl = () => {
  const explicitRepositoryUrl =
    toTrimmedString(process.env.DD_GIT_REPOSITORY_URL) ||
    toTrimmedString(process.env.DATADOG_GIT_REPOSITORY_URL);
  if (explicitRepositoryUrl) {
    return explicitRepositoryUrl;
  }

  const githubRepository = toTrimmedString(process.env.GITHUB_REPOSITORY);
  if (githubRepository) {
    return `https://github.com/${githubRepository}.git`;
  }

  const vercelRepoOwner = toTrimmedString(process.env.VERCEL_GIT_REPO_OWNER);
  const vercelRepoSlug = toTrimmedString(process.env.VERCEL_GIT_REPO_SLUG);
  if (vercelRepoOwner && vercelRepoSlug) {
    return `https://github.com/${vercelRepoOwner}/${vercelRepoSlug}.git`;
  }

  return '';
};

/**
 * @param {{ sourceMapDir: string, releaseVersion: string, minifiedPathPrefix: string }} options
 * @returns {{ args: string[], repositoryUrl: string }}
 */
const buildDatadogSourcemapUploadArgs = ({
  sourceMapDir,
  releaseVersion,
  minifiedPathPrefix,
}) => {
  const args = [
    resolveDatadogCiPackage(),
    'sourcemaps',
    'upload',
    sourceMapDir,
    '--service',
    DATADOG_SERVICE,
    '--release-version',
    releaseVersion,
    '--minified-path-prefix',
    minifiedPathPrefix,
  ];
  const repositoryUrl = resolveDatadogRepositoryUrl();

  if (repositoryUrl) {
    args.push(
      '--repository-url',
      repositoryUrl,
      '--commit-sha',
      releaseVersion,
    );
  } else {
    args.push('--disable-git');
  }

  return { args, repositoryUrl };
};

/**
 * @param {{ stdout: string, stderr: string }} output
 * @returns {string}
 */
const getDatadogCliDiagnosticOutput = ({ stdout, stderr }) => {
  const combined = [stdout, stderr]
    .map(toTrimmedString)
    .filter(Boolean)
    .join('\n');
  if (!combined) {
    return '';
  }

  const lines = combined.split(/\r?\n/);
  const summaryStart = lines.findIndex((line) => /Command summary/i.test(line));
  const summaryLines = summaryStart >= 0 ? lines.slice(summaryStart) : [];
  const diagnosticLines = lines.filter((line) =>
    /warn|error|failed upload|skipped|no sourcemaps detected|sourcemaps?.*(?:success|upload)|handled\s+\d+\s+sourcemaps?|uploaded\s+\d+\s+sourcemaps?/i.test(
      line,
    ),
  );

  return [...new Set([...diagnosticLines, ...summaryLines])]
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .join('\n');
};

/**
 * @param {{ stdout: string, stderr: string }} output
 */
const logDatadogCliOutput = ({ stdout, stderr }) => {
  const diagnosticOutput = getDatadogCliDiagnosticOutput({ stdout, stderr });
  if (diagnosticOutput) {
    console.log(`[datadog] datadog-ci output:\n${diagnosticOutput}`);
  } else {
    console.log('[datadog] datadog-ci completed without summary output.');
  }
};

/**
 * @param {{ stdout: string, stderr: string }} output
 */
const assertDatadogCliUploadOutput = ({ stdout, stderr }) => {
  const combined = [stdout, stderr]
    .map(toTrimmedString)
    .filter(Boolean)
    .join('\n');

  if (DATADOG_CI_SKIPPED_SOURCEMAP_PATTERN.test(combined)) {
    throw new Error(
      '[datadog] datadog-ci reported skipped sourcemaps. Check the datadog-ci output above.',
    );
  }

  if (DATADOG_CI_ZERO_SUCCESS_PATTERN.test(combined)) {
    throw new Error(
      '[datadog] datadog-ci reported 0 successful sourcemap uploads.',
    );
  }

  const successCountMatch =
    combined.match(
      /(?:Handled|Uploaded)\s+(\d+)\s+sourcemaps?\s+with success/i,
    ) ||
    combined.match(/Uploaded\s+(\d+)\s+sourcemaps?\s+in\b/i) ||
    combined.match(/(\d+)\s+sourcemaps?\s+successfully uploaded/i);
  if (!successCountMatch) {
    console.warn(
      '[datadog] Could not parse datadog-ci sourcemap success count; treating exit code 0 as success.',
    );
  }
};

/**
 * @param {string} value
 * @returns {string}
 */
const getLastNonEmptyLine = (value) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .at(-1) || '';

/**
 * @param {unknown} error
 * @returns {string}
 */
const summarizeDatadogUploadError = (error) => {
  if (!(error instanceof Error)) {
    return toTrimmedString(error) || 'unknown upload error';
  }

  const status =
    typeof error.status === 'number' ? ` (exit code ${error.status})` : '';
  const stderrLine = getLastNonEmptyLine(toTrimmedString(error.stderr));
  const stdoutLine = getLastNonEmptyLine(toTrimmedString(error.stdout));
  const detail =
    stderrLine ||
    stdoutLine ||
    toTrimmedString(error.message) ||
    'unknown upload error';

  return `${detail}${status}`;
};

/**
 * @param {{ distDir: string, projectDir: string, minifiedPathPrefix: string }} options
 */
const runDatadogSourcemapUpload = ({
  distDir,
  projectDir,
  minifiedPathPrefix,
}) => {
  const releaseVersion = resolveDeployCommitSha();
  const hasDatadogApiKey = Boolean(process.env.DATADOG_API_KEY);
  const buildEnvLabel = toTrimmedString(process.env.VERCEL_TARGET_ENV);
  const failBuildOnUploadError = buildEnvLabel === 'production';
  const distRootCandidates = resolveDistRootCandidates({ projectDir, distDir });
  const sourceMapDirCandidates = distRootCandidates.map((distRoot) =>
    path.join(distRoot, 'static'),
  );
  const sourceMapCleanupRootCandidates = distRootCandidates.map((distRoot) =>
    path.join(distRoot, 'static'),
  );
  const sourceMapDir = sourceMapDirCandidates.find((candidate) =>
    existsSync(candidate),
  );
  const sourceMapCleanupRoots = [
    ...new Set(
      sourceMapCleanupRootCandidates
        .filter((candidate) => existsSync(candidate))
        .map((candidate) => path.normalize(candidate)),
    ),
  ];

  console.log(
    `[datadog] Sourcemap step started (env='${buildEnvLabel}', release='${releaseVersion || 'none'}', projectDir='${projectDir}', distDir='${distDir}').`,
  );
  console.log(
    `[datadog] Sourcemap directory candidates: ${sourceMapDirCandidates.join(', ')}`,
  );

  let uploadSucceeded = false;
  let uploadError = null;
  try {
    if (!releaseVersion) {
      const error = new Error(
        '[datadog] Sourcemap upload cannot run because no deploy commit SHA is available.',
      );
      if (failBuildOnUploadError) {
        throw error;
      }
      console.warn(
        `${error.message} Build will continue in '${buildEnvLabel}'.`,
      );
      return;
    }

    if (!sourceMapDir) {
      const error = new Error(
        `[datadog] Sourcemap directory not found; checked: ${sourceMapDirCandidates.join(', ')}.`,
      );
      if (failBuildOnUploadError) {
        throw error;
      }
      console.warn(
        `${error.message} Build will continue in '${buildEnvLabel}'.`,
      );
      return;
    }

    if (!hasDatadogApiKey) {
      const error = new Error(
        `[datadog] DATADOG_API_KEY is required for sourcemap upload when deploying '${buildEnvLabel}'.`,
      );
      if (failBuildOnUploadError) {
        throw error;
      }
      console.warn(
        `[datadog] ${error.message} Build will continue in '${buildEnvLabel}'.`,
      );
      return;
    }

    console.log(
      `[datadog] Uploading sourcemaps for release '${releaseVersion}' from '${sourceMapDir}' with minified path prefix '${minifiedPathPrefix}'...`,
    );
    const { args, repositoryUrl } = buildDatadogSourcemapUploadArgs({
      sourceMapDir,
      releaseVersion,
      minifiedPathPrefix,
    });
    if (repositoryUrl) {
      console.log(
        `[datadog] Uploading sourcemaps with git metadata from '${repositoryUrl}'.`,
      );
    } else {
      console.warn(
        '[datadog] Repository URL unavailable; uploading sourcemaps with --disable-git.',
      );
    }
    const result = spawnSync('bunx', args, {
      cwd: projectDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024,
      env: {
        ...process.env,
        DATADOG_SITE: process.env.DATADOG_SITE || DATADOG_DEFAULT_SITE,
        DATADOG_ENV: buildEnvLabel,
        NO_COLOR: '1',
      },
    });
    const stdout = toTrimmedString(result.stdout);
    const stderr = toTrimmedString(result.stderr);
    logDatadogCliOutput({ stdout, stderr });

    if (result.error) {
      throw result.error;
    }
    if (result.signal) {
      throw new Error(`datadog-ci exited due to signal ${result.signal}`);
    }
    if (typeof result.status === 'number' && result.status !== 0) {
      const detail =
        getLastNonEmptyLine(stderr) ||
        getLastNonEmptyLine(stdout) ||
        'datadog-ci failed';
      const error = new Error(`${detail} (exit code ${result.status})`);
      error.status = result.status;
      error.stdout = stdout;
      error.stderr = stderr;
      throw error;
    }

    assertDatadogCliUploadOutput({ stdout, stderr });
    uploadSucceeded = true;
    console.log(
      `[datadog] Sourcemap upload completed for release '${releaseVersion}'.`,
    );
  } catch (error) {
    const errorSummary = summarizeDatadogUploadError(error);
    uploadError = new Error(errorSummary, {
      cause: error instanceof Error ? error : undefined,
    });
    if (failBuildOnUploadError) {
      console.error(
        `[datadog] Sourcemap upload failed in '${buildEnvLabel}'; failing build. ${errorSummary}`,
      );
    } else {
      console.warn(
        `[datadog] Sourcemap upload failed in '${buildEnvLabel}' and build will continue. ${errorSummary}`,
      );
    }
  } finally {
    if (sourceMapCleanupRoots.length > 0) {
      const deletedCount = sourceMapCleanupRoots.reduce(
        (count, rootDir) => count + cleanupSourceMaps(rootDir),
        0,
      );
      console.log(
        `[datadog] Local sourcemap cleanup finished (${deletedCount} .map files removed).`,
      );
    } else {
      console.log(
        `[datadog] Sourcemap cleanup roots not found (checked: ${sourceMapCleanupRootCandidates.join(', ')}); nothing to remove.`,
      );
    }

    if (!uploadSucceeded && !uploadError) {
      console.log('[datadog] Sourcemap upload was skipped.');
    }
  }

  if (uploadError && failBuildOnUploadError) {
    throw uploadError;
  }
};

/**
 * Datadog doesn't provide a Next.js config wrapper like Sentry.
 * We keep Datadog-specific build settings centralized via this local wrapper.
 *
 * @param {import('next').NextConfig} config
 * @returns {import('next').NextConfig}
 */
export const withDatadogConfig = (config) => {
  const existingRunAfterProductionCompile =
    config.compiler?.runAfterProductionCompile;
  const minifiedPathPrefix = resolveDatadogMinifiedPathPrefix(config);

  return {
    ...config,
    productionBrowserSourceMaps: config.productionBrowserSourceMaps ?? true,
    compiler: {
      ...config.compiler,
      runAfterProductionCompile: async ({ distDir, projectDir }) => {
        if (typeof existingRunAfterProductionCompile === 'function') {
          await existingRunAfterProductionCompile({ distDir, projectDir });
        }
        runDatadogSourcemapUpload({
          distDir,
          projectDir,
          minifiedPathPrefix,
        });
      },
    },
  };
};
