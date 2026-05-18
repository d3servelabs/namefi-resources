/**
 * Whitelist marketplace-supplied URLs to http/https before rendering them as links.
 * Guards against `javascript:` / `data:` schemes if a marketplace ever sneaks one through.
 */
export function toSafeExternalUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}
