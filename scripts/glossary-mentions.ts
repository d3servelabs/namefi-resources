#!/usr/bin/env bun
/**
 * glossary-mentions.ts — per-term DEMAND metric for L1→L2 promotion.
 *
 * "Demand" is the number of DISTINCT posts whose prose mentions a glossary term
 * — NOT the number of links actually added (the cross-link skill caps those at
 * ≤5 per term by design). So a term like `registry` can be *mentioned* by 53
 * posts while only ~5 get a back-link. The mention count is the promotion gate
 * (GOAL: promote L1→L2 at ≥ 8 distinct mentions, plus structural anchors).
 *
 * To stay consistent with the cross-link skill's notion of a "mention", this
 * reuses `link-suggest.ts --json` and counts its INBOUND candidates (one per
 * distinct source page that mentions the term but doesn't link it yet) PLUS
 * pages that already link it (those are mentions too — they just aren't
 * candidates anymore). It scopes counting to the `en` corpus by default.
 *
 * Usage (from repo root):
 *   bun scripts/glossary-mentions.ts                 # ranked table, all en terms
 *   bun scripts/glossary-mentions.ts --json          # machine-readable
 *   bun scripts/glossary-mentions.ts --min=8         # only terms at/above gate
 *   bun scripts/glossary-mentions.ts registry udrp   # specific slugs
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import matter from 'gray-matter';
import { resolveEntryFile } from './glossary-fs.ts';

const REPO_ROOT = process.cwd();
const GLOSSARY_EN = path.join(REPO_ROOT, 'content', 'glossary', 'en');
const LINK_SUGGEST = path.join(REPO_ROOT, '.agents', 'skills', 'cross-link', 'link-suggest.ts');

const argv = process.argv.slice(2);
const JSON_OUT = argv.includes('--json');
const minArg = argv.find((a) => a.startsWith('--min='))?.slice(6);
const MIN = minArg ? parseInt(minArg, 10) : 0;
const slugArgs = argv.filter((a) => !a.startsWith('--')).map((s) => s.replace(/\.mdx?$/, '').replace(/.*\//, ''));

function listEnSlugs(): string[] {
  // Dedup: a slug present as both .md and .mdx must yield one row, not two.
  return [
    ...new Set(
      readdirSync(GLOSSARY_EN)
        .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
        .map((f) => f.replace(/\.mdx?$/, '')),
    ),
  ].sort();
}

// Recursive markdown walk — link-suggest builds its inbound corpus this way, so
// the linked-count half must match it (nested posts count too).
function listMarkdownRec(dir: string): string[] {
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const e of entries) {
    const full = path.join(dir, e);
    if (statSync(full).isDirectory()) out.push(...listMarkdownRec(full));
    else if (e.endsWith('.md') || e.endsWith('.mdx')) out.push(full);
  }
  return out;
}

// Resolve an en glossary entry to its canonical file via the shared resolver,
// so this script targets the same file as build-termbase.
function resolveEnEntry(slug: string): string | null {
  return resolveEntryFile(GLOSSARY_EN, slug);
}

// link-suggest INBOUND counts pages that mention but DON'T yet link the term.
// Pages that already link it are mentions too — count those from the raw href.
function countAlreadyLinking(slug: string): number {
  const href = `/en/glossary/${slug}/`;
  const noSlash = href.replace(/\/$/, '');
  const selfEntry = resolveEnEntry(slug); // the glossary entry itself — never count it
  let count = 0;
  const enRoots = ['blog', 'tld', 'partners', 'glossary'].map((c) => path.join(REPO_ROOT, 'content', c, 'en'));
  for (const root of enRoots) {
    for (const full of listMarkdownRec(root)) {
      if (selfEntry && full === selfEntry) continue; // don't count the entry itself
      let raw: string;
      try {
        raw = readFileSync(full, 'utf8');
      } catch {
        continue; // one unreadable corpus file shouldn't abort the whole count
      }
      // link-suggest excludes drafts from its inbound corpus; mirror that here so
      // a draft page linking the term can't inflate demand past the cross-link metric.
      let isDraft = false;
      try {
        isDraft = matter(raw).data?.draft === true;
      } catch {
        /* unparseable frontmatter — treat as non-draft, same as the loader */
      }
      if (isDraft) continue;
      if (raw.includes(`](${href}`) || raw.includes(`](${noSlash}`)) count++;
    }
  }
  return count;
}

