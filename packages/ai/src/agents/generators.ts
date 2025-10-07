import { Experimental_Agent as Agent } from 'ai';
import type { LanguageModelUsage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { enhanceLogoPrompt } from '../prompts/logo-generation';
import type { ImageModel } from '../types/generation';
import type { LogoConceptSchema } from '../types/logo-schemas';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const imageGenerationTool = 'image_generation' as const;

const openaiImageAgent = new Agent({
  model: openai('gpt-4o'),
  system:
    'You must call the image_generation tool exactly once to produce a single 1024x1024 image. Return no additional text.',
  tools: {
    [imageGenerationTool]: openai.tools.imageGeneration({
      model: 'gpt-image-1',
      size: '1024x1024',
      quality: 'low',
      background: 'opaque',
      outputFormat: 'png',
    }),
  },
  toolChoice: { type: 'tool', toolName: imageGenerationTool },
});

const geminiImageAgent = new Agent({
  model: google('gemini-2.5-flash-image'),
  system:
    'You must call the gemini_image tool exactly once to produce the requested image. Return no additional text.',
});

interface ImageGenerationResult {
  imageBase64: string;
  tokenUsage?: LanguageModelUsage;
}

async function generateOpenAiImage(
  prompt: string,
  referenceLogoDataUrl?: string,
): Promise<ImageGenerationResult> {
  const result = await openaiImageAgent.generate({
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
    (entry) => entry.toolName === 'image_generation',
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
  prompt: string,
  referenceLogoDataUrl?: string,
): Promise<ImageGenerationResult> {
  const result = await geminiImageAgent.generate({
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
  prompt: string,
  model: ImageModel,
  referenceLogoDataUrl?: string,
) {
  if (model === 'gpt-image-1') {
    return generateOpenAiImage(prompt, referenceLogoDataUrl);
  }
  return generateGeminiImage(prompt, referenceLogoDataUrl);
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

  const result = await createImage(prompt, input.model);

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
  return createImage(input.prompt, input.model, input.referenceLogoDataUrl);
}
