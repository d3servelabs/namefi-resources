import { ToolLoopAgent } from 'ai';
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
import type {
  LogoTextTreatmentInput,
  LogoTypographyInput,
} from '../types/logo-options';
import { secrets } from '../env';

const openai = createOpenAI({
  apiKey: secrets.OPENAI_API_KEY,
});

const google = createGoogleGenerativeAI({
  apiKey: secrets.GEMINI_API_KEY,
});

const imageGenerationTool = 'image_generation' as const;

const OPENAI_TOOL_CONFIGS = {
  'gpt-image-1': {
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
    animationSheet: {
      model: 'gpt-image-1',
      size: '1536x1024',
      quality: 'medium',
      background: 'opaque',
      outputFormat: 'png',
      outputCompression: 100,
    },
  },
  'gpt-image-1.5': {
    logo: {
      model: 'gpt-image-1.5',
      size: '1024x1024',
      quality: 'medium',
      background: 'opaque',
      outputFormat: 'png',
      outputCompression: 100,
    },
    poster: {
      model: 'gpt-image-1.5',
      size: '1536x1024',
      quality: 'medium',
      background: 'opaque',
      outputFormat: 'png',
      outputCompression: 100,
    },
    animationSheet: {
      model: 'gpt-image-1.5',
      size: '1536x1024',
      quality: 'medium',
      background: 'opaque',
      outputFormat: 'png',
      outputCompression: 100,
    },
  },
  'gpt-image-2': {
    logo: {
      model: 'gpt-image-2',
      size: '1024x1024',
      quality: 'medium',
      background: 'opaque',
      outputFormat: 'png',
      outputCompression: 100,
    },
    poster: {
      model: 'gpt-image-2',
      size: '1536x1024',
      quality: 'medium',
      background: 'opaque',
      outputFormat: 'png',
      outputCompression: 100,
    },
    animationSheet: {
      model: 'gpt-image-2',
      size: '1536x1024',
      quality: 'high',
      background: 'opaque',
      outputFormat: 'png',
      outputCompression: 100,
    },
  },
} as const;

type ImageGenerationResult = {
  imageBase64: string;
  tokenUsage?: LanguageModelUsage;
};

type ReferenceLogoInput = {
  image: Uint8Array;
  mediaType: string;
};

interface ImageGenerationOptions {
  abortSignal?: AbortSignal;
}

const openaiPosterAgents = {
  'gpt-image-1': new ToolLoopAgent({
    model: openai('gpt-4.1'),
    instructions: resolveImageSystemPrompt('gpt-image-1', 'marketing'),
    tools: {
      [imageGenerationTool]: openai.tools.imageGeneration(
        OPENAI_TOOL_CONFIGS['gpt-image-1'].poster,
      ),
    },
    toolChoice: { type: 'tool', toolName: imageGenerationTool },
  }),
  'gpt-image-1.5': new ToolLoopAgent({
    model: openai('gpt-4.1'),
    instructions: resolveImageSystemPrompt('gpt-image-1.5', 'marketing'),
    tools: {
      [imageGenerationTool]: openai.tools.imageGeneration(
        OPENAI_TOOL_CONFIGS['gpt-image-1.5'].poster,
      ),
    },
    toolChoice: { type: 'tool', toolName: imageGenerationTool },
  }),
  'gpt-image-2': new ToolLoopAgent({
    model: openai('gpt-4.1'),
    instructions: resolveImageSystemPrompt('gpt-image-2', 'marketing'),
    tools: {
      [imageGenerationTool]: openai.tools.imageGeneration(
        OPENAI_TOOL_CONFIGS['gpt-image-2'].poster,
      ),
    },
    toolChoice: { type: 'tool', toolName: imageGenerationTool },
  }),
} as const;

const openaiLogoAgents = {
  'gpt-image-1': new ToolLoopAgent({
    model: openai('gpt-4.1'),
    instructions: resolveImageSystemPrompt('gpt-image-1', 'logo'),
    tools: {
      [imageGenerationTool]: openai.tools.imageGeneration(
        OPENAI_TOOL_CONFIGS['gpt-image-1'].logo,
      ),
    },
    toolChoice: { type: 'tool', toolName: imageGenerationTool },
  }),
  'gpt-image-1.5': new ToolLoopAgent({
    model: openai('gpt-4.1'),
    instructions: resolveImageSystemPrompt('gpt-image-1.5', 'logo'),
    tools: {
      [imageGenerationTool]: openai.tools.imageGeneration(
        OPENAI_TOOL_CONFIGS['gpt-image-1.5'].logo,
      ),
    },
    toolChoice: { type: 'tool', toolName: imageGenerationTool },
  }),
  'gpt-image-2': new ToolLoopAgent({
    model: openai('gpt-4.1'),
    instructions: resolveImageSystemPrompt('gpt-image-2', 'logo'),
    tools: {
      [imageGenerationTool]: openai.tools.imageGeneration(
        OPENAI_TOOL_CONFIGS['gpt-image-2'].logo,
      ),
    },
    toolChoice: { type: 'tool', toolName: imageGenerationTool },
  }),
} as const;

