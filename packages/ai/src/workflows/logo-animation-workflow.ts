import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { experimental_generateVideo } from 'ai';
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
  ANIMATION_MOTION_PRESET_IDS,
  ANIMATION_MOTION_PRESET_KNOWN_IDS,
  ANIMATION_SOURCE_MODE_IDS,
  type AnimationGenerationResult,
  type AnimationMotionPresetId,
  type AnimationMotionPresetInput,
  type AnimationSourceMode,
} from '../types/generation';
import { createRunId } from '../utils/files';
import { fetchImageAsBuffer } from '../utils/images';
import { secrets } from '../env';
import { tokenUsageSchema } from '../types/logo-schemas';
import { generateAnimationStrategy } from '../agents/strategists';

const FRAME_WIDTH = 1280;
const FRAME_HEIGHT = 720;
const SAFE_MARGIN_RATIO = 0.12;
const LIGHT_BACKGROUND = '#F8FAFC';
const DARK_BACKGROUND = '#0F172A';

const animationModelEnum = z.enum(ANIMATION_MODEL_IDS);
const motionPresetKnownEnum = z.enum(ANIMATION_MOTION_PRESET_KNOWN_IDS);
const motionPresetResolvedEnum = z.enum(ANIMATION_MOTION_PRESET_KNOWN_IDS);
const animationSourceModeEnum = z.enum(ANIMATION_SOURCE_MODE_IDS);
const google = createGoogleGenerativeAI({
  apiKey: secrets.GEMINI_API_KEY,
});

export const logoAnimationWorkflowInputSchema = z.object({
  domain: namefiNormalizedDomainSchema,
  referenceLogoUrl: z.string().url(),
  description: z.string().optional(),
  sourceMode: animationSourceModeEnum.default('exact-frame'),
  motionPreset: motionPresetKnownEnum.default('let-ai-choose'),
  model: animationModelEnum.default('veo-3.1-generate-preview'),
  storage: z.custom<StorageConfig>(),
});

