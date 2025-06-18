import type { UsageMetadata } from '@langchain/core/messages';
import { MODEL_CONFIGS, STORAGE_BUCKETS } from '../lib/config/models';
import {
  createGenerationMessages,
  createImageGenerationModel,
  createRunId,
  extractImageData,
  generateImageWithTiming,
  sanitizeForFilename,
  uploadImageToS3,
} from '../lib/utils/image-generation';
import {
  enhanceLogoPrompt,
  logoImageSystemPrompt,
} from '../prompts/logo-generation';

interface LogoConceptData {
  type: string;
  style: string;
  concept: string;
  prompt: string;
}

interface GeneratedLogo {
  url: string;
  concept: string;
  type: string;
  style: string;
  storagePath?: string;
  revisedPrompt?: string;
  generationCallId?: string;
  tokenUsage?: UsageMetadata;
  model: string;
}

/**
 * Generate file path for logo with improved naming
 */
function generateLogoFilePath(
  brandName: string,
  runId: string,
  index: number,
  type: string,
  style: string,
): string {
  const sanitizedBrand = sanitizeForFilename(brandName);
  const sanitizedType = sanitizeForFilename(type);
  const sanitizedStyle = sanitizeForFilename(style);

  const fileName = `${sanitizedBrand}-logo-${index}-${sanitizedType}-${sanitizedStyle}.png`;
  return `${sanitizedBrand}/${runId}/${fileName}`;
}

/**
 * Generate single logo
 */
export async function generateLogo(
  brandName: string,
  logoConcept: LogoConceptData,
  runId: string,
): Promise<GeneratedLogo | null> {
  console.log(`Generating logo design for ${brandName}`);
  console.log(`Type: ${logoConcept.type} - Style: ${logoConcept.style}`);
  console.log(`Prompt: ${logoConcept.prompt}`);

  const imageGenerationModel = createImageGenerationModel(
    MODEL_CONFIGS.LOGO_GENERATION,
  );

  try {
    // Create enhanced prompt
    const enhancedPrompt = enhanceLogoPrompt({
      basePrompt: logoConcept.prompt,
      brandName,
      logoType: logoConcept.type,
      style: logoConcept.style,
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
    const { imageData, revisedPrompt, generationCallId } =
      extractImageData(response);

    if (!imageData) {
      console.error(
        `No image data received for ${logoConcept.type} - ${logoConcept.style}`,
      );
      return null;
    }

    // Convert base64 to buffer and upload
    const imageBuffer = Buffer.from(imageData, 'base64');
    const filePath = generateLogoFilePath(
      brandName,
      runId,
      1,
      logoConcept.type,
      logoConcept.style,
    );
    const uploadResult = await uploadImageToS3(
      imageBuffer,
      filePath,
      STORAGE_BUCKETS.LOGOS,
    );

    if (uploadResult.success && uploadResult.publicUrl) {
      console.log(
        `✅ Generated and saved logo: ${logoConcept.type} - ${logoConcept.style}`,
      );
      return {
        url: uploadResult.publicUrl,
        concept: logoConcept.concept,
        type: logoConcept.type,
        style: logoConcept.style,
        storagePath: filePath,
        revisedPrompt,
        generationCallId,
        tokenUsage: response.usage_metadata,
        model: MODEL_CONFIGS.LOGO_GENERATION.toolConfig.model,
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to generate logo:', error);
    return null;
  }
}

/**
 * Create unique run ID for logo generation
 */
export function createLogoRunId(brandName: string): string {
  return createRunId(brandName);
}
