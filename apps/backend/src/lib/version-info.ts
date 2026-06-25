import { createVersionInfo } from '@namefi-astra/common/version-info';

const BACKEND_VERSION_INFO = createVersionInfo({
  version: process.env.BUILD_VERSION || process.env.npm_package_version,
  commitHash:
    process.env.BUILD_COMMIT_SHA ||
    process.env.DEPLOY_COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA,
  commitDate: process.env.BUILD_COMMIT_DATE || process.env.DEPLOY_COMMIT_DATE,
});

export function getBackendVersionInfo() {
  return BACKEND_VERSION_INFO;
}

export function getBackendVersionJson() {
  return {
    ...BACKEND_VERSION_INFO,
    name: process.env.npm_package_name,
  };
}
