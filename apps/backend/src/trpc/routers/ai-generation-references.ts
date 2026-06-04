import { config } from '#lib/env';
import { db } from '@namefi-astra/db';
import { aiGenerationsTable } from '@namefi-astra/db/schema';
import { generateUrlFromStoragePath } from '@namefi-astra/storage';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';

type AiGenerationRow = typeof aiGenerationsTable.$inferSelect;
type LogoReferenceGeneration = Pick<
  AiGenerationRow,
  'domain' | 'id' | 'output'
> &
  Partial<Pick<AiGenerationRow, 'status'>>;
type LogoGenerationOutput = Extract<
  AiGenerationRow['output'],
  { type: 'logo' }
>;
type ValidatedLogoReferenceGeneration = Omit<
  LogoReferenceGeneration,
  'output'
> & {
  output: LogoGenerationOutput;
};

async function findOwnedLogoGeneration(params: {
  generationId: string;
  userId: string;
}) {
  return await db
    .select()
    .from(aiGenerationsTable)
    .where(
      and(
        eq(aiGenerationsTable.userId, params.userId),
        eq(aiGenerationsTable.id, params.generationId),
        eq(aiGenerationsTable.type, 'logo'),
        eq(aiGenerationsTable.isDeleted, false),
      ),
    )
    .then((rows) => rows[0]);
}

export function validateOwnedLogoReference(params: {
  domain: string;
  referenceLogoGeneration?: LogoReferenceGeneration;
}): ValidatedLogoReferenceGeneration {
  const { domain, referenceLogoGeneration } = params;

  if (
    !referenceLogoGeneration ||
    referenceLogoGeneration.output.type !== 'logo' ||
    referenceLogoGeneration.status !== 'SUCCEEDED' ||
    !referenceLogoGeneration.output.storagePath
  ) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Reference logo generation is not ready',
    });
  }

  if (referenceLogoGeneration.domain !== domain) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Reference logo must match the requested domain',
    });
  }

  return referenceLogoGeneration as ValidatedLogoReferenceGeneration;
}

export function getLogoReferencePublicUrl(
  referenceLogoGeneration: ValidatedLogoReferenceGeneration,
) {
  return generateUrlFromStoragePath(
    referenceLogoGeneration.output.storagePath,
    config.CLOUD_FRONT_DOMAIN,
  );
}

export function resolveLogoReferenceDetails(params: {
  domain: string;
  referenceLogoGeneration?: LogoReferenceGeneration;
}) {
  const referenceLogoGeneration = validateOwnedLogoReference(params);

  return {
    referenceLogoGeneration,
    referenceLogoPublicUrl: getLogoReferencePublicUrl(referenceLogoGeneration),
  };
}

export async function resolveOwnedLogoReference(params: {
  domain: string;
  generationId: string;
  userId: string;
}) {
  const referenceLogoGeneration = await findOwnedLogoGeneration({
    generationId: params.generationId,
    userId: params.userId,
  });

  return resolveLogoReferenceDetails({
    domain: params.domain,
    referenceLogoGeneration,
  });
}
