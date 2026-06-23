#!/usr/bin/env bun
/**
 * check-rtl — advisory guardrail for the `i18n-rtl` rule.
 *
 * The app ships right-to-left locales (`ar-EG`). Direction is set once on
 * `<html dir>`; once that's on, the browser + CSS logical properties + Tailwind
 * `rtl:` variants mirror the layout for you — but ONLY for direction-relative
 * styles. Physical `left`/`right` utilities stay pinned and break in Arabic.
 * This script keeps that discipline honest, the same way `check:testid` and
 * `check:mobile` do: advisory by default, ratchetable to blocking via a frozen
 * baseline so only NEW physical-axis debt fails CI.
 *
 * Detectors (suppress a line with a trailing `rtl-ok` comment, or a whole file
 * with an `@rtl-ignore` marker):
 *   physical-axis-class    a Tailwind inline-axis utility with a logical
 *                          equivalent: ml-/mr-, pl-/pr-, left-/right-,
 *                          text-left/right, border-l/r, rounded-l/r/corner.
 *                          (`rtl:`/`ltr:`-prefixed tokens are intentional and
 *                          skipped.)
 *   space-x-physical       space-x / divide-x utilities inject a physical
 *                          margin/border on children that does NOT flip in RTL.
 *                          Migrate to
 *                          `gap-*` on flex/grid, or logical margins otherwise.
 *                          (Negative `-space-x-*` overlap stacks are exempt.)
 *   inline-physical-style  a JSX inline `style` with left/right/marginLeft/
 *                          paddingRight/borderLeft… — `style` ignores `dir`
 *                          entirely; use `insetInlineStart`/`marginInlineEnd`.
 *   preview-dir            `.storybook/preview.tsx` doesn't set `dir` from the
 *                          resolved locale, so the locale toolbar swaps copy but
 *                          can't mirror RTL — every story renders LTR.
 *
 * Usage (run from apps/frontend):
 *   bun run check:rtl                     # advisory report (always exit 0)
 *   bun run check:rtl -- --strict         # exit 1 if any finding is NEW above baseline
 *   bun run check:rtl -- --update-baseline
 *   bun run check:rtl -- --json
 *
 * SCOPE — user-facing surfaces only. Reuses the i18n source-file collector
 * (admin, dev-tools, stories, tests, and the non-`astra` marketing landings are
 * excluded — those are intentionally not RTL-localized) and additionally skips
 * the vendored shadcn primitives under components/ui/shadcn (we don't edit them).
 *
 * KNOWN LIMITS (deliberate — this is a regex pass, not an AST, matching the
 * naive approach of check:testid / check:mobile). These are accepted misses, not
 * bugs; the rule + human review still cover them:
 *   - `style={someVarRef}` (a style object passed by identifier) isn't resolved —
 *     only inline `style={{ … }}` literals are scanned.
 *   - Physical `left:`/`right:` inside raw `<style jsx>` / template CSS strings
 *     (e.g. keyframes) aren't flagged — only Tailwind classes + JSX style objects.
 *   - Per-file dedup is by (detector, base token), so a SECOND already-baselined
 *     class (e.g. another `right-0`) in the same file won't re-trip `--strict`;
 *     the baseline key is intentionally line-independent so it survives refactors.
 */
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectSourceFiles } from './i18n-scope';

// ── Paths ────────────────────────────────────────────────────────────────────
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = join(SCRIPT_DIR, '..');
const SRC_ROOT = join(FRONTEND_ROOT, 'src');
const BASELINE_PATH = join(SCRIPT_DIR, 'rtl-baseline.json');
const PREVIEW_PATH = join(FRONTEND_ROOT, '.storybook', 'preview.tsx');

// shadcn primitives are vendored and not ours to edit (see code-gen rule).
const SHADCN_RE = /(^|\/)components\/ui\/shadcn\//;

// ── Detectors ────────────────────────────────────────────────────────────────
type Detector =
  | 'physical-axis-class'
  | 'space-x-physical'
  | 'inline-physical-style'
  | 'preview-dir';

interface Finding {
  detector: Detector;
  file: string; // relative to apps/frontend
  line: number;
  snippet: string;
  message: string;
}

