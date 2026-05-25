import { createHash } from 'node:crypto';
import { WorkflowNotFoundError } from '@temporalio/common';
import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockLogger = {
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};
const mockDb = {
  insert: vi.fn(),
  select: vi.fn(),
};
const mockUploadDigestAnimationSourceImage = vi.fn();
const mockCreateS3Client = vi.fn(() => ({ s3: 'client' }));
const mockDeleteFileFromS3 = vi.fn();
const mockGenerateUrlFromStoragePath = vi.fn(
  (storagePath: string, cloudfrontDomain: string) =>
    `https://${cloudfrontDomain}/${storagePath}`,
);
const mockWorkflowStart = vi.fn();
const mockWorkflowGetHandle = vi.fn();

vi.mock('#lib/env', () => ({
  config: {
    AI_BUCKET_FOLDERS: {
      ANIMATIONS: 'animations',
      LOGOS: 'logos',
    },
    AWS_REGION: 'us-east-1',
    CLOUD_FRONT_DOMAIN: 'cdn.test',
    STORAGE_BUCKET: 'test-bucket',
  },
  secrets: {
    API_AUTH_KEY: 'test-api-key',
    AWS_ACCESS_KEY_ID: 'test-access-key',
    AWS_SECRET_ACCESS_KEY: 'test-secret-key',
  },
}));

vi.mock('#lib/logger', () => ({
  createLogger: () => mockLogger,
}));

vi.mock('@namefi-astra/db', () => ({
  db: mockDb,
  publicAiGenerationsTable: {},
}));

vi.mock('@namefi-astra/ai', () => ({
  DIGEST_ANIMATION_MODEL_IDS: [
    'bytedance/seedance-2.0',
    'bytedance/seedance-2.0-fast',
    'gemini-omni-flash',
  ],
  DIGEST_ANIMATION_SHEET_MODEL_IDS: ['gpt-image-2'],
  LOGO_STYLE_INPUT_IDS: ['let-ai-choose'],
  LOGO_TEXT_TREATMENT_INPUT_IDS: ['let-ai-choose'],
  LOGO_TYPE_INPUT_IDS: ['let-ai-choose'],
  LOGO_TYPOGRAPHY_INPUT_IDS: ['let-ai-choose'],
  runLogoWorkflow: vi.fn(),
  uploadDigestAnimationSourceImage: mockUploadDigestAnimationSourceImage,
}));

vi.mock('@namefi-astra/storage', () => ({
  createS3Client: mockCreateS3Client,
  deleteFileFromS3: mockDeleteFileFromS3,
  generateUrlFromStoragePath: mockGenerateUrlFromStoragePath,
}));

vi.mock('#temporal/client', () => ({
  temporalClient: {
    workflow: {
      getHandle: mockWorkflowGetHandle,
      start: mockWorkflowStart,
    },
  },
}));

vi.mock('#temporal/shared', () => ({
  TEMPORAL_QUEUES: {
    DEFAULT: 'default',
  },
}));

vi.mock('#temporal/workflows/public-digest-animation.workflow', () => ({
  generatePublicDigestAnimationWorkflow: vi.fn(),
}));

const { publicAiRouter } = await import('./public-ai');

const workflowNotFound = (workflowId: string) =>
  new WorkflowNotFoundError('Workflow not found', workflowId, undefined);

const validDigestBody = {
  externalUserId: 'user-1',
  title: 'Daily Namefi Feed sales digest',
  imageDataUrl: 'data:image/png;base64,ZmFrZQ==',
  domains: ['example.com'],
  summary: 'Summary',
  model: 'bytedance/seedance-2.0',
  sheetModel: 'gpt-image-2',
};

type DigestTestApp = {
  request: (
    input: string | URL | Request,
    init?: RequestInit,
  ) => Response | Promise<Response>;
};

function createRouterApp(requestId = 'request-1'): DigestTestApp {
  const app = new Hono<{ Variables: { requestId: string } }>();
  app.use('*', async (c, next) => {
    c.set('requestId', requestId);
    await next();
  });
  const router = app as unknown as {
    route: (path: string, target: unknown) => void;
    request: DigestTestApp['request'];
  };
  router.route('/', publicAiRouter);
  return router;
}

