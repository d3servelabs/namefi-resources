import { createOpenAI } from '@ai-sdk/openai';
import { createGateway, experimental_generateVideo, ToolLoopAgent } from 'ai';
import type { LanguageModelUsage } from 'ai';
import {
  downloadFileFromS3,
  generateCloudFrontUrl,
  uploadFileToS3,
  type StorageConfig,
} from '@namefi-astra/storage';
import { z } from 'zod';
import { secrets } from '../env';
import { createRunId } from '../utils/files';

const IMAGE_GENERATION_TOOL = 'image_generation' as const;
const DIGEST_ANIMATION_DURATION_SECONDS = 8;
const DIGEST_ANIMATION_ASPECT_RATIO = '16:9';
const DIGEST_ANIMATION_VIDEO_POLL_TIMEOUT_MS = 15 * 60 * 1000;
const DATA_URL_PATTERN =
  /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/;

export const DIGEST_ANIMATION_MODEL_IDS = [
  'bytedance/seedance-2.0',
  'bytedance/seedance-2.0-fast',
] as const;

export const DIGEST_ANIMATION_SHEET_MODEL_IDS = ['gpt-image-2'] as const;

const digestAnimationModelEnum = z.enum(DIGEST_ANIMATION_MODEL_IDS);
const digestAnimationSheetModelEnum = z.enum(DIGEST_ANIMATION_SHEET_MODEL_IDS);

const openai = createOpenAI({
  apiKey: secrets.OPENAI_API_KEY,
});

const gateway = createGateway({
  apiKey: secrets.AI_GATEWAY_API_KEY,
});

const digestAnimationSheetAgent = new ToolLoopAgent({
  model: openai('gpt-4.1'),
  instructions:
    'You are an expert motion-design storyboard artist. Use the image_generation tool to create a clean, readable animation sheet for a daily domain sales digest poster. Output tool calls only.',
  tools: {
    [IMAGE_GENERATION_TOOL]: openai.tools.imageGeneration({
      model: 'gpt-image-2',
      size: '1536x1024',
      quality: 'high',
      background: 'opaque',
      outputFormat: 'png',
      outputCompression: 100,
    }),
  },
  toolChoice: { type: 'tool', toolName: IMAGE_GENERATION_TOOL },
});

const digestAnimationWorkflowInputSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    imageDataUrl: z.string().trim().min(1),
    domains: z.array(z.string().trim().min(3).max(253)).max(12).default([]),
    summary: z.string().trim().max(2000).optional(),
    model: digestAnimationModelEnum.default('bytedance/seedance-2.0'),
    sheetModel: digestAnimationSheetModelEnum.default('gpt-image-2'),
    storage: z.custom<StorageConfig>(),
  })
  .strict();

const uploadedDigestAnimationSourceImageSchema = z
  .object({
    storagePath: z.string().min(1),
    url: z.string().url(),
    mimeType: z.string().min(1),
  })
  .strict();

const uploadedDigestAnimationSourceImageInputSchema = z
  .object({
    storagePath: z.string().min(1),
    mimeType: z.string().min(1),
  })
  .strict();

const digestAnimationWorkflowFromUploadedSourceInputSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    sourceImage: uploadedDigestAnimationSourceImageInputSchema,
    domains: z.array(z.string().trim().min(3).max(253)).max(12).default([]),
    summary: z.string().trim().max(2000).optional(),
    model: digestAnimationModelEnum.default('bytedance/seedance-2.0'),
    sheetModel: digestAnimationSheetModelEnum.default('gpt-image-2'),
    storage: z.custom<StorageConfig>(),
  })
  .strict();

export const digestAnimationWorkflowOutputSchema = z.object({
  sourceImage: z.object({
    storagePath: z.string(),
    url: z.string().url(),
    mimeType: z.string(),
  }),
  animationSheet: z.object({
    storagePath: z.string(),
    url: z.string().url(),
    model: digestAnimationSheetModelEnum,
    prompt: z.string(),
    tokenUsage: z
      .object({
        inputTokens: z.number(),
        outputTokens: z.number(),
        totalTokens: z.number().optional(),
      })
      .passthrough()
      .optional(),
  }),
  video: z.object({
    storagePath: z.string(),
    url: z.string().url(),
    model: digestAnimationModelEnum,
    mimeType: z.literal('video/mp4'),
  }),
  prompt: z.string(),
  warnings: z.array(z.unknown()),
  providerMetadata: z.record(z.string(), z.unknown()).optional(),
});

export type DigestAnimationWorkflowInput = z.input<
  typeof digestAnimationWorkflowInputSchema
>;
export type DigestAnimationWorkflowFromUploadedSourceInput = z.input<
  typeof digestAnimationWorkflowFromUploadedSourceInputSchema
