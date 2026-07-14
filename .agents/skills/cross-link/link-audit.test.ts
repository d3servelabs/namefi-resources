/**
 * Deterministic fixture tests for link-audit.ts.
 *
 * Run: bun run links:test
 */
import { afterEach, describe, expect, test } from 'bun:test';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import matter from 'gray-matter';
import { routeResolvesForPath } from '../../../scripts/validate-data';

const SCRIPT = path.join(import.meta.dir, 'link-audit.ts');
const FIXTURE = path.join(
  import.meta.dir,
  'test-fixtures',
  'locale-invariant',
);
const temporaryDirectories: string[] = [];

type Finding = {
  file: string;
  line: number;
  severity: string;
  href: string;
  fixedHref?: string;
  source: string;
  field?: string;
};
type AuditResult = {
  mode: string;
  locales: string[];
  findings: Finding[];
  fixedFiles: string[];
};

function temporaryRoot(prefix: string) {
  const directory = mkdtempSync(path.join(os.tmpdir(), `${prefix}-`));
  temporaryDirectories.push(directory);
  return directory;
}

function freshFixture() {
  const directory = temporaryRoot('namefi-link-audit');
  cpSync(FIXTURE, directory, { recursive: true });
  return directory;
}

/**
 * Build a throwaway content tree with prefix-collision slugs. `dns` is a
 * prefix of `dnssec`; `com` is a prefix of `company`.
 */
function scaffold() {
  const root = temporaryRoot('namefi-link-collision');
  const write = (relativePath: string, body: string) => {
    const full = path.join(root, relativePath);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, body);
  };
  const doc = (title: string) => `---\ntitle: ${title}\n---\n${title}.\n`;

  write('content/glossary/en/dns.md', doc('DNS'));
  write('content/glossary/en/dnssec.md', doc('DNSSEC'));
  write('content/glossary/en/whois.md', doc('WHOIS'));
  write('content/glossary/zh-CN/dns.md', doc('DNS zh-CN'));
  write('content/tld/en/com.md', doc('com'));
  write('content/tld/en/company.md', doc('company'));
  write('content/tld/zh-CN/com.md', doc('com zh-CN'));
  write(
    'content/glossary/zh-CN/post.md',
    `---\ntitle: post\n---\n` +
      `See [DNS](/en/glossary/dns) and [DNSSEC](/en/glossary/dnssec/) and ` +
      `[WHOIS](/en/glossary/whois/).\n` +
      `Also [company](/en/tld/company/) after [com](/en/tld/com).\n`,
  );
  return root;
}

