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
const invalidOptionErrorPattern = /Invalid option/;

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
  deleteFileFromS3: deleteFileFromS3Mock,
  generateCloudFrontUrl: ({
    cloudfrontDomain,
    s3Key,
  }: {
    cloudfrontDomain: string;
    s3Key: string;
  }) => `https://${cloudfrontDomain}/${s3Key}`,
  uploadFileToS3: uploadFileToS3Mock,
}));

vi.mock('../utils/images', () => ({
  fetchImageAsBuffer: fetchImageAsBufferMock,
}));

vi.mock('../agents/strategists', () => ({
  generateCinematicAnimationStrategy: generateCinematicAnimationStrategyMock,
  generateLoopedAnimationStrategy: generateLoopedAnimationStrategyMock,
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
