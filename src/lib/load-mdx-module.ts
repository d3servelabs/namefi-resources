import type { MDXComponents } from 'mdx/types';
import type { ComponentType } from 'react';

type ReadingTime = {
  text: string;
  minutes: number;
  time: number;
  words: number;
};

export type MdxModule = {
  default: ComponentType<{ components?: MDXComponents }>;
  readingTime?: ReadingTime;
};

const BACKSLASH_PATTERN = /\\/g;
const LEADING_SLASH_PATTERN = /^\/+/;

function normaliseRelativePath(relativePath: string) {
  return relativePath
    .replace(BACKSLASH_PATTERN, '/')
    .replace(LEADING_SLASH_PATTERN, '');
}

export async function loadMdxModule(relativePath: string): Promise<MdxModule> {
  const normalized = normaliseRelativePath(relativePath);
  try {
    const module = await import(`@data/${normalized}`);
    return module as MdxModule;
  } catch (error) {
    throw new Error(`Failed to import MDX module at @data/${normalized}`, {
      cause: error instanceof Error ? error : undefined,
    });
  }
}

export async function loadMdxReadingTime(
  relativePath: string,
): Promise<ReadingTime | undefined> {
  const module = await loadMdxModule(relativePath);
  return module.readingTime;
}
