import { and, gt, sql } from 'drizzle-orm';
import {
  db,
  internalAiGenerationsTable,
  namefiNftCte,
  namefiNftView,
} from '@namefi-astra/db';
import { config, secrets } from '#lib/env';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import pMap from 'p-map';
import { createS3Client, type StorageConfig } from '@namefi-astra/storage';
import {
  runLogoWorkflow,
  type LogoStyleInput,
  type LogoTypeInput,
} from '@namefi-astra/ai';
import { Context } from '@temporalio/activity';

export interface GenerateLogosForDomainsParams {
  domains: NamefiNormalizedDomain[];
  model:
    | 'gpt-image-1'
    | 'gpt-image-1.5'
    | 'gemini-2.5-flash-image'
    | 'gemini-3-pro-image-preview';
  concurrency?: number; // per-activity execution concurrency
  batchId?: string; // optional correlation id
  description?: string; // prompt hint
  logoType?: LogoTypeInput;
  logoStyle?: LogoStyleInput;
}

export interface ListAliveNftDomainsParams {
  limit?: number;
  offset?: number;
  skipExisting?: boolean; // if true, only list domains without an existing internal logo
}

export async function listAliveNftDomains({
  limit = 500,
  offset = 0,
  skipExisting = false,
}: ListAliveNftDomainsParams = {}): Promise<NamefiNormalizedDomain[]> {
  const baseWhere = gt(namefiNftView.expirationTime, new Date());
  const whereClause = skipExisting
    ? and(
        baseWhere,
        sql`NOT EXISTS (SELECT 1 FROM ${internalAiGenerationsTable} AS i WHERE i.domain = ${namefiNftView.normalizedDomainName} AND i.type = 'logo')`,
      )
    : baseWhere;

  const rows = await db
    .with(namefiNftCte)
    .select({ domain: namefiNftView.normalizedDomainName })
    .from(namefiNftView)
    .where(whereClause)
    .limit(limit)
    .offset(offset);
  return rows.map((r) => r.domain);
}

function getStorage(baseFolder: string): StorageConfig {
  const s3Client = createS3Client({
    AWS_ACCESS_KEY_ID: secrets.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: secrets.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: config.AWS_REGION,
  });
  return {
    bucketName: config.STORAGE_BUCKET,
    cloudfrontDomain: config.CLOUD_FRONT_DOMAIN,
    s3Client,
    baseFolder,
  };
}

/**
 * Periodically heartbeats while awaiting a long-running promise.
 * Also respects Temporal cancellation via Activity Context cancellationSignal.
 */
async function heartbeatWhile<T>(
  promise: Promise<T>,
  details: Record<string, unknown>,
  intervalMs = 10_000,
): Promise<T> {
  const ctx = Context.current();
  return await new Promise<T>((resolve, reject) => {
    const interval = setInterval(() => {
      if (ctx.cancellationSignal.aborted) {
        clearInterval(interval);
        reject(new Error('activity-cancelled'));
        return;
      }
      try {
        ctx.heartbeat(details);
      } catch {
        // Ignore heartbeat errors; Temporal will surface if needed
      }
    }, intervalMs);

    promise
      .then((val) => {
        clearInterval(interval);
        resolve(val);
      })
      .catch((err) => {
        clearInterval(interval);
        reject(err);
      });
  });
}

export async function generateLogosForDomains(
  params: GenerateLogosForDomainsParams,
) {
  const ctx = Context.current();
  const {
    domains,
    model,
    concurrency = 5,
    batchId,
    description,
    logoType = 'let-ai-choose',
    logoStyle = 'let-ai-choose',
  } = params;

  if (!domains?.length) return { processed: 0, successes: 0, failures: 0 };

  const storage = getStorage(config.AI_BUCKET_FOLDERS.LOGOS);

  const results = await pMap(
    domains,
    async (domain) => {
      try {
        if (ctx.cancellationSignal.aborted) {
          throw new Error('activity-cancelled');
        }
        ctx.heartbeat({ stage: 'start', domain });

        const logoResult = await heartbeatWhile(
          runLogoWorkflow({
            domain,
            description,
            preferredType: logoType,
            preferredStyle: logoStyle,
            imageModel: model,
            storage,
          }),
          { stage: 'workflow', domain },
        );

        const aggregateTokenUsage = [
          {
            model: logoResult.analysis.model,
            inputTokens: logoResult.analysis.tokenUsage?.inputTokens ?? 0,
            outputTokens: logoResult.analysis.tokenUsage?.outputTokens ?? 0,
          },
          {
            model: logoResult.image.model,
            inputTokens: logoResult.image.tokenUsage?.inputTokens ?? 0,
            outputTokens: logoResult.image.tokenUsage?.outputTokens ?? 0,
          },
        ];

        type Insert = typeof internalAiGenerationsTable.$inferInsert;
        const record: Insert = {
          domain,
          type: 'logo',
          batchId,
          params: { model },
          input: {
            type: 'logo',
            logoType: logoResult.concept.logoConcept.type,
            logoStyle: logoResult.concept.logoConcept.style,
            description,
          },
          output: {
            type: 'logo',
            storagePath: logoResult.image.storagePath,
          },
          tokenUsage: aggregateTokenUsage,
          metadata: {},
        };

        await db.insert(internalAiGenerationsTable).values(record);
        ctx.heartbeat({ stage: 'persisted', domain });

        return { domain, ok: true } as const;
      } catch (e) {
        return {
          domain,
          ok: false,
          error: e instanceof Error ? e.message : 'unknown',
        } as const;
      }
    },
    { concurrency },
  );

  const successes = results.filter((r) => r.ok).length;
  const failures = results.length - successes;
  return { processed: results.length, successes, failures };
}
