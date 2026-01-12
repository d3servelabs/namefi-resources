import { z } from 'zod';
import {
  generateCloudFrontUrl,
  uploadFileToS3,
  type StorageConfig,
} from '@namefi-astra/storage';
import { collateralAnalysisSchema } from '../types/marketing-schemas';
import { tokenUsageSchema } from '../types/logo-schemas';
import { generatePosterStrategy } from '../agents/strategists';
import { generatePosterImage } from '../agents/generators';
import { createRunId } from '../utils/files';
import { fetchImageAsDataUrl } from '../utils/images';
import {
  MARKETING_COLLATERAL_TYPE_INPUT_IDS,
  MARKETING_COLLATERAL_TYPE_RESOLVED_IDS,
} from '../types/generation';

const imageModelEnum = z.enum(['gpt-image-1', 'gemini-2.5-flash-image']);
const collateralTypeInputEnum = z.enum(MARKETING_COLLATERAL_TYPE_INPUT_IDS);
const collateralTypeResolvedEnum = z.enum(
  MARKETING_COLLATERAL_TYPE_RESOLVED_IDS,
);

export const marketingWorkflowInputSchema = z.object({
  domain: z.string(),
  description: z.string().optional(),
  collateralType: collateralTypeInputEnum.default('let_ai_choose'),
  imageModel: imageModelEnum.default('gemini-2.5-flash-image'),
  storage: z.custom<StorageConfig>(),
  referenceLogoUrl: z.string().optional(),
});

export const marketingWorkflowOutputSchema = z.object({
  analysis: z.object({
    analysis: collateralAnalysisSchema,
    resolvedCollateralType: collateralTypeResolvedEnum,
    prompt: z.string(),
    model: z.string(),
    tokenUsage: tokenUsageSchema,
  }),
  image: z.object({
    url: z.string(),
    storagePath: z.string(),
    model: imageModelEnum,
    tokenUsage: tokenUsageSchema,
  }),
});

export type MarketingWorkflowInput = z.input<
  typeof marketingWorkflowInputSchema
>;
export type MarketingWorkflowOutput = z.output<
  typeof marketingWorkflowOutputSchema
>;

export async function runMarketingWorkflow(
  rawInput: MarketingWorkflowInput,
): Promise<MarketingWorkflowOutput> {
  const input = marketingWorkflowInputSchema.parse(rawInput);

  if (!input.referenceLogoUrl) {
    throw new Error(
      'referenceLogoUrl is required to generate marketing collateral',
    );
  }

  const strategy = await generatePosterStrategy({
    domain: input.domain,
    description: input.description,
    collateralType: input.collateralType,
  });

  const analysis = collateralAnalysisSchema.parse(strategy.object);
  const pick = analysis.picks[0];

  if (!pick) {
    throw new Error('Collateral analysis returned no concepts');
  }

  const resolvedCollateralType = pick.collateralType;
  const prompt = input.description
    ? `${pick.prompt}\n\nBrand details: ${input.description}`
    : pick.prompt;

  let referenceLogoDataUrl: string;
  try {
    referenceLogoDataUrl = await fetchImageAsDataUrl(input.referenceLogoUrl);
  } catch (error) {
    throw new Error('Failed to fetch reference logo');
  }

  const generated = await generatePosterImage({
    prompt,
    model: input.imageModel,
    referenceLogoDataUrl,
  });

  if (!generated.imageBase64) {
    throw new Error('Image generation did not return image data');
  }

  const buffer = Buffer.from(generated.imageBase64, 'base64');
  const folder = [
    input.storage.baseFolder,
    'marketing',
    resolvedCollateralType,
    input.domain,
  ]
    .filter(Boolean)
    .join('/');

  const result = await uploadFileToS3({
    s3Client: input.storage.s3Client,
    bucketName: input.storage.bucketName,
    fileBuffer: buffer,
    contentType: 'image/png',
    folder,
    fileName: `${createRunId(resolvedCollateralType)}.png`,
  });

  const url = generateCloudFrontUrl({
    cloudfrontDomain: input.storage.cloudfrontDomain,
    s3Key: result.key,
  });

  return marketingWorkflowOutputSchema.parse({
    analysis: {
      analysis,
      resolvedCollateralType,
      prompt,
      model: strategy.modelId ?? 'gpt-5.2',
      tokenUsage: strategy.totalUsage,
    },
    image: {
      url,
      storagePath: result.key,
      model: input.imageModel,
      tokenUsage: generated.tokenUsage,
    },
  });
}
