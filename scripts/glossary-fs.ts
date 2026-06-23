// Shared glossary file-resolution so every script agrees on the ONE file that
// represents a slug. Resolution is deterministic and existence-based: `.md`
// wins over `.mdx` when both are present. Keeping this in one place is what
// prevents build-termbase and glossary-mentions from each picking a different
// file for the same slug.

import { existsSync } from 'node:fs';
import path from 'node:path';

const EXTS = ['.md', '.mdx'] as const;

/** The canonical content file for `slug` inside `dir`, or null if none exists. */
export function resolveEntryFile(dir: string, slug: string): string | null {
  for (const ext of EXTS) {
    const file = path.join(dir, slug + ext);
    if (existsSync(file)) return file;
  }
  return null;
}

/** True if any extension of `slug` already exists in `dir`. */
export function entryExists(dir: string, slug: string): boolean {
  return resolveEntryFile(dir, slug) !== null;
}
