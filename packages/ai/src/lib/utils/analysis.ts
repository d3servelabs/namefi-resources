import { HumanMessage, SystemMessage } from '@langchain/core/messages';
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

/**
 * Perform structured analysis using a schema
 */
export async function performStructuredAnalysis<T>(
  model: ChatOpenAI,
  schema: z.ZodSchema<T>,
  schemaName: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<T> {
  const structuredModel = model.withStructuredOutput(schema, {
    name: schemaName,
  });

  return (await structuredModel.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(userPrompt),
  ])) as T;
}
