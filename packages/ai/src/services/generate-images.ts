import { AIMessage, type BaseMessageLike } from '@langchain/core/messages';
import { uploadFileToS3, generateCloudFrontUrl } from '@namefi-astra/storage';
import type {
  GeneratedImage,
  GenerateMarketingImageParams,
} from '../lib/types';
import {
  GEMINI_IMAGE_CONFIG,
  OPENAI_MARKETING_IMAGE_CONFIG,
} from '../lib/config/models';
import {
  createGenerationMessages,
  createImageGenerationModel,
  extractImageData,
  generateImageWithTiming,
} from '../lib/utils/image-generation';
import { imageGenerationSystemPrompt } from '../prompts/domain-marketing';

/**
 * Create messages for multi-turn or regular generation
 */
function createMarketingImageMessagesOpenAI(
  enhancedPrompt: string,
  basedOnLogoCallId?: string,
): BaseMessageLike[] {
  const messages: BaseMessageLike[] = [
    ...createGenerationMessages(
      imageGenerationSystemPrompt,
      basedOnLogoCallId
        ? `Generate a marketing image based on the referenced logo. Use this prompt: ${enhancedPrompt}`
        : `Generate a marketing image with this prompt: ${enhancedPrompt}`,
    ),
  ];

  if (basedOnLogoCallId) {
    // Multi-turn generation: reference the logo
    messages.push(
      new AIMessage({
        content: '',
        response_metadata: {
          output: [
            {
              type: 'image_generation_call',
              id: basedOnLogoCallId,
            },
          ],
        },
      }),
    );
  }

  return messages;
}

function createMarketingImageMessagesGemini(
  enhancedPrompt: string,
  basedOnLogoPublicUrl?: string,
): BaseMessageLike[] {
  const messages: BaseMessageLike[] = [
    ...createGenerationMessages(
      imageGenerationSystemPrompt,
      basedOnLogoPublicUrl
        ? `Generate a marketing image based on the referenced logo. Use this prompt: ${enhancedPrompt}`
        : `Generate a marketing image with this prompt: ${enhancedPrompt}`,
    ),
  ];

  if (basedOnLogoPublicUrl) {
    messages.push(
      new AIMessage({
        content: '',
      }),
    );
  }

  console.error(messages);

  return messages;
}

/**
 * Generate single marketing image
 */
export async function generateMarketingImage(
  params: GenerateMarketingImageParams,
): Promise<GeneratedImage | null> {
  const { domain, storage, basedOnLogoCallId, basedOnLogoPublicUrl } = params;

  console.log(`Generating marketing image for ${domain}`);
  console.log(
    basedOnLogoCallId
      ? `Based on logo call ID: ${basedOnLogoCallId}`
      : basedOnLogoPublicUrl
        ? `Based on logo public URL: ${basedOnLogoPublicUrl}`
        : '',
  );

  const imageGenerationModel = createImageGenerationModel(
    params.model === 'gpt-image-1'
      ? OPENAI_MARKETING_IMAGE_CONFIG
      : GEMINI_IMAGE_CONFIG,
  );

  try {
    // Create messages for multi-turn or regular generation
    const messages =
      params.model === 'gpt-image-1'
        ? createMarketingImageMessagesOpenAI(
            'Using the referenced logo, put it on a realistic billboard',
            basedOnLogoCallId,
          )
        : createMarketingImageMessagesGemini(
            'Using the referenced logo, put it on a realistic billboard',
            basedOnLogoPublicUrl,
          );

    // Generate image
    const response = await generateImageWithTiming(
      imageGenerationModel,
      messages,
    );

    // Extract image data
    const { imageData, generationCallId } = extractImageData(
      response,
      params.model,
    );

    if (!imageData) {
      console.error(`No image data received for ${domain}`);
      return null;
    }

    // Convert base64 to buffer
    const rawImageBuffer = Buffer.from(imageData, 'base64');

    const result = await uploadFileToS3({
      s3Client: storage.s3Client,
      bucketName: storage.bucketName,
      fileBuffer: rawImageBuffer,
      contentType: 'image/jpeg',
      folder: storage.baseFolder,
    });

    const publicUrl = generateCloudFrontUrl({
      cloudfrontDomain: storage.cloudfrontDomain,
      s3Key: result.key,
    });

    console.log(`✅ Generated and saved: ${domain}`);
    return {
      url: publicUrl,
      storagePath: result.key,
      generationCallId,
      tokenUsage: response.usage_metadata,
      model: params.model,
    };
  } catch (error) {
    console.error(`Failed to generate image for ${domain}:`, error);
    return null;
  }
}
