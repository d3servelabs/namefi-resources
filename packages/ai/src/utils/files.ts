export function sanitizeForFilename(input: string): string {
  return input
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function createRunId(prefix: string): string {
  const sanitizedPrefix = sanitizeForFilename(prefix);
  const timestamp = Date.now();
  return `${sanitizedPrefix}-${timestamp}`;
}
