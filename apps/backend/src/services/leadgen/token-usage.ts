import type { AiTokenUsageEntry } from '@namefi-astra/common/ai-generation-credits';
import { db, leadgenRunsTable } from '@namefi-astra/db';
import { eq, sql } from 'drizzle-orm';

type UsageLike = {
  inputTokens?: unknown;
  outputTokens?: unknown;
};

type ResponseLike = {
  modelId?: unknown;
};

type ResultWithUsage = {
  response?: ResponseLike | Promise<ResponseLike | undefined>;
  totalUsage?: UsageLike | Promise<UsageLike | undefined>;
  usage?: UsageLike | Promise<UsageLike | undefined>;
};

export async function appendLeadgenTokenUsage(params: {
  runId: string;
  entries: AiTokenUsageEntry[];
}) {
  if (params.entries.length === 0) return;

  await db
    .update(leadgenRunsTable)
    .set({
      tokenUsage: sql<
        AiTokenUsageEntry[]
      >`${leadgenRunsTable.tokenUsage} || ${JSON.stringify(params.entries)}::jsonb`,
      updatedAt: new Date(),
    })
    .where(eq(leadgenRunsTable.id, params.runId));
}

export async function appendLeadgenTokenUsageFromResult(params: {
  runId: string;
  result: unknown;
  fallbackModel: string;
}) {
  const entry = await getLeadgenTokenUsageEntry({
    result: params.result,
    fallbackModel: params.fallbackModel,
  });

  if (!entry) return;

  await appendLeadgenTokenUsage({
    runId: params.runId,
    entries: [entry],
  });
}

export async function getLeadgenTokenUsageEntry(params: {
  result: unknown;
  fallbackModel: string;
}): Promise<AiTokenUsageEntry | null> {
  const result = params.result as ResultWithUsage;
  const usage = await Promise.resolve(result.totalUsage ?? result.usage);
  const inputTokens = normalizeTokenCount(usage?.inputTokens);
  const outputTokens = normalizeTokenCount(usage?.outputTokens);

  if (inputTokens === 0 && outputTokens === 0) {
    return null;
  }

  const response = await Promise.resolve(result.response);
  const model =
    typeof response?.modelId === 'string' && response.modelId.trim()
      ? response.modelId
      : params.fallbackModel;

  return {
    model,
    inputTokens,
    outputTokens,
  };
}

function normalizeTokenCount(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.trunc(value))
    : 0;
}
