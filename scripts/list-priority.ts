#!/usr/bin/env bun
// List/sort content by editorial `priority:` tier (P0/P1/P2).
// Files with no `priority:` line are treated as P2 (the documented default).
// FAQ = blog articles selected via `format: 'faq'` or a `faq` tag.
//
// Usage:
//   bun priority:list                       # all collections, en, P0+P1 (P2 hidden)
//   bun priority:list --tier P0             # only P0
//   bun priority:list --collection tld      # glossary | tld | blog | faq
//   bun priority:list --locale zh           # a different locale (default en)
//   bun priority:list --all                 # include P2 too
//   bun priority:list --json                # machine-readable output
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const ROOT = process.cwd();
const TIERS = ['P0', 'P1', 'P2'] as const;
type Tier = (typeof TIERS)[number];
const COLLECTIONS = ['glossary', 'tld', 'blog'] as const;

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}
const has = (name: string) => process.argv.includes(`--${name}`);

const locale = arg('locale') ?? 'en';
const tierFilter = arg('tier')?.toUpperCase() as Tier | undefined;
const collArg = arg('collection')?.toLowerCase();
const wantFaq = collArg === 'faq';
const showAll = has('all') || tierFilter === 'P2';
const asJson = has('json');

type Row = { collection: string; slug: string; tier: Tier; title: string };

function isFaq(fm: Record<string, unknown>): boolean {
  const tags = Array.isArray(fm.tags) ? (fm.tags as string[]) : [];
  return fm.format === 'faq' || tags.includes('faq');
}

function collect(collection: string): Row[] {
  const dir = path.join(ROOT, 'content', collection, locale);
  if (!existsSync(dir)) return [];
  const rows: Row[] = [];
  for (const entry of readdirSync(dir)) {
    if (!/\.(md|mdx)$/.test(entry)) continue;
    const fm = matter(readFileSync(path.join(dir, entry), 'utf8')).data as Record<string, unknown>;
    if (collection === 'blog' && wantFaq && !isFaq(fm)) continue;
    // Stored frontmatter is canonical exact-case (P0/P1/P2), matching the
    // data:validate enum; anything else is treated as P2 (the default).
    const raw = typeof fm.priority === 'string' ? fm.priority : 'P2';
    const tier = (TIERS as readonly string[]).includes(raw) ? (raw as Tier) : 'P2';
    rows.push({
      collection: wantFaq ? 'faq' : collection,
      slug: entry.replace(/\.(md|mdx)$/, ''),
      tier,
      title: typeof fm.title === 'string' ? fm.title : '',
    });
  }
  return rows;
}

const targets = wantFaq ? ['blog'] : collArg ? [collArg] : [...COLLECTIONS];
let rows = targets.flatMap(collect);
if (tierFilter) rows = rows.filter((r) => r.tier === tierFilter);
if (!showAll) rows = rows.filter((r) => r.tier !== 'P2');
rows.sort(
  (a, b) =>
    a.collection.localeCompare(b.collection) ||
    a.tier.localeCompare(b.tier) ||
    a.slug.localeCompare(b.slug),
);

if (asJson) {
  console.log(JSON.stringify(rows, null, 2));
} else {
  if (rows.length === 0) {
    console.log('(no matching content)');
  } else {
    let group = '';
    for (const r of rows) {
      if (r.collection !== group) {
        group = r.collection;
        console.log(`\n${group} (${locale})`);
      }
      console.log(`  ${r.tier}  ${r.slug}${r.title ? `  — ${r.title}` : ''}`);
    }
    const counts = rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.tier] = (acc[r.tier] ?? 0) + 1;
      return acc;
    }, {});
    console.log(
      `\n${rows.length} item(s): ` +
        TIERS.map((t) => `${t}=${counts[t] ?? 0}`).join(' '),
    );
  }
}
