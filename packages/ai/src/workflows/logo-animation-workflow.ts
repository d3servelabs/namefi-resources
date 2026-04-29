import { createGateway, experimental_generateVideo } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import sharp from 'sharp';
import { z } from 'zod';
import {
  deleteFileFromS3,
  generateCloudFrontUrl,
  uploadFileToS3,
  type StorageConfig,
} from '@namefi-astra/storage';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import {
  ANIMATION_MODEL_IDS,
  ANIMATION_MOTION_INTENSITY_IDS,
  ANIMATION_SOURCE_MODE_IDS,
  CINEMATIC_ANIMATION_MODEL_IDS,
  CINEMATIC_ANIMATION_MOTION_PRESET_IDS,
  CINEMATIC_ANIMATION_MOTION_PRESET_RESOLVED_IDS,
  LOOPED_ANIMATION_MODEL_IDS,
  LOOPED_ANIMATION_MOTION_PRESET_IDS,
  LOOPED_ANIMATION_MOTION_PRESET_RESOLVED_IDS,
  type AnimationGenerationResult,
  type AnimationMotionIntensity,
  type AnimationSourceMode,
} from '../types/generation';
import { createRunId } from '../utils/files';
import { fetchImageAsBuffer } from '../utils/images';
import { secrets } from '../env';
import { tokenUsageSchema } from '../types/logo-schemas';
import {
  generateCinematicAnimationStrategy,
  generateLoopedAnimationStrategy,
  generateSheetGuidedAnimationStrategy,
} from '../agents/strategists';
import { generateAnimationSheetImage } from '../agents/generators';

const CINEMATIC_FRAME_WIDTH = 1280;
const CINEMATIC_FRAME_HEIGHT = 720;
const CINEMATIC_SAFE_MARGIN_RATIO = 0.12;
const LOOPED_FRAME_SIZE = 1024;
const LOOPED_SAFE_MARGIN_RATIO = 0.16;
const SHEET_GUIDED_DURATION_SECONDS = 8;
const LIGHT_BACKGROUND = '#F8FAFC';
const DARK_BACKGROUND = '#0F172A';

const cinematicAnimationModelEnum = z.enum(CINEMATIC_ANIMATION_MODEL_IDS);
const loopedAnimationModelEnum = z.enum(LOOPED_ANIMATION_MODEL_IDS);
const animationModelEnum = z.enum(ANIMATION_MODEL_IDS);
const animationSourceModeEnum = z.enum(ANIMATION_SOURCE_MODE_IDS);
const motionIntensityEnum = z.enum(ANIMATION_MOTION_INTENSITY_IDS);
const cinematicMotionPresetInputEnum = z.enum(
  CINEMATIC_ANIMATION_MOTION_PRESET_IDS,
);
const loopedMotionPresetInputEnum = z.enum(LOOPED_ANIMATION_MOTION_PRESET_IDS);
const cinematicMotionPresetResolvedEnum = z.enum(
  CINEMATIC_ANIMATION_MOTION_PRESET_RESOLVED_IDS,
);
const loopedMotionPresetResolvedEnum = z.enum(
  LOOPED_ANIMATION_MOTION_PRESET_RESOLVED_IDS,
);
const animationSheetImageModelEnum = z.enum(['gpt-image-2']);

const google = createGoogleGenerativeAI({
  apiKey: secrets.GEMINI_API_KEY,
});

const gateway = createGateway({
  apiKey: secrets.AI_GATEWAY_API_KEY,
});

function isSeedance2Model(model: z.infer<typeof loopedAnimationModelEnum>) {
  return (
    model === 'bytedance/seedance-2.0' ||
    model === 'bytedance/seedance-2.0-fast'
  );
}

function buildSeedanceProviderOptions(input: {
  model: z.infer<typeof loopedAnimationModelEnum>;
  lastFrameImage?: string;
  referenceImages?: string[];
}) {
  return {
    ...(input.lastFrameImage ? { lastFrameImage: input.lastFrameImage } : {}),
    ...(input.referenceImages?.length
      ? { referenceImages: input.referenceImages }
      : {}),
    ...(isSeedance2Model(input.model) ? {} : { cameraFixed: true }),
    watermark: false,
    generateAudio: false,
    pollTimeoutMs: 600_000,
  };
}

