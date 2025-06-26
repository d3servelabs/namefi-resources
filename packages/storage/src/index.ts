import { S3Client } from '@aws-sdk/client-s3';

/**
 * S3 Client Configuration for Supabase Storage
 *
 * Supabase Storage supports the S3 protocol.
 *
 * @see https://supabase.com/docs/guides/storage/s3/authentication
 * @see https://supabase.com/docs/guides/storage/s3/compatibility
 */

interface CreateS3ClientWithAccessKeysParams {
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_REGION: string;
}

export const createS3ClientWithAccessKeys = ({
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
}: CreateS3ClientWithAccessKeysParams) => {
  return new S3Client({
    forcePathStyle: true,
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });
};

export type { S3Client } from '@aws-sdk/client-s3';

export const getBucketUrl = ({
  bucketName,
  bucketRegion,
}: {
  bucketName: string;
  bucketRegion: string;
}) =>
  `https://${bucketName}.${bucketRegion}.supabase.co/storage/v1/object/public/${bucketName}`;