const MESSAGES: Record<Detector, string> = {
  'physical-axis-class':
    'physical inline-axis class — use the logical equivalent so it flips in RTL (ml→ms, mr→me, pl→ps, pr→pe, left→start, right→end, text-left→text-start, text-right→text-end, border-l→border-s, border-r→border-e, rounded-l→rounded-s, rounded-r→rounded-e).',
  'space-x-physical':
    'space-x-*/divide-x inject a physical margin/border on children that does not flip in RTL — migrate to gap-* on a flex/grid container, or logical margins otherwise (negative overlap stacks are exempt).',
  'inline-physical-style':
    'inline style with a physical left/right property ignores dir entirely — use logical CSS (insetInlineStart/End, marginInlineStart/End, paddingInlineStart/End).',
  'preview-dir':
    'Storybook preview does not set <html dir> from the resolved locale — the locale toolbar swaps copy but renders RTL locales in an LTR layout. Set document.documentElement.dir = getDirection(locale) and wrap the story in <div dir>.',
};

// base-token (variant + sign stripped) → logical-equivalent regexes. Anchored so
// `rounded-l` does NOT match `rounded-lg` and `border-l` does NOT match a longer
// token. The map order doesn't matter — first match wins per token.
const PHYSICAL_AXIS: RegExp[] = [
  /^-?ml-/,
  /^-?mr-/,
  /^-?pl-/,
  /^-?pr-/,
  /^-?left-/,
  /^-?right-/,
  /^text-left$/,
  /^text-right$/,
  /^-?border-l(-|$)/,
  /^-?border-r(-|$)/,
  /^rounded-l(-|$)/,
  /^rounded-r(-|$)/,
  /^rounded-tl(-|$)/,
  /^rounded-tr(-|$)/,
  /^rounded-bl(-|$)/,
  /^rounded-br(-|$)/,
];

// ── Class-token extraction ───────────────────────────────────────────────────

// Only a line that is wholly a comment (`//`, `/*`, ` *`) is skipped — keeps
// physical-class examples in docstrings (this script, the rule) out of the
// report without an AST. Mid-line matches are rare and suppressible with
// `rtl-ok`. Same naive approach as check:testid / check:mobile.
const COMMENT_LINE_RE = /^\s*(\/\/|\/\*|\*)/;
// Quoted strings (single/double/backtick). className lists, cn()/cva()/clsx()
// args, and variant maps are all string literals — scanning literals catches
// them all without parsing JSX. Escapes inside class strings effectively never
// occur, so a tolerant matcher is fine.
const STRING_RE = /"([^"]*)"|'([^']*)'|`([^`]*)`/g;

const lineAtOffset = (content: string, idx: number): number => {
  let line = 1;
  for (let i = 0; i < idx && i < content.length; i++) {
    if (content[i] === '\n') line++;
  }
  return line;
};

/** A class-list token with its Tailwind variant prefixes and `-` sign removed. */
function baseToken(token: string): { base: string; rtlScoped: boolean } {
  const segments = token.split(':');
  const base = segments[segments.length - 1] ?? '';
  const variants = segments.slice(0, -1);
  // `rtl:`/`ltr:` mean the author already supplied a direction-specific value —
  // intentional, never flagged.
  const rtlScoped = variants.includes('rtl') || variants.includes('ltr');
  return { base, rtlScoped };
}