const cinematicAnalysisSchema = z.object({
  mode: z.literal('cinematic'),
  brandAttributes: z.array(z.string()),
  targetAudience: z.string(),
  rationale: z.string(),
  resolvedMotionPreset: cinematicMotionPresetResolvedEnum,
  direction: z.string(),
  model: z.string(),
  tokenUsage: tokenUsageSchema.optional(),
});

const loopedAnalysisSchema = z.object({
  mode: z.literal('looped'),
  brandAttributes: z.array(z.string()),
  targetAudience: z.string(),
  rationale: z.string(),
  resolvedMotionPreset: loopedMotionPresetResolvedEnum,
  direction: z.string(),
  model: z.string(),
  tokenUsage: tokenUsageSchema.optional(),
});

const sheetGuidedStagePlanSchema = z.object({
  label: z.string(),
  timeRange: z.string(),
  visualState: z.string(),
  motionInstruction: z.string(),
});

const sheetGuidedAnalysisSchema = z.object({
  mode: z.literal('sheet-guided'),
  brandAttributes: z.array(z.string()),
  targetAudience: z.string(),
  rationale: z.string(),
  direction: z.string(),
  model: z.string(),
  tokenUsage: tokenUsageSchema.optional(),
  logoVisualSummary: z.string(),
  animationConcept: z.string(),
  shapeNotes: z.array(z.string()),
  stagePlan: z.array(sheetGuidedStagePlanSchema),
  sheetPrompt: z.string(),
  videoPrompt: z.string(),
});

const cinematicAnimationWorkflowInputSchema = z
  .object({
    mode: z.literal('cinematic'),
    domain: namefiNormalizedDomainSchema,
    referenceLogoUrl: z.string().url(),
    description: z.string().optional(),
    sourceMode: animationSourceModeEnum.default('exact-frame'),
    motionPreset: cinematicMotionPresetInputEnum.default('let-ai-choose'),
    model: cinematicAnimationModelEnum.default('veo-3.1-generate-preview'),
    storage: z.custom<StorageConfig>(),
  })
  .strict();

const loopedAnimationWorkflowInputSchema = z
  .object({
    mode: z.literal('looped'),
    domain: namefiNormalizedDomainSchema,
    referenceLogoUrl: z.string().url(),
    description: z.string().optional(),
    motionPreset: loopedMotionPresetInputEnum.default('let-ai-choose'),
    motionIntensity: motionIntensityEnum.default('subtle'),
    model: loopedAnimationModelEnum.default('bytedance/seedance-2.0'),
    storage: z.custom<StorageConfig>(),
  })
  .strict();

const sheetGuidedAnimationWorkflowInputSchema = z
  .object({
    mode: z.literal('sheet-guided'),
    domain: namefiNormalizedDomainSchema,
    referenceLogoUrl: z.string().url(),
    description: z.string().optional(),
    model: loopedAnimationModelEnum.default('bytedance/seedance-2.0'),
    sheetModel: animationSheetImageModelEnum.default('gpt-image-2'),
    storage: z.custom<StorageConfig>(),
  })
  .strict();

export const logoAnimationWorkflowInputSchema = z.discriminatedUnion('mode', [
  cinematicAnimationWorkflowInputSchema,
  loopedAnimationWorkflowInputSchema,
  sheetGuidedAnimationWorkflowInputSchema,
]);

export const logoAnimationWorkflowOutputSchema = z.object({
  analysis: z.discriminatedUnion('mode', [
    cinematicAnalysisSchema,
    loopedAnalysisSchema,
    sheetGuidedAnalysisSchema,
  ]),
  prompt: z.string(),
  video: z.object({
    storagePath: z.string(),
    thumbnailStoragePath: z.string(),
    url: z.string(),
    thumbnailUrl: z.string(),
    model: animationModelEnum,
    mimeType: z.literal('video/mp4'),
  }),
  animationSheet: z
    .object({
      storagePath: z.string(),
      url: z.string(),
      model: animationSheetImageModelEnum,
      prompt: z.string(),
      tokenUsage: tokenUsageSchema.optional(),
    })
    .optional(),
  warnings: z.array(z.unknown()),
  providerMetadata: z.record(z.string(), z.unknown()).optional(),
});

