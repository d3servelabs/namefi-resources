/** Publication-policy fixtures for the real data validator and link auditor. */
import { afterEach, describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import matter from 'gray-matter';

const repoRoot = path.resolve(import.meta.dir, '..');
const temporaryDirectories: string[] = [];
const slugs = ['one', 'two', 'three', 'four', 'five'];

function writeDocument(root: string, file: string, data: Record<string, unknown>) {
  const destination = path.join(root, 'content', file);
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, matter.stringify('Fixture body.\n', data));
}

function article(locale: string): Record<string, unknown> {
  return {
    title: 'Publication fixture',
    date: '2026-09-15',
    language: locale,
    tags: ['domains'],
    authors: ['new-author'],
    keywords: ['domains'],
    description: 'Publication-policy fixture.',
    relatedArticles: slugs.map((slug) => `/${locale}/blog/${slug}/`),
    relatedGlossary: slugs.map((slug) => `/${locale}/glossary/${slug}/`),
    relatedTopics: ['domain-basics', 'domain-security'].map(
      (slug) => `/${locale}/topics/${slug}/`,
    ),
    relatedSeries: ['blockchain-concepts', 'domain-apocalypse'].map(
      (slug) => `/${locale}/series/${slug}/`,
    ),
  };
}

function fixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'namefi-publication-'));
  temporaryDirectories.push(root);
  for (const collection of ['blog', 'glossary']) {
    for (const slug of slugs) {
      writeDocument(root, `${collection}/en/${slug}.md`, article('en'));
    }
  }
  writeDocument(root, 'authors/en/new-author.mdx', {
    name: 'New author',
    language: 'en',
  });
  return root;
}

function run(root: string, script = 'scripts/validate-data.ts', args: string[] = []) {
  const result = Bun.spawnSync({
    cmd: [process.execPath, path.join(repoRoot, script), ...args],
    cwd: root,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  return {
    code: result.exitCode,
    output: result.stdout.toString() + result.stderr.toString(),
  };
}

afterEach(() => {
  for (const root of temporaryDirectories.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe('English-first publication', () => {
  test.each(['en', 'fr'])(
    'accepts %s coverage with an English-only author and related targets',
    (locale) => {
      const root = fixture();
      if (locale !== 'en') {
        writeDocument(root, `blog/${locale}/one.md`, article(locale));
      }

      const validation = run(root);
      expect(validation.code, validation.output).toBe(0);
      expect(validation.output).toContain('Data validation passed');
      expect(validation.output).not.toContain('No content files were inspected');
      // Exercise both remaining data:validate stages plus the full link audit.
      for (const args of [['--locale-only'], []]) {
        const audit = run(root, '.agents/skills/cross-link/link-audit.ts', args);
        expect(audit.code, audit.output).toBe(0);
      }
      const faqs = run(root, 'scripts/check-tld-faq-sync.ts');
      expect(faqs.code, faqs.output).toBe(0);

      const suggestion = run(root, '.agents/skills/cross-link/link-suggest.ts', [
        '--term=/en/glossary/one/',
      ]);
      expect(suggestion.code, suggestion.output).toBe(0);
      expect(suggestion.output).toContain('no counterpart → keep /fr/glossary/one/');
      expect(suggestion.output).not.toContain('no counterpart → keep /en/');
    },
  );

  test('still rejects malformed metadata in a selected translation', () => {
    const root = fixture();
    writeDocument(root, 'blog/fr/one.md', { ...article('fr'), title: '' });
    const result = run(root);
    expect(result.code).toBe(1);
    expect(result.output).toContain('"title" is required');
  });

  test('still rejects an English relationship URL in a French article', () => {
    const root = fixture();
    writeDocument(root, 'blog/fr/one.md', {
      ...article('fr'),
      relatedArticles: article('en').relatedArticles,
    });
    const result = run(root);
    expect(result.code).toBe(1);
    expect(result.output).toContain('path must stay in the file locale (fr)');
  });

  test('still rejects a target absent from both the selected locale and English', () => {
    const root = fixture();
    writeDocument(root, 'blog/fr/one.md', {
      ...article('fr'),
      relatedGlossary: ['missing', ...slugs.slice(1)].map(
        (slug) => `/fr/glossary/${slug}/`,
      ),
    });
    const result = run(root);
    expect(result.code).toBe(1);
    expect(result.output).toContain('does not resolve through the fr route or its en fallback');
  });
});