function run(root: string, args: string[]) {
  const process = Bun.spawnSync({
    cmd: ['bun', SCRIPT, ...args],
    cwd: root,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  return {
    code: process.exitCode,
    stdout: process.stdout.toString(),
    stderr: process.stderr.toString(),
  };
}

function parseAudit(result: ReturnType<typeof run>): AuditResult {
  expect(result.stderr).toBe('');
  return JSON.parse(result.stdout) as AuditResult;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('full link audit regressions', () => {
  test('--fix preserves whole slugs while localizing every recognized prefix', () => {
    const root = scaffold();
    const result = run(root, ['--fix', 'content/glossary', 'content/tld']);
    expect(result.code).toBe(0);

    const post = readFileSync(
      path.join(root, 'content/glossary/zh-CN/post.md'),
      'utf8',
    );
    expect(post).toContain('](/zh-CN/glossary/dns)');
    expect(post).toContain('](/zh-CN/glossary/dnssec/)');
    expect(post).toContain('](/zh-CN/glossary/whois/)');
    expect(post).toContain('](/zh-CN/tld/com)');
    expect(post).toContain('](/zh-CN/tld/company/)');
    expect(post).not.toContain('/en/glossary/');
    expect(post).not.toContain('/en/tld/');
  });

  test('--fix never introduces a route the runtime cannot resolve', () => {
    const root = scaffold();
    expect(run(root, ['--fix', 'content/glossary', 'content/tld']).code).toBe(0);

    const audit = run(root, [
      '--json',
      'content/glossary',
      'content/tld',
    ]);
    const report = parseAudit(audit);
    expect(report.findings.filter((finding) => finding.severity === 'BROKEN')).toEqual([]);
    expect(
      report.findings.filter(
        (finding) => finding.severity === 'LOCALE_MISMATCH',
      ),
    ).toEqual([]);
    expect(audit.code).toBe(0);
  });

  test('a same-locale route with only an English fallback is accepted', () => {
    const root = scaffold();
    writeFileSync(
      path.join(root, 'content/glossary/zh-CN/probe.md'),
      `---\ntitle: probe\n---\nSee [DNSSEC](/zh-CN/glossary/dnssec/).\n`,
    );

    const audit = run(root, ['--json', 'content/glossary/zh-CN/probe.md']);
    const report = parseAudit(audit);
    expect(
      report.findings.find(
        (finding) => finding.href === '/zh-CN/glossary/dnssec/',
      )?.severity,
    ).toBe('MISSING_TRANSLATION');
    expect(audit.code).toBe(0);
  });

  test('a slug absent from the locale and English fallback is broken', () => {
    const root = scaffold();
    writeFileSync(
      path.join(root, 'content/glossary/zh-CN/probe.md'),
      `---\ntitle: probe\n---\nSee [Ghost](/zh-CN/glossary/ghost/).\n`,
    );

    const audit = run(root, ['--json', 'content/glossary/zh-CN/probe.md']);
    const report = parseAudit(audit);
    expect(
      report.findings.find(
        (finding) => finding.href === '/zh-CN/glossary/ghost/',
      )?.severity,
    ).toBe('BROKEN');
    expect(audit.code).toBe(1);
  });

  test('a bare internal route remains a separate blocking full-audit error', () => {
    const root = scaffold();
    writeFileSync(
      path.join(root, 'content/glossary/zh-CN/probe.md'),
      `---\ntitle: probe\n---\nSee [DNS](/glossary/dns).\n`,
    );

    const audit = run(root, ['--json', 'content/glossary/zh-CN/probe.md']);
    const report = parseAudit(audit);
    expect(report.findings).toContainEqual(
      expect.objectContaining({
        severity: 'MISSING_LOCALE',
        href: '/glossary/dns',
        fixedHref: '/zh-CN/glossary/dns',
      }),
    );
    expect(audit.code).toBe(1);
  });

  test('--fix gives every resolvable bare route the file locale', () => {
    const root = scaffold();
    writeFileSync(
      path.join(root, 'content/glossary/zh-CN/probe.md'),
      `---\ntitle: probe\n---\n` +
        `[DNS](/glossary/dns) and [anchor](/glossary/dns#a) and ` +
        `[DNSSEC](/glossary/dnssec).\n`,
    );

    expect(run(root, ['--fix', 'content/glossary/zh-CN/probe.md']).code).toBe(0);
    const probe = readFileSync(
      path.join(root, 'content/glossary/zh-CN/probe.md'),
      'utf8',
    );
    expect(probe).toContain('](/zh-CN/glossary/dns)');
    expect(probe).toContain('](/zh-CN/glossary/dns#a)');
    expect(probe).toContain('](/zh-CN/glossary/dnssec)');
    expect(probe).not.toContain('](/glossary/');
    expect(run(root, ['content/glossary/zh-CN/probe.md']).code).toBe(0);
  });

  test('--fix leaves an unresolvable bare route unchanged and fails', () => {
    const root = scaffold();
    writeFileSync(
      path.join(root, 'content/glossary/zh-CN/probe.md'),
      `---\ntitle: probe\n---\nSee [Ghost](/glossary/ghost).\n`,
    );

    expect(run(root, ['--fix', 'content/glossary/zh-CN/probe.md']).code).toBe(1);
    expect(
      readFileSync(path.join(root, 'content/glossary/zh-CN/probe.md'), 'utf8'),
    ).toContain('](/glossary/ghost)');
  });
});

describe('same-locale route invariant', () => {
  test('reports recognized locale prefixes in Markdown and related frontmatter', () => {
    const root = freshFixture();
    const audit = run(root, [
      '--locale-only',
      '--json',
      'content/blog/ar/article.md',
    ]);
    const report = parseAudit(audit);

    expect(audit.code).toBe(1);
    expect(report.mode).toBe('locale');
    expect(report.locales).toEqual(['ar', 'en', 'fr']);
    expect(
      report.findings.map(({ line, href, fixedHref, source, field }) => ({
        line,
        href,
        fixedHref,
        source,
        field,
      })),
    ).toEqual([
      {
        line: 3,
        href: '/en/blog/target/',
        fixedHref: '/ar/blog/target/',
        source: 'frontmatter',
        field: 'relatedArticles',
      },
      {
        line: 8,
        href: '/en/glossary/foo/',
        fixedHref: '/ar/glossary/foo/',
        source: 'markdown',
        field: undefined,
      },
      {
        line: 9,
        href: '/fr/blog/fr-only/',
        fixedHref: '/ar/blog/fr-only/',
        source: 'markdown',
        field: undefined,
      },
      {
        line: 14,
        href: '/en/help/',
        fixedHref: '/ar/help/',
        source: 'markdown',
        field: undefined,
      },
      {
        line: 16,
        href: '/fr/blog/fr-only/',
        fixedHref: '/ar/blog/fr-only/',
        source: 'markdown',
        field: undefined,
      },
    ]);
  });

  test('ignores external URLs, anchors, code, and unprefixed internal paths', () => {
    const root = freshFixture();
    const audit = run(root, [
      '--locale-only',
      '--json',
      'content/blog/ar/ignored.md',
    ]);
    expect(audit.code).toBe(0);
    expect(parseAudit(audit).findings).toEqual([]);
  });

  test('checks MDX and accepts missing same-locale frontmatter/body targets', () => {
    const root = freshFixture();
    const mdxAudit = run(root, [
      '--locale-only',
      '--json',
      'content/blog/ar/component.mdx',
    ]);
    const mdxReport = parseAudit(mdxAudit);
    expect(mdxAudit.code).toBe(1);
    expect(mdxReport.findings).toEqual([
      expect.objectContaining({
        href: '/en/blog/target/',
        fixedHref: '/ar/blog/target/',
        source: 'markdown',
      }),
    ]);

    const fallbackAudit = run(root, [
      '--json',
      'content/blog/ar/fallback.md',
    ]);
    expect(fallbackAudit.code).toBe(0);
    expect(parseAudit(fallbackAudit).findings).toEqual([
      expect.objectContaining({
        severity: 'MISSING_TRANSLATION',
        href: '/ar/glossary/foo/',
      }),
    ]);
  });

  test('related-content validation accepts an English fallback behind a same-locale route', () => {
    const root = freshFixture();
    const dataRoot = path.join(root, 'content');

    expect(
      routeResolvesForPath('/ar/glossary/foo/', 'ar', dataRoot),
    ).toBe(true);
    expect(
      routeResolvesForPath('/ar/glossary/ghost/', 'ar', dataRoot),
    ).toBe(false);
    expect(
      routeResolvesForPath('/en/glossary/ghost/', 'en', dataRoot),
    ).toBe(false);
    expect(
      routeResolvesForPath('/fr/glossary/foo/', 'ar', dataRoot),
    ).toBe(false);
    expect(routeResolvesForPath('/ar/glossary/foo', 'ar', dataRoot)).toBe(
      false,
    );
    expect(
      routeResolvesForPath('https://example.com/ar/glossary/foo/', 'ar', dataRoot),
    ).toBe(false);
    expect(
      routeResolvesForPath('/ar/topics/domain-basics/', 'ar', dataRoot),
    ).toBe(false);
  });

  test('relatedGlossary preserves English source order and slugs through fallback routes', () => {
    const root = freshFixture();
    const relativeFile = 'content/blog/ar/privacy.md';
    const audit = run(root, ['--locale-only', '--json', relativeFile]);
    const report = parseAudit(audit);

    expect(audit.code).toBe(1);
    expect(report.findings[0]).toEqual(
      expect.objectContaining({
        line: 3,
        href: '/ar/blog/fr-only/',
        fixedHref: '/ar/blog/target/',
      }),
    );
    expect(
      report.findings.map(({ severity, href, fixedHref, field }) => ({
        severity,
        href,
        fixedHref,
        field,
      })),
    ).toEqual([
      {
        severity: 'RELATIONSHIP_MISMATCH',
        href: '/ar/blog/fr-only/',
        fixedHref: '/ar/blog/target/',
        field: 'relatedArticles',
      },
      {
        severity: 'RELATIONSHIP_MISMATCH',
        href: '/ar/glossary/blockchain/',
        fixedHref: '/ar/glossary/zero-knowledge-proof/',
        field: 'relatedGlossary',
      },
      {
        severity: 'RELATIONSHIP_MISMATCH',
        href: '/ar/glossary/cryptographic-security/',
        fixedHref: '/ar/glossary/fully-homomorphic-encryption/',
        field: 'relatedGlossary',
      },
      {
        severity: 'RELATIONSHIP_MISMATCH',
        href: '/ar/glossary/public-key/',
        fixedHref: '/ar/glossary/secure-multiparty-computation/',
        field: 'relatedGlossary',
      },
      {
        severity: 'RELATIONSHIP_MISMATCH',
        href: '/ar/glossary/private-key/',
        fixedHref: '/ar/glossary/trusted-execution-environment/',
        field: 'relatedGlossary',
      },
      {
        severity: 'RELATIONSHIP_MISMATCH',
        href: '/ar/glossary/smart-contract/',
        fixedHref: '/ar/glossary/cryptographic-security/',
        field: 'relatedGlossary',
      },
    ]);

    const dataRoot = path.join(root, 'content');
    for (const finding of report.findings
      .filter((item) => item.field === 'relatedGlossary')
      .slice(0, 4)) {
      expect(
        routeResolvesForPath(finding.fixedHref!, 'ar', dataRoot),
      ).toBe(true);
    }

    const fix = run(root, [
      '--locale-only',
      '--fix',
      '--json',
      relativeFile,
    ]);
    expect(fix.code).toBe(0);
    expect(run(root, ['--locale-only', relativeFile]).code).toBe(0);
  });

  test('--fix leaves a malformed external related-content value unchanged', () => {
    const root = freshFixture();
    const englishFile = path.join(root, 'content/blog/en/external-relation.md');
    const arabicFile = path.join(root, 'content/blog/ar/external-relation.md');
    writeFileSync(
      englishFile,
      '---\nrelatedArticles:\n  - /en/blog/target/\n---\n',
    );
    writeFileSync(
      arabicFile,
      '---\nrelatedArticles:\n  - https://example.com/article\n---\n',
    );

    const fix = run(root, [
      '--locale-only',
      '--fix',
      '--json',
      'content/blog/ar/external-relation.md',
    ]);
    const report = parseAudit(fix);
    expect(fix.code).toBe(1);
    expect(report.findings).toEqual([
      expect.objectContaining({
        severity: 'RELATIONSHIP_MISMATCH',
        href: 'https://example.com/article',
        fixedHref: '/ar/blog/target/',
        fixable: false,
      }),
    ]);
    expect(readFileSync(arabicFile, 'utf8')).toContain(
      'https://example.com/article',
    );
  });

  test('Arabic privacy metadata keeps the four core English glossary relationships', () => {
    const repoRoot = path.resolve(import.meta.dir, '../../..');
    const readRelations = (locale: 'en' | 'ar') => {
      const file = path.join(
        repoRoot,
        'content/blog',
        locale,
        'blockchain-privacy-technologies.md',
      );
      return matter(readFileSync(file, 'utf8')).data.relatedGlossary as string[];
    };
    const english = readRelations('en');
    const arabic = readRelations('ar');

    expect(arabic).toEqual(
      english.map((href) => href.replace('/en/', '/ar/')),
    );
    expect(arabic.slice(0, 4)).toEqual([
      '/ar/glossary/zero-knowledge-proof/',
      '/ar/glossary/fully-homomorphic-encryption/',
      '/ar/glossary/secure-multiparty-computation/',
      '/ar/glossary/trusted-execution-environment/',
    ]);
  });

  test('--fix changes only locale prefixes and produces a clean rerun', () => {
    const root = freshFixture();
    const fix = run(root, [
      '--locale-only',
      '--fix',
      '--json',
      'content/blog/ar/article.md',
    ]);
    const fixReport = parseAudit(fix);
    expect(fix.code).toBe(0);
    expect(fixReport.fixedFiles).toEqual(['content/blog/ar/article.md']);

    const content = readFileSync(
      path.join(root, 'content/blog/ar/article.md'),
      'utf8',
    );
    expect(content).toContain('/ar/blog/target/');
    expect(content).toContain('/ar/glossary/foo/');
    expect(content).toContain('/ar/blog/fr-only/');
    expect(content).toContain('/ar/help/');
    expect(content).toContain('https://example.com/en/glossary/foo/');
    expect(content).toContain('](/glossary/foo/)');
    expect(content).not.toContain('/en/blog/target/');
    expect(content).not.toContain('/fr/blog/fr-only/');

    const rerun = run(root, [
      '--locale-only',
      '--json',
      'content/blog/ar/article.md',
    ]);
    expect(rerun.code).toBe(0);
    expect(parseAudit(rerun).findings).toEqual([]);
  });

  test('human diagnostics include file, line, actual route, and expected route', () => {
    const root = freshFixture();
    const audit = run(root, [
      '--locale-only',
      'content/blog/ar/article.md',
    ]);
    expect(audit.code).toBe(1);
    expect(audit.stdout).toContain(
      'LOCALE L3 field=relatedArticles actual=/en/blog/target/ expected=/ar/blog/target/',
    );

    const relationshipAudit = run(root, [
      '--locale-only',
      'content/blog/ar/privacy.md',
    ]);
    expect(relationshipAudit.stdout).toContain(
      'RELATION L3 field=relatedArticles actual=/ar/blog/fr-only/ expected=/ar/blog/target/',
    );
  });
});