export const logoAnimationWorkflowOutputSchema = z.object({
  analysis: z.object({
    brandAttributes: z.array(z.string()),
    targetAudience: z.string(),
    rationale: z.string(),
    resolvedMotionPreset: motionPresetResolvedEnum,
    direction: z.string(),
    model: z.string(),
    tokenUsage: tokenUsageSchema,
  }),
  prompt: z.string(),
  video: z.object({
    storagePath: z.string(),
    thumbnailStoragePath: z.string(),
    url: z.string(),
    thumbnailUrl: z.string(),
    model: animationModelEnum,
    mimeType: z.literal('video/mp4'),
  }),
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

const motionPromptByPreset: Record<AnimationMotionPresetId, string> = {
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
  'light-sweep':
    'A narrow premium light sweep glides across the logo surface and resolves with clean stillness.',
  'glow-pulse':
    'A restrained glow pulse brightens the logo once, adds soft atmospheric bloom, and settles naturally.',
  'particle-orbit':
    'A refined field of particles orbits the logo in graceful motion while the mark remains unobscured and central.',
  'contour-trace':
    'A crisp tracing light travels around the logo silhouette, building anticipation before resolving into a hero lockup.',
  shimmer:
    'A subtle metallic shimmer glides across key edges and reflective contours, giving the logo a polished premium finish.',
  'let-ai-choose':
    'Choose the strongest cinematic motion direction for this brand and source logo.',
};

function buildAnimationPrompt(input: {
  motionPreset: AnimationMotionPresetId;
  sourceMode: AnimationSourceMode;
  direction: string;
}) {
  const parts =
    input.sourceMode === 'subject-reference'
      ? [
          'Create an ambitious cinematic 8-second logo animation using the provided logo as a subject reference rather than a literal first frame.',
          motionPromptByPreset[input.motionPreset],
          `Brand-specific motion direction: ${input.direction.trim()}.`,
          'Preserve the original logo shapes, letterforms, proportions, colors, and brand marks throughout the animation.',
          'Treat the provided logo as the core asset reference and compose it natively in frame instead of placing it inside a poster, card, inset, square box, or padded plate.',
          'Use camera movement, atmospheric context, temporal motion, and optical effects only when they keep the logo as the clear focal subject.',
          'No new text, no extra symbols, no mascot characters, no scene cuts, no destructive effects, and no morphing into a different mark.',
          'End on a sharp, fully legible hero frame with the logo cleanly resolved.',
        ]
      : [
          'Create an ambitious cinematic 8-second logo animation from the provided source frame.',
          motionPromptByPreset[input.motionPreset],
          `Brand-specific motion direction: ${input.direction.trim()}.`,
          'Use camera movement, atmospheric context, temporal motion, and optical effects only when they keep the logo as the clear focal subject.',
          'The logo may gain depth, reflections, particles, energy interaction, or cinematic environmental support, but the original shapes, letterforms, proportions, colors, and brand marks must remain intact and recognizable throughout.',
          'No new text, no extra symbols, no mascot characters, no scene cuts, no destructive effects, and no morphing into a different mark.',
          'End on a sharp, fully legible hero frame with the logo cleanly resolved.',
        ];

  return parts.filter(Boolean).join(' ');
}

function isCurrentAnimationMotionPresetInput(
  value: AnimationMotionPresetId,
): value is AnimationMotionPresetInput {
  return ANIMATION_MOTION_PRESET_IDS.includes(
    value as AnimationMotionPresetInput,
  );
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

async function createPreparedSourceFrame(logoBuffer: Buffer) {
  const maxWidth = Math.round(FRAME_WIDTH * (1 - SAFE_MARGIN_RATIO * 2));
  const maxHeight = Math.round(FRAME_HEIGHT * (1 - SAFE_MARGIN_RATIO * 2));
  const background = await resolveContrastingBackground(logoBuffer);

  const logoPng = await sharp(logoBuffer)
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
      width: FRAME_WIDTH,
      height: FRAME_HEIGHT,
      channels: 4,
      background,
    },
  })
    .composite([
      {
        input: logoPng,
        left: Math.round((FRAME_WIDTH - logoWidth) / 2),
        top: Math.round((FRAME_HEIGHT - logoHeight) / 2),
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

export async function runLogoAnimationWorkflow(
  rawInput: LogoAnimationWorkflowInput,
  options: LogoAnimationWorkflowOptions = {},
): Promise<LogoAnimationWorkflowOutput> {
  const input = logoAnimationWorkflowInputSchema.parse(rawInput);

  const logoBuffer = await fetchImageAsBuffer(
    input.referenceLogoUrl,
    options.abortSignal,
  );
  const preparedFrame =
    input.sourceMode === 'exact-frame'
      ? await createPreparedSourceFrame(logoBuffer)
      : null;

  const strategy = isCurrentAnimationMotionPresetInput(input.motionPreset)
    ? await generateAnimationStrategy({
        domain: input.domain,
        description: input.description,
        motionPreset: input.motionPreset,
      })
    : undefined;
  const resolvedMotionPreset =
    strategy?.object.motionPreset ?? input.motionPreset;
  const prompt = buildAnimationPrompt({
    motionPreset: resolvedMotionPreset,
    sourceMode: input.sourceMode,
    direction:
      strategy?.object.direction ??
      (input.description?.trim() ||
        'Honor the originally requested legacy motion direction with a polished, brand-safe execution.'),
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
        brandAttributes: strategy?.object.brandAttributes ?? [],
        targetAudience: strategy?.object.targetAudience ?? '',
        rationale:
          strategy?.object.rationale ??
          'Legacy motion preset preserved from the original request.',
        resolvedMotionPreset,
        direction:
          strategy?.object.direction ??
          'Honor the originally requested legacy motion direction with a polished, brand-safe execution.',
        model: strategy?.modelId ?? 'legacy-preset',
        tokenUsage: strategy?.totalUsage,
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
