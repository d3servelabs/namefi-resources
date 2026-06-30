#!/usr/bin/env bun
/**
 * cross-link candidate suggester for namefi-resources.
 *
 * The auditor (link-audit.ts) is fully deterministic but only inspects links
 * that ALREADY exist. This script does the other half — it *discovers* link
 * candidates mechanically from frontmatter + prose, so the model only has to
 * judge and place a ranked shortlist instead of reading every article to find
 * candidates from scratch.
 *
 * For a target page it emits three sections, all scoped to the page's locale:
 *
 *   OUTBOUND  Existing pages whose canonical term appears in the target's
 *             prose (unlinked) -> link OUT from the target.
 *   INBOUND   Existing pages whose prose mentions the target's distinctive
 *             term/keyword (and don't link to it yet) -> add a back-link THERE.
 *   RELATED   Pages ranked by shared keywords + same cluster/series. No exact
 *             anchor; the model decides whether/where to weave them in.
 *
 * Precision model — every phrase resolves to ONE canonical destination:
 *   - A glossary title head ("Escrow") / its parenthetical ("Non-Fungible
 *     Token") and a tld extension (".com") are TERMS — unique, high confidence.
 *   - A keyword phrase is only used when the page is its SOLE owner (or the
 *     keyword is in the page's slug); keywords shared across many pages are
 *     dropped from OUTBOUND/INBOUND (too generic to point anywhere) and instead
 *     power the RELATED ranking.
 *
 * Matching is locale-scoped, boundary-aware for Latin scripts, substring for
 * CJK/RTL. It is a CANDIDATE generator: some noise is expected and cheap to
 * reject — it never edits files. Confidence is high | medium | low.
 *
 * Usage (from the namefi-resources repo root):
 *   bun .agents/skills/cross-link/link-suggest.ts content/blog/en/<slug>.md
 *   bun .agents/skills/cross-link/link-suggest.ts content/glossary/en/escrow.md
 *   bun .agents/skills/cross-link/link-suggest.ts --json <path>
 *   bun .agents/skills/cross-link/link-suggest.ts --min=medium <path>   # hide low
 *   bun .agents/skills/cross-link/link-suggest.ts --no-inbound <path>
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const LOCALES = ['en', 'es', 'de', 'fr', 'zh-CN', 'ar', 'hi', 'ko', 'ja'] as const;
const COLLECTIONS = ['blog', 'glossary', 'tld', 'partners'] as const;
const COLLECTION_PRIORITY: Record<string, number> = { glossary: 0, blog: 1, tld: 2, partners: 3 };
const MD_EXT = new Set(['.md', '.mdx']);
const CONFIDENCE_RANK = { high: 3, medium: 2, low: 1 } as const;
type Confidence = keyof typeof CONFIDENCE_RANK;

// --- args ------------------------------------------------------------------
const argv = process.argv.slice(2);
const JSON_OUT = argv.includes('--json');
const NO_INBOUND = argv.includes('--no-inbound');
const NO_RELATED = argv.includes('--no-related');
const minArg = (argv.find((a) => a.startsWith('--min=')) ?? '--min=low').slice(6);
const MIN: Confidence = (['high', 'medium', 'low'].includes(minArg) ? minArg : 'low') as Confidence;
const termArgs = argv.filter((a) => a.startsWith('--term=')).map((a) => a.slice(7));
const targets = argv.filter((a) => !a.startsWith('--'));
if (targets.length === 0 && termArgs.length === 0) {
  console.error('Usage: bun .agents/skills/cross-link/link-suggest.ts <content/...md> [--json] [--min=medium] [--no-inbound] [--no-related]');
  console.error('       bun .agents/skills/cross-link/link-suggest.ts --term=/en/glossary/<slug>/   # per-locale anchor + counterpart table');
  process.exit(2);
}
const passConf = (c: Confidence) => CONFIDENCE_RANK[c] >= CONFIDENCE_RANK[MIN];

// --- locate content/ root --------------------------------------------------
function findContentRoot(): string {
  for (const c of [path.join(process.cwd(), 'content'), path.resolve(import.meta.dir, '../../..', 'content')]) {
    try {
      if (statSync(c).isDirectory()) return c;
    } catch {
      /* next */
    }
  }
  console.error('Could not find content/. Run from the namefi-resources repo root.');
  process.exit(2);
}
const CONTENT_ROOT = findContentRoot();
const REPO_ROOT = path.dirname(CONTENT_ROOT);
const rel = (f: string) => path.relative(REPO_ROOT, f).split(path.sep).join('/');