function digestDescription({
  status = 'RUNNING',
  externalUserId = 'user-1',
  storagePath = 'animations/sales-digest/source-existing',
  mimeType = 'image/png',
}: {
  status?: string;
  externalUserId?: string;
  storagePath?: string;
  mimeType?: string;
} = {}) {
  return {
    status: { name: status },
    memo: {
      externalUserId,
      sourceImageMimeType: mimeType,
      sourceImageStoragePath: storagePath,
    },
  };
}

function mockTemporalHandle({
  describe,
  result,
}: {
  describe: ReturnType<typeof vi.fn>;
  result?: ReturnType<typeof vi.fn>;
}) {
  const handle = {
    describe,
    result: result ?? vi.fn(),
  };
  mockWorkflowGetHandle.mockReturnValue(handle);
  return handle;
}

async function postDigestAnimation(app: DigestTestApp, body = validDigestBody) {
  return app.request('http://localhost/generate-digest-animation', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': 'test-api-key',
    },
    body: JSON.stringify(body),
  });
}

async function getDigestAnimation(
  app: DigestTestApp,
  jobId: string,
  externalUserId: string,
) {
  return app.request(
    `http://localhost/generate-digest-animation/${jobId}?externalUserId=${externalUserId}`,
    {
      headers: {
        'x-api-key': 'test-api-key',
      },
    },
  );
}

