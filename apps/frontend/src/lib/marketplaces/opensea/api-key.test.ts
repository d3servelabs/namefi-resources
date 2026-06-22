import { afterEach, describe, expect, it, vi } from 'vitest';

const { requestInstantApiKeyMock } = vi.hoisted(() => ({
  requestInstantApiKeyMock: vi.fn(),
}));

// api-key.ts only touches the SDK's static `requestInstantApiKey`. localStorage
// is unavailable in the node test env, so the cache path is naturally skipped.
vi.mock('@opensea/sdk/viem', () => ({
  OpenSeaSDK: { requestInstantApiKey: requestInstantApiKeyMock },
}));

import { getOrRequestApiKey } from './api-key';

const BASE = 'https://api.opensea.io';
const future = () =>
  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

afterEach(() => {
  requestInstantApiKeyMock.mockReset();
});

describe('getOrRequestApiKey', () => {
  it('returns the freshly-issued instant key on success', async () => {
    requestInstantApiKeyMock.mockResolvedValue({
      api_key: 'k1',
      expires_at: future(),
    });
    expect(await getOrRequestApiKey(BASE)).toBe('k1');
    expect(requestInstantApiKeyMock).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry a 429 (issuance cap) and yields no key', async () => {
    requestInstantApiKeyMock.mockRejectedValue(
      new Error('Server Error (429): Too Many Requests'),
    );
    expect(await getOrRequestApiKey(BASE)).toBeUndefined();
    // Retrying a rate-limited endpoint only burns more against the cap.
    expect(requestInstantApiKeyMock).toHaveBeenCalledTimes(1);
  });

  it('retries once on a transient error, then succeeds', async () => {
    requestInstantApiKeyMock
      .mockRejectedValueOnce(new Error('network timeout'))
      .mockResolvedValueOnce({ api_key: 'k2', expires_at: future() });
    expect(await getOrRequestApiKey(BASE)).toBe('k2');
    expect(requestInstantApiKeyMock).toHaveBeenCalledTimes(2);
  });

  it('falls back to the configured key when issuance fails', async () => {
    requestInstantApiKeyMock.mockRejectedValue(
      new Error('Server Error (429): Too Many Requests'),
    );
    expect(await getOrRequestApiKey(BASE, 'env-dev-key')).toBe('env-dev-key');
  });

  it('returns a freshly-issued key even when expires_at is unparseable', async () => {
    requestInstantApiKeyMock.mockResolvedValue({
      api_key: 'k3',
      expires_at: 'not-a-date',
    });
    expect(await getOrRequestApiKey(BASE)).toBe('k3');
  });
});
