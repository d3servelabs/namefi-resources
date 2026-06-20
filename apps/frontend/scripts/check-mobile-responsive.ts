#!/usr/bin/env bun
/**
 * check-mobile-responsive — advisory guardrail for the `mobile-responsive-ux` rule.
 *
 * Heuristically flags desktop-first patterns that overflow a phone, so new code
 * can't silently re-accumulate the backlog the 2026-06 audit cleared. Mirrors the
 * spirit of `check:i18n:convention`: advisory by default, ratchetable to blocking.
 *
 * Detectors (each suppressible with a trailing `mobile-ok` comment on the line, or a
 * file-level `@mobile-responsive-ignore` marker):
 *   table-no-mobile-card  <ExtensibleDataTable> without a `renderMobileCard` prop.
 *   raw-table             raw <table> (bypasses the ExtensibleDataTable mobile path).
 *   wide-fixed-width      w-[>=360px] / min-w-[>=360px] with no `max-sm:` sibling.
 *   bottom-no-safe-area   fixed/sticky bottom-pinned UI without env(safe-area-inset-bottom).
 *   tabs-grid-no-wrap     <TabsList> using grid-cols-N with no flex-wrap fallback.
 *
 * Usage:
 *   bun run check:mobile                 # advisory report (always exit 0)
 *   bun run check:mobile -- --strict     # exit 1 if any finding is NEW above the baseline
 *   bun run check:mobile -- --update-baseline
 *   bun run check:mobile -- --json
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
const BASELINE_PATH = join(SCRIPT_DIR, 'mobile-responsive-baseline.json');

const WIDTH_THRESHOLD_PX = 360; // phones are ~375–390px wide

// Mechanism-defining files legitimately contain/define the patterns — never flag them.
// (Paths are relative to apps/frontend, i.e. include the `src/` prefix.)
// The generic table renderers forward `{...props}` (incl. renderMobileCard) to consumers,
// so the obligation lives at their call sites, not here.
const EXCLUDE_FILES = new Set([
  'src/components/table/extensible-data-table.tsx',
  'src/components/table/server-data-table.tsx',
  'src/components/table/server-data-table-v2.tsx',
  'src/components/table/data-table.tsx',
  'src/components/dialogs/mobile-bottom-sheet.tsx',
]);

type Detector =
  | 'table-no-mobile-card'
  | 'raw-table'
  | 'wide-fixed-width'
  | 'bottom-no-safe-area'
  | 'tabs-grid-no-wrap';

interface Finding {
  detector: Detector;
  file: string; // relative to apps/frontend
  line: number;
  snippet: string;
  message: string;
}

const MESSAGES: Record<Detector, string> = {
  'table-no-mobile-card':
    'ExtensibleDataTable without renderMobileCard — add a memoized renderMobileCard mapping rows to a card (see my-domains/table.tsx).',
  'raw-table':
    'raw <table> — migrate to ExtensibleDataTable or add a useIsMobile()-gated card layout.',
  'wide-fixed-width':
    'fixed width >= 360px without a max-sm: override — add max-sm:w-full (see table-filter-panel.tsx).',
  'bottom-no-safe-area':
    'fixed/sticky bottom-pinned UI without env(safe-area-inset-bottom) — add pb-[max(<base>,env(safe-area-inset-bottom))] (see floating-cart.tsx).',
  'tabs-grid-no-wrap':
    'TabsList grid-cols-N without flex-wrap — wrap on mobile, grid at lg (see my-domains/content.tsx).',
};

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

function lineOf(content: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < content.length; i++)
    if (content[i] === '\n') line++;
  return line;
}

function analyze(file: string, rel: string): Finding[] {
  const content = readFileSync(file, 'utf8');
  if (content.includes('@mobile-responsive-ignore')) return [];
  const lines = content.split('\n');
  const findings: Finding[] = [];
  const has = (re: RegExp) => re.test(content);
  const suppressed = (lineIdx: number) =>
    (lines[lineIdx] ?? '').includes('mobile-ok');

  // A. ExtensibleDataTable without renderMobileCard (file-level)
  const edtIdx = content.indexOf('<ExtensibleDataTable');
  if (edtIdx !== -1 && !content.includes('renderMobileCard')) {
    const ln = lineOf(content, edtIdx);
    if (!suppressed(ln - 1))
      findings.push({
        detector: 'table-no-mobile-card',
        file: rel,
        line: ln,
        snippet: '<ExtensibleDataTable …>',
        message: MESSAGES['table-no-mobile-card'],
      });
  }

  // B. raw <table> (lowercase = real HTML table; <Table> shadcn primitive is fine)
  if (!rel.startsWith('src/components/ui/')) {
    const m = content.indexOf('<table');
    if (m !== -1) {
      const ln = lineOf(content, m);
      if (!suppressed(ln - 1))
        findings.push({
          detector: 'raw-table',
          file: rel,
          line: ln,
          snippet: '<table>',
          message: MESSAGES['raw-table'],
        });
    }
  }

  // C. wide fixed widths without max-sm: (per line)
  // Only BASE (non-breakpoint-prefixed) widths — `sm:w-[625px]` after a `w-full` base is fine.
  const widthRe = /(?<![:\w-])(?:min-)?w-\[(\d{3,})px\]/g;
  lines.forEach((text, i) => {
    if (text.includes('mobile-ok')) return;
    for (const mm of text.matchAll(widthRe)) {
      const px = Number.parseInt(mm[1], 10);
      if (px >= WIDTH_THRESHOLD_PX && !text.includes('max-sm:')) {
        findings.push({
          detector: 'wide-fixed-width',
          file: rel,
          line: i + 1,
          snippet: mm[0],
          message: MESSAGES['wide-fixed-width'],
        });
        break; // one finding per line is enough
      }
    }
  });

  // D. fixed/sticky bottom-pinned UI without safe-area (file-level, anchored at first hit)
  const bottomLine = lines.findIndex(
    (t) =>
      /\b(?:fixed|sticky)\b/.test(t) &&
      /\bbottom-(?:0|\d|\[)/.test(t) &&
      !t.includes('mobile-ok'),
  );
  if (bottomLine !== -1 && !has(/safe-area-inset-bottom/)) {
    findings.push({
      detector: 'bottom-no-safe-area',
      file: rel,
      line: bottomLine + 1,
      snippet: lines[bottomLine].trim().slice(0, 80),
      message: MESSAGES['bottom-no-safe-area'],
    });
  }

  // E. <TabsList> grid-cols-N without flex-wrap
  let searchFrom = 0;
  while (true) {
    const start = content.indexOf('<TabsList', searchFrom);
    if (start === -1) break;
    const end = content.indexOf('>', start);
    const tag = content.slice(start, end === -1 ? start + 200 : end);
    searchFrom = end === -1 ? start + 9 : end + 1;
    // Only a BASE grid of 3+ columns squeezes a phone; `grid-cols-2` and breakpoint-
    // prefixed grids (`lg:grid-cols-5`) are fine.
    if (/(?<!:)grid-cols-[3-9]/.test(tag) && !/flex-wrap/.test(tag)) {
      const ln = lineOf(content, start);
      if (!suppressed(ln - 1))
        findings.push({
          detector: 'tabs-grid-no-wrap',
          file: rel,
          line: ln,
          snippet: '<TabsList … grid-cols-N>',
          message: MESSAGES['tabs-grid-no-wrap'],
        });
    }
  }

  return findings;
}

function keyOf(f: Finding): string {
  return `${f.detector}|${f.file}|${f.snippet}`;
}

function main() {
  const argv = process.argv.slice(2);
  const strict = argv.includes('--strict');
  const updateBaseline = argv.includes('--update-baseline');
  const asJson = argv.includes('--json');

  if (!existsSync(SRC_ROOT) || !statSync(SRC_ROOT).isDirectory()) {
    console.error(`check-mobile-responsive: src not found at ${SRC_ROOT}`);
    process.exit(2);
  }

  const findings: Finding[] = [];
  for (const file of walk(SRC_ROOT)) {
    const rel = relative(FRONTEND_ROOT, file);
    if (EXCLUDE_FILES.has(rel)) continue;
    findings.push(...analyze(file, rel));
  }
  findings.sort(
    (a, b) =>
      a.detector.localeCompare(b.detector) ||
      a.file.localeCompare(b.file) ||
      a.line - b.line,
  );

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

  if (asJson) {
    console.log(
      JSON.stringify(
        { total: findings.length, novel: novel.length, findings },
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
    '\nMobile-responsive guardrail (advisory) — rule: mobile-responsive-ux\n',
  );
  for (const [det, list] of byDetector) {
    console.log(`■ ${det}  (${list.length})`);
    console.log(`  ${MESSAGES[det]}`);
    for (const f of list) console.log(`    ${f.file}:${f.line}  ${f.snippet}`);
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
