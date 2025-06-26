import { S3Client } from '@aws-sdk/client-s3';

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
