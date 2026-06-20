#!/usr/bin/env bun
/**
 * i18n coverage lint — guards the end-user-facing message catalogs.
 *
 * tsc (via `messages.d.ts`) already validates that a static `t('key')` exists
 * in the English source. It does NOT catch the gaps this script closes:
 *
 *   1. MISSING TRANSLATION  — a key in `en` that some other locale lacks. The
 *      runtime silently falls back to English (request.ts deepMerge), so a
 *      forgotten translation never errors at build or render time.
 *   2. UNUSED LABEL         — a key in the catalog that no in-scope component
 *      references. Dead weight every locale still has to translate.
 *   3. UNDEFINED LABEL      — a `t('key')` whose key is absent from the `en`
 *      source (defence-in-depth; static ones are also a tsc error).
 *   4. ORPHAN KEY           — a key in a non-`en` locale but not in `en`
 *      (usually a rename applied to `en` but not every translation).
 *   5. LOCALITY             — a feature namespace bound outside its codepath
 *      (the path-based rule): a component may only use its own feature's
 *      namespace, plus the allowlisted cross-cutting ones (common/shared/nav/
 *      footer/consent). Map + allowlist live in `./i18n-scope.ts`.
 *
 * English is the source of truth. Run from `apps/frontend`:
 *   bun run scripts/check-i18n-coverage.ts
 * Exits non-zero (with `error:` lines) on any failure so it can gate
 * pre-push / CI the same way typecheck does.
 *
 * SCOPE — only end-user-facing surfaces count. Admin, dev-tools, studio, the
 * Storybook stories, tests, and the resources app are excluded from the usage
 * scan (EXCLUDED_DIRS / EXCLUDED_FILE_RE): a key used only there is treated as
 * not-in-use, because those surfaces are intentionally not localized.
 *
 * DYNAMIC KEYS — components access data-driven keys two ways, both handled:
 *   • template literals  `t(`report.reasons.${k}.label`)` → matched as a glob.
 *   • a variable          `t(LABEL_KEYS[state])`           → the namespace is
 *     flagged "dynamic" and its keys are considered used when the key's suffix
 *     appears as a string literal anywhere in scope (the const maps that feed
 *     those calls hold the keys as literals). This errs toward NOT reporting a
 *     key as unused — a false "unused" error is worse than a missed dead key.
 */

import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultLocale, locales, NAMESPACES } from '../src/i18n/config';
import {
  ALLOWLISTED_NAMESPACES,
  collectSourceFiles,
  featuresForPath,
} from './i18n-scope';

// ── Paths ────────────────────────────────────────────────────────────────────
const FRONTEND_DIR = fileURLToPath(new URL('..', import.meta.url));
const SRC_DIR = join(FRONTEND_DIR, 'src');
const MESSAGES_DIR = join(FRONTEND_DIR, 'messages');

// ── Types ────────────────────────────────────────────────────────────────────
type Leaf = string; // a flattened dotted key path, e.g. "common.account.label"

interface UsageStatic {
  kind: 'static';
  path: Leaf;
  file: string;
  line: number;
}
interface UsagePattern {
  kind: 'pattern';
  re: RegExp; // anchored regex over full key paths
  display: string; // human form, e.g. "feed.report.reasons.*.label"
  file: string;
  line: number;
}
type Usage = UsageStatic | UsagePattern;

// ── Lexer helpers (so we never match `t(` inside comments/strings) ────────────

/** Read a complete quoted token starting at `start` (the opening quote),
 * honoring backslash escapes. Returns the token incl. quotes, or null if
 * unterminated. For backticks the whole template (incl. `${…}`) is one token. */
function readQuotedToken(text: string, start: number): string | null {
  const quote = text[start];
  let i = start + 1;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === quote) return text.slice(start, i + 1);
    if (quote !== '`' && ch === '\n') return null; // unterminated '…/"…"
    i += 1;
  }
  return null;
}

/** Replace `//` and block comments with spaces (newlines preserved, so offsets
 * and line numbers are unchanged), while leaving string/template content
 * intact. */
