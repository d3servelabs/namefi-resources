import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isAllowedSalesDigestRemoteImageUrl,
  loadSalesDigestImageAttachment,
} from './digest-media.service';

describe('sales digest remote logo safety', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('rejects loopback and link-local URLs before DNS lookup', async () => {
    await expect(
      isAllowedSalesDigestRemoteImageUrl('https://127.0.0.1/logo.png'),
    ).resolves.toBe(false);
    await expect(
      isAllowedSalesDigestRemoteImageUrl(
        'https://169.254.169.254/latest/meta-data',
      ),
    ).resolves.toBe(false);
  });

  it('rejects trusted hosts that resolve to private addresses', async () => {
    await expect(
      isAllowedSalesDigestRemoteImageUrl(
        'https://pbs.twimg.com/profile_images/logo.png',
        async () => [{ address: '10.0.0.4', family: 4 }],
      ),
    ).resolves.toBe(false);
  });

  it('does not follow redirects from trusted logo URLs', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(null, {
        headers: {
          location: 'http://169.254.169.254/latest/meta-data',
        },
        status: 302,
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const loaded = await loadSalesDigestImageAttachment(
      {
        kind: 'top_pick_logo',
        altText: 'Example logo',
        caption: 'Example logo',
        domain: 'example.com',
        filenameBase: 'example-logo',
        logoUrl: 'https://pbs.twimg.com/profile_images/logo.png',
        rank: 1,
        title: 'Example logo',
      },
      {
        lookupHostname: async () => [{ address: '93.184.216.34', family: 4 }],
      },
    );

    expect(loaded).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://pbs.twimg.com/profile_images/logo.png',
      expect.objectContaining({ redirect: 'manual' }),
    );
  });
});
