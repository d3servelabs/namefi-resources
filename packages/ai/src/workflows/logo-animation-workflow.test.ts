import { beforeEach, describe, expect, it, vi } from 'vitest';

const createGatewayMock = vi.fn();
const gatewayVideoMock = vi.fn();
const createGoogleGenerativeAIMock = vi.fn();
const googleVideoMock = vi.fn();
const experimentalGenerateVideoMock = vi.fn();
const uploadFileToS3Mock = vi.fn();
const deleteFileFromS3Mock = vi.fn();
const fetchImageAsBufferMock = vi.fn();
const generateCinematicAnimationStrategyMock = vi.fn();
const generateLoopedAnimationStrategyMock = vi.fn();
const generateSheetGuidedAnimationStrategyMock = vi.fn();
const generateAnimationSheetImageMock = vi.fn();
const invalidOptionErrorPattern = /Invalid option/;
const unrecognizedKeyErrorPattern = /Unrecognized key/;

const onePixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg==',
  'base64',
);

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: createGoogleGenerativeAIMock,
}));

vi.mock('ai', () => ({
  createGateway: createGatewayMock,
  experimental_generateVideo: experimentalGenerateVideoMock,
}));

vi.mock('@namefi-astra/storage', () => ({
  createS3Client: vi.fn(() => ({})),
  deleteFileFromS3: deleteFileFromS3Mock,
  generateCloudFrontUrl: ({
    cloudfrontDomain,
    s3Key,
  }: {
    cloudfrontDomain: string;
    s3Key: string;
  }) => `https://${cloudfrontDomain}/${s3Key}`,
  generateUrlFromStoragePath: (storagePath: string, cloudfrontDomain: string) =>
    `https://${cloudfrontDomain}/${storagePath}`,
  uploadFileToS3: uploadFileToS3Mock,
}));

vi.mock('../utils/images', () => ({
  fetchImageAsBuffer: fetchImageAsBufferMock,
}));

vi.mock('../agents/strategists', () => ({
  generateCinematicAnimationStrategy: generateCinematicAnimationStrategyMock,
  generateLoopedAnimationStrategy: generateLoopedAnimationStrategyMock,
  generateSheetGuidedAnimationStrategy:
    generateSheetGuidedAnimationStrategyMock,
}));

vi.mock('../agents/generators', () => ({
  generateAnimationSheetImage: generateAnimationSheetImageMock,
}));

vi.mock('../env', () => ({
  secrets: {
    GEMINI_API_KEY: 'test-gemini-key',
    AI_GATEWAY_API_KEY: 'test-gateway-key',
  },
}));

googleVideoMock.mockReturnValue('mock-google-video-model');
gatewayVideoMock.mockReturnValue('mock-gateway-video-model');
createGoogleGenerativeAIMock.mockReturnValue({
  video: googleVideoMock,
});
createGatewayMock.mockReturnValue({
  video: gatewayVideoMock,
});

const { runLogoAnimationWorkflow } = await import('./logo-animation-workflow');

const storage = {
  bucketName: 'test-bucket',
  cloudfrontDomain: 'cdn.test',
  s3Client: {} as never,
  baseFolder: 'animations',
};