// Returns the distinct-inbound-mention count, or null when link-suggest could
// not be run/parsed (non-zero exit, empty stdout, or unparseable JSON). null is
// NOT 0 — a failed subprocess that silently counted as 0 would drop every prose
// mention that tool would have found and skew the promotion ranking.
const SLUG_MISSING = Symbol('slug-missing');
function inboundCount(slug: string): number | null | typeof SLUG_MISSING {
  const file = resolveEnEntry(slug);
  if (!file) return SLUG_MISSING;
  const res = spawnSync('bun', [LINK_SUGGEST, '--json', '--no-related', file], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (res.status !== 0 || !res.stdout) {
    process.stderr.write(`\n   ⚠️  link-suggest failed for ${slug} (exit ${res.status ?? '?'}); mention count unknown.\n`);
    return null;
  }
  try {
    const parsed = JSON.parse(res.stdout);
    const report = Array.isArray(parsed) ? parsed[0] : parsed.reports?.[0] ?? parsed;
    const inbound = report?.inbound;
    return Array.isArray(inbound) ? inbound.length : null;
  } catch {
    process.stderr.write(`\n   ⚠️  link-suggest output for ${slug} was unparseable; mention count unknown.\n`);
    return null;
  }
}

function main() {
  const slugs = slugArgs.length ? slugArgs : listEnSlugs();
  const rows: { slug: string; mentions: number; linked: number; candidates: number }[] = [];

  const failed: string[] = [];
  const missing: string[] = [];
  let done = 0;
  for (const slug of slugs) {
    const candidates = inboundCount(slug);
    if (candidates === SLUG_MISSING) {
      missing.push(slug);
      if (!JSON_OUT) console.error(`   (skip ${slug}: no en entry)`);
      continue;
    }
    if (candidates === null) {
      failed.push(slug); // link-suggest failed — do NOT silently treat as 0
      done++;
      continue;
    }
    const linked = countAlreadyLinking(slug);
    rows.push({ slug, mentions: candidates + linked, linked, candidates });
    done++;
    if (!JSON_OUT) process.stderr.write(`\r   counting… ${done}/${slugs.length}`);
  }
  if (!JSON_OUT) process.stderr.write('\r' + ' '.repeat(40) + '\r');

  rows.sort((a, b) => b.mentions - a.mentions || a.slug.localeCompare(b.slug));
  const filtered = rows.filter((r) => r.mentions >= MIN);

  // Explicit slug args that ALL lack an en entry must fail loudly — a typo must
  // not read as "0 mentions". (No args = scan everything, where empty is fine.)
  const allRequestedMissing = slugArgs.length > 0 && rows.length === 0 && failed.length === 0;
  if (allRequestedMissing) {
    console.error(`Error: none of the requested slug(s) have an en glossary entry: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (JSON_OUT) {
    console.log(JSON.stringify({ ranked: filtered, failed }, null, 2));
    if (failed.length) process.exitCode = 1;
    return;
  }

  console.log(`Glossary mention demand (en corpus) — gate for L1→L2 is ≥ 8 distinct posts.\n`);
  console.log(`  ${'#'.padStart(4)}  ${'mentions'.padStart(8)}  ${'(linked'.padStart(7)} ${'unlinked)'.padEnd(9)}  term`);
  filtered.forEach((r, i) => {
    const gate = r.mentions >= 8 ? '★' : ' ';
    console.log(`  ${String(i + 1).padStart(4)}  ${String(r.mentions).padStart(8)}  ${String(r.linked).padStart(7)} ${String(r.candidates).padEnd(9)} ${gate} ${r.slug}`);
  });
  const over = filtered.filter((r) => r.mentions >= 8).length;
  console.log(`\n  ${over} term(s) at/above the ≥8 promotion gate.`);
  if (failed.length) {
    console.error(`\n  ⚠️  ${failed.length} term(s) could not be counted (link-suggest failed): ${failed.join(', ')}`);
    console.error(`      Their ranking is UNKNOWN, not zero — re-run before trusting the gate.`);
    process.exitCode = 1;
  }
}

main();
