/**
 * Check if a hostname matches any allowed hostname pattern.
 * Supports:
 * - Exact matches
 * - Suffix matches (patterns starting with '.')
 * - Glob patterns (patterns containing '*')
 *
 * @param hostname - The hostname to check
 * @param allowedHostnames - Array of allowed hostname patterns
 * @returns true if the hostname matches any pattern, false otherwise
 */
export function isHostnameAllowed(
  hostname: string,
  allowedHostnames: string[],
): boolean {
  return allowedHostnames.some((pattern) => {
    if (pattern === hostname) return true;

    // Support simple suffix match (e.g. .vercel.app)
    if (pattern.startsWith('.') && hostname.endsWith(pattern)) return true;

    // Support glob patterns (e.g. namefi-astra-*-d3servelabs.vercel.app)
    if (pattern.includes('*')) {
      // Remove regex anchors if present to normalize
      const cleanPattern = pattern.replace(/^\^/, '').replace(/\$$/, '');

      // Security: Validate pattern only contains safe characters (letters, digits, dashes, dots, and *)
      // This prevents regex injection attacks
      const safePatternRegex = /^[a-zA-Z0-9.*-]+$/;
      if (!safePatternRegex.test(cleanPattern)) {
        // Reject patterns with unsafe characters
        return false;
      }

      const regexStr = `^${
        cleanPattern
          .replace(/\./g, '\\.') // Escape dots
          .replace(/\*/g, '.*') // Convert glob * to regex .*
      }$`;
      return new RegExp(regexStr).test(hostname);
    }

    return false;
  });
}