// ── Per-file scan ────────────────────────────────────────────────────────────
function scanFile(file: string, rel: string, findings: Finding[]): void {
  const content = readFileSync(file, 'utf8');
  if (content.includes('@rtl-ignore')) return;
  const lines = content.split('\n');
  const suppressed = (ln: number) => (lines[ln - 1] ?? '').includes('rtl-ok');
  const isComment = (ln: number) => COMMENT_LINE_RE.test(lines[ln - 1] ?? '');

  // Dedup per (detector, base) within a file so repeats collapse to one finding
  // (keeps the report and baseline stable when a class is used many times).
  const seen = new Set<string>();
  const push = (detector: Detector, line: number, snippet: string) => {
    const dedupKey = `${detector}|${snippet}`;
    if (seen.has(dedupKey)) return;
    seen.add(dedupKey);
    findings.push({
      detector,
      file: rel,
      line,
      snippet,
      message: MESSAGES[detector],
    });
  };

  // 1 + 2: class-token detectors over every string literal.
  for (const m of content.matchAll(STRING_RE)) {
    const raw = m[1] ?? m[2] ?? m[3] ?? '';
    if (!raw) continue;
    const line = lineAtOffset(content, m.index ?? 0);
    if (isComment(line) || suppressed(line)) continue;
    for (const token of raw.split(/\s+/)) {
      if (!token || token.includes('${')) continue;
      const { base, rtlScoped } = baseToken(token);
      if (rtlScoped || !base) continue;

      // space-x / divide-x: physical child spacing. Negative overlap is exempt.
      if (/^space-x-/.test(base) || /^divide-x(-|$)/.test(base)) {
        push('space-x-physical', line, base);
        continue;
      }

      if (PHYSICAL_AXIS.some((re) => re.test(base))) {
        push('physical-axis-class', line, base);
      }
    }
  }

  // 3: inline physical style. Extract `style={{ … }}` blocks (multiline-aware)
  // and only flag physical props as object KEYS inside them. Scoping to real
  // style objects avoids matching plain-JS identifiers like
  // `getComputedStyle(el).paddingLeft`, and the [\s\S] body catches props on a
  // continuation line — both false-positive/false-negative gaps a line-by-line
  // scan had.
  const StyleBlockRe = /style=\{\{([\s\S]*?)\}\}/g;
  const PhysicalStylePropRe =
    /\b(left|right|marginLeft|marginRight|paddingLeft|paddingRight|borderLeft|borderRight)\s*:/g;
  const StyleOpenLen = 'style={{'.length;
  for (const block of content.matchAll(StyleBlockRe)) {
    const blockStart = block.index ?? 0;
    for (const prop of (block[1] ?? '').matchAll(PhysicalStylePropRe)) {
      const line = lineAtOffset(
        content,
        blockStart + StyleOpenLen + (prop.index ?? 0),
      );
      if (isComment(line) || suppressed(line)) continue;
      push('inline-physical-style', line, prop[1]);
    }
  }
}

// Drop block + line comments so a comment that merely *mentions* the fix
// (e.g. the docstring "set document.documentElement.dir = getDirection(locale)")
// can't satisfy the preview-dir check. The line-comment pass keeps the char
// before `//` so `https://` inside a string survives.
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

// ── Storybook preview check ──────────────────────────────────────────────────
function checkPreviewDir(findings: Finding[]): void {
  if (!existsSync(PREVIEW_PATH)) return;
  const code = stripComments(readFileSync(PREVIEW_PATH, 'utf8'));
  const setsDir = /\.dir\s*=/.test(code) || /\bdir=\{/.test(code);
  const fromLocale =
    code.includes('getDirection') || /dir=\{[^}]*direction/.test(code);
  if (!(setsDir && fromLocale)) {
    findings.push({
      detector: 'preview-dir',
      file: relative(FRONTEND_ROOT, PREVIEW_PATH),
      line: 1,
      snippet: '(preview does not set dir from locale)',
      message: MESSAGES['preview-dir'],
    });
  }
}

// ── Run ──────────────────────────────────────────────────────────────────────
function main() {
  const argv = process.argv.slice(2);
  const strict = argv.includes('--strict');
  const updateBaseline = argv.includes('--update-baseline');
  const asJson = argv.includes('--json');

  if (!existsSync(SRC_ROOT) || !statSync(SRC_ROOT).isDirectory()) {
    console.error(`check-rtl: src not found at ${SRC_ROOT}`);
    process.exit(2);
  }

  const findings: Finding[] = [];
  let filesScanned = 0;
  for (const file of collectSourceFiles(SRC_ROOT)) {
    if (!file.endsWith('.tsx')) continue;
    const rel = relative(FRONTEND_ROOT, file);
    if (SHADCN_RE.test(rel)) continue;
    filesScanned++;
    scanFile(file, rel, findings);
  }
  checkPreviewDir(findings);

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

  if (asJson) {
    console.log(
      JSON.stringify(
        { total: findings.length, novel: novel.length, filesScanned, findings },
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

  console.log('\nRTL sanity guardrail (advisory) — rule: i18n-rtl\n');
  console.log(`Scanned ${filesScanned} component file(s).\n`);
  for (const [det, list] of byDetector) {
    const shown = list.slice(0, 40);
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
