import {
  type AIMessage,
  type BaseMessageLike,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { Responses } from 'openai/resources';
import type { Part } from '@google/genai';
import { secrets } from '../env';
import type { Model } from '../types';

export interface OpenAIToolConfig {
  type: 'image_generation';
  model: string;
  quality: string;
  size: string;
  output_format: string;
  output_compression: number;
  background: string;
}

export interface BaseImageGenerationConfig {
  type: 'openai' | 'gemini';
  model: string;
  temperature: number;
}

export interface OpenAIImageGenerationConfig extends BaseImageGenerationConfig {
  type: 'openai';
  toolConfig: OpenAIToolConfig;
}

export interface GeminiImageGenerationConfig extends BaseImageGenerationConfig {
  type: 'gemini';
}

export type ImageGenerationConfig =
  | OpenAIImageGenerationConfig
  | GeminiImageGenerationConfig;

export interface ImageData {
  imageData: string | null;
  generationCallId?: string;
}

/**
 * Create a configured ChatOpenAI model for image generation
 */
export function createImageGenerationModel(config: ImageGenerationConfig) {
  if (config.type === 'openai') {
    return new ChatOpenAI({
      model: config.model,
      temperature: config.temperature,
      apiKey: secrets.OPENAI_API_KEY,
    }).bindTools([config.toolConfig]);
  }
  return new ChatGoogleGenerativeAI({
    model: config.model,
    temperature: config.temperature,
    apiKey: secrets.GEMINI_API_KEY,
  });
}

/**
 * Extract image data from AI response
 */
export function extractImageData(response: AIMessage, model: Model): ImageData {
  console.log('response', Object.keys(response));
  if (!response.lc_kwargs?.content) {
    console.error('No tool outputs found in response');
    return { imageData: null };
  }

  if (model === 'gpt-image-1') {
    const imageOutput = (
      response.lc_kwargs?.content as Responses.ResponseOutputItem[]
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

  if (model === 'gemini-2.5-flash-image-preview') {
    const imageOutput = (response.lc_kwargs?.content as Part[]).find(
      (output) => !!output.inlineData,
    );
    if (!imageOutput?.inlineData?.data) {
      console.error('No image data found in tool outputs');
      return { imageData: null };
    }

    return {
      imageData: imageOutput.inlineData.data,
      generationCallId: undefined,
    };
  }

  console.error('Invalid model');
  return { imageData: null };
}

/**
 * Generate image using AI model with timing
 */
export interface InvokableModel {
  invoke: (messages: BaseMessageLike[]) => Promise<AIMessage>;
}

export async function generateImageWithTiming(
  model: InvokableModel,
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