>;
export type DigestAnimationUploadedSourceImage = z.output<
  typeof uploadedDigestAnimationSourceImageSchema
>;
export type DigestAnimationWorkflowOutput = z.output<
  typeof digestAnimationWorkflowOutputSchema
>;

export interface DigestAnimationWorkflowOptions {
  abortSignal?: AbortSignal;
}

interface ParsedImageDataUrl {
  bytes: Buffer;
  mimeType: string;
}

function parseImageDataUrl(value: string): ParsedImageDataUrl {
  const match = value.trim().match(DATA_URL_PATTERN);
  if (!match?.[1] || !match[2]) {
    throw new Error('Digest animation source image must be an image data URL.');
  }

  const bytes = Buffer.from(normalizeBase64Data(match[2]), 'base64');
  if (bytes.length === 0) {
    throw new Error('Digest animation source image data URL is empty.');
  }

  return {
    bytes,
    mimeType: match[1],
  };
}

function normalizeBase64Data(value: string): string {
  const normalized = value.replace(/\s/g, '');
  const padding = normalized.length % 4;
  return padding === 0
    ? normalized
    : normalized.padEnd(normalized.length + 4 - padding, '=');
}

function normalizeImageBase64(value: string): string {
  const match = value.trim().match(DATA_URL_PATTERN);
  return normalizeBase64Data(match?.[2] ?? value);
}

function buildDomainLine(domains: ReadonlyArray<string>): string {
  if (domains.length === 0) {
    return 'No explicit domains were supplied; preserve all visible poster text exactly.';
  }

  return domains.map((domain, index) => `${index + 1}. ${domain}`).join('\n');
}

export function buildDigestAnimationSheetPrompt(input: {
  title: string;
  domains: ReadonlyArray<string>;
  summary?: string;
}): string {
  return [
    'Create a professional landscape animation sheet for an 8-second daily domain sales digest poster animation.',
    'Use the uploaded poster image as the exact source of truth for text, hierarchy, palette, and final lockup.',
    'Canvas: 1536x1024, clean dark motion-design board, high contrast, crisp readable labels.',
    `Digest title: ${input.title}.`,
    `Digest context: ${input.summary?.trim() || 'Daily Namefi Feed domain market digest.'}`,
    'Visible domains that must remain spelled exactly in the final video:',
    buildDomainLine(input.domains),
    'Required sheet layout: 5 labeled keyframe panels with time ranges covering 0.0s to 8.0s, arrows showing motion flow, timing bars, easing notes, typography motion notes, and one focused breakdown row showing safe parallax/luminance treatment for domain words.',
    'Motion direction: subtle premium editorial motion. Use gentle depth separation, small scale shifts, light sweeps, market-signal particles, and background texture movement while keeping domain words readable.',
    'Final keyframe must return to the original poster composition, centered, fully legible, and intact.',
    'Do not add new domain names, new brands, people, mascots, mockup devices, unrelated UI, or any extra promotional copy.',
    'If a domain spelling is uncertain, keep that word static and unchanged.',
  ].join('\n');
}

export function buildDigestAnimationVideoPrompt(input: {
  title: string;
  domains: ReadonlyArray<string>;
  summary?: string;
}): string {
  return [
    'Create an 8-second 16:9 premium animation for a daily domain sales digest poster using the provided references.',
    '[Image 1] is the exact digest poster and final lockup reference. Preserve all visible domain spellings, typography hierarchy, colors, and the Namefi mark.',
    '[Image 2] is the animation sheet/storyboard. Follow its staged timing, motion flow, easing, and final lockup guidance closely.',
    `Digest title: ${input.title}.`,
    `Digest context: ${input.summary?.trim() || 'Daily Namefi Feed domain market digest.'}`,
    `Protected domain text: ${input.domains.length > 0 ? input.domains.join(', ') : 'all visible domains in Image 1'}.`,
    'Use subtle parallax, controlled light sweeps, restrained market-data particles, and tasteful background texture motion.',
    'Keep all domain words legible for the entire clip. Do not invent, remove, reorder, or misspell any domain text.',
    'No new text, no logos beyond the source poster, no people, no mascots, no scene cuts, no camera travel that makes words unreadable.',
    'End with the original digest poster lockup held clearly for at least the final 1.0 second.',
  ].join(' ');
}

