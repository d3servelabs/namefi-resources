import { z } from 'zod';
import {
  uploadFileToS3,
  generateCloudFrontUrl,
  type StorageConfig,
} from '@namefi-astra/storage';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { createRunId } from '../utils/files';
import {
  LOGO_STYLE_INPUT_IDS,
  LOGO_TEXT_TREATMENT_INPUT_IDS,
  LOGO_TYPE_INPUT_IDS,
  LOGO_TYPOGRAPHY_INPUT_IDS,
} from '../types/logo-options';
import { logoConceptSchema, tokenUsageSchema } from '../types/logo-schemas';
import { generateLogoStrategy } from '../agents/strategists';
import { generateLogoImage } from '../agents/generators';

const imageModelEnum = z.enum([
  'gpt-image-1',
  'gpt-image-1.5',
  'gemini-2.5-flash-image',
  'gemini-3-pro-image-preview',
]);
const logoTypeInputEnum = z.enum(LOGO_TYPE_INPUT_IDS);
const logoStyleInputEnum = z.enum(LOGO_STYLE_INPUT_IDS);
const logoTextTreatmentInputEnum = z.enum(LOGO_TEXT_TREATMENT_INPUT_IDS);
const logoTypographyInputEnum = z.enum(LOGO_TYPOGRAPHY_INPUT_IDS);

export const logoWorkflowInputSchema = z.object({
  domain: namefiNormalizedDomainSchema,
  description: z.string().optional(),
  preferredType: logoTypeInputEnum.optional(),
  preferredStyle: logoStyleInputEnum.optional(),
  textTreatment: logoTextTreatmentInputEnum.optional(),
  typography: logoTypographyInputEnum.optional(),
  imageModel: imageModelEnum.default('gpt-image-1.5'),
  storage: z.custom<StorageConfig>(),
});

export const logoWorkflowOutputSchema = z.object({
  concept: logoConceptSchema,
  analysis: z.object({
    model: z.string(),
    tokenUsage: tokenUsageSchema,
  }),
  image: z.object({
    prompt: z.string(),
    url: z.string(),
    storagePath: z.string(),
    model: imageModelEnum,
    tokenUsage: tokenUsageSchema,
  }),
});

export type LogoWorkflowInput = z.input<typeof logoWorkflowInputSchema>;
export type LogoWorkflowOutput = z.output<typeof logoWorkflowOutputSchema>;

export async function runLogoWorkflow(
  rawInput: LogoWorkflowInput,
): Promise<LogoWorkflowOutput> {
  const input = logoWorkflowInputSchema.parse(rawInput);
  const preferredType =
    input.preferredType && input.preferredType !== 'let-ai-choose'
      ? input.preferredType
      : undefined;
  const preferredStyle =
    input.preferredStyle && input.preferredStyle !== 'let-ai-choose'
      ? input.preferredStyle
      : undefined;
  const preferredTextTreatment =
    input.textTreatment && input.textTreatment !== 'let-ai-choose'
      ? input.textTreatment
      : undefined;
  const preferredTypography =
    input.typography && input.typography !== 'let-ai-choose'
      ? input.typography
      : undefined;

  const strategy = await generateLogoStrategy({
    domain: input.domain,
    description: input.description,
    preferredType,
    preferredStyle,
    preferredTextTreatment,
    preferredTypography,
  });

  const concept = logoConceptSchema.parse(strategy.object);

  const generated = await generateLogoImage({
    domain: input.domain,
    concept,
    model: input.imageModel,
    textTreatment: concept.logoConcept.textTreatment,
    typography: concept.logoConcept.typography,
  });

  if (!generated.imageBase64) {
    throw new Error('Image generation did not return image data');
  }

  const buffer = Buffer.from(generated.imageBase64, 'base64');
  const folder = [input.storage.baseFolder, 'logos', input.domain]
    .filter(Boolean)
    .join('/');

  const uploadResult = await uploadFileToS3({
    s3Client: input.storage.s3Client,
    bucketName: input.storage.bucketName,
    fileBuffer: buffer,
    contentType: 'image/png',
    folder,
    fileName: `${createRunId(concept.logoConcept.type)}.png`,
  });

  const url = generateCloudFrontUrl({
    cloudfrontDomain: input.storage.cloudfrontDomain,
    s3Key: uploadResult.key,
  });

  return logoWorkflowOutputSchema.parse({
    concept,
    analysis: {
      model: strategy.modelId ?? 'gpt-5.2',
      tokenUsage: strategy.totalUsage,
    },
    image: {
      prompt: generated.prompt,
      url,
      storagePath: uploadResult.key,
      model: input.imageModel,
      tokenUsage: generated.tokenUsage,
    },
  });
}