const openaiAnimationSheetAgents = {
  'gpt-image-1': new ToolLoopAgent({
    model: openai('gpt-4.1'),
    instructions: resolveImageSystemPrompt('gpt-image-1', 'animationSheet'),
    tools: {
      [imageGenerationTool]: openai.tools.imageGeneration(
        OPENAI_TOOL_CONFIGS['gpt-image-1'].animationSheet,
      ),
    },
    toolChoice: { type: 'tool', toolName: imageGenerationTool },
  }),
  'gpt-image-1.5': new ToolLoopAgent({
    model: openai('gpt-4.1'),
    instructions: resolveImageSystemPrompt('gpt-image-1.5', 'animationSheet'),
    tools: {
      [imageGenerationTool]: openai.tools.imageGeneration(
        OPENAI_TOOL_CONFIGS['gpt-image-1.5'].animationSheet,
      ),
    },
    toolChoice: { type: 'tool', toolName: imageGenerationTool },
  }),
  'gpt-image-2': new ToolLoopAgent({
    model: openai('gpt-4.1'),
    instructions: resolveImageSystemPrompt('gpt-image-2', 'animationSheet'),
    tools: {
      [imageGenerationTool]: openai.tools.imageGeneration(
        OPENAI_TOOL_CONFIGS['gpt-image-2'].animationSheet,
      ),
    },
    toolChoice: { type: 'tool', toolName: imageGenerationTool },
  }),
} as const;

function getOpenAiAgent(
  task: ImageTask,
  model: 'gpt-image-1' | 'gpt-image-1.5' | 'gpt-image-2',
) {
  if (task === 'logo') {
    return openaiLogoAgents[model];
  }
  if (task === 'animationSheet') {
    return openaiAnimationSheetAgents[model];
  }
  return openaiPosterAgents[model];
}

const geminiPosterAgents = {
  'gemini-2.5-flash-image': new ToolLoopAgent({
    model: google('gemini-2.5-flash-image'),
    instructions: resolveImageSystemPrompt(
      'gemini-2.5-flash-image',
      'marketing',
    ),
  }),
  'gemini-3-pro-image-preview': new ToolLoopAgent({
    model: google('gemini-3-pro-image-preview'),
    instructions: resolveImageSystemPrompt(
      'gemini-3-pro-image-preview',
      'marketing',
    ),
  }),
} as const;

const geminiLogoAgents = {
  'gemini-2.5-flash-image': new ToolLoopAgent({
    model: google('gemini-2.5-flash-image'),
    instructions: resolveImageSystemPrompt('gemini-2.5-flash-image', 'logo'),
  }),
  'gemini-3-pro-image-preview': new ToolLoopAgent({
    model: google('gemini-3-pro-image-preview'),
    instructions: resolveImageSystemPrompt(
      'gemini-3-pro-image-preview',
      'logo',
    ),
  }),
} as const;

function getGeminiAgent(
  task: ImageTask,
  model: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview',
) {
  return task === 'logo' ? geminiLogoAgents[model] : geminiPosterAgents[model];
}

async function generateOpenAiImage(
  task: ImageTask,
  model: 'gpt-image-1' | 'gpt-image-1.5' | 'gpt-image-2',
  prompt: string,
  referenceLogo?: ReferenceLogoInput,
  options: ImageGenerationOptions = {},
): Promise<ImageGenerationResult> {
  const result = await getOpenAiAgent(task, model).generate({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...(referenceLogo
            ? [
                {
                  type: 'image' as const,
                  image: referenceLogo.image,
                  mediaType: referenceLogo.mediaType,
                },
              ]
            : []),
        ],
      },
    ],
    abortSignal: options.abortSignal,
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
  model: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview',
  prompt: string,
  referenceLogo?: ReferenceLogoInput,
  options: ImageGenerationOptions = {},
): Promise<ImageGenerationResult> {
  const result = await getGeminiAgent(task, model).generate({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...(referenceLogo
            ? [
                {
                  type: 'image' as const,
                  image: referenceLogo.image,
                  mediaType: referenceLogo.mediaType,
                },
              ]
            : []),
        ],
      },
    ],
    abortSignal: options.abortSignal,
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
  referenceLogo?: ReferenceLogoInput,
  options: ImageGenerationOptions = {},
) {
  if (
    model === 'gpt-image-1' ||
    model === 'gpt-image-1.5' ||
    model === 'gpt-image-2'
  ) {
    return generateOpenAiImage(task, model, prompt, referenceLogo, options);
  }
  return generateGeminiImage(task, model, prompt, referenceLogo, options);
}

export interface LogoGenerationInput {
  domain: NamefiNormalizedDomain;
  concept: LogoConceptSchema;
  model: ImageModel;
  textTreatment?: LogoTextTreatmentInput;
  typography?: LogoTypographyInput;
  abortSignal?: AbortSignal;
}

export async function generateLogoImage(input: LogoGenerationInput) {
  const prompt = enhanceLogoPrompt({
    basePrompt: input.concept.logoConcept.prompt,
    domain: input.domain,
    logoType: input.concept.logoConcept.type,
    style: input.concept.logoConcept.style,
    colorPalette: input.concept.colorPalette,
    textTreatment: input.textTreatment,
    typography: input.typography,
    model: input.model,
  });

  const result = await createImage('logo', input.model, prompt, undefined, {
    abortSignal: input.abortSignal,
  });

  return {
    prompt,
    imageBase64: result.imageBase64,
    tokenUsage: result.tokenUsage,
  } as const;
}

export interface PosterGenerationInput {
  prompt: string;
  model: ImageModel;
  referenceLogo?: ReferenceLogoInput;
  abortSignal?: AbortSignal;
}

export async function generatePosterImage(input: PosterGenerationInput) {
  return createImage(
    'marketing',
    input.model,
    input.prompt,
    input.referenceLogo,
    { abortSignal: input.abortSignal },
  );
}

export interface AnimationSheetGenerationInput {
  prompt: string;
  model: 'gpt-image-2';
  referenceLogo: ReferenceLogoInput;
  abortSignal?: AbortSignal;
}

export async function generateAnimationSheetImage(
  input: AnimationSheetGenerationInput,
) {
  return createImage(
    'animationSheet',
    input.model,
    input.prompt,
    input.referenceLogo,
    { abortSignal: input.abortSignal },
  );
}