describe('publicAiRouter digest animation workflow lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUploadDigestAnimationSourceImage.mockResolvedValue({
      storagePath: 'animations/sales-digest/source-new',
      url: 'https://cdn.test/animations/sales-digest/source-new',
      mimeType: 'image/png',
    });
    mockWorkflowStart.mockResolvedValue({});
  });

  it('normalizes unsafe request IDs and starts a durable workflow', async () => {
    const requestId = 'unsafe request id';
    const expectedJobId = `req-${createHash('sha256')
      .update(requestId)
      .digest('base64url')}`;
    const expectedWorkflowId = `public-digest-animation-${expectedJobId}`;
    mockTemporalHandle({
      describe: vi.fn().mockRejectedValue(workflowNotFound(expectedWorkflowId)),
    });

    const response = await postDigestAnimation(createRouterApp(requestId));
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toMatchObject({
      id: expectedJobId,
      workflowId: expectedWorkflowId,
      status: 'processing',
      sourceImageStoragePath: 'animations/sales-digest/source-new',
    });
    expect(mockWorkflowStart).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        workflowId: expectedWorkflowId,
        memo: expect.objectContaining({
          externalUserId: 'user-1',
          sourceImageMimeType: 'image/png',
          sourceImageStoragePath: 'animations/sales-digest/source-new',
        }),
      }),
    );
  });

  it('accepts Gemini Omni for public digest animation workflows', async () => {
    mockTemporalHandle({
      describe: vi
        .fn()
        .mockRejectedValue(
          workflowNotFound('public-digest-animation-request-gemini'),
        ),
    });

    const response = await postDigestAnimation(
      createRouterApp('request-gemini'),
      {
        ...validDigestBody,
        model: 'gemini-omni-flash',
      },
    );

    expect(response.status).toBe(202);
    expect(mockWorkflowStart).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        args: [
          expect.objectContaining({
            model: 'gemini-omni-flash',
            sheetModel: 'gpt-image-2',
          }),
        ],
      }),
    );
  });

  it('returns an existing same-owner workflow without uploading again', async () => {
    mockTemporalHandle({
      describe: vi.fn().mockResolvedValue(
        digestDescription({
          storagePath: 'animations/sales-digest/source-existing',
        }),
      ),
    });

    const response = await postDigestAnimation(createRouterApp('request-1'));
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toMatchObject({
      id: 'request-1',
      workflowId: 'public-digest-animation-request-1',
      sourceImageUrl:
        'https://cdn.test/animations/sales-digest/source-existing',
      sourceImageStoragePath: 'animations/sales-digest/source-existing',
      sourceImageMimeType: 'image/png',
    });
    expect(mockUploadDigestAnimationSourceImage).not.toHaveBeenCalled();
    expect(mockWorkflowStart).not.toHaveBeenCalled();
  });

  it('does not reuse an existing workflow owned by another user', async () => {
    mockTemporalHandle({
      describe: vi.fn().mockResolvedValue(
        digestDescription({
          externalUserId: 'user-2',
        }),
      ),
    });

    const response = await postDigestAnimation(createRouterApp('request-1'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: 'Not Found' });
    expect(mockUploadDigestAnimationSourceImage).not.toHaveBeenCalled();
    expect(mockWorkflowStart).not.toHaveBeenCalled();
    expect(mockDeleteFileFromS3).not.toHaveBeenCalled();
  });

  it('returns an existing completed result without relabeling it as processing', async () => {
    mockTemporalHandle({
      describe: vi.fn().mockResolvedValue(
        digestDescription({
          status: 'COMPLETED',
        }),
      ),
      result: vi.fn().mockResolvedValue({
        id: 'request-1',
        externalUserId: 'user-1',
        type: 'digest_animation',
        url: 'https://cdn.test/animations/sales-digest/video.mp4',
      }),
    });

    const response = await postDigestAnimation(createRouterApp('request-1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      id: 'request-1',
      externalUserId: 'user-1',
      status: 'succeeded',
      workflowStatus: 'COMPLETED',
      url: 'https://cdn.test/animations/sales-digest/video.mp4',
    });
    expect(mockUploadDigestAnimationSourceImage).not.toHaveBeenCalled();
    expect(mockWorkflowStart).not.toHaveBeenCalled();
  });

  it('starts a new workflow when the previous same-owner workflow failed', async () => {
    mockTemporalHandle({
      describe: vi.fn().mockResolvedValue(
        digestDescription({
          status: 'FAILED',
        }),
      ),
    });

    const response = await postDigestAnimation(createRouterApp('request-1'));
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toMatchObject({
      status: 'processing',
      sourceImageStoragePath: 'animations/sales-digest/source-new',
    });
    expect(mockUploadDigestAnimationSourceImage).toHaveBeenCalledTimes(1);
    expect(mockWorkflowStart).toHaveBeenCalledTimes(1);
  });

  it('cleans up the losing upload and returns canonical metadata after a start conflict', async () => {
    const workflowId = 'public-digest-animation-request-1';
    mockTemporalHandle({
      describe: vi
        .fn()
        .mockRejectedValueOnce(workflowNotFound(workflowId))
        .mockResolvedValueOnce(
          digestDescription({
            storagePath: 'animations/sales-digest/source-winner',
          }),
        ),
    });
    mockWorkflowStart.mockRejectedValueOnce(
      new Error('Workflow already exists'),
    );

    const response = await postDigestAnimation(createRouterApp('request-1'));
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toMatchObject({
      sourceImageUrl: 'https://cdn.test/animations/sales-digest/source-winner',
      sourceImageStoragePath: 'animations/sales-digest/source-winner',
    });
    expect(mockDeleteFileFromS3).toHaveBeenCalledWith({
      s3Client: { s3: 'client' },
      bucketName: 'test-bucket',
      key: 'animations/sales-digest/source-new',
    });
  });

  it('keeps the uploaded source when a start conflict describes the same source', async () => {
    const workflowId = 'public-digest-animation-request-1';
    mockTemporalHandle({
      describe: vi
        .fn()
        .mockRejectedValueOnce(workflowNotFound(workflowId))
        .mockResolvedValueOnce(
          digestDescription({
            storagePath: 'animations/sales-digest/source-new',
          }),
        ),
    });
    mockWorkflowStart.mockRejectedValueOnce(
      new Error('Workflow already exists'),
    );

    const response = await postDigestAnimation(createRouterApp('request-1'));
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toMatchObject({
      sourceImageUrl: 'https://cdn.test/animations/sales-digest/source-new',
      sourceImageStoragePath: 'animations/sales-digest/source-new',
    });
    expect(mockDeleteFileFromS3).not.toHaveBeenCalled();
  });

  it('cleans up the uploaded source when start fails without a surviving workflow', async () => {
    const workflowId = 'public-digest-animation-request-1';
    mockTemporalHandle({
      describe: vi.fn().mockRejectedValue(workflowNotFound(workflowId)),
    });
    mockWorkflowStart.mockRejectedValueOnce(new Error('temporal unavailable'));

    const response = await postDigestAnimation(createRouterApp('request-1'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: 'Internal Server Error',
      message: 'Failed to start digest animation',
    });
    expect(mockDeleteFileFromS3).toHaveBeenCalledWith({
      s3Client: { s3: 'client' },
      bucketName: 'test-bucket',
      key: 'animations/sales-digest/source-new',
    });
  });

  it('returns 404 and cleans up the losing upload after a start conflict owned by another user', async () => {
    const workflowId = 'public-digest-animation-request-1';
    mockTemporalHandle({
      describe: vi
        .fn()
        .mockRejectedValueOnce(workflowNotFound(workflowId))
        .mockResolvedValueOnce(
          digestDescription({
            externalUserId: 'user-2',
            storagePath: 'animations/sales-digest/source-winner',
          }),
        ),
    });
    mockWorkflowStart.mockRejectedValueOnce(
      new Error('Workflow already exists'),
    );

    const response = await postDigestAnimation(createRouterApp('request-1'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: 'Not Found' });
    expect(mockUploadDigestAnimationSourceImage).toHaveBeenCalledTimes(1);
    expect(mockWorkflowStart).toHaveBeenCalledTimes(1);
    expect(mockDeleteFileFromS3).toHaveBeenCalledWith({
      s3Client: { s3: 'client' },
      bucketName: 'test-bucket',
      key: 'animations/sales-digest/source-new',
    });
  });

  it('returns a completed result after a start conflict with a completed workflow', async () => {
    const workflowId = 'public-digest-animation-request-1';
    mockTemporalHandle({
      describe: vi
        .fn()
        .mockRejectedValueOnce(workflowNotFound(workflowId))
        .mockResolvedValueOnce(
          digestDescription({
            status: 'COMPLETED',
            storagePath: 'animations/sales-digest/source-winner',
          }),
        ),
      result: vi.fn().mockResolvedValue({
        id: 'request-1',
        externalUserId: 'user-1',
        type: 'digest_animation',
        url: 'https://cdn.test/animations/sales-digest/video.mp4',
      }),
    });
    mockWorkflowStart.mockRejectedValueOnce(
      new Error('Workflow already exists'),
    );

    const response = await postDigestAnimation(createRouterApp('request-1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      id: 'request-1',
      status: 'succeeded',
      workflowStatus: 'COMPLETED',
      url: 'https://cdn.test/animations/sales-digest/video.mp4',
    });
    expect(mockDeleteFileFromS3).toHaveBeenCalledWith({
      s3Client: { s3: 'client' },
      bucketName: 'test-bucket',
      key: 'animations/sales-digest/source-new',
    });
  });

  it('does not leak running workflow status to a different external user', async () => {
    mockTemporalHandle({
      describe: vi.fn().mockResolvedValue(
        digestDescription({
          externalUserId: 'user-1',
          status: 'RUNNING',
        }),
      ),
      result: vi.fn(),
    });

    const response = await getDigestAnimation(
      createRouterApp(),
      'request-1',
      'user-2',
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: 'Not Found' });
  });

  it('returns failed workflow errors only for the owner', async () => {
    const result = vi.fn().mockRejectedValue(new Error('provider timeout'));
    mockTemporalHandle({
      describe: vi.fn().mockResolvedValue(
        digestDescription({
          status: 'FAILED',
        }),
      ),
      result,
    });

    const response = await getDigestAnimation(
      createRouterApp(),
      'request-1',
      'user-1',
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      id: 'request-1',
      workflowId: 'public-digest-animation-request-1',
      status: 'failed',
      workflowStatus: 'FAILED',
      error: 'provider timeout',
    });
  });

  it('keeps the completed result ownership check as a second guard', async () => {
    const result = vi.fn().mockResolvedValue({
      externalUserId: 'user-2',
    });
    mockTemporalHandle({
      describe: vi.fn().mockResolvedValue(
        digestDescription({
          externalUserId: 'user-1',
          status: 'COMPLETED',
        }),
      ),
      result,
    });

    const response = await getDigestAnimation(
      createRouterApp(),
      'request-1',
      'user-1',
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: 'Not Found' });
  });

  it('returns 404 when the workflow does not exist', async () => {
    const workflowId = 'public-digest-animation-missing';
    mockTemporalHandle({
      describe: vi.fn().mockRejectedValue(workflowNotFound(workflowId)),
    });

    const response = await getDigestAnimation(
      createRouterApp(),
      'missing',
      'user-1',
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: 'Not Found' });
  });
});