// --- page model ------------------------------------------------------------
type Page = {
  file: string;
  collection: (typeof COLLECTIONS)[number];
  locale: (typeof LOCALES)[number];
  slug: string;
  href: string;
  title: string;
  keywords: string[];
  cluster?: string;
  series?: string;
  draft: boolean;
  raw: string;
  prose: string;
};

function stripNonProse(raw: string): string {
  let body = raw.replace(/^---\n[\s\S]*?\n---\n?/, (m) => m.replace(/[^\n]/g, ' '));
  body = body.replace(/^([ \t]*)(`{3,}|~{3,})[\s\S]*?\n\1\2[^\n]*$/gm, (m) => m.replace(/[^\n]/g, ' '));
  body = body.replace(/`[^`\n]*`/g, (m) => m.replace(/[^\n]/g, ' '));
  // Blank whole markdown links/images so phrases can't match inside existing
  // anchor text or href slugs — we only want to surface UNLINKED prose mentions.
  body = body.replace(/!?\[[^\]\n]*\]\([^)\n]*\)/g, (m) => m.replace(/[^\n]/g, ' '));
  // Blank ATX heading lines — the skill forbids links in headings, so a term in
  // a heading must not be cited as the first mention.
  body = body.replace(/^#{1,6} .*$/gm, (m) => m.replace(/[^\n]/g, ' '));
  return body;
}

function listMarkdown(dir: string): string[] {
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const e of entries) {
    const full = path.join(dir, e);
    if (statSync(full).isDirectory()) out.push(...listMarkdown(full));
    else if (MD_EXT.has(path.extname(e))) out.push(full);
  }
  return out;
}

function loadPage(file: string): Page | null {
  const r = rel(file);
  const m = r.match(/^content\/([^/]+)\/([^/]+)\/(.+)\.(md|mdx)$/);
  if (!m) return null;
  const [, collection, locale, slug] = m;
  if (!(COLLECTIONS as readonly string[]).includes(collection)) return null;
  if (!(LOCALES as readonly string[]).includes(locale)) return null;
  const raw = readFileSync(file, 'utf8');
  let data: Record<string, unknown> = {};
  try {
    data = matter(raw).data as Record<string, unknown>;
  } catch {
    /* keep empty */
  }
  const keywords = Array.isArray(data.keywords)
    ? (data.keywords as unknown[]).filter((k): k is string => typeof k === 'string').map((k) => k.trim())
    : [];
  return {
    file,
    collection: collection as Page['collection'],
    locale: locale as Page['locale'],
    slug,
    href: `/${locale}/${collection}/${slug}/`,
    title: typeof data.title === 'string' ? data.title.trim() : '',
    keywords,
    cluster: typeof data.cluster === 'string' ? data.cluster : undefined,
    series: typeof data.series === 'string' ? data.series : undefined,
    draft: data.draft === true || data.draft === 'true',
    raw,
    prose: stripNonProse(raw),
  };
}

const corpus: Page[] = [];
for (const collection of COLLECTIONS)
  for (const locale of LOCALES)
    for (const f of listMarkdown(path.join(CONTENT_ROOT, collection, locale))) {
      const p = loadPage(f);
      // Exclude drafts: they must never become link targets or inbound sources.
      // An explicitly-passed draft target is still analyzed via the loadPage
      // fallback in the run loop below.
      if (p && !p.draft) corpus.push(p);
    }
