/**
 * Sanitize domain name for use in file paths and IDs
 */
export function sanitizeDomainName(domain: string): string {
  return domain.replace(/\./g, '-');
}

/**
 * Extract domain extension from a domain name
 */
export function getDomainExtension(domain: string): string {
  const parts = domain.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

/**
 * Get domain without extension
 */
export function getDomainWithoutExtension(domain: string): string {
  const parts = domain.split('.');
  return parts.length > 1 ? parts.slice(0, -1).join('.') : domain;
}
