import {
  createVersionInfo,
  formatVersionStamp,
} from '@namefi-astra/common/version-info';
import { config } from '@/lib/env';

export const FRONTEND_VERSION_INFO = createVersionInfo({
  version: config.APP_VERSION,
  commitHash: config.DEPLOY_COMMIT_SHA,
  commitDate: config.DEPLOY_COMMIT_DATE,
});

export const FRONTEND_VERSION_STAMP = formatVersionStamp(FRONTEND_VERSION_INFO);

export const FRONTEND_COMMIT_URL = config.DEPLOY_COMMIT_URL;

export const API_VERSION_URL = 'https://api.namefi.io/versionz.json';

export const VERSION_JSON_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
} as const;

export function createVersionJsonResponse() {
  return Response.json(FRONTEND_VERSION_INFO, {
    headers: VERSION_JSON_HEADERS,
  });
}
