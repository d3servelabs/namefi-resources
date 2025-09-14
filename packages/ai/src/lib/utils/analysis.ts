import {
  HumanMessage,
  SystemMessage,
  type UsageMetadata,
  type BaseMessageLike,
} from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import type { z } from 'zod';
import { secrets } from '../env';

export interface AnalysisConfig {
  model: string;
  temperature: number;
}

/**
 * Create a configured ChatOpenAI model for analysis
 */
export function createAnalysisModel(config: AnalysisConfig): ChatOpenAI {
  return new ChatOpenAI({
    model: config.model,
    temperature: config.temperature,
    apiKey: secrets.OPENAI_API_KEY,
  });
}

export type AnalysisResult<T> = {
  data: T;
  tokenUsage?: UsageMetadata;
  model: string;
};

type MinimalStructuredModel = {
  invoke: (messages: BaseMessageLike[]) => Promise<{
    parsed?: unknown;
    raw?: { usage_metadata?: UsageMetadata } | unknown;
  }>;
};

/**
 * Perform structured analysis using a schema
 */
export async function performStructuredAnalysis<T>(
  model: ChatOpenAI,
  schema: z.ZodSchema<T>,
  schemaName: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<AnalysisResult<T>> {
  // TODO (sid): Fix these types once zod is upgraded
  const typedModel = model as unknown as {
    withStructuredOutput: (
      schema: unknown,
      options: { name: string; includeRaw: boolean },
    ) => unknown;
  };

  const structuredModel = typedModel.withStructuredOutput(schema as unknown, {
    name: schemaName,
    includeRaw: true,
  }) as MinimalStructuredModel;

  const result = await structuredModel.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(userPrompt),
  ]);

  return {
    data: result.parsed as T,
    tokenUsage: (result.raw as { usage_metadata?: UsageMetadata } | undefined)
      ?.usage_metadata,
    model: model.model,
  };
}
