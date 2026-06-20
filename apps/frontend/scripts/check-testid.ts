#!/usr/bin/env bun
/**
 * check-testid — advisory guardrail for the `testid-hierarchy` rule.
 *
 * Test ids are language-independent, refactor-stable handles for rendered
 * elements. This script keeps them honest: hierarchical (dotted), namespaced to
 * match the i18n key hierarchy, and collision-free. Mirrors `check:mobile`:
 * advisory by default, ratchetable to blocking via a frozen baseline.
 *
 * Detectors (suppress a line with a trailing `testid-ok` comment, or a whole
 * file with a `@testid-ignore` marker):
 *   testid-collision      the same LITERAL id rendered from >1 distinct site
 *                         (every instance is reported so you can disambiguate).
 *   testid-flat           a literal id with no `.` — not hierarchical
 *                         (e.g. "tr", "announcement-banner").
 *   testid-unknown-ns     first segment isn't a known i18n namespace or an
 *                         allowed primitive root — likely an invented namespace.
 *   coverage-gap          a file renders interactive controls but has zero
 *                         data-testid (file-level; the rollout work-list).
 *
 * Usage:
 *   bun run check:testid                  # advisory report (always exit 0)
 *   bun run check:testid -- --strict      # exit 1 if any finding is NEW above baseline
 *   bun run check:testid -- --update-baseline
 *   bun run check:testid -- --json
 */
import {
  readFileSync,
  readdirSync,
  writeFileSync,
  existsSync,
  statSync,
} from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = join(SCRIPT_DIR, '..');
const SRC_ROOT = join(FRONTEND_ROOT, 'src');
const MESSAGES_ROOT = join(FRONTEND_ROOT, 'messages', 'en');
const BASELINE_PATH = join(SCRIPT_DIR, 'testid-baseline.json');

// Primitive/structural roots that legitimately own a generic top-level segment
// (the "generic atom" tier of the hierarchy — they come from a component, not a
// feature namespace). Their *generated* children (`table.head`, `dialog.close`)
// are fine; their bare generic defaults ("table") are still flagged as flat.
const PRIMITIVE_ROOTS = new Set([
  'table',
  'dialog',
  'sheet',
  'menu',
  'toast',
  'tooltip',
  'popover',
  'form',
  'field',
]);

// Known i18n namespaces = the message namespace files (cart, domains, …) plus the
// two cross-cutting tiers. Built at runtime so it tracks messages/en/ exactly.
function knownNamespaces(): Set<string> {
  const ns = new Set<string>(['shared', 'common']);
  if (existsSync(MESSAGES_ROOT)) {
    for (const f of readdirSync(MESSAGES_ROOT)) {
      if (f.endsWith('.json')) ns.add(f.replace(/\.json$/, ''));
    }
  }
  return ns;
}

type Detector =
  | 'testid-collision'
  | 'testid-flat'
  | 'testid-unknown-ns'
  | 'coverage-gap';

interface Finding {
  detector: Detector;
  file: string; // relative to apps/frontend
  line: number;
  snippet: string;
  message: string;
}

const MESSAGES: Record<Detector, string> = {
  'testid-collision':
    'duplicate literal data-testid — generate a unique id (suffix with the item data, or thread a root namespace through the primitive). See testid-hierarchy rule.',
  'testid-flat':
    'non-hierarchical data-testid (no dot) — use <namespace>.<section>.<element> mirroring the i18n key (e.g. cart.summary.checkout-button).',
  'testid-unknown-ns':
    "first segment isn't a known i18n namespace or primitive root — start the id with the namespace the component already uses for copy.",
  'coverage-gap':
    'file renders interactive controls but has no data-testid — add hierarchical ids to its buttons/inputs/links (rollout work-list).',
};

// Interactive controls a test needs to find/click. File-level coverage signal.
const INTERACTIVE_RE =
  /<button\b|<input\b|<textarea\b|<select\b|<a\s+[^>]*href|\.Trigger\b|\bonClick=/;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name === '__tests__' ||
        entry.name === '.next'
      )
        continue;
      walk(full, out);
    } else if (
      entry.name.endsWith('.tsx') &&
      !entry.name.endsWith('.stories.tsx') &&
      !entry.name.endsWith('.test.tsx') &&
      !entry.name.endsWith('.spec.tsx')
    ) {
      out.push(full);
    }
  }
  return out;
}

