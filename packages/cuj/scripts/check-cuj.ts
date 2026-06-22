/**
 * check:cuj — Critical User Journey guardrail.
 *
 * Three jobs:
 *   1. Registry integrity (blocking)  — ids well-formed, unique, area matches prefix.
 *   2. Reference integrity (blocking) — every `CUJ-<Area>.<n>` / `data-cuj="<Area>.<n>"`
 *      reference in code resolves to a real, non-deprecated id.
 *   3. Coverage (advisory)            — which `live` journeys have ≥1 reference
 *      (an e2e tag or a `data-cuj` marker). Reported, not enforced — until `--strict`.
 *
 * Usage:
 *   bun run scripts/check-cuj.ts            # blocks only on integrity errors
 *   bun run scripts/check-cuj.ts --strict   # also fails on deprecated refs + any uncovered live journey
 *
 * Exit: 1 if any error (or, under --strict, any warning / uncovered live journey); else 0.
 */
import { type Dirent, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CUJS, type CujArea } from '../src/registry';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '../../..');

const SCAN_ROOTS = ['apps', 'tests'];
const PRUNE_DIRS = new Set([
  'node_modules',
  '.next',
  '.turbo',
  'dist',
  'build',
  'coverage',
  'out',
  '.storybook',
]);
const SCAN_EXT = /\.(ts|tsx|mts|cts|js|jsx)$/;

const ID_RE = /\bCUJ-[A-Za-z][A-Za-z0-9]*\.\d+\b/g;
const DATA_CUJ_RE = /data-cuj\s*=\s*["'`]([A-Za-z][A-Za-z0-9]*\.\d+)["'`]/g;
const ID_SHAPE = /^CUJ-([A-Za-z][A-Za-z0-9]*)\.\d+$/;
// `@cuj ['CUJ-Owner.1', 'CUJ-Owner.2']` — function marker carrying an ordered
// array of ids (see the convention in ../src/registry.ts). Captures the
// bracket body so its ids can be checked for ordering + uniqueness. `[\s\S]*?`
// (not `[^\]]*` line-by-line) so arrays wrapped across multiple lines — which a
// shared function with many ids will be — are still validated, not bypassed.
const CUJ_ANNOTATION_RE = /@cuj\b\s*\[([\s\S]*?)\]/g;
const ID_WITH_AREA_AND_N = /^CUJ-([A-Za-z][A-Za-z0-9]*)\.(\d+)$/;

interface Ref {
  readonly id: string;
  readonly file: string;
  readonly line: number;
}

/** Canonical order for `@cuj` arrays: by area (alphabetical), then number. */
function compareCujIds(a: string, b: string): number {
  const pa = ID_WITH_AREA_AND_N.exec(a);
  const pb = ID_WITH_AREA_AND_N.exec(b);
  if (!pa || !pb) return a < b ? -1 : a > b ? 1 : 0;
  if (pa[1] !== pb[1]) return pa[1] < pb[1] ? -1 : 1;
  return Number(pa[2]) - Number(pb[2]);
}

/** Validate every `@cuj [...]` annotation is non-empty, deduped, and ordered. */
function collectAnnotationErrors(): string[] {
  const errs: string[] = [];
  for (const root of SCAN_ROOTS) {
    for (const file of walk(join(REPO_ROOT, root))) {
      const rel = relative(REPO_ROOT, file);
      const content = readFileSync(file, 'utf8');
      for (const m of content.matchAll(CUJ_ANNOTATION_RE)) {
        // 1-based line of the `@cuj` token, derived from the match offset.
        const line = content.slice(0, m.index).split('\n').length;
        const at = `${rel}:${line}`;
        const ids = [...m[1].matchAll(ID_RE)].map((x) => x[0]);
        if (ids.length === 0) {
          errs.push(`@cuj annotation has no valid CUJ ids  (${at})`);
          continue;
        }
        for (let k = 1; k < ids.length; k += 1) {
          const cmp = compareCujIds(ids[k - 1], ids[k]);
          if (cmp === 0)
            errs.push(`@cuj annotation has duplicate ${ids[k]}  (${at})`);
          else if (cmp > 0)
            errs.push(
              `@cuj annotation not ordered: ${ids[k - 1]} before ${ids[k]} — sort by area then number  (${at})`,
            );
        }
      }
    }
  }
  return errs;
}

function* walk(dir: string): Generator<string> {
  let entries: Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (!PRUNE_DIRS.has(e.name)) yield* walk(join(dir, e.name));
    } else if (SCAN_EXT.test(e.name)) {
      yield join(dir, e.name);
    }
  }
}

