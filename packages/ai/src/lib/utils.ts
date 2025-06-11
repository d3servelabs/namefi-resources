/**
 * Creates a unique run ID for image/logo generation
 *
 * @param identifier - The domain name or brand name to create a run ID for
 * @returns A sanitized run ID with format: "{sanitized-identifier}-{timestamp}"
 *
 * Normalization Process:
 * - Converts to lowercase
 * - Replaces spaces and dots with dashes
 * - Removes all non-alphanumeric characters except dashes
 * - Appends current timestamp for uniqueness
 */
export function createRunId(identifier: string): string {
  const sanitized = identifier
    .toLowerCase()
    .replace(/[\s.]+/g, '-') // Replace spaces and dots with dashes
    .replace(/[^a-z0-9-]/g, ''); // Remove non-alphanumeric chars except dashes

  const timestamp = Date.now();
  return `${sanitized}-${timestamp}`;
}
