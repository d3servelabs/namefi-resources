import { Experimental_Agent as Agent } from 'ai';
import type { LanguageModelUsage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { enhanceLogoPrompt } from '../prompts/logo-generation';
import {
  resolveImageSystemPrompt,
  type ImageTask,
} from '../prompts/image-system-prompts';
import type { ImageModel } from '../types/generation';
import type { LogoConceptSchema } from '../types/logo-schemas';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const imageGenerationTool = 'image_generation' as const;

const OPENAI_TOOL_CONFIGS = {
  logo: {
    model: 'gpt-image-1',
    size: '1024x1024',
    quality: 'medium',
    background: 'opaque',
    outputFormat: 'png',
    outputCompression: 100,
  },
  poster: {
    model: 'gpt-image-1',
    size: '1536x1024',
    quality: 'medium',
    background: 'opaque',
    outputFormat: 'png',
    outputCompression: 100,
  },
} as const;

type ImageGenerationResult = {
  imageBase64: string;
  tokenUsage?: LanguageModelUsage;
};

const openaiPosterAgent = new Agent({
  model: openai('gpt-4.1'),
  system: resolveImageSystemPrompt('gpt-image-1', 'marketing'),
  tools: {
    [imageGenerationTool]: openai.tools.imageGeneration(
      OPENAI_TOOL_CONFIGS.poster,
    ),
  },
  toolChoice: { type: 'tool', toolName: imageGenerationTool },
});

const openaiLogoAgent = new Agent({
  model: openai('gpt-4.1'),
  system: resolveImageSystemPrompt('gpt-image-1', 'logo'),
  tools: {
    [imageGenerationTool]: openai.tools.imageGeneration(
      OPENAI_TOOL_CONFIGS.logo,
    ),
  },
  toolChoice: { type: 'tool', toolName: imageGenerationTool },
});

function getOpenAiAgent(task: ImageTask) {
  return task === 'logo' ? openaiLogoAgent : openaiPosterAgent;
}

const geminiPosterAgent = new Agent({
  model: google('gemini-2.5-flash-image'),
  system: resolveImageSystemPrompt('gemini-2.5-flash-image', 'marketing'),
});

const geminiLogoAgent = new Agent({
  model: google('gemini-2.5-flash-image'),
  system: resolveImageSystemPrompt('gemini-2.5-flash-image', 'logo'),
});

function getGeminiAgent(task: ImageTask) {
  return task === 'logo' ? geminiLogoAgent : geminiPosterAgent;
}

async function generateOpenAiImage(
  task: ImageTask,
  prompt: string,
  referenceLogoDataUrl?: string,
): Promise<ImageGenerationResult> {
  const result = await getOpenAiAgent(task).generate({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...(referenceLogoDataUrl
            ? [{ type: 'image' as const, image: referenceLogoDataUrl }]
            : []),
        ],
      },
    ],
  });

  const toolResult = result.staticToolResults.find(
    (entry) => entry.toolName === imageGenerationTool,
  );
  const imageBase64 = toolResult?.output?.result;

  if (!imageBase64) {
    throw new Error('image_generation tool did not return image data');
  }

  return {
    imageBase64,
    tokenUsage: result.totalUsage,
  };
}

async function generateGeminiImage(
  task: ImageTask,
  prompt: string,
  referenceLogoDataUrl?: string,
): Promise<ImageGenerationResult> {
  const result = await getGeminiAgent(task).generate({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...(referenceLogoDataUrl
            ? [{ type: 'image' as const, image: referenceLogoDataUrl }]
            : []),
        ],
      },
    ],
  });

  const base64Image = result.files[0]?.base64;

  if (!base64Image) {
    throw new Error('gemini_image tool did not return image data');
  }

  return {
    imageBase64: base64Image,
    tokenUsage: result.totalUsage,
  };
}

async function createImage(
  task: ImageTask,
  model: ImageModel,
  prompt: string,
  referenceLogoDataUrl?: string,
) {
  if (model === 'gpt-image-1') {
    return generateOpenAiImage(task, prompt, referenceLogoDataUrl);
  }
  return generateGeminiImage(task, prompt, referenceLogoDataUrl);
}

export interface LogoGenerationInput {
  domain: NamefiNormalizedDomain;
  concept: LogoConceptSchema;
  model: ImageModel;
}

export async function generateLogoImage(input: LogoGenerationInput) {
  const prompt = enhanceLogoPrompt({
    basePrompt: input.concept.logoConcept.prompt,
    domain: input.domain,
    logoType: input.concept.logoConcept.type,
    style: input.concept.logoConcept.style,
    model: input.model,
  });

  const result = await createImage('logo', input.model, prompt);

  return {
    prompt,
    imageBase64: result.imageBase64,
    tokenUsage: result.tokenUsage,
  } as const;
}

export interface PosterGenerationInput {
  prompt: string;
  model: ImageModel;
  referenceLogoDataUrl?: string;
}

export async function generatePosterImage(input: PosterGenerationInput) {
  return createImage(
    'marketing',
    input.model,
    input.prompt,
    input.referenceLogoDataUrl,
  );
}
