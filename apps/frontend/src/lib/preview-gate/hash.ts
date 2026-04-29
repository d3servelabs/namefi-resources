import { createHash, timingSafeEqual } from 'node:crypto';

const PURPOSE = 'preview-gate.v1';

export function previewGateHash(password: string, salt: string): string {
  return createHash('sha256')
    .update(`${PURPOSE}|${password}|${salt}`)
    .digest('hex');
}

export function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}
