import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockLogger = {
  assign: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  trace: vi.fn(),
};

vi.mock('#lib/logger', () => ({
  createLogger: () => mockLogger,
  logger: mockLogger,
}));

const { createNsJsonHandlerRouter } = await import('./json');

describe('createNsJsonHandlerRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a health check response', async () => {
    const router = createNsJsonHandlerRouter({
      dnsRequestHandler: {
        handle: vi.fn(),
      },
    });

    const response = await router.request('http://localhost/healthz');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ message: 'OK' });
  });

  it('returns 412 when the query is invalid', async () => {
    const handle = vi.fn();
    const router = createNsJsonHandlerRouter({
      dnsRequestHandler: { handle },
    });

    const response = await router.request(
      'http://localhost/?name=localhost&type=1',
    );
    const body = await response.json();

    expect(response.status).toBe(412);
    expect(body).toEqual({
      error: 'Precondition Failed',
      message: expect.stringContaining('Invalid parameters'),
    });
    expect(handle).not.toHaveBeenCalled();
  });

  it('delegates SIG queries to the injected handler', async () => {
    const handle = vi.fn().mockResolvedValue({
      RCODE: 0,
      Answer: [],
    });
    const router = createNsJsonHandlerRouter({
      dnsRequestHandler: { handle },
    });

    const response = await router.request(
      'http://localhost/?name=example.com.&type=24',
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      RCODE: 0,
      Answer: [],
    });
    expect(handle).toHaveBeenCalledWith(
      expect.objectContaining({
        recordName: 'example.com',
        recordType: 'SIG',
        wildcard: false,
      }),
    );
  });

  it('delegates valid questions to the injected handler', async () => {
    const handle = vi.fn().mockResolvedValue({
      RCODE: 0,
      Answer: [
        {
          name: 'example.com',
          type: 1,
          TTL: 300,
          data: '1.1.1.1',
        },
      ],
    });
    const router = createNsJsonHandlerRouter({
      dnsRequestHandler: { handle },
    });

    const response = await router.request(
      'http://localhost/?name=example.com.&type=1',
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(handle).toHaveBeenCalledWith(
      expect.objectContaining({
        recordName: 'example.com',
        recordType: 'A',
        wildcard: false,
      }),
    );
    expect(body).toEqual({
      RCODE: 0,
      Answer: [
        {
          name: 'example.com',
          type: 1,
          TTL: 300,
          data: '1.1.1.1',
        },
      ],
    });
  });

  it('returns the fallback 404 response for unknown paths', async () => {
    const router = createNsJsonHandlerRouter({
      dnsRequestHandler: {
        handle: vi.fn(),
      },
    });

    const response = await router.request('http://localhost/missing');
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: 'Not Found',
      message: 'The requested endpoint does not exist',
    });
  });
});
