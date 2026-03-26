import { fileURLToPath } from 'node:url';
import type { AuthKind, AuthMode, ParsedArgs } from './types';

const ENVELOPE_SUFFIX_REGEX = /Envelope$/;
const TRAILING_SLASHES_REGEX = /\/+$/;
const LEADING_SLASHES_REGEX = /^\/+/;
const PATH_TEMPLATE_REGEX = /\{([^}]+)\}/g;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function asBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === 'string');
}

export function deepClone<T>(value: T): T {
  return structuredClone(value);
}

export function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}

export function payloadTypeFromPrimaryType(
  primaryType: string | null,
): string | null {
  if (!primaryType) {
    return null;
  }

  return primaryType.replace(ENVELOPE_SUFFIX_REGEX, '');
}

export function deriveAuthMode(args: {
  authKind: AuthKind;
  hasEip712: boolean;
}): AuthMode {
  if (args.hasEip712) {
    return 'eip712';
  }

  switch (args.authKind) {
    case 'public':
      return 'none';
    case 'authedOrPublic':
      return 'siwe-optional';
    case 'protected':
      return 'siwe-required';
    default:
      return 'unknown';
  }
}

export function sameRoute(
  left: { method: string; path: string },
  right: { method: string; path: string },
): boolean {
  return (
    left.method.toUpperCase() === right.method.toUpperCase() &&
    left.path === right.path
  );
}

export function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(TRAILING_SLASHES_REGEX, '')}/${path.replace(LEADING_SLASHES_REGEX, '')}`;
}

export function resolvePathTemplate(
  path: string,
  pathParams: Record<string, unknown>,
): { resolvedPath: string; missingPathParams: string[] } {
  const missingPathParams: string[] = [];

  const resolvedPath = path.replace(
    PATH_TEMPLATE_REGEX,
    (_match, rawKey: string) => {
      const key = rawKey.trim();
      const value = pathParams[key];

      if (value === undefined || value === null || value === '') {
        missingPathParams.push(key);
        return `{${key}}`;
      }

      return encodeURIComponent(String(value));
    },
  );

  return { resolvedPath, missingPathParams };
}

export function parseArgs(argv: string[]): ParsedArgs {
  const flags = new Map<string, string | boolean>();
  const positionals: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const part = argv[index];

    if (!part.startsWith('--')) {
      positionals.push(part);
      continue;
    }

    const trimmed = part.slice(2);
    const equalsIndex = trimmed.indexOf('=');

    if (equalsIndex >= 0) {
      const key = trimmed.slice(0, equalsIndex);
      const value = trimmed.slice(equalsIndex + 1);
      flags.set(key, value);
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      flags.set(trimmed, next);
      index += 1;
      continue;
    }

    flags.set(trimmed, true);
  }

  return { flags, positionals };
}

export function getStringFlag(args: ParsedArgs, name: string): string | null {
  const value = args.flags.get(name);
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function getBooleanFlag(args: ParsedArgs, name: string): boolean {
  return args.flags.get(name) === true;
}

export function requireStringFlag(args: ParsedArgs, name: string): string {
  const value = getStringFlag(args, name);

  if (!value) {
    throw new Error(`Missing required flag --${name}`);
  }

  return value;
}

export function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function isMainModule(meta: ImportMeta): boolean {
  return process.argv[1] === fileURLToPath(meta.url);
}

export function writeError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
}

export function fail(message: string): never {
  throw new Error(message);
}
