/**
 * Set the current theme by changing the data-theme attribute
 *
 * @param theme The theme name to apply
 */
export function setTheme(theme: string): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

/**
 * Get the current theme from the data-theme attribute
 *
 * @returns The current theme name
 */
export function getTheme(): string {
  if (typeof document !== 'undefined') {
    return document.documentElement.getAttribute('data-theme') || 'namefi';
  }
  return 'namefi';
}

/**
 * Convert an origin domain to a theme name
 *
 * @param origin The origin domain (e.g., "0x.city")
 * @returns Formatted theme name (e.g., "0x-city")
 */
export function originToTheme(origin: string | null): string {
  if (!origin) {
    return 'namefi';
  }
  return origin.replace(/\./g, '-');
}

/**
 * Map a third-party origin to its theme name
 *
 * @param thirdPartyOrigin The third-party origin
 * @returns The corresponding theme name or 'namefi' for first-party origins
 */
export function getThemeFromOrigin(thirdPartyOrigin: string | null): string {
  if (!thirdPartyOrigin) {
    return 'namefi';
  }
  return originToTheme(thirdPartyOrigin);
}
