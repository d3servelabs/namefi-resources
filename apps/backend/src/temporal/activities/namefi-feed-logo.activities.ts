import { Context } from '@temporalio/activity';
import type { LogoStyleInput, LogoTypeInput } from '@namefi-astra/ai';
import { runLogoWorkflow } from '@namefi-astra/ai';
import {
  db,
  internalAiGenerationsTable,
  type NamefiFeedListingLogo,
  namefiFeedListingsTable,
} from '@namefi-astra/db';
import {
  generateCloudFrontUrl,
  createS3Client,
  type StorageConfig,
} from '@namefi-astra/storage';
import {
  namefiNormalizedDomainSchema,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm';
import pMap from 'p-map';
import { config, secrets } from '#lib/env';
import { createLogger } from '#lib/logger';
import { getActiveNamefiFeedListingWhereClauses } from '../../services/namefi-feed/listing-visibility';

const logger = createLogger({ module: 'namefi-feed-logo-activities' });
const NAMEFI_FEED_LISTING_LOGO_IMAGE_MODEL = 'gpt-image-1.5';

export interface GenerateNamefiFeedListingLogosParams {
  domains: string[];
  concurrency?: number;
  batchId?: string;
  logoType?: LogoTypeInput;
  logoStyle?: LogoStyleInput;
}

export interface GenerateNamefiFeedListingLogosResult {
  processed: number;
  successes: number;
  failures: number;
  reusedExisting: number;
  skipped: number;
}

type EligibleLogoTarget = {
  domain: NamefiNormalizedDomain;
};

function normalizeNamefiFeedListingLogoDomains(
  domains: readonly string[],
): NamefiNormalizedDomain[] {
  const normalizedDomains = new Set<NamefiNormalizedDomain>();

  for (const domain of domains) {
    const parsed = namefiNormalizedDomainSchema.safeParse(
      domain.trim().toLowerCase(),
    );
    if (parsed.success) {
      normalizedDomains.add(parsed.data);
    }
  }

  return Array.from(normalizedDomains);
}

export async function generateNamefiFeedListingLogosForDomains(
  params: GenerateNamefiFeedListingLogosParams,
): Promise<GenerateNamefiFeedListingLogosResult> {
  const domains = normalizeNamefiFeedListingLogoDomains(params.domains);
  if (domains.length === 0) {
    return createEmptyLogoResult();
  }

  const targets = await listEligibleNamefiFeedListingLogoTargets(domains);
  if (targets.length === 0) {
    return createEmptyLogoResult();
  }

  const concurrency = clampInteger(params.concurrency ?? 2, 1, 5);
  const results = await pMap(
    targets,
    (target) =>
      generateNamefiFeedListingLogoForDomain({
        domain: target.domain,
        batchId: params.batchId,
        logoType: params.logoType,
        logoStyle: params.logoStyle,
      }),
    { concurrency },
  );

  return results.reduce<GenerateNamefiFeedListingLogosResult>(
    (summary, result) => ({
      processed: summary.processed + 1,
      successes: summary.successes + (result.status === 'success' ? 1 : 0),
      failures: summary.failures + (result.status === 'failed' ? 1 : 0),
      reusedExisting: summary.reusedExisting + (result.reusedExisting ? 1 : 0),
      skipped: summary.skipped + (result.status === 'skipped' ? 1 : 0),
    }),
    createEmptyLogoResult(),
  );
}

async function listEligibleNamefiFeedListingLogoTargets(
  domains: NamefiNormalizedDomain[],
): Promise<EligibleLogoTarget[]> {
  const rows = await db
    .select({
      domain: namefiFeedListingsTable.domain,
    })
    .from(namefiFeedListingsTable)
    .where(
      and(
        inArray(namefiFeedListingsTable.domain, domains),
        isNull(namefiFeedListingsTable.logo),
        ...getActiveNamefiFeedListingWhereClauses(),
      ),
    )
    .orderBy(asc(namefiFeedListingsTable.domain));

  return rows;
}

async function generateNamefiFeedListingLogoForDomain(input: {
  domain: NamefiNormalizedDomain;
  batchId?: string;
  logoType?: LogoTypeInput;
  logoStyle?: LogoStyleInput;
}): Promise<{
  status: 'success' | 'failed' | 'skipped';
  reusedExisting: boolean;
}> {
  const ctx = Context.current();

  try {
    if (ctx.cancellationSignal.aborted) {
      throw new Error('activity-cancelled');
    }
    ctx.heartbeat({ stage: 'start', domain: input.domain });

    const existingLogo = await findLatestInternalLogo(input.domain);
    if (existingLogo) {
      const updated = await updateListingLogoIfEligible({
        domain: input.domain,
        logo: existingLogo,
      });
      return {
        status: updated ? 'success' : 'skipped',
        reusedExisting: updated,
      };
    }

    const storage = getStorage(config.AI_BUCKET_FOLDERS.LOGOS);
    const logoResult = await heartbeatWhile(
      runLogoWorkflow({
        domain: input.domain,
        description: `Logo for ${input.domain}`,
        preferredType: input.logoType,
        preferredStyle: input.logoStyle,
        imageModel: NAMEFI_FEED_LISTING_LOGO_IMAGE_MODEL,
        storage,
      }),
      { stage: 'workflow', domain: input.domain },
    );

    const tokenUsage = [
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
    const [generation] = await db
      .insert(internalAiGenerationsTable)
      .values({
        domain: input.domain,
        type: 'logo',
        batchId: input.batchId,
        params: { model: NAMEFI_FEED_LISTING_LOGO_IMAGE_MODEL },
        input: {
          type: 'logo',
          logoType: logoResult.concept.logoConcept.type,
          logoStyle: logoResult.concept.logoConcept.style,
          textTreatment: logoResult.concept.logoConcept.textTreatment,
          typography: logoResult.concept.logoConcept.typography,
          description: `Logo for ${input.domain}`,
          imageModel: NAMEFI_FEED_LISTING_LOGO_IMAGE_MODEL,
        },
        output: {
          type: 'logo',
          storagePath: logoResult.image.storagePath,
          logoType: logoResult.concept.logoConcept.type,
          logoStyle: logoResult.concept.logoConcept.style,
          textTreatment: logoResult.concept.logoConcept.textTreatment,
          typography: logoResult.concept.logoConcept.typography,
          imageModel: logoResult.image.model,
        },
        tokenUsage,
        metadata: { source: 'namefi-feed-listing-logo' },
      })
      .returning({
        id: internalAiGenerationsTable.id,
        createdAt: internalAiGenerationsTable.createdAt,
      });

    if (!generation) {
      throw new Error('Failed to persist Namefi feed listing logo generation.');
    }

    const updated = await updateListingLogoIfEligible({
      domain: input.domain,
      logo: {
        generationId: generation.id,
        domain: input.domain,
        url: logoResult.image.url,
        storagePath: logoResult.image.storagePath,
        model: logoResult.image.model,
        logoType: logoResult.concept.logoConcept.type,
        logoStyle: logoResult.concept.logoConcept.style,
        textTreatment: logoResult.concept.logoConcept.textTreatment,
        typography: logoResult.concept.logoConcept.typography,
        createdAt: generation.createdAt.toISOString(),
        tokenUsage,
        source: 'internal_ai_generation',
      },
    });
    ctx.heartbeat({ stage: 'persisted', domain: input.domain });

    return { status: updated ? 'success' : 'skipped', reusedExisting: false };
  } catch (error) {
    if (isActivityCancellation(ctx, error)) {
      throw error;
    }

    logger.warn(
      {
        domain: input.domain,
        batchId: input.batchId,
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to generate Namefi feed listing logo',
    );
    return { status: 'failed', reusedExisting: false };
  }
}

async function findLatestInternalLogo(
  domain: NamefiNormalizedDomain,
): Promise<NamefiFeedListingLogo | null> {
  const [generation] = await db
    .select({
      id: internalAiGenerationsTable.id,
      output: internalAiGenerationsTable.output,
      tokenUsage: internalAiGenerationsTable.tokenUsage,
      createdAt: internalAiGenerationsTable.createdAt,
    })
    .from(internalAiGenerationsTable)
    .where(
      and(
        eq(internalAiGenerationsTable.domain, domain),
        eq(internalAiGenerationsTable.type, 'logo'),
      ),
    )
    .orderBy(desc(internalAiGenerationsTable.createdAt))
    .limit(1);

  if (!generation || generation.output.type !== 'logo') {
    return null;
  }

  return {
    generationId: generation.id,
    domain,
    url: generateCloudFrontUrl({
      cloudfrontDomain: config.CLOUD_FRONT_DOMAIN,
      s3Key: generation.output.storagePath,
    }),
    storagePath: generation.output.storagePath,
    model: generation.output.imageModel,
    logoType: generation.output.logoType,
    logoStyle: generation.output.logoStyle,
    textTreatment: generation.output.textTreatment,
    typography: generation.output.typography,
    createdAt: generation.createdAt.toISOString(),
    tokenUsage: generation.tokenUsage,
    source: 'internal_ai_generation',
  };
}

async function updateListingLogoIfEligible(input: {
  domain: NamefiNormalizedDomain;
  logo: NamefiFeedListingLogo;
}): Promise<boolean> {
  const [updated] = await db
    .update(namefiFeedListingsTable)
    .set({
      logo: input.logo,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(namefiFeedListingsTable.domain, input.domain),
        isNull(namefiFeedListingsTable.logo),
        ...getActiveNamefiFeedListingWhereClauses(),
      ),
    )
    .returning({ id: namefiFeedListingsTable.id });

  return Boolean(updated);
}

function isActivityCancellation(ctx: Context, error: unknown): boolean {
  return (
    ctx.cancellationSignal.aborted ||
    (error instanceof Error && error.message === 'activity-cancelled')
  );
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
        // Heartbeat failures are reported by the activity promise itself.
      }
    }, intervalMs);

    promise
      .then((value) => {
        clearInterval(interval);
        resolve(value);
      })
      .catch((error) => {
        clearInterval(interval);
        reject(error);
      });
  });
}

function createEmptyLogoResult(): GenerateNamefiFeedListingLogosResult {
  return {
    processed: 0,
    successes: 0,
    failures: 0,
    reusedExisting: 0,
    skipped: 0,
  };
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(Math.floor(value), min), max);
}