describe('runLogoAnimationWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    googleVideoMock.mockReturnValue('mock-google-video-model');
    gatewayVideoMock.mockReturnValue('mock-gateway-video-model');
    createGoogleGenerativeAIMock.mockReturnValue({
      video: googleVideoMock,
    });
    createGatewayMock.mockReturnValue({
      video: gatewayVideoMock,
    });

    fetchImageAsBufferMock.mockResolvedValue(onePixelPng);
    deleteFileFromS3Mock.mockResolvedValue(undefined);

    generateCinematicAnimationStrategyMock.mockResolvedValue({
      object: {
        brandAttributes: ['bold', 'premium'],
        targetAudience: 'Design-conscious founders',
        rationale: 'An orbital reveal gives the mark a stronger hero moment.',
        motionPreset: 'orbital-reveal',
        direction:
          'Use an elegant arc shot, cinematic light ribbons, and atmospheric particles while keeping the logo perfectly legible.',
      },
      totalUsage: {
        inputTokens: 12,
        outputTokens: 18,
        totalTokens: 30,
      },
      modelId: 'gpt-5.2',
    });

    generateLoopedAnimationStrategyMock.mockResolvedValue({
      object: {
        brandAttributes: ['premium', 'precise'],
        targetAudience: 'Design-conscious founders',
        rationale:
          'A light sweep keeps the mark polished without turning it cinematic.',
        motionPreset: 'light-sweep',
        direction:
          'Keep the logo centered with a restrained polish pass that resolves back to stillness.',
      },
      totalUsage: {
        inputTokens: 10,
        outputTokens: 14,
        totalTokens: 24,
      },
      modelId: 'gpt-5.2',
    });

    generateSheetGuidedAnimationStrategyMock.mockResolvedValue({
      object: {
        brandAttributes: ['premium', 'precise'],
        targetAudience: 'Design-conscious founders',
        rationale:
          'The logo has sharp contours that will read best as a staged trace and hero reveal.',
        logoVisualSummary:
          'A compact monochrome logo with a clean symbol and short wordmark.',
        animationConcept:
          'A luminous contour trace forms the symbol before the wordmark settles.',
        shapeNotes: [
          'Trace the outer symbol edge first.',
          'Resolve the inner negative space before the wordmark appears.',
          'Keep the final wordmark crisp and centered.',
        ],
        stagePlan: [
          {
            label: 'Signal',
            timeRange: '0.0s-1.5s',
            visualState: 'Small luminous strokes gather on a dark field.',
            motionInstruction: 'Draw the first logo contour.',
          },
          {
            label: 'Trace',
            timeRange: '1.5s-3.5s',
            visualState: 'The symbol outline becomes recognizable.',
            motionInstruction: 'Continue contour tracing.',
          },
          {
            label: 'Assemble',
            timeRange: '3.5s-6.0s',
            visualState: 'Wordmark forms beside the symbol.',
            motionInstruction: 'Fade and slide letters into place.',
          },
          {
            label: 'Lockup',
            timeRange: '6.0s-8.0s',
            visualState: 'Original logo resolves fully.',
            motionInstruction: 'Settle to a sharp final frame.',
          },
        ],
        direction:
          'Use an elegant logo-specific trace and arc reveal, then settle on the original lockup.',
        sheetPrompt:
          'Show the contour trace, wordmark assembly, and final lockup with timing labels.',
        videoPrompt:
          'Follow the animation sheet timings and resolve to the original logo.',
      },
      totalUsage: {
        inputTokens: 20,
        outputTokens: 28,
        totalTokens: 48,
      },
      modelId: 'gpt-5.2',
    });

    generateAnimationSheetImageMock.mockResolvedValue({
      imageBase64: onePixelPng.toString('base64'),
      tokenUsage: {
        inputTokens: 30,
        outputTokens: 8,
        totalTokens: 38,
      },
    });
  });

  it('forwards abort signals through the cinematic branch', async () => {
    experimentalGenerateVideoMock.mockResolvedValue({
      video: { uint8Array: new Uint8Array([1, 2, 3]) },
      warnings: [],
      providerMetadata: {},
    });
    uploadFileToS3Mock
      .mockResolvedValueOnce({ key: 'animations/domain/video.mp4' })
      .mockResolvedValueOnce({ key: 'animations/domain/thumb.png' });

    const abortController = new AbortController();

    await runLogoAnimationWorkflow(
      {
        mode: 'cinematic',
        domain: 'example.com',
        referenceLogoUrl: 'https://cdn.test/logo.png',
        motionPreset: 'let-ai-choose',
        model: 'veo-3.1-generate-preview',
        storage,
      },
      { abortSignal: abortController.signal },
    );

    expect(fetchImageAsBufferMock).toHaveBeenCalledWith(
      'https://cdn.test/logo.png',
      abortController.signal,
    );
    expect(generateCinematicAnimationStrategyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: 'example.com',
        motionPreset: 'let-ai-choose',
      }),
    );
    expect(experimentalGenerateVideoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        abortSignal: abortController.signal,
      }),
    );
    expect(googleVideoMock).toHaveBeenCalledWith('veo-3.1-generate-preview');
  });

  it('uses subject references without sending a literal first frame in cinematic mode', async () => {
    experimentalGenerateVideoMock.mockResolvedValue({
      video: { uint8Array: new Uint8Array([1, 2, 3]) },
      warnings: [],
      providerMetadata: {},
    });
    uploadFileToS3Mock
      .mockResolvedValueOnce({ key: 'animations/domain/video.mp4' })
      .mockResolvedValueOnce({ key: 'animations/domain/thumb.png' });

    await runLogoAnimationWorkflow({
      mode: 'cinematic',
      domain: 'example.com',
      referenceLogoUrl: 'https://cdn.test/logo.png',
      sourceMode: 'subject-reference',
      motionPreset: 'let-ai-choose',
      model: 'veo-3.1-generate-preview',
      storage,
    });

    const generateVideoCall = experimentalGenerateVideoMock.mock.calls[0]?.[0];
    expect(typeof generateVideoCall.prompt).toBe('string');
    expect(generateVideoCall.prompt).toContain('subject reference');
    expect(generateVideoCall.providerOptions.google.referenceImages).toEqual([
      {
        image: {
          bytesBase64Encoded: onePixelPng.toString('base64'),
          mimeType: 'image/png',
        },
        referenceType: 'asset',
      },
    ]);
  });

  it('uploads a square source frame and reuses it as the loop boundary in looped mode', async () => {
    experimentalGenerateVideoMock.mockResolvedValue({
      video: { uint8Array: new Uint8Array([7, 8, 9]) },
      warnings: ['draft-preview'],
      providerMetadata: { provider: 'bytedance' },
    });
    uploadFileToS3Mock
      .mockResolvedValueOnce({ key: 'animations/domain/source.png' })
      .mockResolvedValueOnce({ key: 'animations/domain/video.mp4' });

    const result = await runLogoAnimationWorkflow({
      mode: 'looped',
      domain: 'example.com',
      referenceLogoUrl: 'https://cdn.test/logo.png',
      motionPreset: 'let-ai-choose',
      motionIntensity: 'subtle',
      model: 'bytedance/seedance-v1.5-pro',
      storage,
    });

    expect(generateLoopedAnimationStrategyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: 'example.com',
        motionIntensity: 'subtle',
      }),
    );
    expect(gatewayVideoMock).toHaveBeenCalledWith(
      'bytedance/seedance-v1.5-pro',
    );

    const generateVideoCall = experimentalGenerateVideoMock.mock.calls[0]?.[0];
    expect(generateVideoCall.aspectRatio).toBe('1:1');
    expect(generateVideoCall.duration).toBe(4);
    expect(generateVideoCall.prompt).toEqual({
      image: 'https://cdn.test/animations/domain/source.png',
      text: expect.stringContaining(
        'seamless 4-second square animated logo loop',
      ),
    });
    expect(generateVideoCall.providerOptions.bytedance).toEqual(
      expect.objectContaining({
        lastFrameImage: 'https://cdn.test/animations/domain/source.png',
        cameraFixed: true,
        watermark: false,
        generateAudio: false,
        pollTimeoutMs: 600_000,
      }),
    );
    expect(result.video.thumbnailStoragePath).toBe(
      'animations/domain/source.png',
    );
  });

  it('creates a GPT Image 2 animation sheet and uses logo plus sheet as Seedance references', async () => {
    experimentalGenerateVideoMock.mockResolvedValue({
      video: { uint8Array: new Uint8Array([4, 5, 6]) },
      warnings: [],
      providerMetadata: { provider: 'bytedance' },
    });
    uploadFileToS3Mock
      .mockResolvedValueOnce({ key: 'animations/domain/sheet.png' })
      .mockResolvedValueOnce({ key: 'animations/domain/video.mp4' });

    const result = await runLogoAnimationWorkflow({
      mode: 'sheet-guided',
      domain: 'example.com',
      referenceLogoUrl: 'https://cdn.test/logo.png',
      model: 'bytedance/seedance-2.0',
      sheetModel: 'gpt-image-2',
      storage,
    });

    expect(generateSheetGuidedAnimationStrategyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: 'example.com',
        referenceLogo: expect.any(Uint8Array),
        referenceLogoMediaType: 'image/png',
      }),
    );
    expect(generateAnimationSheetImageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-image-2',
        referenceLogo: expect.objectContaining({
          image: expect.any(Uint8Array),
          mediaType: 'image/png',
        }),
        prompt: expect.stringContaining('1536x1024'),
      }),
    );
    expect(gatewayVideoMock).toHaveBeenCalledWith('bytedance/seedance-2.0');

    const generateVideoCall = experimentalGenerateVideoMock.mock.calls[0]?.[0];
    expect(generateVideoCall.aspectRatio).toBe('16:9');
    expect(generateVideoCall.duration).toBe(8);
    expect(generateVideoCall.prompt).toEqual(
      expect.stringContaining('Use [Image 2] only as the animation sheet'),
    );
    expect(generateVideoCall.prompt).toEqual(
      expect.stringContaining('non-logo [Image 2] annotation artifacts'),
    );
    expect(generateVideoCall.providerOptions.bytedance).toEqual(
      expect.objectContaining({
        referenceImages: [
          'https://cdn.test/logo.png',
          'https://cdn.test/animations/domain/sheet.png',
        ],
        watermark: false,
        generateAudio: false,
        pollTimeoutMs: 600_000,
      }),
    );
    expect(generateVideoCall.providerOptions.bytedance).not.toHaveProperty(
      'cameraFixed',
    );
    expect(generateVideoCall.providerOptions.bytedance).not.toHaveProperty(
      'lastFrameImage',
    );
    expect(result.animationSheet).toEqual(
      expect.objectContaining({
        storagePath: 'animations/domain/sheet.png',
        url: 'https://cdn.test/animations/domain/sheet.png',
        model: 'gpt-image-2',
      }),
    );
    expect(result.video.thumbnailStoragePath).toBe(
      'animations/domain/video.mp4',
    );
  });

  it('rejects invalid cross-mode combinations', async () => {
    await expect(
      runLogoAnimationWorkflow({
        mode: 'looped',
        domain: 'example.com',
        referenceLogoUrl: 'https://cdn.test/logo.png',
        motionPreset: 'light-sweep',
        motionIntensity: 'subtle',
        model: 'veo-3.1-generate-preview',
        storage,
      } as never),
    ).rejects.toThrow(invalidOptionErrorPattern);

    await expect(
      runLogoAnimationWorkflow({
        mode: 'sheet-guided',
        domain: 'example.com',
        referenceLogoUrl: 'https://cdn.test/logo.png',
        motionPreset: 'orbital-reveal',
        model: 'bytedance/seedance-2.0',
        sheetModel: 'gpt-image-2',
        storage,
      } as never),
    ).rejects.toThrow(unrecognizedKeyErrorPattern);
  });

  it('cleans up uploaded assets when a later cinematic upload fails', async () => {
    experimentalGenerateVideoMock.mockResolvedValue({
      video: { uint8Array: new Uint8Array([1, 2, 3]) },
      warnings: [],
      providerMetadata: {},
    });
    uploadFileToS3Mock
      .mockResolvedValueOnce({ key: 'animations/domain/video.mp4' })
      .mockRejectedValueOnce(new Error('thumbnail upload failed'));

    await expect(
      runLogoAnimationWorkflow({
        mode: 'cinematic',
        domain: 'example.com',
        referenceLogoUrl: 'https://cdn.test/logo.png',
        motionPreset: 'let-ai-choose',
        model: 'veo-3.1-generate-preview',
        storage,
      }),
    ).rejects.toThrow('thumbnail upload failed');

    expect(deleteFileFromS3Mock).toHaveBeenCalledWith({
      bucketName: 'test-bucket',
      key: 'animations/domain/video.mp4',
      s3Client: storage.s3Client,
    });
  });
});
