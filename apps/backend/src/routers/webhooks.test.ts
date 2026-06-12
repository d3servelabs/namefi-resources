import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const signingKey = 'alchemy-webhook-signing-key';
const mockTriggerUpdateNamefiNftIndex = vi.fn();
const mockUpdateNamefiNftIndex = vi.fn();

vi.mock('#lib/env', () => ({
  secrets: {
    X_ALCHEMY_WEBHOOK_NFT_ACTIVITY_SIGNATURE: {
      8453: signingKey,
    },
  },
}));

vi.mock('../temporal/activities/mint/namefi-nft', () => ({
  updateNamefiNftIndex: mockUpdateNamefiNftIndex,
}));

vi.mock('../temporal/schedules/update-namefi-nft-index', () => ({
  triggerUpdateNamefiNftIndex: mockTriggerUpdateNamefiNftIndex,
}));

const { webhooksRouter } = await import('./webhooks');

const nftActivityBody = JSON.stringify({
  webhookId: 'webhook-1',
  id: 'event-1',
  createdAt: '2026-06-12T00:00:00.000Z',
  type: 'NFT_ACTIVITY',
  event: {
    network: 'BASE_MAINNET',
    activity: [],
  },
});

function signBody(body: string) {
  return createHmac('sha256', signingKey).update(body, 'utf8').digest('hex');
}

async function postNftActivity(signature: string) {
  return webhooksRouter.request('http://localhost/nft-activity', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-alchemy-signature': signature,
    },
    body: nftActivityBody,
  });
}

describe('webhooksRouter nft activity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTriggerUpdateNamefiNftIndex.mockResolvedValue(undefined);
    mockUpdateNamefiNftIndex.mockResolvedValue(undefined);
  });

  it('validates the Alchemy HMAC against the raw request body', async () => {
    const response = await postNftActivity(signBody(nftActivityBody));

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe('done');
    expect(mockTriggerUpdateNamefiNftIndex).toHaveBeenCalledTimes(1);
    expect(mockUpdateNamefiNftIndex).not.toHaveBeenCalled();
  });

  it('rejects malformed Alchemy signatures without updating the index', async () => {
    const response = await postNftActivity('not-a-hex-signature');

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toBe('Invalid Signature');
    expect(mockTriggerUpdateNamefiNftIndex).not.toHaveBeenCalled();
    expect(mockUpdateNamefiNftIndex).not.toHaveBeenCalled();
  });

  it('rejects signatures with a valid digest plus trailing junk', async () => {
    const response = await postNftActivity(`${signBody(nftActivityBody)}zz`);

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toBe('Invalid Signature');
    expect(mockTriggerUpdateNamefiNftIndex).not.toHaveBeenCalled();
    expect(mockUpdateNamefiNftIndex).not.toHaveBeenCalled();
  });
});
