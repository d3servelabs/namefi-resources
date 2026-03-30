import { describe, expect, it } from 'vitest';
import { checksumWalletAddressSchema } from '@namefi-astra/utils';
import { createApiAuthJwt, verifyApiAuthJwt } from './jwt';

describe('createApiAuthJwt', () => {
  it('creates and verifies a JWT roundtrip', async () => {
    const jwt = await createApiAuthJwt({
      chain: 'eip155:1',
      userId: '202832e8-304f-4f4a-81c9-df32fd1e5364',
      walletAddress: checksumWalletAddressSchema.parse(
        '0x0000000000000000000000000000000000000001',
      ),
    });

    const verificationResult = await verifyApiAuthJwt(jwt.token);

    expect(verificationResult.valid).toBe(true);
    if (!verificationResult.valid) {
      return;
    }

    expect(verificationResult.payload.userId).toBe(
      '202832e8-304f-4f4a-81c9-df32fd1e5364',
    );
    expect(verificationResult.payload.walletAddress).toBe(
      '0x0000000000000000000000000000000000000001',
    );
    expect(verificationResult.payload.chain).toBe('eip155:1');
  });

  it('rejects malformed tokens', async () => {
    const verificationResult = await verifyApiAuthJwt('not-a-jwt');

    expect(verificationResult.valid).toBe(false);
  });
});
