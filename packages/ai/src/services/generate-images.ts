import { AIMessage, type BaseMessageLike } from '@langchain/core/messages';
import { MODEL_CONFIGS, STORAGE_BUCKETS } from '../lib/config/models';
import { sanitizeDomainName } from '../lib/utils/domain';
import {
  createGenerationMessages,
  createImageGenerationModel,
  createRunId,
  extractImageData,
  generateImageWithTiming,
  uploadImageToS3,
} from '../lib/utils/image-generation';
import {
  addImageOverlays,
  createDefaultOverlayConfig,
} from '../lib/utils/image-overlay';
import {
  enhanceImagePrompt,
  imageGenerationSystemPrompt,
} from '../prompts/domain-marketing';

interface MarketingConcept {
  style: string;
  buyerAppeal: string;
  concept: string;
  prompt: string;
}

interface GeneratedImage {
  url: string;
  prompt: string;
  style: string;
  storagePath?: string;
  revisedPrompt?: string;
  generationCallId?: string;
}

/**
 * Generate file path for marketing image
 */
function generateImageFilePath(
  domain: string,
  runId: string,
  index: number,
  style: string,
): string {
  const fileName = `${index}-${style.toLowerCase().replace(/\s+/g, '-')}.png`;
  return `${runId}/${fileName}`;
}

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
  domain: string,
  marketingConcept: MarketingConcept,
  runId: string,
  basedOnLogoCallId?: string,
): Promise<GeneratedImage | null> {
  console.log(`Generating marketing image for ${domain}`);
  console.log(`Style: ${marketingConcept.style}`);
  console.log(`Prompt: ${marketingConcept.prompt}`);
  console.log(`Based on logo call ID: ${basedOnLogoCallId}`);

  const imageGenerationModel = createImageGenerationModel(
    MODEL_CONFIGS.MARKETING_IMAGE_GENERATION,
  );

  try {
    // Create enhanced prompt
    const enhancedPrompt = enhanceImagePrompt({
      basePrompt: marketingConcept.prompt,
      domain,
      buyerAppeal: marketingConcept.buyerAppeal,
      style: marketingConcept.style,
      withLogo: !!basedOnLogoCallId,
    });

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
      console.error(`No image data received for ${marketingConcept.style}`);
      return null;
    }

    // Convert base64 to buffer
    const rawImageBuffer = Buffer.from(imageData, 'base64');

    // Add procedural overlays (NameFi logo and QR code)
    console.log(`Adding overlays for ${domain}...`);
    const overlayConfig = createDefaultOverlayConfig(
      domain,
      rawImageBuffer,
      'https://xlwzxdrkpyaksbwzvcqy.supabase.co/storage/v1/object/public/assets//powered-by-namefi.jpg',
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

    const filePath = generateImageFilePath(
      domain,
      runId,
      1,
      marketingConcept.style,
    );
    const uploadResult = await uploadImageToS3(
      finalImageBuffer,
      filePath,
      STORAGE_BUCKETS.MARKETING_IMAGES,
      'image/jpeg',
    );

    if (uploadResult.success && uploadResult.publicUrl) {
      console.log(`✅ Generated and saved: ${marketingConcept.style}`);
      return {
        url: uploadResult.publicUrl,
        prompt: marketingConcept.concept,
        style: marketingConcept.style,
        storagePath: filePath,
        revisedPrompt,
        generationCallId,
      };
    }

    return null;
  } catch (error) {
    console.error(
      `Failed to generate image for ${marketingConcept.style}:`,
      error,
    );
    return null;
  }
}

/**
 * Generate marketing images (kept for backward compatibility, but now generates only 1)
 */
export async function generateMarketingImages(
  domain: string,
  marketingConcepts: MarketingConcept[],
  runId: string,
  basedOnLogoCallId?: string,
): Promise<GeneratedImage[]> {
  // Since we only generate 1 image per call now, take the first concept
  const concept = marketingConcepts[0];
  if (!concept) {
    return [];
  }

  const result = await generateMarketingImage(
    domain,
    concept,
    runId,
    basedOnLogoCallId,
  );
  return result ? [result] : [];
}

/**
 * Create unique run ID for marketing image generation
 */
export function createMarketingRunId(domain: string): string {
  return createRunId(sanitizeDomainName(domain));
}