const byHref = new Map(corpus.map((p) => [p.href, p]));

// keyword owner counts, per locale, for "sole owner" distinctiveness test
const kwOwners = new Map<string, Set<string>>(); // `${locale}::${kw}` -> set of hrefs
for (const p of corpus)
  for (const k of p.keywords) {
    const key = `${p.locale}::${k.toLowerCase()}`;
    if (!kwOwners.has(key)) kwOwners.set(key, new Set());
    kwOwners.get(key)!.add(p.href);
  }

// --- phrase derivation -----------------------------------------------------
const GENERIC = new Set(['domain', 'domains', 'crypto', 'web3', 'guide', 'seo', 'namefi', 'blockchain', 'name']);
const isLatin = (s: string) => /[A-Za-z]/.test(s) && /^[\x00-\x7f]*$/.test(s);
const slugified = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

function keywordOk(k: string): boolean {
  const t = k.trim();
  if (t.length < 3 || GENERIC.has(t.toLowerCase())) return false;
  if (isLatin(t)) return t.includes(' ') || t.length >= 6;
  return t.length >= 3;
}

type Phrase = { text: string; confidence: Confidence; kind: 'term' | 'keyword' };

// Distinctive phrases: terms (always) + keywords the page solely owns or that
// live in its slug. Generic shared keywords are excluded — they can't point
// at a unique destination.
function distinctivePhrases(p: Page): Phrase[] {
  const out: Phrase[] = [];
  const seen = new Set<string>();
  const add = (text: string, confidence: Confidence, kind: Phrase['kind']) => {
    const t = text.trim();
    const key = t.toLowerCase();
    if (t.length < 2 || seen.has(key)) return;
    seen.add(key);
    out.push({ text: t, confidence, kind });
  };
  if (p.collection === 'glossary' && p.title) {
    // Handle ASCII (Escrow) and full-width CJK （非同质化代币） parentheses.
    const head = p.title.split(/[(（]/)[0].trim().replace(/[?.!,;:，。！？；：]+$/, '');
    add(head, head.length <= 3 ? 'medium' : 'high', 'term');
    const paren = p.title.match(/[(（]([^)）]+)[)）]/);
    if (paren) add(paren[1], 'high', 'term');
  }
  if (p.collection === 'tld') add(`.${p.slug}`, 'high', 'term');
  for (const k of p.keywords) {
    if (!keywordOk(k)) continue;
    const sole = (kwOwners.get(`${p.locale}::${k.toLowerCase()}`)?.size ?? 0) <= 1;
    const inSlug = slugified(p.slug).includes(slugified(k));
    if (sole || inSlug) add(k, 'medium', 'keyword');
  }
  return out;
}

// --- global outbound index: phrase -> single canonical target --------------
type Resolved = { target: Page; confidence: Confidence; kind: Phrase['kind']; phrase: string };
const outboundIndex = new Map<string, Resolved>(); // `${locale}::${lowerphrase}` -> resolved (phrase keeps original case)
function betterThan(a: Resolved, b: Resolved): boolean {
  if (a.kind !== b.kind) return a.kind === 'term';
  if (CONFIDENCE_RANK[a.confidence] !== CONFIDENCE_RANK[b.confidence]) return CONFIDENCE_RANK[a.confidence] > CONFIDENCE_RANK[b.confidence];
  return COLLECTION_PRIORITY[a.target.collection] < COLLECTION_PRIORITY[b.target.collection];
}
for (const p of corpus)
  for (const ph of distinctivePhrases(p)) {
    const key = `${p.locale}::${ph.text.toLowerCase()}`;
    const cand: Resolved = { target: p, confidence: ph.confidence, kind: ph.kind, phrase: ph.text };
    const cur = outboundIndex.get(key);
    if (!cur || betterThan(cand, cur)) outboundIndex.set(key, cand);
  }

