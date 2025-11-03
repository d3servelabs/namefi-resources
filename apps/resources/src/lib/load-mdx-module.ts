import type { MDXComponents } from 'mdx/types';
import type { ComponentType } from 'react';

export type MdxModule = {
  default: ComponentType<{ components?: MDXComponents }>;
};

const BACKSLASH_PATTERN = /\\/g;
const LEADING_SLASH_PATTERN = /^\/+/;

export async function loadMdxModule(relativePath: string): Promise<MdxModule> {
  const normalized = relativePath
    .replace(BACKSLASH_PATTERN, '/')
    .replace(LEADING_SLASH_PATTERN, '');
  try {
    const module = await import(`@data/${normalized}`);
    return module as MdxModule;
  } catch (error) {
    throw new Error(`Failed to import MDX module at @data/${normalized}`, {
      cause: error instanceof Error ? error : undefined,
    });
  }
}
