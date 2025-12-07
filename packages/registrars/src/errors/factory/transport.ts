/**
 * Shared transport-error detection.
 *
 * Network/socket failures surface as Node system errors that carry a structured
 * `.code` (e.g. ECONNREFUSED). Classify on that code rather than matching error
 * message text, which is locale- and wording-dependent. A few callers only have
 * the code embedded in the message, so we fall back to scanning for the
 * unambiguous code tokens — but never broad words like "connection".
 */

const TRANSPORT_ERROR_CODES = [
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EPIPE',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'EHOSTDOWN',
] as const;

const TRANSPORT_ERROR_CODE_SET: ReadonlySet<string> = new Set(
  TRANSPORT_ERROR_CODES,
);

/**
 * Returns true when the error represents a network/transport-level failure.
 * Primary signal is the Node `error.code`; falls back to scanning the message
 * for an unambiguous code token.
 */
export function isTransportError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const code = (error as { code?: unknown }).code;
  if (typeof code === 'string' && TRANSPORT_ERROR_CODE_SET.has(code)) {
    return true;
  }

  return TRANSPORT_ERROR_CODES.some((token) => error.message.includes(token));
}
