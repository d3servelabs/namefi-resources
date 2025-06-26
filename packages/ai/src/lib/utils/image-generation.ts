import { PutObjectCommand } from '@aws-sdk/client-s3';
import {
  type AIMessage,
  type BaseMessageLike,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import type { S3Client } from '@namefi-astra/storage';
import type { Responses } from 'openai/resources';
import { secrets } from '../env';

export interface ImageGenerationConfig {
  model: string;
  temperature: number;
  toolConfig: {
    type: 'image_generation';
    model: string;
    quality: string;
    size: string;
    output_format: string;
    output_compression: number;
    background: string;
  };
}

export interface ImageData {
  imageData: string | null;
  revisedPrompt?: string;
  generationCallId?: string;
}

export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  error?: Error;
}

/**
 * Create a configured ChatOpenAI model for image generation
 */
export function createImageGenerationModel(config: ImageGenerationConfig) {
  return new ChatOpenAI({
    model: config.model,
    temperature: config.temperature,
    apiKey: secrets.OPENAI_API_KEY,
  }).bindTools([config.toolConfig]);
}

/**
 * Extract image data from AI response
 */
export function extractImageData(response: AIMessage): ImageData {
  if (!response.additional_kwargs?.tool_outputs) {
    console.error('No tool outputs found in response');
    return { imageData: null };
  }

  const imageOutput = (
    response.additional_kwargs.tool_outputs as Responses.ResponseOutputItem[]
  ).find((output) => output.type === 'image_generation_call');

  if (!imageOutput?.result) {
    console.error('No image data found in tool outputs');
    return { imageData: null };
  }

  return {
    imageData: imageOutput.result,
    generationCallId: imageOutput.id,
  };
}

/**
 * Upload image buffer to S3
 */
export async function uploadImageToS3(
  buffer: Buffer,
  filePath: string,
  storageBucket: string,
  cloudFrontUrl: string,
  s3Client: S3Client,
  contentType = 'image/png',
): Promise<UploadResult> {
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: storageBucket,
        Key: filePath,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    const publicUrl = `${cloudFrontUrl}/${filePath}`;
    return { success: true, publicUrl };
  } catch (error) {
    console.error('Failed to upload to S3:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown S3 error'),
    };
  }
}

/**
 * Generate image using AI model with timing
 */
export async function generateImageWithTiming(
  model: ReturnType<ChatOpenAI['bindTools']>,
  messages: BaseMessageLike[],
): Promise<AIMessage> {
  const startTime = Date.now();
  const response = await model.invoke(messages);
  const generationTime = Date.now() - startTime;
  console.log(`⏱️ Image generation took ${generationTime}ms`);
  return response;
}

/**
 * Create system and human messages for generation
 */
export function createGenerationMessages(
  systemPrompt: string,
  userPrompt: string,
): BaseMessageLike[] {
  return [new SystemMessage(systemPrompt), new HumanMessage(userPrompt)];
}

/**
 * Sanitize string for file naming
 */
export function sanitizeForFilename(input: string): string {
  return input
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Create unique run ID with timestamp
 */
export function createRunId(prefix: string): string {
  const sanitizedPrefix = sanitizeForFilename(prefix);
  const timestamp = Date.now();
  return `${sanitizedPrefix}-${timestamp}`;
}
