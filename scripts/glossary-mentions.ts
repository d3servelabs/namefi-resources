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

const REPO_ROOT = process.cwd();
const GLOSSARY_EN = path.join(REPO_ROOT, 'content', 'glossary', 'en');
const LINK_SUGGEST = path.join(REPO_ROOT, '.agents', 'skills', 'cross-link', 'link-suggest.ts');

const argv = process.argv.slice(2);
const JSON_OUT = argv.includes('--json');
const minArg = argv.find((a) => a.startsWith('--min='))?.slice(6);
const MIN = minArg ? parseInt(minArg, 10) : 0;
const slugArgs = argv.filter((a) => !a.startsWith('--')).map((s) => s.replace(/\.mdx?$/, '').replace(/.*\//, ''));

function listEnSlugs(): string[] {
  return readdirSync(GLOSSARY_EN)
    .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx?$/, ''))
    .sort();
}

// Resolve an en glossary entry to its actual file, honouring both extensions
// (build-termbase.ts and translate-glossary.ts already do) so an .mdx-only term
// is never mistaken for missing.
function resolveEnEntry(slug: string): string | null {
  for (const ext of ['.md', '.mdx']) {
    const f = path.join(GLOSSARY_EN, slug + ext);
    try {
      statSync(f);
      return f;
    } catch {
      /* next */
    }
  }
  return null;
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
    let files: string[] = [];
    try {
      files = readdirSync(root).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
    } catch {
      continue;
    }
    for (const f of files) {
      const full = path.join(root, f);
      if (selfEntry && full === selfEntry) continue; // don't count the entry itself
      const raw = readFileSync(full, 'utf8');
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
  let done = 0;
  for (const slug of slugs) {
    const candidates = inboundCount(slug);
    if (candidates === SLUG_MISSING) {
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