function stripComments(text: string): string {
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      const tok = readQuotedToken(text, i);
      if (tok) {
        out.push(tok);
        i += tok.length;
        continue;
      }
    }
    if (ch === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') {
        out.push(' ');
        i++;
      }
      continue;
    }
    if (ch === '/' && text[i + 1] === '*') {
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) {
        out.push(text[i] === '\n' ? '\n' : ' ');
        i++;
      }
      out.push('  '); // the closing */
      i += 2;
      continue;
    }
    out.push(ch);
    i++;
  }
  return out.join('');
}

/** All string/template tokens in `text` as {raw, start}. */
function lexLiterals(text: string): { raw: string; start: number }[] {
  const tokens: { raw: string; start: number }[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      const tok = readQuotedToken(text, i);
      if (tok) {
        tokens.push({ raw: tok, start: i });
        i += tok.length;
        continue;
      }
    }
    i++;
  }
  return tokens;
}

/** Scan from an opening `(` (at `openIdx`) and return only the FIRST argument's
 * source — i.e. up to the first top-level comma or the matching `)`. Only the
 * first arg is the message key; later args (ICU values, classNames, fallbacks)
 * must not be mistaken for keys. A ternary key `cond ? 'a' : 'b'` has no
 * top-level comma, so both literals are returned. Strings and nested
 * ()/[]/{} are skipped. */
function readFirstArg(text: string, openIdx: number): string {
  let depth = 0;
  let i = openIdx;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      const tok = readQuotedToken(text, i);
      if (tok) {
        i += tok.length;
        continue;
      }
    }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') {
      depth--;
      if (depth === 0) return text.slice(openIdx + 1, i);
    } else if (ch === ',' && depth === 1) {
      return text.slice(openIdx + 1, i);
    }
    i++;
  }
  return text.slice(openIdx + 1);
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ── Catalog loading ──────────────────────────────────────────────────────────

function flatten(obj: unknown, prefix: string, out: Set<Leaf>): Set<Leaf> {
  if (obj != null && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [key, value] of Object.entries(obj)) {
      flatten(value, prefix ? `${prefix}.${key}` : key, out);
    }
  } else {
    out.add(prefix);
  }
  return out;
}

function loadCatalog(locale: string): {
  leaves: Set<Leaf>;
  missingNamespaces: string[];
} {
  const leaves = new Set<Leaf>();
  const missingNamespaces: string[] = [];
  for (const ns of NAMESPACES) {
    const file = join(MESSAGES_DIR, locale, `${ns}.json`);
    try {
      flatten(JSON.parse(readFileSync(file, 'utf8')), ns, leaves);
    } catch {
      missingNamespaces.push(ns);
    }
  }
  return { leaves, missingNamespaces };
}

// ── Source scanning ──────────────────────────────────────────────────────────

