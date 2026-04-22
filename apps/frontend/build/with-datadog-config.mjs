import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';

const DATADOG_SERVICE = 'namefi-astra-frontend';
const DATADOG_SOURCEMAP_PATH = '/_next/static/chunks';
const DATADOG_DEFAULT_SITE = 'us5.datadoghq.com';

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
    path.join(distRoot, 'static', 'chunks'),
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
      console.log(
        '[datadog] Skipping sourcemap upload because no deploy commit SHA is available.',
      );
      return;
    }

    if (!sourceMapDir) {
      console.log('[datadog] Sourcemap directory not found; skipping upload.');
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
      `[datadog] Uploading sourcemaps for release '${releaseVersion}' from '${sourceMapDir}'...`,
    );
    execFileSync(
      'bunx',
      [
        '@datadog/datadog-ci',
        'sourcemaps',
        'upload',
        sourceMapDir,
        '--service',
        DATADOG_SERVICE,
        '--release-version',
        releaseVersion,
        '--minified-path-prefix',
        minifiedPathPrefix,
        '--disable-git',
      ],
      {
        cwd: projectDir,
        stdio: ['ignore', 'pipe', 'pipe'],
        encoding: 'utf8',
        env: {
          ...process.env,
          DATADOG_SITE: process.env.DATADOG_SITE || DATADOG_DEFAULT_SITE,
          DATADOG_ENV: buildEnvLabel,
        },
      },
    );
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
