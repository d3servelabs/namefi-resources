#!/usr/bin/env bun

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const locales = ['en', 'es', 'de', 'fr', 'zh', 'ar', 'hi'] as const;
type Locale = (typeof locales)[number];

type Collection = 'blog' | 'tld' | 'partners' | 'glossary' | 'authors';

type Issue = {
  file: string;
  message: string;
};

type ValidationResult = {
  errors: Issue[];
  warnings: Issue[];
  filesChecked: number;
};

const DATA_ROOT = path.join(process.cwd(), 'content');
const MARKDOWN_EXTENSIONS = new Set(['.md', '.mdx']);

const COLLECTION_ROOTS: Record<Collection, string> = {
  blog: path.join(DATA_ROOT, 'blog'),
  tld: path.join(DATA_ROOT, 'tld'),
  partners: path.join(DATA_ROOT, 'partners'),
  glossary: path.join(DATA_ROOT, 'glossary'),
  authors: path.join(DATA_ROOT, 'authors'),
};

function toRelative(filePath: string) {
  return path.relative(process.cwd(), filePath).split(path.sep).join('/');
}

function isMarkdownFile(fileName: string) {
  return MARKDOWN_EXTENSIONS.has(path.extname(fileName));
}

type FrontmatterResult =
  | { data: Record<string, unknown>; error: null }
  | { data: null; error: string };

function loadFrontmatter(filePath: string): FrontmatterResult {
  try {
    const raw = readFileSync(filePath, 'utf8');
    const parsed = matter(raw);
    return { data: parsed.data as Record<string, unknown>, error: null };
  } catch (error: unknown) {
    const relativePath = toRelative(filePath);
    let errorMessage = `YAML parsing error in ${relativePath}`;

    if (error && typeof error === 'object' && 'name' in error) {
      const yamlError = error as {
        name?: string;
        message?: string;
        mark?: {
          line?: number;
          column?: number;
          getSnippet?: () => string;
        };
        reason?: string;
      };

      if (yamlError.mark) {
        const line = yamlError.mark.line ?? '?';
        const column = yamlError.mark.column ?? '?';
        errorMessage = `YAML parsing error in ${relativePath}:\n   Line ${line}, column ${column}: ${yamlError.reason || yamlError.message || 'unknown error'}`;

        if (yamlError.mark.getSnippet) {
          try {
            const snippet = yamlError.mark.getSnippet();
            if (snippet) {
              errorMessage += `\n   Snippet: ${snippet.trim()}`;
            }
          } catch {
            // Ignore snippet errors
          }
        }
      } else if (yamlError.message) {
        errorMessage = `YAML parsing error in ${relativePath}: ${yamlError.message}`;
      }
    } else if (error instanceof Error) {
      errorMessage = `Error reading ${relativePath}: ${error.message}`;
    }

    return { data: null, error: errorMessage };
  }
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function asStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function validateDate(rawDate: unknown) {
  if (typeof rawDate === 'string') {
    const parsed = new Date(rawDate);
    if (!Number.isNaN(parsed.getTime())) {
      return true;
    }
  }
  if (rawDate instanceof Date && !Number.isNaN(rawDate.getTime())) {
    return true;
  }
  return false;
}

async function processInBatches<T, R>(
  items: T[],
  processor: (item: T) => Promise<R> | R,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map((item) => Promise.resolve(processor(item))),
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        // If a processor throws, we still want to continue
        // This shouldn't happen with our current implementation, but handle it gracefully
        throw result.reason;
      }
    }
  }

  return results;
}

