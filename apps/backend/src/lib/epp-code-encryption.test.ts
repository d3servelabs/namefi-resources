import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendMock = vi.fn();

class MockEncryptCommand {
  constructor(public input: { KeyId: string; Plaintext: Uint8Array }) {}
}

class MockDecryptCommand {
  constructor(public input: { KeyId: string; CiphertextBlob: Uint8Array }) {}
}

vi.mock('@aws-sdk/client-kms', () => ({
  KMSClient: vi.fn(() => ({
    send: sendMock,
  })),
  EncryptCommand: MockEncryptCommand,
  DecryptCommand: MockDecryptCommand,
}));

vi.mock('./env', () => ({
  config: {
    AWS_REGION: 'us-east-1',
  },
  secrets: {
    AWS_ACCESS_KEY_ID: 'test-access-key',
    AWS_SECRET_ACCESS_KEY: 'test-secret-key',
    DEFAULT_EPP_CODE_ENCRYPTION_KEY_ID: 'test-kms-key',
  },
}));

const { decryptEppAuthCode, encryptEppAuthCode } = await import(
  './epp-code-encryption'
);

describe('epp-code-encryption', () => {
  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockImplementation(async (command) => {
      if (command instanceof MockEncryptCommand) {
        const plaintext = Buffer.from(command.input.Plaintext).toString('utf8');
        const ciphertext = Buffer.from(`cipher:${plaintext}`, 'utf8');

        return {
          CiphertextBlob: Uint8Array.from(ciphertext),
          KeyId: command.input.KeyId,
        };
      }

      if (command instanceof MockDecryptCommand) {
        const ciphertext = Buffer.from(command.input.CiphertextBlob).toString(
          'utf8',
        );

        if (!ciphertext.startsWith('cipher:')) {
          throw new Error('Invalid ciphertext blob');
        }

        return {
          Plaintext: Uint8Array.from(
            Buffer.from(ciphertext.slice('cipher:'.length), 'utf8'),
          ),
        };
      }

      throw new Error('Unexpected command');
    });
  });

  it.each([
    'auth-code-123',
    '',
    'äuth-cøde-🔐',
    'x'.repeat(2048),
  ])('round-trips auth code %j through KMS helpers', async (authCode) => {
    const encrypted = await encryptEppAuthCode(authCode);

    expect(encrypted.encryptionKeyId).toBe('test-kms-key');
    expect(encrypted.encryptedEppAuthorizationCode).not.toBe('');

    const encryptCommand = sendMock.mock.calls[0]?.[0];
    expect(encryptCommand).toBeInstanceOf(MockEncryptCommand);
    expect(encryptCommand.input.Plaintext).toBeInstanceOf(Uint8Array);
    expect(Buffer.from(encryptCommand.input.Plaintext).toString('utf8')).toBe(
      authCode,
    );

    const decrypted = await decryptEppAuthCode(
      encrypted.encryptedEppAuthorizationCode,
      encrypted.encryptionKeyId,
    );

    const decryptCommand = sendMock.mock.calls[1]?.[0];
    expect(decryptCommand).toBeInstanceOf(MockDecryptCommand);
    expect(decryptCommand.input.CiphertextBlob).toBeInstanceOf(Uint8Array);
    expect(decrypted).toBe(authCode);
  });

  it('propagates malformed base64 input as a decryption failure', async () => {
    await expect(
      decryptEppAuthCode('###not-base64###', 'test-kms-key'),
    ).rejects.toThrow('Invalid ciphertext blob');
  });
});