// --- matching helpers ------------------------------------------------------
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function buildScanner(phrases: string[]): { latin?: RegExp; other?: RegExp } {
  const latin = phrases.filter(isLatin).sort((a, b) => b.length - a.length);
  const other = phrases.filter((p) => !isLatin(p)).sort((a, b) => b.length - a.length);
  const res: { latin?: RegExp; other?: RegExp } = {};
  if (latin.length) res.latin = new RegExp(`(?<![A-Za-z0-9])(?:${latin.map(escapeRe).join('|')})(?![A-Za-z0-9])`, 'gi');
  if (other.length) res.other = new RegExp(`(?:${other.map(escapeRe).join('|')})`, 'g');
  return res;
}

function lineOf(prose: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < prose.length; i++) if (prose[i] === '\n') line++;
  return line;
}

function alreadyLinks(fromRaw: string, toHref: string): boolean {
  const noSlash = toHref.replace(/\/$/, '');
  return fromRaw.includes(`](${toHref}`) || fromRaw.includes(`](${noSlash}`);
}

// First occurrence (lowest index) of each distinct matched phrase in prose.
// Returns lowercased-key -> { index, text }: the key dedupes case-insensitively
// and joins the phrase indexes, while `text` keeps the prose's ORIGINAL casing
// so the reported anchor matches what's actually on the page.
function scanFirst(prose: string, scanner: { latin?: RegExp; other?: RegExp }): Map<string, { index: number; text: string }> {
  const first = new Map<string, { index: number; text: string }>();
  for (const re of [scanner.latin, scanner.other]) {
    if (!re) continue;
    for (const m of prose.matchAll(re)) {
      const key = m[0].toLowerCase();
      const idx = m.index ?? 0;
      const prev = first.get(key);
      if (!prev || idx < prev.index) first.set(key, { index: idx, text: m[0] });
    }
  }
  return first;
}

// --- per-target analysis ---------------------------------------------------
type OutboundCand = { target: string; phrase: string; line: number; confidence: Confidence };
type InboundCand = { source: string; phrase: string; line: number; confidence: Confidence };
type RelatedCand = { target: string; score: number; reasons: string[] };
type Report = { target: string; outbound: OutboundCand[]; inbound: InboundCand[]; related: RelatedCand[] };

