import createMdx from '@next/mdx';
import type { NextConfig } from 'next';
// biome-ignore lint/correctness/noNodejsModules: next.config runs in Node and needs execSync to read build metadata
import { execSync } from 'node:child_process';
// biome-ignore lint/correctness/noNodejsModules: next.config runs in Node and needs createRequire
import { createRequire } from 'node:module';
import packageJson from './package.json';
import { config as appConfig } from './src/lib/env/load';

// Build-time version stamp for the footer: a `v<version>-<6charSha>-<yyyy-mm-dd>`
// label that links to the deployed commit's GitHub permalink. Prefer Vercel's
// authoritative SHA, fall back to local git, and degrade to 'unknown' if git is
// unavailable. The date is the committer date (`%cs`, already yyyy-mm-dd), and
// falls back to the build date because Vercel build containers don't reliably
// expose `.git` (the SHA/permalink still pin the exact commit either way).
function resolveBuildInfo(version: string) {
  const git = (args: string) => {
    try {
      return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim();
    } catch {
      return '';
    }
  };
  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() || git('rev-parse HEAD');
  const commitDate =
    git(`show -s --format=%cs ${sha || 'HEAD'}`) ||
    new Date().toISOString().slice(0, 10);
  const repo =
    process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
      ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`
      : 'd3servelabs/namefi-astra';
  return {
    BUILD_VERSION: version,
    BUILD_COMMIT_SHA: sha ? sha.slice(0, 6) : 'unknown',
    BUILD_COMMIT_DATE: commitDate,
    BUILD_COMMIT_URL: sha ? `https://github.com/${repo}/commit/${sha}` : '',
  };
}

const buildInfo = resolveBuildInfo(packageJson.version);

const require = createRequire(import.meta.url);
const remarkStaticImageImportsPath = require.resolve(
  './mdx-plugins/remark-static-image-imports',
);
const remarkBlogOgImagePath = require.resolve(
  './mdx-plugins/remark-blog-og-image',
);
const remarkHeadingIdsPath = require.resolve(
  './mdx-plugins/remark-heading-ids',
);

const withMDX = createMdx({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [
      'remark-frontmatter',
      'remark-mdx-frontmatter',
      'remark-gfm',
      'remark-reading-time',
      'remark-reading-time/mdx',
      remarkBlogOgImagePath,
      remarkStaticImageImportsPath,
      remarkHeadingIdsPath,
    ],
  },
});

const nextConfig: NextConfig = {
  basePath: '/r',
  transpilePackages: ['@namefi-astra/ui'],
  compiler: {
    define: {
      'process.env.LOADED_CONFIG': JSON.stringify(appConfig),
    },
  },
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  experimental: {
    turbopackFileSystemCacheForDev: true,
    turbopackFileSystemCacheForBuild: true,
  },
  env: {
    ENVIRONMENT: process.env.ENVIRONMENT,
    version: packageJson.version,
    name: packageJson.name,
    ...buildInfo,
  },
  typescript: {
    // Note: validate is run on CI with build
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/r/api/c15t/:path*',
        destination: `${appConfig.BACKEND_URL}/c15t/:path*`,
        basePath: false,
      },
    ];
  },
};

// biome-ignore lint/style/noDefaultExport: Next.js requires a default export for the config file.
export default withMDX(nextConfig);
