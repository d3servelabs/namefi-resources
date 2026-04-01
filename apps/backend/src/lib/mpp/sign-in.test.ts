import { describe, expect, it } from 'vitest';
import {
  buildMppSignInPaymentRequiredResponse,
  type MppSignInPaymentRequiredMetadata,
} from './sign-in';

describe('buildMppSignInPaymentRequiredResponse', () => {
  it('preserves challenge headers and returns sign-in metadata', async () => {
    const challenge = new Response(null, {
      headers: {
        'WWW-Authenticate': 'Payment challenge',
      },
      status: 402,
    });

    const metadata: MppSignInPaymentRequiredMetadata = {
      acceptedCredentialTypes: ['transaction', 'hash'],
      action: 'sign-in',
      preferredMode: 'pull',
      warning: 'Push mode may spend gas before authentication completes.',
      zeroFeePreferred: true,
    };

    const response = buildMppSignInPaymentRequiredResponse({
      challenge,
      metadata,
    });

    expect(response.status).toBe(402);
    expect(response.headers.get('WWW-Authenticate')).toBe('Payment challenge');
    expect(await response.json()).toEqual({
      message: 'Payment Required',
      status: 402,
      ...metadata,
    });
  });
});
