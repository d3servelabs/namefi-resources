import { timingSafeEqual } from 'node:crypto';

export function validateApiKey(
  provided: string | null | undefined,
  expected: string,
): boolean {
  if (!provided) {
    return false;
  }

  const encoder = new TextEncoder();
  const providedBytes = encoder.encode(provided);
  const expectedBytes = encoder.encode(expected);

  if (providedBytes.length !== expectedBytes.length) {
    return false;
  }

  return timingSafeEqual(providedBytes, expectedBytes);
}
