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

// link-suggest INBOUND counts pages that mention but DON'T yet link the term.
// Pages that already link it are mentions too — count those from the raw href.
function countAlreadyLinking(slug: string): number {
  const href = `/en/glossary/${slug}/`;
  const noSlash = href.replace(/\/$/, '');
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
      if (path.basename(full) === `${slug}.md`) continue; // don't count the entry itself
      const raw = readFileSync(full, 'utf8');
      if (raw.includes(`](${href}`) || raw.includes(`](${noSlash}`)) count++;
    }
  }
  return count;
}

function inboundCount(slug: string): number {
  const file = path.join(GLOSSARY_EN, `${slug}.md`);
  try {
    statSync(file);
  } catch {
    return -1;
  }
  const res = spawnSync('bun', [LINK_SUGGEST, '--json', '--no-related', file], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (res.status !== 0 || !res.stdout) return 0;
  try {
    const parsed = JSON.parse(res.stdout);
    const report = Array.isArray(parsed) ? parsed[0] : parsed.reports?.[0] ?? parsed;
    const inbound = report?.inbound;
    return Array.isArray(inbound) ? inbound.length : 0;
  } catch {
    return 0;
  }
}

function main() {
  const slugs = slugArgs.length ? slugArgs : listEnSlugs();
  const rows: { slug: string; mentions: number; linked: number; candidates: number }[] = [];

  let done = 0;
  for (const slug of slugs) {
    const candidates = inboundCount(slug);
    if (candidates < 0) {
      if (!JSON_OUT) console.error(`   (skip ${slug}: no en entry)`);
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
    console.log(JSON.stringify(filtered, null, 2));
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
}

main();