function validateContentFile(
  collection: Collection,
  locale: Locale,
  filePath: string,
): ValidationResult {
  const frontmatterResult = loadFrontmatter(filePath);
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  const relativePath = toRelative(filePath);
  const filesChecked = 1;

  // If there's a YAML parsing error, return it immediately and skip further validation
  if (frontmatterResult.error) {
    errors.push({
      file: relativePath,
      message: frontmatterResult.error,
    });
    return { errors, warnings, filesChecked };
  }

  // TypeScript: after error check, data is guaranteed to be non-null
  const data = frontmatterResult.data!;

  let language: Locale = locale;
  if (typeof data.language === 'string') {
    const dataLanguage = data.language;
    const matched = locales.find(
      (value) => value.toLowerCase() === dataLanguage.toLowerCase(),
    );
    if (matched) {
      language = matched;
      if (language !== locale) {
        warnings.push({
          file: relativePath,
          message: `"language" (${language}) does not match folder locale (${locale}); falling back to folder locale`,
        });
      }
    } else {
      warnings.push({
        file: relativePath,
        message: '"language" is invalid; falling back to folder locale',
      });
    }
  } else {
    warnings.push({
      file: relativePath,
      message: '"language" is missing; falling back to folder locale',
    });
  }

  if (collection === 'authors') {
    const name = asString(data.name);
    if (!name) {
      errors.push({
        file: relativePath,
        message: '"name" is required for authors',
      });
    }
    return { errors, warnings, filesChecked };
  }

  const title = asString(data.title);
  if (!title) {
    errors.push({
      file: relativePath,
      message: '"title" is required',
    });
  }

  if (!validateDate(data.date)) {
    errors.push({
      file: relativePath,
      message: '"date" is missing or invalid (expected ISO date string)',
    });
  }

  const tags = asStringArray(data.tags);
  if (tags.length === 0) {
    warnings.push({
      file: relativePath,
      message: '"tags" is empty',
    });
  }

  const authors = asStringArray(data.authors);
  if (authors.length === 0) {
    warnings.push({
      file: relativePath,
      message: '"authors" is empty',
    });
  }

  if (
    collection === 'blog' ||
    collection === 'tld' ||
    collection === 'partners' ||
    collection === 'glossary'
  ) {
    const keywords = asStringArray(data.keywords);
    if (keywords.length === 0) {
      warnings.push({
        file: relativePath,
        message: '"keywords" is empty; consider adding for SEO',
      });
    }
    const description = asString(data.description);
    if (!description) {
      warnings.push({
        file: relativePath,
        message: '"description" is empty; used for summaries/SEO',
      });
    }
  }

  return { errors, warnings, filesChecked };
}

async function validateCollection(
  collection: Collection,
  locale: Locale,
  directory: string,
): Promise<ValidationResult> {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  let filesChecked = 0;

  let entries: string[] = [];
  try {
    entries = readdirSync(directory);
  } catch (error) {
    warnings.push({
      file: `${collection}/${locale}`,
      message: `locale directory missing (${directory})`,
    });
    return { errors, warnings, filesChecked };
  }

  // Collect all markdown files first
  const markdownFiles: string[] = [];
  for (const entry of entries) {
    const filePath = path.join(directory, entry);
    const stats = statSync(filePath);
    if (stats.isDirectory()) continue;
    if (!isMarkdownFile(entry)) continue;
    markdownFiles.push(filePath);
  }

  // Process files in parallel batches of 5
  const results = await processInBatches(
    markdownFiles,
    (filePath) => validateContentFile(collection, locale, filePath),
    5,
  );

  // Aggregate results
  for (const result of results) {
    errors.push(...result.errors);
    warnings.push(...result.warnings);
    filesChecked += result.filesChecked;
  }

  return { errors, warnings, filesChecked };
}

async function main() {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];

  const collections: Collection[] = [
    'blog',
    'tld',
    'partners',
    'glossary',
    'authors',
  ];

  let filesChecked = 0;

  for (const collection of collections) {
    for (const locale of locales) {
      const directory = path.join(COLLECTION_ROOTS[collection], locale);
      const result = await validateCollection(collection, locale, directory);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
      filesChecked += result.filesChecked;
    }
  }

  const errorCount = errors.length;
  const warningCount = warnings.length;

  if (warningCount > 0) {
    console.log(`⚠️  ${warningCount} warning(s):`);
    for (const issue of warnings) {
      console.log(`   • ${issue.file}: ${issue.message}`);
    }
  }

  if (errorCount > 0) {
    console.error(`\n❌ ${errorCount} error(s) found:`);
    for (const issue of errors) {
      console.error(`   • ${issue.file}: ${issue.message}`);
    }
    console.error(
      '\nFix the errors above (warnings are optional) and rerun: bun data:validate',
    );

    // Suggest regeneration for TLD files if applicable
    const tldErrors = errors.filter((e) => e.file.startsWith('content/tld/'));
    if (tldErrors.length > 0) {
      const failedTlds = new Set<string>();
      for (const err of tldErrors) {
        // Expected path format: content/tld/[locale]/[tld].md
        const parts = err.file.split('/');
        if (parts.length >= 4) {
          const locale = parts[2];
          const filename = parts[3];
          if (filename.endsWith('.md')) {
            const tld = filename.replace('.md', '');
            failedTlds.add(`${locale}/${tld}`);
          }
        }
      }

      if (failedTlds.size > 0) {
        const localeTldsArg = Array.from(failedTlds).join(',');
        console.error(
          `\n💡 Suggestion: Regenerate the failing TLD articles with:\n   bun scripts/generate-tld.ts --locale-tlds ${localeTldsArg} --overwrite`,
        );
      }
    }

    process.exitCode = 1;
    return;
  }

  console.log(
    `\n✅ Data validation passed${warningCount > 0 ? ` with ${warningCount} warning(s)` : ''}`,
  );
  if (filesChecked === 0) {
    console.log('ℹ️  No content files were inspected (folders may be empty).');
  }
}

main();
