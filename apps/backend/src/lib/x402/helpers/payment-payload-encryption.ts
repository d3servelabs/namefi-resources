import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import type { PaymentPayload } from '@x402/hono';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_VERSION = 'v1' as const;
const ENCRYPTION_DELIMITER = '.';
const ENCRYPTION_IV_BYTES = 12;

type EncryptionVersion = typeof ENCRYPTION_VERSION;

const deriveEncryptionKey = (privateKey: string): Buffer => {
  if (!privateKey) {
    throw new Error(
      'Private key is required for x402 payment payload encryption',
    );
  }

  return createHash('sha256').update(privateKey, 'utf8').digest();
};

function encryptX402Value({
  plaintext,
  privateKey,
}: {
  plaintext: string;
  privateKey: string;
}): string {
  const key = deriveEncryptionKey(privateKey);
  const iv = randomBytes(ENCRYPTION_IV_BYTES);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    ENCRYPTION_VERSION,
    iv.toString('base64url'),
    authTag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join(ENCRYPTION_DELIMITER);
}

function parseEncryptedX402Value(encryptedValue: string): {
  version: EncryptionVersion;
  iv: Buffer;
  authTag: Buffer;
  ciphertext: Buffer;
} {
  if (!encryptedValue) {
    throw new Error('Encrypted x402 payload value is required');
  }

  const [version, ivBase64, authTagBase64, ciphertextBase64] =
    encryptedValue.split(ENCRYPTION_DELIMITER);

  if (
    !version ||
    !ivBase64 ||
    !authTagBase64 ||
    !ciphertextBase64 ||
    version !== ENCRYPTION_VERSION
  ) {
    throw new Error('Invalid encrypted x402 payload value format');
  }

  return {
    version,
    iv: Buffer.from(ivBase64, 'base64url'),
    authTag: Buffer.from(authTagBase64, 'base64url'),
    ciphertext: Buffer.from(ciphertextBase64, 'base64url'),
  };
}

function decryptX402Value({
  encryptedValue,
  privateKey,
}: {
  encryptedValue: string;
  privateKey: string;
}): string {
  const parsed = parseEncryptedX402Value(encryptedValue);
  const key = deriveEncryptionKey(privateKey);

  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, parsed.iv);
  decipher.setAuthTag(parsed.authTag);

  return Buffer.concat([
    decipher.update(parsed.ciphertext),
    decipher.final(),
  ]).toString('utf8');
}

function resolvePayloadRecord(
  paymentPayload: PaymentPayload,
): Record<string, unknown> {
  if (
    !paymentPayload.payload ||
    typeof paymentPayload.payload !== 'object' ||
    Array.isArray(paymentPayload.payload)
  ) {
    throw new Error('x402 payment payload is missing payload object');
  }

  return paymentPayload.payload as Record<string, unknown>;
}

function resolvePayloadSignature(paymentPayload: PaymentPayload): string {
  const payloadRecord = resolvePayloadRecord(paymentPayload);
  const signature = payloadRecord.signature;

  if (typeof signature !== 'string' || !signature) {
    throw new Error('x402 payment payload signature is required');
  }

  return signature;
}

function withPayloadSignature(
  paymentPayload: PaymentPayload,
  signature: string,
): PaymentPayload {
  const payloadRecord = resolvePayloadRecord(paymentPayload);

  return {
    ...paymentPayload,
    payload: {
      ...payloadRecord,
      signature,
    },
  } as PaymentPayload;
}

export function isEncryptedX402Value(value: string): boolean {
  try {
    parseEncryptedX402Value(value);
    return true;
  } catch {
    return false;
  }
}

export function hasEncryptedX402PaymentPayloadSignature(
  paymentPayload: PaymentPayload,
): boolean {
  try {
    const signature = resolvePayloadSignature(paymentPayload);
    return isEncryptedX402Value(signature);
  } catch {
    return false;
  }
}

export function encryptX402PaymentPayloadSignature({
  paymentPayload,
  privateKey,
}: {
  paymentPayload: PaymentPayload;
  privateKey: string;
}): {
  paymentPayload: PaymentPayload;
  paymentPayloadEncryptionVersion: EncryptionVersion;
} {
  const signature = resolvePayloadSignature(paymentPayload);
  const encryptedSignature = isEncryptedX402Value(signature)
    ? signature
    : encryptX402Value({
        plaintext: signature,
        privateKey,
      });

  return {
    paymentPayload: withPayloadSignature(paymentPayload, encryptedSignature),
    paymentPayloadEncryptionVersion: ENCRYPTION_VERSION,
  };
}

export function decryptX402PaymentPayloadSignature({
  paymentPayload,
  privateKey,
}: {
  paymentPayload: PaymentPayload;
  privateKey: string;
}): PaymentPayload {
  const signature = resolvePayloadSignature(paymentPayload);

  if (!isEncryptedX402Value(signature)) {
    return paymentPayload;
  }

  const decryptedSignature = decryptX402Value({
    encryptedValue: signature,
    privateKey,
  });

  return withPayloadSignature(paymentPayload, decryptedSignature);
}

export function encryptX402PaymentPayload({
  paymentPayload,
  privateKey,
}: {
  paymentPayload: PaymentPayload;
  privateKey: string;
}): {
  encryptedPaymentPayload: string;
  paymentPayloadEncryptionVersion: EncryptionVersion;
} {
  const plaintext = JSON.stringify(paymentPayload);
  const encryptedPaymentPayload = encryptX402Value({
    plaintext,
    privateKey,
  });

  return {
    encryptedPaymentPayload,
    paymentPayloadEncryptionVersion: ENCRYPTION_VERSION,
  };
}

export function decryptX402PaymentPayload({
  encryptedPaymentPayload,
  privateKey,
}: {
  encryptedPaymentPayload: string;
  privateKey: string;
}): PaymentPayload {
  if (!encryptedPaymentPayload) {
    throw new Error('Encrypted x402 payment payload is required');
  }
  const plaintext = decryptX402Value({
    encryptedValue: encryptedPaymentPayload,
    privateKey,
  });

  const parsed = JSON.parse(plaintext) as PaymentPayload;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Decrypted x402 payment payload is invalid');
  }

  return parsed;
}
