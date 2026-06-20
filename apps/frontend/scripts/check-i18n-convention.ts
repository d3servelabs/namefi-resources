#!/usr/bin/env bun
/**
 * i18n convention lint — ADVISORY (never fails the build; always exits 0).
 *
 * Where `check-i18n-coverage.ts` enforces hard correctness (parity / unused /
 * undefined), this script nudges the codebase toward the key-hierarchy
 * convention documented in `.rulesync/rules/i18n-translation-keys.md`. Its
 * output is a backlog, not a gate. Run from `apps/frontend`:
 *   bun run scripts/check-i18n-convention.ts
 *
 * It reports two things:
 *   1. HARDCODED  — user-facing JSX text / text attributes not wrapped in t().
 *                   (Heuristic: trades some false positives for coverage — the
 *                   reason this is advisory, not blocking.)
 *   2. DEMOTION   — a `common.*`/`shared.*` key consumed by only one feature →
 *                   candidate to move down into that feature's namespace.
 *
 * (Locality — a feature namespace used outside its codepath — is enforced as a
 * BLOCKING check in `check-i18n-coverage.ts`, not reported here.)
 *
 * Scope + the codepath→namespace map are shared via `./i18n-scope.ts`.
 */

import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectSourceFiles, featuresForPath } from './i18n-scope';

const FRONTEND_DIR = fileURLToPath(new URL('..', import.meta.url));
const SRC_DIR = join(FRONTEND_DIR, 'src');

