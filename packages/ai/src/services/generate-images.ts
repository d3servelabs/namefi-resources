import { AIMessage, type BaseMessageLike } from '@langchain/core/messages';
import { uploadFileToS3, generateCloudFrontUrl } from '@namefi-astra/storage';
import type {
  GeneratedImage,
  GenerateMarketingImageParams,
} from '../lib/types';
import { MODEL_CONFIGS } from '../lib/config/models';
import {
  createGenerationMessages,
  createImageGenerationModel,
  extractImageData,
  generateImageWithTiming,
} from '../lib/utils/image-generation';
import {
  addImageOverlays,
  createDefaultOverlayConfig,
} from '../lib/utils/image-overlay';
import { imageGenerationSystemPrompt } from '../prompts/domain-marketing';

/**
 * Create messages for multi-turn or regular generation
 */
function createMarketingImageMessages(
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
        // biome-ignore lint/style/useNamingConvention: langchain uses snake_case
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

/**
 * Generate single marketing image
 */
export async function generateMarketingImage(
  params: GenerateMarketingImageParams,
): Promise<GeneratedImage | null> {
  const { domain, storage, basedOnLogoCallId } = params;

  console.log(`Generating marketing image for ${domain}`);
  console.log(`Based on logo call ID: ${basedOnLogoCallId}`);

  const imageGenerationModel = createImageGenerationModel(
    MODEL_CONFIGS.MARKETING_IMAGE_GENERATION,
  );

  try {
    // Create messages for multi-turn or regular generation
    const messages = createMarketingImageMessages(
      'Using the referenced logo, put it on a realistic billboard',
      basedOnLogoCallId,
    );

    // Generate image
    const response = await generateImageWithTiming(
      imageGenerationModel,
      messages,
    );

    // Extract image data
    const { imageData, revisedPrompt, generationCallId } =
      extractImageData(response);

    if (!imageData) {
      console.error(`No image data received for ${domain}`);
      return null;
    }

    // Convert base64 to buffer
    const rawImageBuffer = Buffer.from(imageData, 'base64');

    // Add procedural overlays (NameFi logo and QR code)
    console.log(`Adding overlays for ${domain}...`);
    const overlayConfig = createDefaultOverlayConfig(
      domain,
      rawImageBuffer,
      'https://xlwzxdrkpyaksbwzvcqy.supabase.co/storage/v1/object/public/assets//jain-with-namefi.png',
    );
    const overlayResult = await addImageOverlays(overlayConfig);

    let finalImageBuffer: Buffer;
    if (overlayResult.success && overlayResult.processedImage) {
      console.log('✅ Successfully added overlays');
      finalImageBuffer = overlayResult.processedImage;
    } else {
      console.error('Failed to add overlays, using original image');
      // Fall back to original image if overlay fails
      finalImageBuffer = rawImageBuffer;
    }

    const result = await uploadFileToS3({
      s3Client: storage.s3Client,
      bucketName: storage.bucketName,
      fileBuffer: finalImageBuffer,
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
      revisedPrompt,
      generationCallId,
      tokenUsage: response.usage_metadata,
      model: MODEL_CONFIGS.MARKETING_IMAGE_GENERATION.toolConfig.model,
    };
  } catch (error) {
    console.error(`Failed to generate image for ${domain}:`, error);
    return null;
  }
}
