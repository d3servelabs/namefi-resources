import type {
  DigestAnimationUploadedSourceImage,
  DigestAnimationWorkflowFromUploadedSourceInput,
  DigestAnimationWorkflowOutput,
} from '@namefi-astra/ai';

export interface PublicDigestAnimationWorkflowInput {
  jobId: string;
  externalUserId: string;
  title: string;
  domains: string[];
  summary?: string;
  model: DigestAnimationWorkflowFromUploadedSourceInput['model'];
  sheetModel: DigestAnimationWorkflowFromUploadedSourceInput['sheetModel'];
  sourceImage: DigestAnimationUploadedSourceImage;
}

export interface PublicDigestAnimationActivityResult {
  createdAt: string;
  output: DigestAnimationWorkflowOutput;
}

export interface PublicDigestAnimationWorkflowResult {
  id: string;
  externalUserId: string;
  title: string;
  type: 'digest_animation';
  model: string;
  sheetModel: string;
  url: string;
  storagePath: string;
  mimeType: 'video/mp4';
  sourceImageUrl: string;
  sourceImageStoragePath: string;
  sourceImageMimeType: string;
  sheetUrl: string;
  sheetStoragePath: string;
  sheetPrompt: string;
  videoPrompt: string;
  warnings: unknown[];
  providerMetadata?: Record<string, unknown>;
  /**
   * Usage counts, measured in tokens, for the animation-sheet image generation
   * stage only. The downstream video provider currently does not return token
   * usage.
   */
  tokenUsage: Array<{
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens?: number;
  }>;
  createdAt: string;
}

export function buildPublicDigestAnimationWorkflowResult(
  input: PublicDigestAnimationWorkflowInput,
  result: PublicDigestAnimationActivityResult,
): PublicDigestAnimationWorkflowResult {
  const tokenUsage = result.output.animationSheet.tokenUsage
    ? [
        {
          model: result.output.animationSheet.model,
          inputTokens: result.output.animationSheet.tokenUsage.inputTokens ?? 0,
          outputTokens:
            result.output.animationSheet.tokenUsage.outputTokens ?? 0,
          totalTokens: result.output.animationSheet.tokenUsage.totalTokens,
        },
      ]
    : [];

  return {
    id: input.jobId,
    externalUserId: input.externalUserId,
    title: input.title,
    type: 'digest_animation',
    model: result.output.video.model,
    sheetModel: result.output.animationSheet.model,
    url: result.output.video.url,
    storagePath: result.output.video.storagePath,
    mimeType: result.output.video.mimeType,
    sourceImageUrl: result.output.sourceImage.url,
    sourceImageStoragePath: result.output.sourceImage.storagePath,
    sourceImageMimeType: result.output.sourceImage.mimeType,
    sheetUrl: result.output.animationSheet.url,
    sheetStoragePath: result.output.animationSheet.storagePath,
    sheetPrompt: result.output.animationSheet.prompt,
    videoPrompt: result.output.prompt,
    warnings: result.output.warnings,
    providerMetadata: result.output.providerMetadata,
    tokenUsage,
    createdAt: result.createdAt,
  };
}