async function generateDigestAnimationSheet(input: {
  prompt: string;
  referenceImage: ParsedImageDataUrl;
  abortSignal?: AbortSignal;
}): Promise<{ imageBase64: string; tokenUsage?: LanguageModelUsage }> {
  const result = await digestAnimationSheetAgent.generate({
    abortSignal: input.abortSignal,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: input.prompt },
          {
            type: 'image',
            image: new Uint8Array(input.referenceImage.bytes),
            mediaType: input.referenceImage.mimeType,
          },
        ],
      },
    ],
  });

  const toolResult = result.staticToolResults.find(
    (entry) => entry.toolName === IMAGE_GENERATION_TOOL,
  );
  const imageBase64 =
    typeof toolResult?.output?.result === 'string'
      ? toolResult.output.result.trim()
      : null;

  if (!imageBase64) {
    throw new Error(
      'Digest animation sheet generation returned no image data.',
    );
  }

  return {
    imageBase64,
    tokenUsage: result.totalUsage,
  };
}

async function uploadBufferToStorage(params: {
  buffer: Buffer;
  contentType: string;
  label: string;
  storage: StorageConfig;
}) {
  const folder = buildDigestAnimationStorageFolder(params.storage);
  const uploaded = await uploadFileToS3({
    s3Client: params.storage.s3Client,
    bucketName: params.storage.bucketName,
    fileBuffer: params.buffer,
    contentType: params.contentType,
    folder,
    fileName: params.label,
  });

  return {
    storagePath: uploaded.key,
    url: generateCloudFrontUrl({
      cloudfrontDomain: params.storage.cloudfrontDomain,
      s3Key: uploaded.key,
    }),
  };
}

function buildDigestAnimationStorageFolder(storage: StorageConfig) {
  return [storage.baseFolder, 'sales-digest'].filter(Boolean).join('/');
}

function assertDigestAnimationStoragePath(params: {
  storagePath: string;
  storage: StorageConfig;
}) {
  const folder = buildDigestAnimationStorageFolder(params.storage);
  if (!params.storagePath.startsWith(`${folder}/`)) {
    throw new Error(
      `Digest animation source image storagePath must be under ${folder}.`,
    );
  }
}

function buildSeedanceProviderOptions(input: { referenceImages: string[] }) {
  return {
    referenceImages: input.referenceImages,
    watermark: false,
    generateAudio: false,
    pollTimeoutMs: DIGEST_ANIMATION_VIDEO_POLL_TIMEOUT_MS,
  };
}

function getImageExtensionFromMimeType(mimeType: string): string {
  switch (mimeType.toLowerCase()) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'png';
  }
}

export async function uploadDigestAnimationSourceImage({
  imageDataUrl,
  storage,
}: {
  imageDataUrl: string;
  storage: StorageConfig;
}): Promise<DigestAnimationUploadedSourceImage> {
  const sourceImage = parseImageDataUrl(imageDataUrl);
  const uploadedSource = await uploadBufferToStorage({
    buffer: sourceImage.bytes,
    contentType: sourceImage.mimeType,
    label: `${createRunId('digest-animation-source')}.${getImageExtensionFromMimeType(sourceImage.mimeType)}`,
    storage,
  });

  return uploadedDigestAnimationSourceImageSchema.parse({
    storagePath: uploadedSource.storagePath,
    url: uploadedSource.url,
    mimeType: sourceImage.mimeType,
  });
}

function canonicalizeUploadedDigestAnimationSourceImage(
  sourceImage: z.output<typeof uploadedDigestAnimationSourceImageInputSchema>,
  storage: StorageConfig,
): DigestAnimationUploadedSourceImage {
  assertDigestAnimationStoragePath({
    storagePath: sourceImage.storagePath,
    storage,
  });

  return uploadedDigestAnimationSourceImageSchema.parse({
    storagePath: sourceImage.storagePath,
    url: generateCloudFrontUrl({
      cloudfrontDomain: storage.cloudfrontDomain,
      s3Key: sourceImage.storagePath,
    }),
    mimeType: sourceImage.mimeType,
  });
}

async function loadUploadedDigestAnimationSourceImage(
  sourceImage: DigestAnimationUploadedSourceImage,
  storage: StorageConfig,
  options: DigestAnimationWorkflowOptions = {},
): Promise<ParsedImageDataUrl> {
  const declaredMimeType = sourceImage.mimeType.toLowerCase();
  if (!declaredMimeType.startsWith('image/')) {
    throw new Error(
      `Digest animation source image must be an image, received ${sourceImage.mimeType}.`,
    );
  }

  const downloaded = await downloadFileFromS3({
    s3Client: storage.s3Client,
    bucketName: storage.bucketName,
    key: sourceImage.storagePath,
    abortSignal: options.abortSignal,
  });
  if (downloaded.bytes.length === 0) {
    throw new Error('Digest animation source image is empty.');
  }

  const downloadedMimeType = downloaded.contentType
    ?.split(';')[0]
    ?.trim()
    .toLowerCase();
  const mimeType = downloadedMimeType || sourceImage.mimeType;
  if (!mimeType.toLowerCase().startsWith('image/')) {
    throw new Error(
      `Digest animation source image must be an image, received ${mimeType}.`,
    );
  }

  return {
    bytes: downloaded.bytes,
    mimeType,
  };
}

