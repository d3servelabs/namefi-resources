import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';

interface CreateS3ClientParams {
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_REGION: string;
}

interface BaseStorageParams {
  bucketName: string;
  s3Client: S3Client;
}

interface BaseCloudFrontParams {
  cloudfrontDomain: string;
}

export interface StorageConfig extends BaseStorageParams, BaseCloudFrontParams {
  baseFolder: string;
}

export const createS3Client = ({
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
}: CreateS3ClientParams) => {
  return new S3Client({
    forcePathStyle: true,
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });
};

export interface UploadFileToS3Params extends BaseStorageParams {
  fileBuffer: Buffer;
  contentType: string;
  fileName?: string;
  folder?: string;
  abortSignal?: AbortSignal;
}

export interface UploadFileToS3Result {
  key: string;
  etag?: string;
  location: string;
}

export const uploadFileToS3 = async ({
  s3Client,
  bucketName,
  fileBuffer,
  fileName,
  contentType,
  folder,
  abortSignal,
}: UploadFileToS3Params): Promise<UploadFileToS3Result> => {
  try {
    const uniqueFileName = randomUUID();
    const key = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      Metadata: {
        ...(fileName && { originalName: fileName }),
        uploadedAt: new Date().toISOString(),
      },
    });

    const result = await s3Client.send(
      command,
      abortSignal ? { abortSignal } : undefined,
    );

    if (!result.ETag) {
      throw new Error('Upload failed: No ETag returned');
    }

    return {
      key,
      etag: result.ETag,
      location: `s3://${bucketName}/${key}`,
    };
  } catch (error) {
    throw new Error(
      `Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};

export interface DeleteFileFromS3Params extends BaseStorageParams {
  key: string;
}

export const deleteFileFromS3 = async ({
  s3Client,
  bucketName,
  key,
}: DeleteFileFromS3Params): Promise<void> => {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      }),
    );
  } catch (error) {
    throw new Error(
      `Failed to delete file from S3: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};

export interface DownloadFileFromS3Params extends BaseStorageParams {
  key: string;
  abortSignal?: AbortSignal;
}

export interface DownloadFileFromS3Result {
  bytes: Buffer;
  contentType?: string;
}

export const downloadFileFromS3 = async ({
  s3Client,
  bucketName,
  key,
  abortSignal,
}: DownloadFileFromS3Params): Promise<DownloadFileFromS3Result> => {
  try {
    const result = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      }),
      abortSignal ? { abortSignal } : undefined,
    );

    if (!result.Body) {
      throw new Error('Download failed: No body returned');
    }

    return {
      bytes: Buffer.from(await result.Body.transformToByteArray()),
      contentType: result.ContentType,
    };
  } catch (error) {
    throw new Error(
      `Failed to download file from S3: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};

export interface GenerateCloudFrontUrlParams extends BaseCloudFrontParams {
  s3Key: string;
}

export const generateCloudFrontUrl = ({
  cloudfrontDomain,
  s3Key,
}: GenerateCloudFrontUrlParams): string => {
  return `https://${cloudfrontDomain}/${s3Key}`;
};

export const generateUrlFromStoragePath = (
  storagePath: string,
  cloudfrontDomain: string,
): string => {
  return generateCloudFrontUrl({
    cloudfrontDomain,
    s3Key: storagePath,
  });
};

export type { S3Client } from '@aws-sdk/client-s3';