function analyze(target: Page): Report {
  // OUTBOUND — scan target prose against the global phrase index for its locale.
  // Build the scanner from ORIGINAL-case phrases (not the lowercased keys) so
  // mixed-script phrases like "ccTLD 市场份额" — routed to the case-sensitive
  // non-Latin regex — still match the original casing in prose.
  const localePhrases = [...outboundIndex.entries()].filter(([k]) => k.startsWith(`${target.locale}::`)).map(([, v]) => v.phrase);
  const scanner = buildScanner(localePhrases);
  const matched = scanFirst(target.prose, scanner);
  const outByTarget = new Map<string, OutboundCand>();
  for (const [phrase, hit] of matched) {
    const res = outboundIndex.get(`${target.locale}::${phrase}`);
    if (!res || res.target.href === target.href) continue;
    if (!passConf(res.confidence) || alreadyLinks(target.raw, res.target.href)) continue;
    const cand: OutboundCand = { target: res.target.href, phrase: hit.text, line: lineOf(target.prose, hit.index), confidence: res.confidence };
    const prev = outByTarget.get(res.target.href);
    if (!prev || CONFIDENCE_RANK[cand.confidence] > CONFIDENCE_RANK[prev.confidence] || (CONFIDENCE_RANK[cand.confidence] === CONFIDENCE_RANK[prev.confidence] && cand.line < prev.line)) outByTarget.set(res.target.href, cand);
  }
  const outbound = [...outByTarget.values()].sort((a, b) => CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence] || a.line - b.line);

  // INBOUND — scan every same-locale page for the target's distinctive phrases.
  const inbound: InboundCand[] = [];
  const myPhrases = distinctivePhrases(target).filter((p) => passConf(p.confidence));
  if (!NO_INBOUND && myPhrases.length) {
    const myScanner = buildScanner(myPhrases.map((p) => p.text));
    const confOf = new Map(myPhrases.map((p) => [p.text.toLowerCase(), p.confidence]));
    for (const other of corpus) {
      if (other.locale !== target.locale || other.href === target.href) continue;
      if (alreadyLinks(other.raw, target.href)) continue;
      const hits = scanFirst(other.prose, myScanner);
      if (hits.size === 0) continue;
      let best: { phrase: string; idx: number; conf: Confidence } | null = null;
      for (const [phrase, hit] of hits) {
        const conf = confOf.get(phrase) ?? 'medium';
        if (!best || CONFIDENCE_RANK[conf] > CONFIDENCE_RANK[best.conf] || (CONFIDENCE_RANK[conf] === CONFIDENCE_RANK[best.conf] && hit.index < best.idx)) best = { phrase: hit.text, idx: hit.index, conf };
      }
      if (best) inbound.push({ source: rel(other.file), phrase: best.phrase, line: lineOf(other.prose, best.idx), confidence: best.conf });
    }
    inbound.sort((a, b) => CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence] || a.source.localeCompare(b.source));
  }

  // RELATED — keyword overlap + cluster/series boost.
  const related: RelatedCand[] = [];
  if (!NO_RELATED) {
    const mine = new Set(target.keywords.map((k) => k.toLowerCase()));
    for (const other of corpus) {
      if (other.locale !== target.locale || other.href === target.href) continue;
      const shared = other.keywords.filter((k) => mine.has(k.toLowerCase()));
      let score = shared.length;
      const reasons: string[] = [];
      if (shared.length) reasons.push(`${shared.length} shared keyword(s): ${shared.slice(0, 3).join(', ')}`);
      if (target.cluster && other.cluster === target.cluster) {
        score += 2;
        reasons.push(`same cluster: ${target.cluster}`);
      }
      if (target.series && other.series === target.series) {
        score += 3;
        reasons.push(`same series: ${target.series}`);
      }
      if (score > 0) related.push({ target: other.href, score, reasons });
    }
    related.sort((a, b) => b.score - a.score);
  }

  return { target: target.href, outbound, inbound, related: related.slice(0, 8) };
}

