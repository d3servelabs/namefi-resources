import { uploadFileToS3, generateCloudFrontUrl } from '@namefi-astra/storage';
import type { GeneratedLogo, GenerateLogoParams } from '../lib/types';
import {
  GEMINI_IMAGE_CONFIG,
  OPENAI_LOGO_IMAGE_CONFIG,
} from '../lib/config/models';
import {
  createGenerationMessages,
  createImageGenerationModel,
  extractImageData,
  generateImageWithTiming,
} from '../lib/utils/image-generation';
import {
  enhanceLogoPrompt,
  logoImageSystemPrompt,
} from '../prompts/logo-generation';

/**
 * Generate single logo
 */
export async function generateLogo(
  params: GenerateLogoParams,
): Promise<GeneratedLogo | null> {
  const { domain, logoConcept, storage } = params;

  console.log(`Generating logo design for ${domain}`);
  console.log(`Type: ${logoConcept.type} - Style: ${logoConcept.style}`);
  console.log(`Prompt: ${logoConcept.prompt}`);

  const imageGenerationModel = createImageGenerationModel(
    params.model === 'gpt-image-1'
      ? OPENAI_LOGO_IMAGE_CONFIG
      : GEMINI_IMAGE_CONFIG,
  );

  try {
    // Create enhanced prompt
    const enhancedPrompt = enhanceLogoPrompt({
      basePrompt: logoConcept.prompt,
      domain,
      logoType: logoConcept.type,
      style: logoConcept.style,
      model: params.model,
    });

    // Generate logo
    const messages = createGenerationMessages(
      logoImageSystemPrompt,
      `Generate a logo with this prompt: ${enhancedPrompt}`,
    );
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
      console.error(
        `No image data received for ${logoConcept.type} - ${logoConcept.style}`,
      );
      return null;
    }

    // Convert base64 to buffer and upload
    const imageBuffer = Buffer.from(imageData, 'base64');

    const result = await uploadFileToS3({
      s3Client: storage.s3Client,
      bucketName: storage.bucketName,
      fileBuffer: imageBuffer,
      contentType: 'image/png',
      folder: storage.baseFolder,
    });

    const publicUrl = generateCloudFrontUrl({
      cloudfrontDomain: storage.cloudfrontDomain,
      s3Key: result.key,
    });

    console.log(
      `✅ Generated and saved logo: ${logoConcept.type} - ${logoConcept.style}`,
    );
    return {
      url: publicUrl,
      concept: logoConcept.concept,
      type: logoConcept.type,
      style: logoConcept.style,
      storagePath: result.key,
      generationCallId,
      tokenUsage: response.usage_metadata,
      model: params.model,
    };
  } catch (error) {
    console.error('Failed to generate logo:', error);
    return null;
  }
}