// Static (string-literal) data-testid occurrences. Template-literal/expression
// ids (`data-testid={`domains.list.row.${name}`}`) are intentionally dynamic and
// not collision-checked, but a literal prefix inside them is still parsed for ns.
const STATIC_RE =
  /data-testid=(?:"([^"]*)"|'([^']*)'|\{"([^"]*)"\}|\{'([^']*)'\})/g;
const DYNAMIC_PREFIX_RE = /data-testid=\{`([^`$]*)/g;

// Lines that are obviously a comment (single-line, block start, or block
// continuation). A `data-testid=` written in a docstring/example (this rule, the
// table-primitive comments) is not a real id — skip those so they don't show up
// as flat/collision/unknown-ns false positives. String-literal mentions on real
// code lines are rarer; suppress those with a trailing `testid-ok`. (Same naive,
// no-AST approach as check:mobile; an advisory tool doesn't warrant a parser.)
const COMMENT_LINE_RE = /^\s*(\/\/|\/\*|\*)/;

/** A line carries a *real* data-testid (not just a comment mention). */
function hasRealTestid(lines: string[]): boolean {
  return lines.some(
    (l) => l.includes('data-testid=') && !COMMENT_LINE_RE.test(l),
  );
}

interface IdHit {
  value: string;
  line: number;
  dynamic: boolean;
}

function collectIds(content: string, lines: string[]): IdHit[] {
  const hits: IdHit[] = [];
  const lineAt = (idx: number) => {
    let line = 1;
    for (let i = 0; i < idx && i < content.length; i++)
      if (content[i] === '\n') line++;
    return line;
  };
  const onComment = (line: number) =>
    COMMENT_LINE_RE.test(lines[line - 1] ?? '');
  for (const m of content.matchAll(STATIC_RE)) {
    const line = lineAt(m.index ?? 0);
    if (onComment(line)) continue;
    const value = m[1] ?? m[2] ?? m[3] ?? m[4] ?? '';
    hits.push({ value, line, dynamic: false });
  }
  for (const m of content.matchAll(DYNAMIC_PREFIX_RE)) {
    const line = lineAt(m.index ?? 0);
    if (onComment(line)) continue;
    const prefix = (m[1] ?? '').replace(/\.$/, '');
    if (prefix) hits.push({ value: prefix, line, dynamic: true });
  }
  return hits;
}

