import { beforeEach, describe, expect, it, vi } from 'vitest';

const createGoogleGenerativeAIMock = vi.fn();
const googleVideoMock = vi.fn();
const experimentalGenerateVideoMock = vi.fn();
const uploadFileToS3Mock = vi.fn();
const deleteFileFromS3Mock = vi.fn();
const fetchImageAsBufferMock = vi.fn();
const generateAnimationStrategyMock = vi.fn();

const onePixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg==',
  'base64',
);

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: createGoogleGenerativeAIMock,
}));

vi.mock('ai', () => ({
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
  generateAnimationStrategy: generateAnimationStrategyMock,
}));

vi.mock('../env', () => ({
  secrets: {
    GEMINI_API_KEY: 'test-gemini-key',
  },
}));

googleVideoMock.mockReturnValue('mock-google-video-model');
createGoogleGenerativeAIMock.mockReturnValue({
  video: googleVideoMock,
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
    createGoogleGenerativeAIMock.mockReturnValue({
      video: googleVideoMock,
    });
    experimentalGenerateVideoMock.mockReset();
    fetchImageAsBufferMock.mockReset();
    fetchImageAsBufferMock.mockResolvedValue(onePixelPng);
    generateAnimationStrategyMock.mockReset();
    generateAnimationStrategyMock.mockResolvedValue({
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
    uploadFileToS3Mock.mockReset();
    deleteFileFromS3Mock.mockResolvedValue(undefined);
  });

  it('forwards abort signals to image fetch and video generation', async () => {
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
    expect(generateAnimationStrategyMock).toHaveBeenCalledWith(
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

  it('does not upload assets before video generation succeeds', async () => {
    experimentalGenerateVideoMock.mockRejectedValue(
      new Error('provider request failed'),
    );

    await expect(
      runLogoAnimationWorkflow({
        domain: 'example.com',
        referenceLogoUrl: 'https://cdn.test/logo.png',
        motionPreset: 'let-ai-choose',
        model: 'veo-3.1-generate-preview',
        storage,
      }),
    ).rejects.toThrow('provider request failed');

    expect(uploadFileToS3Mock).not.toHaveBeenCalled();
    expect(deleteFileFromS3Mock).not.toHaveBeenCalled();
  });

  it('deletes already-uploaded assets when a later upload fails', async () => {
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
        domain: 'example.com',
        referenceLogoUrl: 'https://cdn.test/logo.png',
        motionPreset: 'let-ai-choose',
        model: 'veo-3.1-generate-preview',
        storage,
      }),
    ).rejects.toThrow('thumbnail upload failed');

    expect(deleteFileFromS3Mock).toHaveBeenCalledTimes(1);
    expect(deleteFileFromS3Mock).toHaveBeenCalledWith({
      bucketName: 'test-bucket',
      key: 'animations/domain/video.mp4',
      s3Client: storage.s3Client,
    });
  });
});
