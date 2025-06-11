import { S3Client } from '@aws-sdk/client-s3';
import { secrets } from './lib/env';

/**
 * S3 Client Configuration for Supabase Storage
 *
 * Supabase Storage supports the S3 protocol.
 *
 * @see https://supabase.com/docs/guides/storage/s3/authentication
 * @see https://supabase.com/docs/guides/storage/s3/compatibility
 */

export const createS3ClientWithAccessKeys = () => {
  const {
    SUPABASE_PROJECT_REF,
    SUPABASE_S3_ACCESS_KEY_ID,
    SUPABASE_S3_SECRET_ACCESS_KEY,
    SUPABASE_S3_REGION,
  } = secrets;

  return new S3Client({
    forcePathStyle: true,
    region: SUPABASE_S3_REGION,
    endpoint: `https://${SUPABASE_PROJECT_REF}.supabase.co/storage/v1/s3`,
    credentials: {
      accessKeyId: SUPABASE_S3_ACCESS_KEY_ID,
      secretAccessKey: SUPABASE_S3_SECRET_ACCESS_KEY,
    },
  });
};

export const s3Client = createS3ClientWithAccessKeys();

export const getBucketUrl = (bucketName: string) =>
  `https://${secrets.SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/public/${bucketName}`;