// --- --term mode: per-locale anchor + counterpart table -------------------
// Supports the "apply the link in every language" step: discovery is English
// only, but the link must be mirrored into each locale. For a link target this
// prints, per locale, whether a counterpart exists, its href, and the anchor
// text to look for (that locale's title of the target).
type TermLocale = { locale: string; exists: boolean; href: string; anchor: string | null };
type TermResult = { collection: string; slug: string; enTitle: string | null; locales: TermLocale[] };
const termResults: TermResult[] = [];
if (termArgs.length) {
  // The mirror anchor is the page's canonical matched phrase(s) — the same
  // distinctive terms OUTBOUND/INBOUND link on — NOT the full frontmatter title
  // (a TLD title is a long explainer, but the linked token is ".com").
  const anchorFor = (pg: Page): string => {
    const ph = distinctivePhrases(pg);
    const terms = ph.filter((p) => p.kind === 'term').map((p) => p.text);
    if (terms.length) return terms.join(' / ');
    const all = ph.map((p) => p.text);
    return all.length ? all.slice(0, 3).join(' / ') : pg.title;
  };
  for (const t of termArgs) {
    let collection: string | undefined;
    let slug: string | undefined;
    const hrefM = t.match(/^\/[a-z]{2}(?:-[A-Z]{2})?\/([a-z]+)\/(.+?)\/?$/);
    if (hrefM) {
      collection = hrefM[1];
      slug = hrefM[2];
    } else {
      const p = loadPage(path.resolve(process.cwd(), t));
      if (p) {
        collection = p.collection;
        slug = p.slug;
      }
    }
    if (!collection || !(COLLECTIONS as readonly string[]).includes(collection) || !slug) {
      console.error(`--term: cannot resolve "${t}" to a <collection>/<slug>`);
      continue;
    }
    const coll = collection;
    const sl = slug;
    const enPage = byHref.get(`/en/${coll}/${sl}/`);
    const locales: TermLocale[] = LOCALES.map((locale) => {
      const pg = byHref.get(`/${locale}/${coll}/${sl}/`);
      return { locale, exists: !!pg, href: `/${locale}/${coll}/${sl}/`, anchor: pg ? anchorFor(pg) : null };
    });
    termResults.push({ collection: coll, slug: sl, enTitle: enPage ? enPage.title : null, locales });
  }
  if (!JSON_OUT) {
    const tty = process.stdout.isTTY;
    const c = (code: string, s: string) => (tty ? `\x1b[${code}m${s}\x1b[0m` : s);
    for (const tr of termResults) {
      console.log(c('1', `\n# ${tr.collection}/${tr.slug}  `) + (tr.enTitle ? c('2', `(en: ${tr.enTitle})`) : c('31', '(no en page!)')));
      for (const l of tr.locales) {
        if (l.exists) console.log(`  ${l.locale}  ${c('32', '✓')}  ${l.href}  ${c('2', '→ anchor:')} "${l.anchor}"`);
        else console.log(`  ${l.locale}  ${c('31', '✗')}  ${c('2', `no counterpart → keep /en/${tr.collection}/${tr.slug}/`)}`);
      }
    }
    console.log('');
  }
  // With no positional file targets this is the whole run: emit term results
  // (as JSON when requested) and stop. Otherwise fall through and also analyze
  // the files; --json then emits a single combined { terms, reports } document.
  if (targets.length === 0) {
    if (JSON_OUT) console.log(JSON.stringify(termResults, null, 2));
    process.exit(0);
  }
}

// --- run -------------------------------------------------------------------
const reports: Report[] = [];
for (const t of targets) {
  const abs = path.resolve(process.cwd(), t);
  const page = corpus.find((p) => p.file === abs) ?? loadPage(abs);
  if (!page) {
    console.error(`skip (not a content page): ${t}`);
    continue;
  }
  reports.push(analyze(page));
}

if (JSON_OUT) {
  console.log(JSON.stringify(termResults.length ? { terms: termResults, reports } : reports, null, 2));
} else {
  const tty = process.stdout.isTTY;
  const c = (code: string, s: string) => (tty ? `\x1b[${code}m${s}\x1b[0m` : s);
  const cc: Record<Confidence, string> = { high: '32', medium: '33', low: '2' };
  for (const r of reports) {
    const tp = byHref.get(r.target);
    console.log(c('1', `\n# ${r.target}  ${tp ? c('2', `(${tp.title})`) : ''}`));

    console.log(c('1', `\nOUTBOUND — add links IN this page (it mentions these existing pages):`));
    if (r.outbound.length === 0) console.log('  (none)');
    for (const o of r.outbound) console.log(`  ${c(cc[o.confidence], o.confidence.padEnd(6))} L${o.line}  "${o.phrase}"  → ${o.target}`);

    if (!NO_INBOUND) {
      console.log(c('1', `\nINBOUND — add a back-link to this page FROM (they mention its terms):`));
      if (r.inbound.length === 0) console.log('  (none)');
      for (const i of r.inbound) console.log(`  ${c(cc[i.confidence], i.confidence.padEnd(6))} ${i.source}:L${i.line}  "${i.phrase}"`);
    }

    if (!NO_RELATED) {
      console.log(c('1', `\nRELATED — by keyword/cluster/series (model picks which to weave in):`));
      if (r.related.length === 0) console.log('  (none)');
      for (const rc of r.related) console.log(`  ${c('36', `score ${rc.score}`)}  ${rc.target}  ${c('2', `— ${rc.reasons.join('; ')}`)}`);
    }
  }
  console.log('');
}