function main() {
  const argv = process.argv.slice(2);
  const strict = argv.includes('--strict');
  const updateBaseline = argv.includes('--update-baseline');
  const asJson = argv.includes('--json');

  if (!existsSync(SRC_ROOT) || !statSync(SRC_ROOT).isDirectory()) {
    console.error(`check-testid: src not found at ${SRC_ROOT}`);
    process.exit(2);
  }

  const namespaces = knownNamespaces();
  const findings: Finding[] = [];
  // value -> list of {file,line} for collision detection (static literals only)
  const literalSites = new Map<string, { file: string; line: number }[]>();
  let filesWithInteractive = 0;
  let filesWithTestid = 0;
  let totalStaticIds = 0;
  let totalDynamicIds = 0;

  for (const file of walk(SRC_ROOT)) {
    const rel = relative(FRONTEND_ROOT, file);
    const content = readFileSync(file, 'utf8');
    if (content.includes('@testid-ignore')) continue;
    const lines = content.split('\n');
    const suppressed = (ln: number) =>
      (lines[ln - 1] ?? '').includes('testid-ok');

    const hits = collectIds(content, lines);
    const hasInteractive = INTERACTIVE_RE.test(content);
    // Presence of a real data-testid (incl. generated template-literal ids whose
    // prefix collectIds skips) on a non-comment line — not just any text match.
    const hasTestid = hasRealTestid(lines);
    if (hasInteractive) filesWithInteractive++;
    // Coverage ratio = interactive files that carry a test id, so the numerator
    // must be a subset of the denominator (never > 100%). A non-interactive
    // file with a test id doesn't count toward interactive coverage.
    if (hasInteractive && hasTestid) filesWithTestid++;

    for (const hit of hits) {
      if (suppressed(hit.line)) continue;
      if (hit.dynamic) totalDynamicIds++;
      else totalStaticIds++;

      // flat (no dot) — only meaningful for static literals; a dynamic prefix
      // like `domains.list.row` already passed its dotted check via the prefix.
      if (!hit.value.includes('.')) {
        findings.push({
          detector: 'testid-flat',
          file: rel,
          line: hit.line,
          snippet: hit.value,
          message: MESSAGES['testid-flat'],
        });
      } else {
        const root = hit.value.split('.')[0];
        if (!namespaces.has(root) && !PRIMITIVE_ROOTS.has(root)) {
          findings.push({
            detector: 'testid-unknown-ns',
            file: rel,
            line: hit.line,
            snippet: hit.value,
            message: MESSAGES['testid-unknown-ns'],
          });
        }
      }

      if (!hit.dynamic) {
        const arr = literalSites.get(hit.value) ?? [];
        arr.push({ file: rel, line: hit.line });
        literalSites.set(hit.value, arr);
      }
    }

    // coverage gap (file-level)
    if (hasInteractive && !hasTestid && !rel.startsWith('src/components/ui/')) {
      const ln =
        lines.findIndex(
          (t) => INTERACTIVE_RE.test(t) && !t.includes('testid-ok'),
        ) + 1;
      findings.push({
        detector: 'coverage-gap',
        file: rel,
        line: Math.max(ln, 1),
        snippet: '(interactive controls, no data-testid)',
        message: MESSAGES['coverage-gap'],
      });
    }
  }

  // collisions: any literal value used at >1 site
  for (const [value, sites] of literalSites) {
    if (sites.length < 2) continue;
    for (const s of sites) {
      findings.push({
        detector: 'testid-collision',
        file: s.file,
        line: s.line,
        // Snippet is the bare id (no `(×N)` count): the baseline key derives
        // from the snippet, so embedding a count would make every collision
        // entry churn its key whenever the number of sites changes, and
        // `--strict` would flag unchanged duplicates as novel. The grouped
        // header already reports the total, and each site is listed.
        snippet: value,
        message: MESSAGES['testid-collision'],
      });
    }
  }

  findings.sort(
    (a, b) =>
      a.detector.localeCompare(b.detector) ||
      a.file.localeCompare(b.file) ||
      a.line - b.line,
  );

  const keyOf = (f: Finding) => `${f.detector}|${f.file}|${f.snippet}`;
  const baseline: Set<string> = existsSync(BASELINE_PATH)
    ? new Set<string>(
        JSON.parse(readFileSync(BASELINE_PATH, 'utf8')).keys ?? [],
      )
    : new Set<string>();
  const novel = findings.filter((f) => !baseline.has(keyOf(f)));

  if (updateBaseline) {
    const keys = [...new Set(findings.map(keyOf))].sort();
    writeFileSync(BASELINE_PATH, `${JSON.stringify({ keys }, null, 2)}\n`);
    console.log(
      `Wrote baseline with ${keys.length} entries → ${relative(FRONTEND_ROOT, BASELINE_PATH)}`,
    );
    return;
  }

  const coveragePct =
    filesWithInteractive === 0
      ? 100
      : Math.round((filesWithTestid / filesWithInteractive) * 1000) / 10;

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          total: findings.length,
          novel: novel.length,
          coverage: {
            filesWithInteractive,
            filesWithTestid,
            coveragePct,
            totalStaticIds,
            totalDynamicIds,
          },
          findings,
        },
        null,
        2,
      ),
    );
    process.exit(strict && novel.length > 0 ? 1 : 0);
  }

  const byDetector = new Map<Detector, Finding[]>();
  for (const f of findings) {
    const list = byDetector.get(f.detector);
    if (list) list.push(f);
    else byDetector.set(f.detector, [f]);
  }

  console.log(
    '\nTest-id hierarchy guardrail (advisory) — rule: testid-hierarchy\n',
  );
  console.log(
    `Coverage: ${filesWithTestid}/${filesWithInteractive} interactive files carry a data-testid (${coveragePct}%); ` +
      `${totalStaticIds} static + ${totalDynamicIds} generated ids.\n`,
  );
  for (const [det, list] of byDetector) {
    // coverage-gap can be huge — summarize, list first 40
    const shown = det === 'coverage-gap' ? list.slice(0, 40) : list;
    console.log(`■ ${det}  (${list.length})`);
    console.log(`  ${MESSAGES[det]}`);
    for (const f of shown) console.log(`    ${f.file}:${f.line}  ${f.snippet}`);
    if (shown.length < list.length)
      console.log(
        `    … and ${list.length - shown.length} more (use --json for all)`,
      );
    console.log('');
  }
  console.log(
    `Total: ${findings.length} finding(s)${baseline.size ? `, ${novel.length} new above baseline` : ''}.`,
  );
  if (!baseline.size)
    console.log(
      'No baseline yet — run with --update-baseline to freeze current findings, then --strict in CI blocks only NEW ones.',
    );

  process.exit(strict && novel.length > 0 ? 1 : 0);
}

main();
