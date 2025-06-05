import crypto from 'node:crypto';

/**
 * Signs a message using the specified private key and algorithm
 * @param privateKey - Private key in PEM format (PKCS#1 or PKCS#8)
 * @param message - The message to sign
 * @param algorithm - The hashing algorithm (default: 'sha256')
 * @param format - The signature output format (default: 'hex')
 * @returns The signature as a string in the specified format
 */
export function signMessage({
  privateKey,
  message,
  algorithm = 'sha256',
  format = 'hex',
}: {
  message: string;
  privateKey: string;
  algorithm?: string;
  format?: crypto.BinaryToTextEncoding;
}) {
  // Validate inputs
  if (!message || !privateKey) {
    throw new Error('Message and private key are required');
  }

  // Validate algorithm against known secure algorithms
  const allowedAlgorithms = ['sha256', 'sha384', 'sha512'];
  if (!allowedAlgorithms.includes(algorithm)) {
    throw new Error(
      `Unsupported algorithm: ${algorithm}. Allowed: ${allowedAlgorithms.join(
        ', ',
      )}`,
    );
  }

  try {
    const signer = crypto.createSign(algorithm);

    signer.write(message);
    signer.end();
    const signature = signer.sign(privateKey, format);
    return signature;
  } catch (error) {
    throw new Error(
      `Failed to sign message: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