// `const t = useTranslations('ns')` / `await getTranslations('ns')`.
const BINDING_RE =
  /(?:const|let|var)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\s*\(\s*(['"])([^'"]*)\2\s*\)/g;
// Alias: `const tDynamic = t as (key: string) => string` (the codebase's typed
// escape hatch for data-driven keys), or a plain `const x = t`.
const ALIAS_RE = /(?:const|let|var)\s+(\w+)\s*=\s*(\w+)\s*(?:as\b|;|\n|$)/g;

interface ScanResult {
  usages: Usage[];
  dynamicNamespaces: Set<string>; // namespaces hit by a fully-dynamic `t(var)`
  literals: Set<string>; // every plain string-literal value in the file
  localityViolations: string[]; // feature ns bound outside its codepath
}

function scanFile(file: string): ScanResult {
  const rel = relative(FRONTEND_DIR, file);
  const text = stripComments(readFileSync(file, 'utf8'));
  const usages: Usage[] = [];
  const dynamicNamespaces = new Set<string>();
  const literals = new Set<string>();
  const localityViolations: string[] = [];

  const lineAt = (offset: number) => text.slice(0, offset).split('\n').length;

  // Every plain (non-template) string literal feeds the dynamic-key harvest.
  for (const { raw } of lexLiterals(text)) {
    if (raw[0] === "'" || raw[0] === '"') literals.add(raw.slice(1, -1));
  }

  // Resolve the namespace bound to each variable name (incl. aliases). A name
  // can be rebound; we keep all bindings with offsets and pick the nearest
  // preceding one per call site.
  const bindings: { name: string; ns: string; offset: number }[] = [];
  for (const m of text.matchAll(BINDING_RE)) {
    bindings.push({ name: m[1], ns: m[3], offset: m.index ?? 0 });
  }

  // Locality rule: a feature namespace may only be bound from its own codepath;
  // only the allowlisted cross-cutting namespaces are usable from anywhere.
  const features = featuresForPath(rel);
  for (const b of bindings) {
    const top = b.ns.split('.')[0];
    if (ALLOWLISTED_NAMESPACES.has(top)) continue;
    if (!features.includes(top)) {
      localityViolations.push(
        `${rel}:${lineAt(b.offset)} binds '${b.ns}' but its codepath maps to {${features.join(', ') || 'no feature'}} — a feature namespace may only be used from its own codepath (allowlisted anywhere: ${[...ALLOWLISTED_NAMESPACES].join('/')})`,
      );
    }
  }

  if (bindings.length === 0) {
    return { usages, dynamicNamespaces, literals, localityViolations };
  }

  const boundNames = new Set(bindings.map((b) => b.name));
  // Two passes so an alias-of-alias still resolves.
  for (let pass = 0; pass < 2; pass++) {
    for (const m of text.matchAll(ALIAS_RE)) {
      const [, alias, source] = m;
      if (boundNames.has(source) && !boundNames.has(alias)) {
        const src = bindings.find((b) => b.name === source);
        if (src) {
          bindings.push({ name: alias, ns: src.ns, offset: m.index ?? 0 });
          boundNames.add(alias);
        }
      }
    }
  }

  const nsForCall = (name: string, offset: number): string => {
    let chosen: { ns: string } | undefined;
    for (const b of bindings) {
      if (b.name === name) {
        if (b.offset <= offset) chosen = b;
        else if (!chosen) chosen = b; // fallback: first binding if call precedes
      }
    }
    return chosen?.ns ?? '';
  };

  for (const name of boundNames) {
    // `name('k')`, `name(\`k\`)`, `name.rich('k')`, `name.markup(..)`, `name.has(..)`
    const callRe = new RegExp(
      String.raw`\b${escapeRe(name)}\s*(?:\.(?:rich|markup|has))?\s*\(`,
      'g',
    );
    for (const m of text.matchAll(callRe)) {
      const matchStart = m.index ?? 0;
      const openIdx = matchStart + m[0].length - 1;
      const ns = nsForCall(name, matchStart);
      const args = readFirstArg(text, openIdx);
      const argTokens = lexLiterals(args);
      const line = lineAt(matchStart);

      if (argTokens.length === 0) {
        // Fully dynamic, e.g. t(LABEL_KEYS[state]) — namespace is data-driven.
        if (ns) dynamicNamespaces.add(ns);
        continue;
      }
      for (const { raw } of argTokens) {
        const inner = raw.slice(1, -1);
        const full = ns ? `${ns}.${inner}` : inner;
        if (raw[0] === '`' && inner.includes('${')) {
          const display = ns
            ? `${ns}.${inner.replace(/\$\{[^}]*\}/g, '*')}`
            : inner.replace(/\$\{[^}]*\}/g, '*');
          const pattern = full
            .split(/\$\{[^}]*\}/)
            .map(escapeRe)
            .join('[^.]+');
          usages.push({
            kind: 'pattern',
            re: new RegExp(`^${pattern}$`),
            display,
            file: rel,
            line,
          });
        } else {
          usages.push({ kind: 'static', path: full, file: rel, line });
        }
      }
    }
  }
  return { usages, dynamicNamespaces, literals, localityViolations };
}

// ── Run ──────────────────────────────────────────────────────────────────────
const errors: string[] = [];
const err = (msg: string) => errors.push(msg);

const { leaves: enLeaves, missingNamespaces: enMissing } =
  loadCatalog(defaultLocale);
for (const ns of enMissing) {
  err(
    `[catalog] source locale '${defaultLocale}' is missing namespace file: messages/${defaultLocale}/${ns}.json`,
  );
}

const usages: Usage[] = [];
const dynamicNamespaces = new Set<string>();
const globalLiterals = new Set<string>();
for (const file of collectSourceFiles(SRC_DIR)) {
  const r = scanFile(file);
  usages.push(...r.usages);
  for (const ns of r.dynamicNamespaces) dynamicNamespaces.add(ns);
  for (const lit of r.literals) globalLiterals.add(lit);
  // Check 5: LOCALITY — feature namespace bound outside its codepath.
  for (const v of r.localityViolations) err(`[locality] ${v}`);
}

const staticUsages = usages.filter(
  (u): u is UsageStatic => u.kind === 'static',
);
const patternUsages = usages.filter(
  (u): u is UsagePattern => u.kind === 'pattern',
);

// ── Check 3: UNDEFINED — used in code but absent from the en source ──────────
const isPrefixOfLeaf = (path: string) => {
  const dotted = `${path}.`;
  for (const leaf of enLeaves) if (leaf.startsWith(dotted)) return true;
  return false;
};
for (const u of staticUsages) {
  if (!enLeaves.has(u.path) && !isPrefixOfLeaf(u.path)) {
    err(
      `[undefined] ${u.file}:${u.line} uses '${u.path}' which is not defined in messages/${defaultLocale}/`,
    );
  }
}
for (const u of patternUsages) {
  if (![...enLeaves].some((leaf) => u.re.test(leaf))) {
    err(
      `[undefined] ${u.file}:${u.line} dynamic key '${u.display}' matches no key in messages/${defaultLocale}/`,
    );
  }
}

// ── Check 2: UNUSED — en keys no in-scope component references ────────────────
const usedStaticPaths = new Set(staticUsages.map((u) => u.path));
/** A key is used if it is referenced statically, by a template pattern, or its
 * namespace is data-driven and its suffix appears as a literal somewhere. */
const isUsed = (leaf: Leaf): boolean => {
  if (usedStaticPaths.has(leaf)) return true;
  for (const u of patternUsages) if (u.re.test(leaf)) return true;
  for (const ns of dynamicNamespaces) {
    if (leaf === ns || leaf.startsWith(`${ns}.`)) {
      if (globalLiterals.has(leaf)) return true;
      if (globalLiterals.has(leaf.slice(ns.length + 1))) return true;
    }
  }
  return false;
};
for (const leaf of enLeaves) {
  if (!isUsed(leaf)) {
    err(
      `[unused] '${leaf}' is defined in messages/${defaultLocale}/ but no end-user-facing component uses it`,
    );
  }
}

// ── Checks 1 & 4: MISSING TRANSLATION + ORPHAN, per non-en locale ────────────
for (const locale of locales) {
  if (locale === defaultLocale) continue;
  const { leaves, missingNamespaces } = loadCatalog(locale);
  for (const ns of missingNamespaces) {
    err(
      `[missing] locale '${locale}' is missing namespace file: messages/${locale}/${ns}.json (every key untranslated)`,
    );
  }
  for (const leaf of enLeaves) {
    if (!leaves.has(leaf)) {
      err(
        `[missing] locale '${locale}' is missing translation for '${leaf}' (present in '${defaultLocale}')`,
      );
    }
  }
  for (const leaf of leaves) {
    if (!enLeaves.has(leaf)) {
      err(
        `[orphan] locale '${locale}' has '${leaf}' which no longer exists in '${defaultLocale}' (stale after a rename?)`,
      );
    }
  }
}

// ── Report ───────────────────────────────────────────────────────────────────
if (errors.length > 0) {
  errors.sort();
  for (const e of errors) console.error(`error: ${e}`);
  console.error(
    `\n✖ i18n coverage: ${errors.length} problem(s) across ${locales.length} locale(s), ${NAMESPACES.length} namespace(s).`,
  );
  process.exit(1);
}

console.log(
  `✓ i18n coverage: ${enLeaves.size} keys, all in use and translated across ${locales.length} locales (${NAMESPACES.length} namespaces).`,
);
