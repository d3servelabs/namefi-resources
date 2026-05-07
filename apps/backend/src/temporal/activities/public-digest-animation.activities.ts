import { Context } from '@temporalio/activity';
import {
  runDigestAnimationWorkflowFromUploadedSource,
  type DigestAnimationWorkflowOutput,
} from '@namefi-astra/ai';
import { createS3Client } from '@namefi-astra/storage';
import { config, secrets } from '#lib/env';
import { createLogger } from '#lib/logger';
import type {
  PublicDigestAnimationActivityResult,
  PublicDigestAnimationWorkflowInput,
} from '../shared/public-digest-animation';
import { heartbeatWhile } from './logo-animation.activities';

const logger = createLogger({ module: 'public-digest-animation-activities' });

function getAnimationStorage() {
  const s3Client = createS3Client({
    AWS_ACCESS_KEY_ID: secrets.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: secrets.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: config.AWS_REGION,
  });

  return {
    bucketName: config.STORAGE_BUCKET,
    cloudfrontDomain: config.CLOUD_FRONT_DOMAIN,
    s3Client,
    baseFolder: config.AI_BUCKET_FOLDERS.ANIMATIONS,
  };
}

export async function generatePublicDigestAnimation(
  input: PublicDigestAnimationWorkflowInput,
): Promise<PublicDigestAnimationActivityResult> {
  logger.info(
    {
      jobId: input.jobId,
      model: input.model,
      sheetModel: input.sheetModel,
      sourceImageStoragePath: input.sourceImage.storagePath,
    },
    'Starting public digest animation generation',
  );

  const output: DigestAnimationWorkflowOutput = await heartbeatWhile(
    (abortSignal) =>
      runDigestAnimationWorkflowFromUploadedSource(
        {
          title: input.title,
          sourceImage: {
            storagePath: input.sourceImage.storagePath,
            mimeType: input.sourceImage.mimeType,
          },
          domains: input.domains,
          summary: input.summary,
          model: input.model,
          sheetModel: input.sheetModel,
          storage: getAnimationStorage(),
        },
        { abortSignal },
      ),
    {
      stage: 'public-digest-animation',
      jobId: input.jobId,
    },
    10_000,
    Context.current(),
  );

  logger.info(
    {
      jobId: input.jobId,
      videoStoragePath: output.video.storagePath,
      sheetStoragePath: output.animationSheet.storagePath,
    },
    'Finished public digest animation generation',
  );

  return {
    createdAt: new Date().toISOString(),
    output,
  };
}
