import { HumanMessage } from '@langchain/core/messages';
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
  buildImageGenerationMessages,
  createImageGenerationModel,
  extractImageData,
  generateImageWithTiming,
  fetchImageAsDataUrl,
} from '../lib/utils/image-generation';

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
    const messages = buildImageGenerationMessages({
      model: params.model,
      task: 'marketing',
      userPrompt: params.rewrittenPrompt,
      basedOnLogoCallId,
      basedOnLogoPublicUrl,
    });

    // For Gemini, append inline image if a public URL reference is provided
    if (
      params.model === 'gemini-2.5-flash-image-preview' &&
      basedOnLogoPublicUrl
    ) {
      const dataUrl = await fetchImageAsDataUrl(basedOnLogoPublicUrl);
      messages.push(
        new HumanMessage({
          content: [
            { type: 'text', text: 'Here is the reference logo image to use.' },
            { type: 'image_url', image_url: dataUrl },
          ],
        }),
      );
    }

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