async function runDigestAnimationWorkflowWithSource({
  input,
  options = {},
  sourceImage,
  uploadedSource,
}: {
  input: {
    title: string;
    domains: ReadonlyArray<string>;
    summary?: string;
    model: z.output<typeof digestAnimationModelEnum>;
    sheetModel: z.output<typeof digestAnimationSheetModelEnum>;
    storage: StorageConfig;
  };
  options?: DigestAnimationWorkflowOptions;
  sourceImage: ParsedImageDataUrl;
  uploadedSource: DigestAnimationUploadedSourceImage;
}): Promise<DigestAnimationWorkflowOutput> {
  const sheetPrompt = buildDigestAnimationSheetPrompt({
    title: input.title,
    domains: input.domains,
    summary: input.summary,
  });
  const generatedSheet = await generateDigestAnimationSheet({
    prompt: sheetPrompt,
    referenceImage: sourceImage,
    abortSignal: options.abortSignal,
  });
  const uploadedSheet = await uploadBufferToStorage({
    buffer: Buffer.from(
      normalizeImageBase64(generatedSheet.imageBase64),
      'base64',
    ),
    contentType: 'image/png',
    label: `${createRunId('digest-animation-sheet')}.png`,
    storage: input.storage,
  });

  const prompt = buildDigestAnimationVideoPrompt({
    title: input.title,
    domains: input.domains,
    summary: input.summary,
  });
  const referenceImages = [uploadedSource.url, uploadedSheet.url];
  const generated = await experimental_generateVideo({
    model: gateway.video(input.model),
    prompt,
    aspectRatio: DIGEST_ANIMATION_ASPECT_RATIO,
    duration: DIGEST_ANIMATION_DURATION_SECONDS,
    providerOptions: {
      bytedance: buildSeedanceProviderOptions({ referenceImages }),
    },
    abortSignal: options.abortSignal,
  }).catch((error) => {
    const generationError = new Error(
      `Digest animation video generation failed for model ${input.model} (${DIGEST_ANIMATION_ASPECT_RATIO}, ${DIGEST_ANIMATION_DURATION_SECONDS}s, references: ${referenceImages.join(', ')}).`,
    ) as Error & { cause?: unknown };
    generationError.cause = error;
    throw generationError;
  });

  const uploadedVideo = await uploadBufferToStorage({
    buffer: Buffer.from(generated.video.uint8Array),
    contentType: 'video/mp4',
    label: `${createRunId('digest-animation')}.mp4`,
    storage: input.storage,
  });

  return digestAnimationWorkflowOutputSchema.parse({
    sourceImage: uploadedSource,
    animationSheet: {
      storagePath: uploadedSheet.storagePath,
      url: uploadedSheet.url,
      model: input.sheetModel,
      prompt: sheetPrompt,
      tokenUsage: generatedSheet.tokenUsage,
    },
    video: {
      storagePath: uploadedVideo.storagePath,
      url: uploadedVideo.url,
      model: input.model,
      mimeType: 'video/mp4',
    },
    prompt,
    warnings: generated.warnings,
    providerMetadata: generated.providerMetadata,
  });
}

export async function runDigestAnimationWorkflow(
  rawInput: DigestAnimationWorkflowInput,
  options: DigestAnimationWorkflowOptions = {},
): Promise<DigestAnimationWorkflowOutput> {
  const input = digestAnimationWorkflowInputSchema.parse(rawInput);
  const sourceImage = parseImageDataUrl(input.imageDataUrl);
  const uploadedSource = await uploadDigestAnimationSourceImage({
    imageDataUrl: input.imageDataUrl,
    storage: input.storage,
  });

  return runDigestAnimationWorkflowWithSource({
    input,
    options,
    sourceImage,
    uploadedSource,
  });
}

export async function runDigestAnimationWorkflowFromUploadedSource(
  rawInput: DigestAnimationWorkflowFromUploadedSourceInput,
  options: DigestAnimationWorkflowOptions = {},
): Promise<DigestAnimationWorkflowOutput> {
  const input =
    digestAnimationWorkflowFromUploadedSourceInputSchema.parse(rawInput);
  const uploadedSource = canonicalizeUploadedDigestAnimationSourceImage(
    input.sourceImage,
    input.storage,
  );
  const sourceImage = await loadUploadedDigestAnimationSourceImage(
    uploadedSource,
    input.storage,
    options,
  );

  return runDigestAnimationWorkflowWithSource({
    input,
    options,
    sourceImage,
    uploadedSource,
  });
}
