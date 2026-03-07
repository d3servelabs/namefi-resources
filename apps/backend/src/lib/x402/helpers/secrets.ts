import { secrets } from '#lib/env';

export function resolveX402PaymentPayloadEncryptionPrivateKey(options?: {
  onMissing?: () => Error;
}): string {
  const privateKey =
    secrets.X402_PAYMENT_PAYLOAD_ENCRYPTION_PRIVATE_KEY ??
    secrets.X402_SIGNER_PRIVATE_KEY ??
    secrets.X402_SIGNER_MNEMONIC;

  if (!privateKey) {
    if (options?.onMissing) {
      throw options.onMissing();
    }

    throw new Error('x402 payment payload encryption key is not configured');
  }

  return privateKey;
}