export type LogoAnimationWorkflowInput = z.input<
  typeof logoAnimationWorkflowInputSchema
>;
export type LogoAnimationWorkflowOutput = z.output<
  typeof logoAnimationWorkflowOutputSchema
>;

export interface LogoAnimationWorkflowOptions {
  abortSignal?: AbortSignal;
}

const cinematicMotionPromptByPreset: Record<
  z.infer<typeof cinematicMotionPresetResolvedEnum>,
  string
> = {
  'orbital-reveal':
    'A smooth semi-circular arc shot orbits the logo while elegant light ribbons, controlled lens flare, and refined parallax depth build toward a premium hero reveal.',
  'energy-surge':
    'Concentrated energy races through the logo contours, gathers into a luminous build, and releases as a controlled cinematic burst with sparks, atmospheric particles, and a precise settling finish.',
  'atmospheric-rise':
    'A slow cinematic lift reveals the logo through mist, floating particles, and volumetric light shafts, creating a dramatic sense of emergence and scale.',
  'dimensional-parallax':
    'Subtle depth-separated layers and a confident camera push create a dimensional parallax reveal, then resolve cleanly back into the untouched original mark.',
  'prismatic-bloom':
    'Glossy refractions, caustic highlights, chromatic glints, and premium optical bloom sweep through the frame, culminating in a crisp high-end hero lockup.',
};

const loopedMotionPromptByPreset: Record<
  z.infer<typeof loopedMotionPresetResolvedEnum>,
  string
> = {
  breathe:
    'The logo gently breathes with restrained luminance and depth shifts while staying perfectly centered and legible.',
  'light-sweep':
    'A narrow polished light sweep travels across the mark and resolves back to the untouched resting state.',
  shimmer:
    'A subtle material-aware shimmer glides over key edges without becoming flashy or scene-like.',
  'glow-pulse':
    'A soft bounded glow pulse brightens and fades in place without blooming beyond the mark.',
  'contour-trace':
    'A clean tracing light follows important contours of the logo and settles back into the original state.',
  'ambient-orbit':
    'Sparse ambient particles orbit around the logo without obscuring any core text or shapes.',
  'micro-parallax':
    'Very small internal depth shifts create dimension while the camera remains effectively locked.',
  'gradient-drift':
    'Subtle movement in fills or gradients adds life while the logo composition stays stable.',
};

const motionIntensityPromptByValue: Record<AnimationMotionIntensity, string> = {
  subtle:
    'Keep motion very restrained with a locked camera and minimal amplitude.',
  balanced:
    'Allow moderate motion while preserving a calm, square logo-loop feel.',
  bold: 'Use the strongest motion allowed for a looped logo without turning it into a cinematic reveal.',
};

function buildCinematicAnimationPrompt(input: {
  motionPreset: z.infer<typeof cinematicMotionPresetResolvedEnum>;
  sourceMode: AnimationSourceMode;
  direction: string;
}) {
  const parts =
    input.sourceMode === 'subject-reference'
      ? [
          'Create an ambitious cinematic 8-second logo animation using the provided logo as a subject reference rather than a literal first frame.',
          cinematicMotionPromptByPreset[input.motionPreset],
          `Brand-specific motion direction: ${input.direction.trim()}.`,
          'Preserve the original logo shapes, letterforms, proportions, colors, and brand marks throughout the animation.',
          'Treat the provided logo as the core asset reference and compose it natively in frame instead of placing it inside a poster, card, inset, square box, or padded plate.',
          'Use camera movement, atmospheric context, temporal motion, and optical effects only when they keep the logo as the clear focal subject.',
          'No new text, no extra symbols, no mascot characters, no scene cuts, no destructive effects, and no morphing into a different mark.',
          'End on a sharp, fully legible hero frame with the logo cleanly resolved.',
        ]
      : [
          'Create an ambitious cinematic 8-second logo animation from the provided source frame.',
          cinematicMotionPromptByPreset[input.motionPreset],
          `Brand-specific motion direction: ${input.direction.trim()}.`,
          'Use camera movement, atmospheric context, temporal motion, and optical effects only when they keep the logo as the clear focal subject.',
          'The logo may gain depth, reflections, particles, energy interaction, or cinematic environmental support, but the original shapes, letterforms, proportions, colors, and brand marks must remain intact and recognizable throughout.',
          'No new text, no extra symbols, no mascot characters, no scene cuts, no destructive effects, and no morphing into a different mark.',
          'End on a sharp, fully legible hero frame with the logo cleanly resolved.',
        ];

  return parts.join(' ');
}

