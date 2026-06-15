import { DecryptCommand, EncryptCommand, KMSClient } from '@aws-sdk/client-kms';
import { lazy } from '@namefi-astra/utils/lazy';
import { config, secrets } from './env';

const getKmsClient = lazy(
  () =>
    new KMSClient({
      region: config.AWS_REGION,
      credentials: {
        accessKeyId: secrets.AWS_ACCESS_KEY_ID,
        secretAccessKey: secrets.AWS_SECRET_ACCESS_KEY,
      },
    }),
);

export async function decryptEppAuthCode(
  encryptedAuthorizationCode: string,
  encryptionKeyId: string,
) {
  const input = {
    CiphertextBlob: Uint8Array.from(
      Buffer.from(encryptedAuthorizationCode, 'base64'),
    ),
    KeyId: encryptionKeyId,
  };
  const command = new DecryptCommand(input);
  const response = await getKmsClient().send(command);
  if (!response.Plaintext) {
    throw new Error('Failed to decrypt EPP authorization code');
  }
  return Buffer.from(response.Plaintext).toString('utf-8');
}

export async function encryptEppAuthCode(eppAuthorizationCode: string) {
  const encryptionKeyId = secrets.DEFAULT_EPP_CODE_ENCRYPTION_KEY_ID;
  if (!encryptionKeyId) {
    throw new Error('ENCRYPTION_KEY_ID is not set');
  }
  const input = {
    KeyId: encryptionKeyId,
    Plaintext: Uint8Array.from(Buffer.from(eppAuthorizationCode, 'utf-8')),
  };
  const command = new EncryptCommand(input);
  const { CiphertextBlob, KeyId } = await getKmsClient().send(command);
  if (!CiphertextBlob || !KeyId) {
    throw new Error('Failed to encrypt EPP authorization code');
  }
  return {
    encryptedEppAuthorizationCode:
      Buffer.from(CiphertextBlob).toString('base64'),
    encryptionKeyId: KeyId,
  };
}
