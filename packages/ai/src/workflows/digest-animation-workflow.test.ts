import { beforeEach, describe, expect, it, vi } from 'vitest';

const createOpenAIMock = vi.fn();
const imageGenerationToolMock = vi.fn();
const createGoogleGenerativeAIMock = vi.fn();
const googleVideoMock = vi.fn();
const createGatewayMock = vi.fn();
const gatewayVideoMock = vi.fn();
const experimentalGenerateVideoMock = vi.fn();
const digestAnimationSheetGenerateMock = vi.fn();
const toolLoopAgentMock = vi.fn(() => ({
  generate: digestAnimationSheetGenerateMock,
}));
const downloadFileFromS3Mock = vi.fn();
const uploadFileToS3Mock = vi.fn();

const onePixelPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg==';

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: createOpenAIMock,
}));

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: createGoogleGenerativeAIMock,
}));

vi.mock('ai', () => ({
  createGateway: createGatewayMock,
  experimental_generateVideo: experimentalGenerateVideoMock,
  ToolLoopAgent: toolLoopAgentMock,
}));

vi.mock('@namefi-astra/storage', () => ({
  downloadFileFromS3: downloadFileFromS3Mock,
  generateCloudFrontUrl: ({
    cloudfrontDomain,
    s3Key,
  }: {
    cloudfrontDomain: string;
    s3Key: string;
  }) => `https://${cloudfrontDomain}/${s3Key}`,
  uploadFileToS3: uploadFileToS3Mock,
}));

vi.mock('../env', () => ({
  secrets: {
    AI_GATEWAY_API_KEY: 'test-gateway-key',
    GEMINI_API_KEY: 'test-gemini-key',
    OPENAI_API_KEY: 'test-openai-key',
  },
}));

const openAIModelMock = vi.fn((model: string) => `mock-openai-${model}`);
Object.assign(openAIModelMock, {
  tools: {
    imageGeneration: imageGenerationToolMock,
  },
});

createOpenAIMock.mockReturnValue(openAIModelMock);
googleVideoMock.mockReturnValue('mock-google-video-model');
gatewayVideoMock.mockReturnValue('mock-gateway-video-model');
createGoogleGenerativeAIMock.mockReturnValue({
  video: googleVideoMock,
});
createGatewayMock.mockReturnValue({
  video: gatewayVideoMock,
});
imageGenerationToolMock.mockReturnValue('mock-image-generation-tool');

const { runDigestAnimationWorkflowFromUploadedSource } = await import(
  './digest-animation-workflow'
);

const storage = {
  bucketName: 'test-bucket',
  cloudfrontDomain: 'cdn.test',
  s3Client: {} as never,
  baseFolder: 'digest',
};

describe('runDigestAnimationWorkflowFromUploadedSource', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    googleVideoMock.mockReturnValue('mock-google-video-model');
    gatewayVideoMock.mockReturnValue('mock-gateway-video-model');
    experimentalGenerateVideoMock.mockResolvedValue({
      video: { uint8Array: new Uint8Array([1, 2, 3]) },
      warnings: [],
      providerMetadata: { provider: 'google' },
    });
    digestAnimationSheetGenerateMock.mockResolvedValue({
      staticToolResults: [
        {
          toolName: 'image_generation',
          output: { result: onePixelPngBase64 },
        },
      ],
      totalUsage: {
        inputTokens: 10,
        outputTokens: 2,
        totalTokens: 12,
      },
    });
    uploadFileToS3Mock
      .mockResolvedValueOnce({ key: 'digest/sales-digest/sheet.png' })
      .mockResolvedValueOnce({ key: 'digest/sales-digest/video.mp4' });
  });

  it('routes Gemini Omni digest animations through Google with source and sheet references', async () => {
    const sourceImageBytes = Buffer.from('source-image');
    downloadFileFromS3Mock.mockResolvedValue({
      bytes: sourceImageBytes,
      contentType: 'image/webp',
    });

    const result = await runDigestAnimationWorkflowFromUploadedSource({
      title: 'Daily domain digest',
      sourceImage: {
        storagePath: 'digest/sales-digest/source.webp',
        mimeType: 'image/webp',
      },
      domains: ['example.com', 'namefi.io'],
      summary: 'Two featured domains.',
      model: 'gemini-omni-flash',
      sheetModel: 'gpt-image-2',
      storage,
    });

    expect(googleVideoMock).toHaveBeenCalledWith('gemini-omni-flash');
    expect(gatewayVideoMock).not.toHaveBeenCalled();

    const generateVideoCall = experimentalGenerateVideoMock.mock.calls[0]?.[0];
    expect(generateVideoCall.model).toBe('mock-google-video-model');
    expect(generateVideoCall.providerOptions).toEqual({
      google: {
        pollTimeoutMs: 900_000,
        referenceImages: [
          {
            image: {
              bytesBase64Encoded: sourceImageBytes.toString('base64'),
              mimeType: 'image/webp',
            },
            referenceType: 'asset',
          },
          {
            image: {
              bytesBase64Encoded: onePixelPngBase64,
              mimeType: 'image/png',
            },
            referenceType: 'asset',
          },
        ],
      },
    });
    expect(generateVideoCall.providerOptions).not.toHaveProperty('bytedance');
    expect(result.video).toEqual(
      expect.objectContaining({
        storagePath: 'digest/sales-digest/video.mp4',
        model: 'gemini-omni-flash',
        mimeType: 'video/mp4',
      }),
    );
  });
});