function buildLoopedAnimationPrompt(input: {
  motionPreset: z.infer<typeof loopedMotionPresetResolvedEnum>;
  motionIntensity: AnimationMotionIntensity;
  direction: string;
}) {
  return [
    'Create a seamless 4-second square animated logo loop from the provided image.',
    loopedMotionPromptByPreset[input.motionPreset],
    motionIntensityPromptByValue[input.motionIntensity],
    `Brand-specific motion direction: ${input.direction.trim()}.`,
    'Keep the logo centered, dominant, perfectly legible, and compositionally stable for the full clip.',
    'No scene cuts, no environmental sets, no extra text, no mascots, no camera travel, and no morphing into a different mark.',
    'Preserve the original logo shapes, letterforms, proportions, colors, and silhouette.',
    'The ending frame must closely match the starting frame so the video loops cleanly.',
  ].join(' ');
}

function buildSheetGuidedAnimationSheetPrompt(input: {
  domain: string;
  logoVisualSummary: string;
  animationConcept: string;
  rationale: string;
  shapeNotes: string[];
  stagePlan: Array<z.output<typeof sheetGuidedStagePlanSchema>>;
  sheetPrompt: string;
}) {
  return [
    'Create a professional landscape animation sheet for an 8-second logo animation.',
    'Use the uploaded logo image as the exact source logo reference and preserve its identity.',
    'Canvas: 1536x1024, clean dark motion-design board, high contrast, crisp readable labels.',
    `Brand/domain: ${input.domain}.`,
    `Uploaded logo analysis: ${input.logoVisualSummary.trim()}.`,
    `Tailored animation concept: ${input.animationConcept.trim()}.`,
    `Motion rationale: ${input.rationale.trim()}.`,
    `Shape-specific motion notes: ${input.shapeNotes.join(' | ')}.`,
    `8-second stage plan: ${JSON.stringify(input.stagePlan)}.`,
    `Additional sheet direction: ${input.sheetPrompt.trim()}.`,
    'Required sheet layout: 4-6 labeled keyframe panels with time ranges, arrows showing motion flow, timing bars from 0.0s to 8.0s, easing notes, and one focused breakdown row showing how the real logo shapes/letterforms form, trace, morph, or settle.',
    'Final keyframe must be the original logo, centered, fully legible, and intact.',
    'Do not add new brand text, symbols, mascots, mockup devices, posters, or unrelated scene elements.',
  ].join(' ');
}

function buildSheetGuidedAnimationPrompt(input: {
  direction: string;
  videoPrompt: string;
  stagePlan: Array<z.output<typeof sheetGuidedStagePlanSchema>>;
}) {
  return [
    'Create an 8-second 16:9 logo animation from scratch using the provided references for guidance.',
    'Use [Image 1] only as the exact logo identity and final lockup reference.',
    'Use [Image 2] only as the animation sheet/storyboard reference for timing, composition, transformation, and easing guidance.',
    'Keep the overall read as a premium logo animation: the logo is always the hero, and every movement should clarify its construction, identity, and final lockup.',
    `Brand-specific motion direction: ${input.direction.trim()}.`,
    `Animation-sheet video direction: ${input.videoPrompt.trim()}.`,
    `Match these [Image 2] stage timings: ${JSON.stringify(input.stagePlan)}.`,
    'Preserve the original logo shapes, letterforms, colors, proportions, and final lockup.',
    'No new text, no extra symbols, no mascot characters, no scene cuts, no destructive effects, and no morphing into a different mark.',
    'End on a sharp, fully legible hero frame with the logo cleanly resolved.',
  ].join(' ');
}