// ── Lexer (shared shape with the coverage checker) ───────────────────────────
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
    if (quote !== '`' && ch === '\n') return null;
    i += 1;
  }
  return null;
}

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
      out.push('  ');
      i += 2;
      continue;
    }
    out.push(ch);
    i++;
  }
  return out.join('');
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ── Binding + usage extraction (lightweight; enough for locality/demotion) ───
const BINDING_RE =
  /(?:const|let|var)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\s*\(\s*(['"])([^'"]*)\2\s*\)/g;
const ALIAS_RE = /(?:const|let|var)\s+(\w+)\s*=\s*(\w+)\s*(?:as\b|;|\n|$)/g;

interface Binding {
  name: string;
  ns: string;
  offset: number;
}

const lineAt = (text: string, offset: number) =>
  text.slice(0, offset).split('\n').length;

function bindingsOf(text: string): Binding[] {
  const bindings: Binding[] = [];
  for (const m of text.matchAll(BINDING_RE)) {
    bindings.push({ name: m[1], ns: m[3], offset: m.index ?? 0 });
  }
  if (bindings.length === 0) return bindings;
  const names = new Set(bindings.map((b) => b.name));
  for (let pass = 0; pass < 2; pass++) {
    for (const m of text.matchAll(ALIAS_RE)) {
      const [, alias, source] = m;
      if (names.has(source) && !names.has(alias)) {
        const src = bindings.find((b) => b.name === source);
        if (src) {
          bindings.push({ name: alias, ns: src.ns, offset: m.index ?? 0 });
          names.add(alias);
        }
      }
    }
  }
  return bindings;
}

/** Static keys requested per binding, as full `ns.key` paths. */
function staticKeysOf(text: string, bindings: Binding[]): string[] {
  const keys: string[] = [];
  const names = [...new Set(bindings.map((b) => b.name))];
  const nsForCall = (name: string, offset: number) => {
    let chosen: Binding | undefined;
    for (const b of bindings) {
      if (b.name === name && b.offset <= offset) chosen = b;
    }
    return (chosen ?? bindings.find((b) => b.name === name))?.ns ?? '';
  };
  for (const name of names) {
    const callRe = new RegExp(
      String.raw`\b${escapeRe(name)}\s*(?:\.(?:rich|markup|has))?\s*\(\s*(['"])([^'"]*)\1`,
      'g',
    );
    for (const m of text.matchAll(callRe)) {
      const ns = nsForCall(name, m.index ?? 0);
      keys.push(ns ? `${ns}.${m[2]}` : m[2]);
    }
  }
  return keys;
}

// ── Hardcoded user-facing string heuristic ───────────────────────────────────
// JSX text node between tags, e.g. `>Save</`. Excludes interpolations/markup.
const JSX_TEXT_RE = />([^<>{}]*[A-Za-z]{2,}[^<>{}]*)</g;
// Text-bearing attributes most likely to be user-visible copy.
const ATTR_RE =
  /\b(placeholder|title|alt|aria-label|label|heading|description|emptyText)\s*=\s*(['"])([^'"]*[A-Za-z]{2,}[^'"]*)\2/g;
// Conservative "is this natural-language copy?" — the JSX-text regex also
// catches code between `>` and `<` (generics, comparisons), so we only accept
// strings made of letters + light sentence punctuation. Trades recall for far
// fewer false positives (this whole report is advisory anyway).
// Single Capitalized words that are almost always TS type identifiers caught
// between `>` and `<` (generics), not UI copy.
const TYPE_WORDS = new Set([
  'Promise',
  'Array',
  'Record',
  'Map',
  'Set',
  'Partial',
  'Readonly',
  'Pick',
  'Omit',
  'Awaited',
  'ReactNode',
  'ReactElement',
  'Fragment',
  'Suspense',
]);
function looksLikeCopy(s: string): boolean {
  const t = s.trim();
  if (t.length < 2) return false;
  if (!/^[A-Za-z][A-Za-z .,!?:'’&%-]*$/.test(t)) return false; // letters + punct only
  if (!/[a-z]/.test(t)) return false; // require a lowercase letter
  if (/^[a-z]+([A-Z][a-z]+)+$/.test(t)) return false; // camelCase identifier
  if (TYPE_WORDS.has(t)) return false; // generic type name, not copy
  return /\s/.test(t) || /^[A-Z][a-z]+$/.test(t); // a phrase, or one Capitalized word
}

// ── Run ──────────────────────────────────────────────────────────────────────
const hardcoded: string[] = [];
// key -> set of features that consume it (for demotion analysis)
const commonConsumers = new Map<string, Set<string>>();

for (const file of collectSourceFiles(SRC_DIR)) {
  const rel = relative(FRONTEND_DIR, file);
  const text = stripComments(readFileSync(file, 'utf8'));
  const features = featuresForPath(rel);

  // Demotion needs the bindings/usages. (Locality is enforced as a blocking
  // check in check-i18n-coverage.ts, so it is not reported here.)
  const bindings = bindingsOf(text);
  for (const key of staticKeysOf(text, bindings)) {
    const top = key.split('.')[0];
    if (top === 'common' || top === 'shared') {
      if (!commonConsumers.has(key)) commonConsumers.set(key, new Set());
      commonConsumers.get(key)?.add(features[0] ?? '∅');
    }
  }

  // Hardcoded strings only in .tsx (JSX).
  if (file.endsWith('.tsx')) {
    for (const m of text.matchAll(JSX_TEXT_RE)) {
      const s = m[1].trim();
      if (looksLikeCopy(s)) {
        hardcoded.push(`${rel}:${lineAt(text, m.index ?? 0)} JSX text "${s}"`);
      }
    }
    for (const m of text.matchAll(ATTR_RE)) {
      const s = m[3].trim();
      if (looksLikeCopy(s)) {
        hardcoded.push(`${rel}:${lineAt(text, m.index ?? 0)} ${m[1]}="${s}"`);
      }
    }
  }
}

// Demotion: common/shared keys consumed by exactly one identifiable feature.
// `common.actions.*` and `common.status.*` are by-design atom buckets — a
// generic action/status word legitimately lives in `common` even with one
// current consumer, so they are not demotion candidates.
const demotion: string[] = [];
for (const [key, feats] of commonConsumers) {
  if (/^common\.(actions|status)\./.test(key)) continue;
  const real = [...feats].filter((f) => f && f !== '∅');
  if (real.length === 1) {
    demotion.push(
      `'${key}' is used only by the '${real[0]}' feature — candidate to demote to '${real[0]}.*'`,
    );
  }
}

// ── Report (advisory) ─────────────────────────────────────────────────────────
function section(title: string, items: string[], cap = 40): void {
  console.log(`\n## ${title} (${items.length})`);
  if (items.length === 0) {
    console.log('  none');
    return;
  }
  for (const it of items.slice(0, cap).sort()) console.log(`  warning: ${it}`);
  if (items.length > cap) console.log(`  … and ${items.length - cap} more`);
}

console.log('i18n convention report — ADVISORY (does not fail the build)');
section('HARDCODED user-facing strings (heuristic)', hardcoded);
section('DEMOTION — single-feature common/shared keys', demotion);
console.log(
  `\nSummary: ${hardcoded.length} hardcoded, ${demotion.length} demotion candidate(s).`,
);