function collectRefs(): Ref[] {
  const refs: Ref[] = [];
  for (const root of SCAN_ROOTS) {
    for (const file of walk(join(REPO_ROOT, root))) {
      const rel = relative(REPO_ROOT, file);
      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((text, i) => {
        for (const m of text.matchAll(ID_RE))
          refs.push({ id: m[0], file: rel, line: i + 1 });
        for (const m of text.matchAll(DATA_CUJ_RE))
          refs.push({ id: `CUJ-${m[1]}`, file: rel, line: i + 1 });
      });
    }
  }
  return refs;
}

const main = () => {
  const strict = process.argv.includes('--strict');
  const errors: string[] = [];
  const warnings: string[] = [];

  // ── 1. Registry integrity ────────────────────────────────────────────────
  const seen = new Set<string>();
  const validIds = new Set<string>();
  const deprecatedIds = new Set<string>();
  const liveIds = new Set<string>();
  for (const c of CUJS) {
    if (seen.has(c.id)) errors.push(`registry: duplicate id ${c.id}`);
    seen.add(c.id);
    const shape = ID_SHAPE.exec(c.id);
    if (!shape) {
      errors.push(`registry: malformed id ${c.id} (expected CUJ-<Area>.<n>)`);
    } else if (shape[1] !== (c.area as CujArea)) {
      errors.push(
        `registry: id ${c.id} prefix "${shape[1]}" != area "${c.area}"`,
      );
    }
    validIds.add(c.id);
    if (c.status === 'deprecated') deprecatedIds.add(c.id);
    if (c.status === 'live') liveIds.add(c.id);
  }

  // ── 2. Reference integrity ───────────────────────────────────────────────
  const refs = collectRefs();
  const referenced = new Set<string>();
  for (const r of refs) {
    referenced.add(r.id);
    if (!validIds.has(r.id))
      errors.push(`unknown CUJ id referenced: ${r.id}  (${r.file}:${r.line})`);
    else if (deprecatedIds.has(r.id))
      warnings.push(
        `deprecated CUJ referenced: ${r.id}  (${r.file}:${r.line})`,
      );
  }

  // ── 2b. `@cuj` annotation integrity (blocking) ───────────────────────────
  errors.push(...collectAnnotationErrors());

  // ── 3. Coverage (advisory) ───────────────────────────────────────────────
  const uncoveredLive = [...liveIds].filter((id) => !referenced.has(id)).sort();
  const coveredLive = liveIds.size - uncoveredLive.length;

  // ── Report ───────────────────────────────────────────────────────────────
  const counts = CUJS.reduce<Record<string, number>>((a, c) => {
    a[c.status] = (a[c.status] ?? 0) + 1;
    return a;
  }, {});
  console.log('\nCUJ guardrail — rule: critical-user-journeys\n');
  console.log(
    `Registry: ${CUJS.length} journeys (${[
      'live',
      'partial',
      'draft',
      'deprecated',
    ]
      .filter((s) => counts[s])
      .map((s) => `${counts[s]} ${s}`)
      .join(' · ')})`,
  );
  console.log(
    `References in code: ${refs.length} (resolving to ${referenced.size} distinct id(s))\n`,
  );

  for (const e of errors) console.log(`  ✗ ${e}`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
  if (errors.length || warnings.length) console.log('');

  console.log(
    `Coverage (live journeys): ${coveredLive}/${liveIds.size} referenced.`,
  );
  if (uncoveredLive.length)
    console.log(
      `  uncovered: ${uncoveredLive.join(', ')}\n  (advisory — tag an e2e test name with the id, e.g. "@${uncoveredLive[0]}", or add data-cuj="${uncoveredLive[0].replace('CUJ-', '')}")`,
    );

  console.log(
    `\nTotal: ${errors.length} error(s), ${warnings.length} warning(s)${
      strict && uncoveredLive.length
        ? `, ${uncoveredLive.length} uncovered live journey(s)`
        : ''
    }.`,
  );

  const fail =
    errors.length > 0 ||
    (strict && (warnings.length > 0 || uncoveredLive.length > 0));
  process.exit(fail ? 1 : 0);
};

main();