async function createLogoReferenceImage(logoBuffer: Buffer) {
  const logoPng = await sharp(logoBuffer)
    .ensureAlpha()
    .resize({
      width: 1024,
      height: 1024,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();

  return {
    image: new Uint8Array(logoPng),
    mediaType: 'image/png',
  } as const;
}

async function resolveContrastingBackground(logoBuffer: Buffer) {
  const stats = await sharp(logoBuffer)
    .ensureAlpha()
    .resize(512, 512, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .flatten({ background: '#FFFFFF' })
    .stats();

  const red = stats.channels[0]?.mean ?? 255;
  const green = stats.channels[1]?.mean ?? 255;
  const blue = stats.channels[2]?.mean ?? 255;
  const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;

  return luminance > 170 ? DARK_BACKGROUND : LIGHT_BACKGROUND;
}

async function createPreparedSourceFrame(params: {
  logoBuffer: Buffer;
  width: number;
  height: number;
  safeMarginRatio: number;
}) {
  const maxWidth = Math.round(params.width * (1 - params.safeMarginRatio * 2));
  const maxHeight = Math.round(
    params.height * (1 - params.safeMarginRatio * 2),
  );
  const background = await resolveContrastingBackground(params.logoBuffer);

  const logoPng = await sharp(params.logoBuffer)
    .ensureAlpha()
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();

  const metadata = await sharp(logoPng).metadata();
  const logoWidth = metadata.width ?? maxWidth;
  const logoHeight = metadata.height ?? maxHeight;

  const frame = await sharp({
    create: {
      width: params.width,
      height: params.height,
      channels: 4,
      background,
    },
  })
    .composite([
      {
        input: logoPng,
        left: Math.round((params.width - logoWidth) / 2),
        top: Math.round((params.height - logoHeight) / 2),
      },
    ])
    .png()
    .toBuffer();

  return { background, frame };
}

async function uploadBufferToStorage(params: {
  buffer: Buffer;
  contentType: string;
  domain: string;
  storage: StorageConfig;
  label: string;
}) {
  const folder = [params.storage.baseFolder, params.domain]
    .filter(Boolean)
    .join('/');

  const result = await uploadFileToS3({
    s3Client: params.storage.s3Client,
    bucketName: params.storage.bucketName,
    fileBuffer: params.buffer,
    contentType: params.contentType,
    folder,
    fileName: params.label,
  });

  return {
    storagePath: result.key,
    url: generateCloudFrontUrl({
      cloudfrontDomain: params.storage.cloudfrontDomain,
      s3Key: result.key,
    }),
  };
}

async function deleteStoragePaths(params: {
  storage: StorageConfig;
  storagePaths: string[];
}) {
  const cleanupErrors: Error[] = [];

  await Promise.all(
    params.storagePaths.map(async (storagePath) => {
      try {
        await deleteFileFromS3({
          s3Client: params.storage.s3Client,
          bucketName: params.storage.bucketName,
          key: storagePath,
        });
      } catch (error) {
        cleanupErrors.push(
          error instanceof Error
            ? error
            : new Error('Unknown storage cleanup error'),
        );
      }
    }),
  );

  return cleanupErrors;
}

async function runCinematicAnimationWorkflow(
  input: z.output<typeof cinematicAnimationWorkflowInputSchema>,
  options: LogoAnimationWorkflowOptions,
) {
  const logoBuffer = await fetchImageAsBuffer(
    input.referenceLogoUrl,
    options.abortSignal,
  );
  const preparedFrame =
    input.sourceMode === 'exact-frame'
      ? await createPreparedSourceFrame({
          logoBuffer,
          width: CINEMATIC_FRAME_WIDTH,
          height: CINEMATIC_FRAME_HEIGHT,
          safeMarginRatio: CINEMATIC_SAFE_MARGIN_RATIO,
        })
      : null;

  const strategy = await generateCinematicAnimationStrategy({
    domain: input.domain,
    description: input.description,
    motionPreset: input.motionPreset,
  });

  const resolvedMotionPreset = strategy.object.motionPreset;
  const prompt = buildCinematicAnimationPrompt({
    motionPreset: resolvedMotionPreset,
    sourceMode: input.sourceMode,
    direction: strategy.object.direction,
  });

  const generated = await experimental_generateVideo({
    model: google.video(input.model),
    prompt:
      input.sourceMode === 'exact-frame'
        ? {
            image: preparedFrame?.frame ?? logoBuffer,
            text: prompt,
          }
        : prompt,
    aspectRatio: '16:9',
    resolution: '1280x720',
    duration: 8,
    providerOptions: {
      google: {
        pollTimeoutMs: 600_000,
        ...(input.sourceMode === 'subject-reference'
          ? {
              referenceImages: [
                {
                  image: {
                    bytesBase64Encoded: logoBuffer.toString('base64'),
                    mimeType: 'image/png',
                  },
                  referenceType: 'asset',
                },
              ],
            }
          : {}),
      },
    },
    abortSignal: options.abortSignal,
  });

  const uploadedStoragePaths: string[] = [];

  try {
    const videoBuffer = Buffer.from(generated.video.uint8Array);
    const uploadedVideo = await uploadBufferToStorage({
      buffer: videoBuffer,
      contentType: 'video/mp4',
      domain: input.domain,
      storage: input.storage,
      label: `${createRunId('animation')}.mp4`,
    });
    uploadedStoragePaths.push(uploadedVideo.storagePath);

    const uploadedThumbnail = await uploadBufferToStorage({
      buffer: preparedFrame?.frame ?? logoBuffer,
      contentType: 'image/png',
      domain: input.domain,
      storage: input.storage,
      label: `${createRunId('animation-thumbnail')}.png`,
    });
    uploadedStoragePaths.push(uploadedThumbnail.storagePath);

    return logoAnimationWorkflowOutputSchema.parse({
      analysis: {
        mode: 'cinematic',
        brandAttributes: strategy.object.brandAttributes,
        targetAudience: strategy.object.targetAudience,
        rationale: strategy.object.rationale,
        resolvedMotionPreset,
        direction: strategy.object.direction,
        model: strategy.modelId ?? 'gpt-5.2',
        tokenUsage: strategy.totalUsage,
      },
      prompt,
      video: {
        storagePath: uploadedVideo.storagePath,
        thumbnailStoragePath: uploadedThumbnail.storagePath,
        url: uploadedVideo.url,
        thumbnailUrl: uploadedThumbnail.url,
        model: input.model,
        mimeType: 'video/mp4',
      },
      warnings: generated.warnings,
      providerMetadata: generated.providerMetadata,
    } satisfies AnimationGenerationResult);
  } catch (error) {
    const cleanupErrors = await deleteStoragePaths({
      storage: input.storage,
      storagePaths: uploadedStoragePaths,
    });

    if (cleanupErrors.length > 0) {
      const cleanupMessage = cleanupErrors
        .map((item) => item.message)
        .join('; ');
      const failureMessage =
        error instanceof Error ? error.message : 'Unknown animation failure';

      throw new Error(
        `Logo animation generation failed (${failureMessage}) and uploaded assets could not be fully cleaned up: ${cleanupMessage}`,
      );
    }

    throw error;
  }
}

async function runLoopedAnimationWorkflow(
  input: z.output<typeof loopedAnimationWorkflowInputSchema>,
  options: LogoAnimationWorkflowOptions,
) {
  const logoBuffer = await fetchImageAsBuffer(
    input.referenceLogoUrl,
    options.abortSignal,
  );
  const preparedFrame = await createPreparedSourceFrame({
    logoBuffer,
    width: LOOPED_FRAME_SIZE,
    height: LOOPED_FRAME_SIZE,
    safeMarginRatio: LOOPED_SAFE_MARGIN_RATIO,
  });

  const uploadedStoragePaths: string[] = [];

  try {
    const uploadedPreparedFrame = await uploadBufferToStorage({
      buffer: preparedFrame.frame,
      contentType: 'image/png',
      domain: input.domain,
      storage: input.storage,
      label: `${createRunId('animation-source')}.png`,
    });
    uploadedStoragePaths.push(uploadedPreparedFrame.storagePath);

    const strategy = await generateLoopedAnimationStrategy({
      domain: input.domain,
      description: input.description,
      motionPreset: input.motionPreset,
      motionIntensity: input.motionIntensity,
    });

    const resolvedMotionPreset = strategy.object.motionPreset;
    const prompt = buildLoopedAnimationPrompt({
      motionPreset: resolvedMotionPreset,
      motionIntensity: input.motionIntensity,
      direction: strategy.object.direction,
    });

    const generated = await experimental_generateVideo({
      model: gateway.video(input.model),
      prompt: {
        image: uploadedPreparedFrame.url,
        text: prompt,
      },
      aspectRatio: '1:1',
      duration: 4,
      providerOptions: {
        bytedance: buildSeedanceProviderOptions({
          model: input.model,
          lastFrameImage: uploadedPreparedFrame.url,
        }),
      },
      abortSignal: options.abortSignal,
    });

    const videoBuffer = Buffer.from(generated.video.uint8Array);
    const uploadedVideo = await uploadBufferToStorage({
      buffer: videoBuffer,
      contentType: 'video/mp4',
      domain: input.domain,
      storage: input.storage,
      label: `${createRunId('animation')}.mp4`,
    });
    uploadedStoragePaths.push(uploadedVideo.storagePath);

    return logoAnimationWorkflowOutputSchema.parse({
      analysis: {
        mode: 'looped',
        brandAttributes: strategy.object.brandAttributes,
        targetAudience: strategy.object.targetAudience,
        rationale: strategy.object.rationale,
        resolvedMotionPreset,
        direction: strategy.object.direction,
        model: strategy.modelId ?? 'gpt-5.2',
        tokenUsage: strategy.totalUsage,
      },
      prompt,
      video: {
        storagePath: uploadedVideo.storagePath,
        thumbnailStoragePath: uploadedPreparedFrame.storagePath,
        url: uploadedVideo.url,
        thumbnailUrl: uploadedPreparedFrame.url,
        model: input.model,
        mimeType: 'video/mp4',
      },
      warnings: generated.warnings,
      providerMetadata: generated.providerMetadata,
    } satisfies AnimationGenerationResult);
  } catch (error) {
    const cleanupErrors = await deleteStoragePaths({
      storage: input.storage,
      storagePaths: uploadedStoragePaths,
    });

    if (cleanupErrors.length > 0) {
      const cleanupMessage = cleanupErrors
        .map((item) => item.message)
        .join('; ');
      const failureMessage =
        error instanceof Error ? error.message : 'Unknown animation failure';

      throw new Error(
        `Logo animation generation failed (${failureMessage}) and uploaded assets could not be fully cleaned up: ${cleanupMessage}`,
      );
    }

    throw error;
  }
}

async function runSheetGuidedAnimationWorkflow(
  input: z.output<typeof sheetGuidedAnimationWorkflowInputSchema>,
  options: LogoAnimationWorkflowOptions,
) {
  const logoBuffer = await fetchImageAsBuffer(
    input.referenceLogoUrl,
    options.abortSignal,
  );
  const referenceLogo = await createLogoReferenceImage(logoBuffer);
  const uploadedStoragePaths: string[] = [];

  try {
    const strategy = await generateSheetGuidedAnimationStrategy({
      domain: input.domain,
      description: input.description,
      referenceLogo: referenceLogo.image,
      referenceLogoMediaType: referenceLogo.mediaType,
    });

    const sheetPrompt = buildSheetGuidedAnimationSheetPrompt({
      domain: input.domain,
      logoVisualSummary: strategy.object.logoVisualSummary,
      animationConcept: strategy.object.animationConcept,
      rationale: strategy.object.rationale,
      shapeNotes: strategy.object.shapeNotes,
      stagePlan: strategy.object.stagePlan,
      sheetPrompt: strategy.object.sheetPrompt,
    });
    const generatedSheet = await generateAnimationSheetImage({
      prompt: sheetPrompt,
      model: input.sheetModel,
      referenceLogo,
    });

    if (!generatedSheet.imageBase64) {
      throw new Error('Animation sheet generation did not return image data');
    }

    const uploadedSheet = await uploadBufferToStorage({
      buffer: Buffer.from(generatedSheet.imageBase64, 'base64'),
      contentType: 'image/png',
      domain: input.domain,
      storage: input.storage,
      label: `${createRunId('animation-sheet')}.png`,
    });
    uploadedStoragePaths.push(uploadedSheet.storagePath);

    const prompt = buildSheetGuidedAnimationPrompt({
      direction: strategy.object.direction,
      videoPrompt: strategy.object.videoPrompt,
      stagePlan: strategy.object.stagePlan,
    });

    const generated = await experimental_generateVideo({
      model: gateway.video(input.model),
      prompt,
      aspectRatio: '16:9',
      duration: SHEET_GUIDED_DURATION_SECONDS,
      providerOptions: {
        bytedance: buildSeedanceProviderOptions({
          model: input.model,
          referenceImages: [input.referenceLogoUrl, uploadedSheet.url],
        }),
      },
      abortSignal: options.abortSignal,
    });

    const videoBuffer = Buffer.from(generated.video.uint8Array);
    const uploadedVideo = await uploadBufferToStorage({
      buffer: videoBuffer,
      contentType: 'video/mp4',
      domain: input.domain,
      storage: input.storage,
      label: `${createRunId('animation')}.mp4`,
    });
    uploadedStoragePaths.push(uploadedVideo.storagePath);

    return logoAnimationWorkflowOutputSchema.parse({
      analysis: {
        mode: 'sheet-guided',
        brandAttributes: strategy.object.brandAttributes,
        targetAudience: strategy.object.targetAudience,
        rationale: strategy.object.rationale,
        direction: strategy.object.direction,
        model: strategy.modelId ?? 'gpt-5.2',
        tokenUsage: strategy.totalUsage,
        logoVisualSummary: strategy.object.logoVisualSummary,
        animationConcept: strategy.object.animationConcept,
        shapeNotes: strategy.object.shapeNotes,
        stagePlan: strategy.object.stagePlan,
        sheetPrompt,
        videoPrompt: prompt,
      },
      prompt,
      video: {
        storagePath: uploadedVideo.storagePath,
        thumbnailStoragePath: uploadedSheet.storagePath,
        url: uploadedVideo.url,
        thumbnailUrl: uploadedSheet.url,
        model: input.model,
        mimeType: 'video/mp4',
      },
      animationSheet: {
        storagePath: uploadedSheet.storagePath,
        url: uploadedSheet.url,
        model: input.sheetModel,
        prompt: sheetPrompt,
        tokenUsage: generatedSheet.tokenUsage,
      },
      warnings: generated.warnings,
      providerMetadata: generated.providerMetadata,
    } satisfies AnimationGenerationResult);
  } catch (error) {
    const cleanupErrors = await deleteStoragePaths({
      storage: input.storage,
      storagePaths: uploadedStoragePaths,
    });

    if (cleanupErrors.length > 0) {
      const cleanupMessage = cleanupErrors
        .map((item) => item.message)
        .join('; ');
      const failureMessage =
        error instanceof Error ? error.message : 'Unknown animation failure';

      throw new Error(
        `Logo animation generation failed (${failureMessage}) and uploaded assets could not be fully cleaned up: ${cleanupMessage}`,
      );
    }

    throw error;
  }
}

export async function runLogoAnimationWorkflow(
  rawInput: LogoAnimationWorkflowInput,
  options: LogoAnimationWorkflowOptions = {},
): Promise<LogoAnimationWorkflowOutput> {
  const input = logoAnimationWorkflowInputSchema.parse(rawInput);

  if (input.mode === 'cinematic') {
    return await runCinematicAnimationWorkflow(input, options);
  }

  if (input.mode === 'sheet-guided') {
    return await runSheetGuidedAnimationWorkflow(input, options);
  }

  return await runLoopedAnimationWorkflow(input, options);
}
