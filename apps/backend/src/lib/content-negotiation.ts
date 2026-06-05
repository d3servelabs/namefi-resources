/**
 * Helpers for HTTP content negotiation: parsing `Accept` headers and
 * classifying `User-Agent` strings. Kept framework-agnostic (plain strings in,
 * booleans/arrays out) so they can be reused across routes and middleware.
 */

const HTML_MEDIA_TYPES = new Set(['text/html', 'application/xhtml+xml']);

const BROWSER_USER_AGENT_REGEX = /mozilla|chrome|safari|firefox|edg|opera/i;

/**
 * Split an `Accept` header into its bare media types, dropping quality and
 * other parameters (e.g. `;q=0.9`) and lowercasing each entry. Returns an empty
 * array when the header is absent or empty.
 *
 * @param acceptHeader - Raw `Accept` header value, if present.
 * @returns Ordered list of media types (e.g. `['text/html', '*\/*']`).
 */
export function parseAcceptMediaTypes(
  acceptHeader: string | undefined,
): string[] {
  if (!acceptHeader) {
    return [];
  }
  return acceptHeader
    .split(',')
    .map((part) => part.split(';')[0]?.trim().toLowerCase())
    .filter((mediaType): mediaType is string => !!mediaType);
}

/**
 * Whether the parsed media types include an HTML type
 * (`text/html` or `application/xhtml+xml`).
 */
export function acceptIncludesHtml(mediaTypes: string[]): boolean {
  return mediaTypes.some((mediaType) => HTML_MEDIA_TYPES.has(mediaType));
}

/**
 * Whether every parsed media type is HTML and at least one is present. Use this
 * to distinguish a request that asks for HTML and nothing else from one that
 * also accepts other types (e.g. `*\/*`).
 */
export function acceptOnlyHtml(mediaTypes: string[]): boolean {
  return (
    mediaTypes.length > 0 &&
    mediaTypes.every((mediaType) => HTML_MEDIA_TYPES.has(mediaType))
  );
}

/**
 * Heuristic check for whether a `User-Agent` looks like a web browser. Matches
 * the common browser tokens (Mozilla, Chrome, Safari, Firefox, Edge, Opera) and
 * treats CLI/programmatic agents (curl, wget, fetch libraries) as non-browsers.
 */
export function isBrowserUserAgent(userAgent: string | undefined): boolean {
  if (!userAgent) {
    return false;
  }
  return BROWSER_USER_AGENT_REGEX.test(userAgent);
}
