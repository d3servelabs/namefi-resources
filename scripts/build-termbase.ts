#!/usr/bin/env bun
/**
 * build-termbase.ts — generate content/termbase.json from the glossary.
 *
 * The glossary is the canonical bilingual termbase for the whole resources
 * site: each entry's per-locale `title` is the *standard* translation of that
 * concept in that locale. This script flattens every glossary entry into a
 * single lookup artifact so other tooling (translate-glossary, check:termbase)
 * and AI crawlers (/llms.txt) can read one file instead of re-scanning 7×N
 * markdown files.
 *
 * Output schema (content/termbase.json), sorted by slug:
 *   {
 *     "<slug>": {
 *       "en": "<english title>",
 *       "level": 1,
 *       "titles": { "en": "...", "zh": "...", "ar": "...", ... },
 *       "aliasesByLocale": { "zh": ["注册中心", ...], "de": [...] }
 *     }
 *   }
 *
 * `en` is the source of truth: a slug only enters the termbase if an English
 * entry exists. Missing locale titles are simply absent (the gap a future
 * translate-glossary run fills). `aliasesByLocale` is harvested from the EN
 * entry's build-time-only frontmatter (the curated non-canonical variants to
 * normalise away — read by check:termbase).
 *
 * Usage (from repo root):
 *   bun scripts/build-termbase.ts            # write content/termbase.json
 *   bun scripts/build-termbase.ts --check    # verify it is up to date (CI)
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const LOCALES = ['en', 'es', 'de', 'fr', 'zh', 'ar', 'hi'] as const;
type Locale = (typeof LOCALES)[number];

const REPO_ROOT = process.cwd();
const GLOSSARY_ROOT = path.join(REPO_ROOT, 'content', 'glossary');
const OUT_PATH = path.join(REPO_ROOT, 'content', 'termbase.json');

const CHECK = process.argv.includes('--check');

type Entry = {
  en: string;
  level?: number;
  titles: Partial<Record<Locale, string>>;
  aliasesByLocale?: Partial<Record<Locale, string[]>>;
};

function listSlugs(locale: Locale): string[] {
  const dir = path.join(GLOSSARY_ROOT, locale);
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
      .map((f) => f.replace(/\.mdx?$/, ''));
  } catch {
    return [];
  }
}

function readTitle(locale: Locale, slug: string): string | null {
  for (const ext of ['.md', '.mdx']) {
    const file = path.join(GLOSSARY_ROOT, locale, slug + ext);
    try {
      statSync(file);
    } catch {
      continue;
    }
    const { data } = matter(readFileSync(file, 'utf8'));
    const title = typeof data.title === 'string' ? data.title.trim() : '';
    return title || null;
  }
  return null;
}

function readEnFrontmatter(slug: string): Record<string, unknown> {
  for (const ext of ['.md', '.mdx']) {
    const file = path.join(GLOSSARY_ROOT, 'en', slug + ext);
    try {
      statSync(file);
    } catch {
      continue;
    }
    return matter(readFileSync(file, 'utf8')).data as Record<string, unknown>;
  }
  return {};
}

function normaliseAliases(raw: unknown): Partial<Record<Locale, string[]>> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const out: Partial<Record<Locale, string[]>> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!(LOCALES as readonly string[]).includes(k)) continue;
    const list = Array.isArray(v)
      ? v.filter((x): x is string => typeof x === 'string').map((s) => s.trim()).filter(Boolean)
      : [];
    if (list.length) out[k as Locale] = list;
  }
  return Object.keys(out).length ? out : undefined;
}

function build(): Record<string, Entry> {
  const enSlugs = listSlugs('en').sort();
  const termbase: Record<string, Entry> = {};

  for (const slug of enSlugs) {
    const enTitle = readTitle('en', slug);
    if (!enTitle) continue; // en is the source of truth

    const fm = readEnFrontmatter(slug);
    const titles: Partial<Record<Locale, string>> = {};
    for (const locale of LOCALES) {
      const t = readTitle(locale, slug);
      if (t) titles[locale] = t;
    }

    const entry: Entry = { en: enTitle, titles };
    if (typeof fm.level === 'number') entry.level = fm.level;
    const aliases = normaliseAliases(fm.aliasesByLocale);
    if (aliases) entry.aliasesByLocale = aliases;

    termbase[slug] = entry;
  }

  return termbase;
}

function serialise(tb: Record<string, Entry>): string {
  return JSON.stringify(tb, null, 2) + '\n';
}

function main() {
  const termbase = build();
  const json = serialise(termbase);
  const slugCount = Object.keys(termbase).length;

  if (CHECK) {
    let current = '';
    try {
      current = readFileSync(OUT_PATH, 'utf8');
    } catch {
      console.error(`❌ ${path.relative(REPO_ROOT, OUT_PATH)} is missing. Run: bun scripts/build-termbase.ts`);
      process.exitCode = 1;
      return;
    }
    if (current !== json) {
      console.error(`❌ ${path.relative(REPO_ROOT, OUT_PATH)} is out of date. Run: bun scripts/build-termbase.ts`);
      process.exitCode = 1;
      return;
    }
    console.log(`✅ termbase.json is up to date (${slugCount} concepts).`);
    return;
  }

  writeFileSync(OUT_PATH, json, 'utf8');
  const localeCoverage = LOCALES.map((l) => {
    const n = Object.values(termbase).filter((e) => e.titles[l]).length;
    return `${l}=${n}`;
  }).join(' ');
  console.log(`✅ Wrote ${path.relative(REPO_ROOT, OUT_PATH)} — ${slugCount} concepts.`);
  console.log(`   Title coverage: ${localeCoverage}`);
}

main();
