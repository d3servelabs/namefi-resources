import { secrets } from '#lib/env';
import {
  completeNamefiFeedIngestionRun,
  createNamefiFeedIngestionRun,
  failNamefiFeedIngestionRun,
  ingestManualNamefiFeedXPosts,
  processPendingNamefiFeedPosts,
  scanAndQueueNamefiFeedXPosts,
} from '../../services/namefi-feed/ingestion.service';

export async function startNamefiFeedIngestionRun(input: {
  workflowId: string;
  trigger: 'scheduled' | 'manual';
  requestedByUserId?: string | null;
}) {
  return createNamefiFeedIngestionRun(input);
}

export async function scanNamefiFeedXPosts(input: {
  runId: string;
  ignoreAutoScanEnabled?: boolean;
}) {
  return scanAndQueueNamefiFeedXPosts({
    runId: input.runId,
    ignoreAutoScanEnabled: input.ignoreAutoScanEnabled,
    bearerToken: getNamefiFeedXBearerToken(),
  });
}

export async function ingestManualNamefiFeedPosts(input: {
  runId: string;
  tweets: string[];
  includeReplies?: boolean;
}) {
  return ingestManualNamefiFeedXPosts({
    runId: input.runId,
    tweets: input.tweets,
    includeReplies: input.includeReplies,
    bearerToken: getNamefiFeedXBearerToken(),
  });
}

export async function processNamefiFeedPosts(input: {
  runId: string;
  limit?: number;
}) {
  return processPendingNamefiFeedPosts(input);
}

export async function completeNamefiFeedRun(input: {
  runId: string;
  status?: 'completed' | 'skipped';
  metadata?: Record<string, string | number | boolean | null | object>;
}) {
  return completeNamefiFeedIngestionRun(input);
}

export async function failNamefiFeedRun(input: {
  runId: string;
  errorMessage: string;
}) {
  return failNamefiFeedIngestionRun(input);
}

function getNamefiFeedXBearerToken() {
  const token = secrets.NAMEFI_FEED_X_BEARER_TOKEN?.trim();
  if (!token) {
    throw new Error(
      'NAMEFI_FEED_X_BEARER_TOKEN is required for Namefi Feed ingestion.',
    );
  }
  return token;
}
