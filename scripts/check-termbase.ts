#!/usr/bin/env bun
/**
 * check-termbase.ts — advisory consistency linter for canonical terminology.
 *
 * The glossary's per-locale `title` is the canonical term for a concept in that
 * locale. When a translated post renders the concept with a KNOWN non-canonical
 * variant (tracked per entry in `aliasesByLocale`), this linter flags it so the
 * prose can be reconciled to the canonical term (allowing grammatical inflection
 * only — 除语法词性变化).
 *
 * It proves "no listed alias remains", not absolute consistency — it can only
 * catch variants we have explicitly harvested into `aliasesByLocale`. Like
 * check:i18n:convention it is ADVISORY (exit 0) by default; pass --strict to
 * make it fail CI.
 *
 * Matching mirrors the cross-link skill: prose only (frontmatter / code / links
 * / headings blanked), boundary-aware for Latin scripts, substring for CJK/RTL.
 *
 * Usage (from repo root):
 *   bun scripts/check-termbase.ts                 # advisory scan of all locales
 *   bun scripts/check-termbase.ts --strict        # exit 1 if any variant found
 *   bun scripts/check-termbase.ts --locale=zh     # one locale only
 *   bun scripts/check-termbase.ts content/blog/zh/foo.md   # specific files
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const LOCALES = ['en', 'es', 'de', 'fr', 'zh', 'ar', 'hi', 'ko', 'ja', 'ta'] as const;
type Locale = (typeof LOCALES)[number];
const COLLECTIONS = ['blog', 'glossary', 'tld', 'partners'] as const;
const MD_EXT = new Set(['.md', '.mdx']);

const REPO_ROOT = process.cwd();
const CONTENT_ROOT = path.join(REPO_ROOT, 'content');
const TERMBASE_PATH = path.join(CONTENT_ROOT, 'termbase.json');

const argv = process.argv.slice(2);
const STRICT = argv.includes('--strict');
const localeArgRaw = argv.find((a) => a.startsWith('--locale='))?.slice(9);
if (localeArgRaw !== undefined && !(LOCALES as readonly string[]).includes(localeArgRaw)) {
  // A typo'd locale must not silently scan zero files and report "0 deviations".
  console.error(`Error: --locale=${localeArgRaw} is not a known locale (${LOCALES.join(', ')}).`);
  process.exit(1);
}
const localeArg = localeArgRaw as Locale | undefined;
const fileArgs = argv.filter((a) => !a.startsWith('--'));

type TermbaseEntry = {
  en: string;
  titles: Partial<Record<Locale, string>>;
  aliasesByLocale?: Partial<Record<Locale, string[]>>;
};

function loadTermbase(): Record<string, TermbaseEntry> {
  try {
    return JSON.parse(readFileSync(TERMBASE_PATH, 'utf8'));
  } catch {
    console.error(`❌ Could not read ${path.relative(REPO_ROOT, TERMBASE_PATH)}. Run: bun scripts/build-termbase.ts`);
    process.exit(2);
  }
}

// Blank out everything that isn't human-readable prose so a variant can't match
// inside frontmatter, code, an existing link/href, or a heading.
function stripNonProse(raw: string): string {
  let body = raw.replace(/^---\n[\s\S]*?\n---\n?/, (m) => m.replace(/[^\n]/g, ' '));
  body = body.replace(/^([ \t]*)(`{3,}|~{3,})[\s\S]*?\n\1\2[^\n]*$/gm, (m) => m.replace(/[^\n]/g, ' '));
  body = body.replace(/`[^`\n]*`/g, (m) => m.replace(/[^\n]/g, ' '));
  body = body.replace(/!?\[[^\]\n]*\]\([^)\n]*\)/g, (m) => m.replace(/[^\n]/g, ' '));
  body = body.replace(/^#{1,6} .*$/gm, (m) => m.replace(/[^\n]/g, ' '));
  return body;
}

function isLatin(s: string): boolean {
  return /[A-Za-z]/.test(s) && !/[؀-ۿ一-鿿ऀ-ॿ]/.test(s);
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildScanner(variants: string[]): { latin?: RegExp; other?: RegExp } {
  const latin = variants.filter(isLatin).sort((a, b) => b.length - a.length);
  const other = variants.filter((v) => !isLatin(v)).sort((a, b) => b.length - a.length);
  const res: { latin?: RegExp; other?: RegExp } = {};
  if (latin.length) res.latin = new RegExp(`(?<![A-Za-z0-9])(?:${latin.map(escapeRe).join('|')})(?![A-Za-z0-9])`, 'gi');
  if (other.length) res.other = new RegExp(`(?:${other.map(escapeRe).join('|')})`, 'g');
  return res;
}

function lineOf(prose: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < prose.length; i++) if (prose[i] === '\n') line++;
  return line;
}

function listMarkdown(dir: string): string[] {
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const e of entries) {
    const full = path.join(dir, e);
    if (statSync(full).isDirectory()) out.push(...listMarkdown(full));
    else if (MD_EXT.has(path.extname(e))) out.push(full);
  }
  return out;
}

function localeOf(file: string): Locale | null {
  const rel = path.relative(CONTENT_ROOT, file).split(path.sep);
  // content/<collection>/<locale>/<slug>.md
  const loc = rel[1];
  return (LOCALES as readonly string[]).includes(loc) ? (loc as Locale) : null;
}

type Finding = { file: string; line: number; variant: string; slug: string; canonical: string };

function main() {
  const termbase = loadTermbase();

  // variant -> { slug, canonical } per locale (derived from LOCALES so a newly
  // added locale never leaves an undefined bucket here).
  const variantIndex = Object.fromEntries(
    LOCALES.map((l) => [l, new Map<string, { slug: string; canonical: string }>()]),
  ) as Record<Locale, Map<string, { slug: string; canonical: string }>>;
  for (const [slug, entry] of Object.entries(termbase)) {
    const aliases = entry.aliasesByLocale;
    if (!aliases) continue;
    for (const locale of LOCALES) {
      const list = aliases[locale];
      const canonical = entry.titles[locale];
      if (!list || !canonical) continue;
      for (const v of list) variantIndex[locale].set(v, { slug, canonical });
    }
  }

  const scanners: Partial<Record<Locale, { latin?: RegExp; other?: RegExp }>> = {};
  for (const locale of LOCALES) {
    const variants = [...variantIndex[locale].keys()];
    if (variants.length) scanners[locale] = buildScanner(variants);
  }

  const totalVariants = LOCALES.reduce((n, l) => n + variantIndex[l].size, 0);
  if (totalVariants === 0) {
    console.log('ℹ️  No aliasesByLocale variants are tracked yet — nothing to check.');
    console.log('   Harvest variants into glossary frontmatter as the reconciliation sweep finds them.');
    return;
  }

  // Files to scan
  let files: string[];
  if (fileArgs.length) {
    files = fileArgs.map((f) => path.resolve(REPO_ROOT, f));
  } else {
    files = [];
    for (const col of COLLECTIONS) {
      for (const locale of LOCALES) {
        if (localeArg && locale !== localeArg) continue;
        files.push(...listMarkdown(path.join(CONTENT_ROOT, col, locale)));
      }
    }
  }

  const findings: Finding[] = [];
  for (const file of files) {
    const locale = localeOf(file);
    if (!locale) continue;
    if (localeArg && locale !== localeArg) continue;
    const scanner = scanners[locale];
    if (!scanner) continue;
    let raw: string;
    try {
      raw = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const prose = stripNonProse(raw);
    const seen = new Set<string>();
    for (const re of [scanner.latin, scanner.other]) {
      if (!re) continue;
      for (const m of prose.matchAll(re)) {
        const key = m[0].toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        const hit = variantIndex[locale].get(m[0]) ?? variantIndex[locale].get(m[0].toLowerCase())
          ?? [...variantIndex[locale].entries()].find(([v]) => v.toLowerCase() === key)?.[1];
        if (!hit) continue;
        findings.push({
          file: path.relative(REPO_ROOT, file),
          line: lineOf(prose, m.index ?? 0),
          variant: m[0],
          slug: hit.slug,
          canonical: hit.canonical,
        });
      }
    }
  }

  if (findings.length === 0) {
    console.log(`✅ check:termbase — 0 known-variant deviations across ${files.length} files (${totalVariants} tracked variants).`);
    return;
  }

  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  console.log(`${STRICT ? '❌' : '⚠️ '} check:termbase — ${findings.length} known-variant deviation(s):`);
  for (const f of findings) {
    console.log(`   • ${f.file}:${f.line}  "${f.variant}" → use canonical "${f.canonical}" (${f.slug})`);
  }
  console.log(`\n   Reconcile to the canonical term (grammatical inflection allowed — 除语法词性变化).`);
  if (STRICT) process.exitCode = 1;
}

main();
