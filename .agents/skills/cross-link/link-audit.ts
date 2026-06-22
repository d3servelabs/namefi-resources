#!/usr/bin/env bun
/**
 * cross-link link auditor for namefi-resources.
 *
 * Deterministic backbone of the `cross-link` skill. It does NOT invent
 * editorial links (that is the model's judgement job) — it audits the
 * internal links that already exist and finds the two mechanical failure
 * modes a human eye misses across 7 locales x 4 collections:
 *
 *   BROKEN          target slug does not exist in ANY locale -> 404.
 *   LOCALE_MISMATCH link locale != file locale AND a same-locale counterpart
 *                   exists. e.g. a `zh` post links to `/en/glossary/dns/`
 *                   while `/zh/glossary/dns/` exists. Auto-fixable: repoint
 *                   the link to the file's own locale.
 *   CROSS_LOCALE    link locale != file locale and NO same-locale counterpart
 *                   exists (the term is only translated in the linked locale).
 *                   Acceptable fallback — surfaced as a warning, never auto-fixed.
 *
 * Internal links are written as absolute, locale-prefixed, trailing-slash
 * paths: /<locale>/<collection>/<slug>/ . The resources app does NOT
 * auto-localize hrefs (see apps/resources/src/mdx-components.tsx), so the
 * locale in the href is authoritative: a mismatch is a real bug, not cosmetic.
 *
 * Usage (run from the namefi-resources repo root):
 *   bun .agents/skills/cross-link/link-audit.ts                 # audit everything
 *   bun .agents/skills/cross-link/link-audit.ts content/blog/zh # audit a subtree
 *   bun .agents/skills/cross-link/link-audit.ts --fix <paths>   # repoint LOCALE_MISMATCH
 *   bun .agents/skills/cross-link/link-audit.ts --json <paths>  # machine-readable
 *
 * Exit code is 1 when BROKEN links remain (after --fix), else 0.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const LOCALES = ['en', 'es', 'de', 'fr', 'zh', 'ar', 'hi'] as const;
const COLLECTIONS = ['blog', 'glossary', 'tld', 'partners'] as const;
const MD_EXT = new Set(['.md', '.mdx']);

type Severity = 'BROKEN' | 'LOCALE_MISMATCH' | 'CROSS_LOCALE';
type Finding = {
  file: string;
  line: number;
  severity: Severity;
  href: string;
  fixedHref?: string;
  collection: string;
  slug: string;
  fileLocale: string;
  linkLocale: string;
};

// --- arg parsing -----------------------------------------------------------
const argv = process.argv.slice(2);
const FIX = argv.includes('--fix');
const JSON_OUT = argv.includes('--json');
const pathArgs = argv.filter((a) => !a.startsWith('--'));

// --- locate the content/ root ---------------------------------------------
function findContentRoot(): string {
  const fromCwd = path.join(process.cwd(), 'content');
  try {
    if (statSync(fromCwd).isDirectory()) return fromCwd;
  } catch {
    /* fall through */
  }
  // .agents/skills/cross-link/ -> repo root is three levels up.
  const fromScript = path.resolve(import.meta.dir, '../../..', 'content');
  try {
    if (statSync(fromScript).isDirectory()) return fromScript;
  } catch {
    /* fall through */
  }
  console.error(
    'Could not find a content/ directory. Run from the namefi-resources repo root.',
  );
  process.exit(2);
}

const CONTENT_ROOT = findContentRoot();
const REPO_ROOT = path.dirname(CONTENT_ROOT);

function rel(file: string) {
  return path.relative(REPO_ROOT, file).split(path.sep).join('/');
}

// --- walk content + build the slug index ----------------------------------
function listMarkdown(dir: string): string[] {
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...listMarkdown(full));
    else if (MD_EXT.has(path.extname(entry))) out.push(full);
  }
  return out;
}

const allFiles: string[] = [];
const slugIndex = new Set<string>(); // `${collection}/${locale}/${slug}`
for (const collection of COLLECTIONS) {
  for (const locale of LOCALES) {
    const dir = path.join(CONTENT_ROOT, collection, locale);
    for (const file of listMarkdown(dir)) {
      allFiles.push(file);
      const slug = path.basename(file).replace(/\.mdx?$/, '');
      slugIndex.add(`${collection}/${locale}/${slug}`);
    }
  }
}

// Which files to audit (full index is always built so counterpart lookups work).
const absPathArgs = pathArgs.map((p) => path.resolve(process.cwd(), p));
function inScope(file: string) {
  if (absPathArgs.length === 0) return true;
  return absPathArgs.some((p) => file === p || file.startsWith(p + path.sep));
}
const auditFiles = allFiles.filter(inScope);

// --- strip frontmatter + code so we only look at prose links ---------------
function stripNonProse(raw: string): string {
  let body = raw;
  // leading YAML frontmatter
  body = body.replace(/^---\n[\s\S]*?\n---\n?/, (m) =>
    m.replace(/[^\n]/g, ' '),
  );
  // fenced code blocks (``` or ~~~) — blank them out, preserving line count
  body = body.replace(/^([ \t]*)(`{3,}|~{3,})[\s\S]*?\n\1\2[^\n]*$/gm, (m) =>
    m.replace(/[^\n]/g, ' '),
  );
  // inline code spans
  body = body.replace(/`[^`\n]*`/g, (m) => m.replace(/[^\n]/g, ' '));
  return body;
}

const LOCALE_RE = LOCALES.join('|');
const COLL_RE = COLLECTIONS.join('|');
// matches `](/<locale>/<collection>/<slug>[/][#anchor])`, href token has no
// spaces/quotes/closeparen so a `](href "title")` form still captures cleanly.
const LINK_RE = new RegExp(
  String.raw`\]\((\/(?:${LOCALE_RE})\/(?:${COLL_RE})\/[^)\s"]+)`,
  'g',
);
const HREF_PARTS_RE = new RegExp(
  String.raw`^\/(${LOCALE_RE})\/(${COLL_RE})\/([^\/#?]+)\/?(?:[#?].*)?$`,
);

function localeOfFile(file: string): string | null {
  const r = rel(file); // content/<collection>/<locale>/<slug>.md
  const m = r.match(new RegExp(String.raw`^content\/[^/]+\/([^/]+)\/`));
  return m ? m[1] : null;
}

// Every internal-link href in `content` whose exact target
// (`<collection>/<linkLocale>/<slug>`) is absent from slugIndex — i.e. a 404.
// Used by the --fix self-check to prove a rewrite never *introduces* a dead
// link (the en-only mislocalization bug). Returns raw hrefs (may repeat).
function findAbsentTargets(content: string): string[] {
  const prose = stripNonProse(content);
  const out: string[] = [];
  for (const m of prose.matchAll(LINK_RE)) {
    const href = m[1];
    const parts = href.match(HREF_PARTS_RE);
    if (!parts) continue;
    const [, linkLocale, collection, slugRaw] = parts;
    const slug = decodeURIComponent(slugRaw);
    if (!slugIndex.has(`${collection}/${linkLocale}/${slug}`)) out.push(href);
  }
  return out;
}

// --- audit -----------------------------------------------------------------
const findings: Finding[] = [];
const filesToRewrite = new Map<string, string>();
// Count of files where --fix would have created a dead link and was refused.
let selfCheckFailures = 0;

for (const file of auditFiles) {
  const fileLocale = localeOfFile(file);
  if (!fileLocale || !(LOCALES as readonly string[]).includes(fileLocale)) {
    continue;
  }
  const raw = readFileSync(file, 'utf8');
  const prose = stripNonProse(raw);
  const lineStarts: number[] = [0];
  for (let i = 0; i < prose.length; i++) {
    if (prose[i] === '\n') lineStarts.push(i + 1);
  }
  const lineAt = (idx: number) => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= idx) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };

  // Collected --fix rewrites as exact byte spans into `raw`. prose is built by
  // stripNonProse, which blanks frontmatter/code char-for-char (length and
  // newlines preserved), so a match index in `prose` is the same index in
  // `raw`. Splicing exact spans — rather than the old substring replace —
  // is what makes the fix immune to prefix collisions (see below).
  const edits: { start: number; end: number; replacement: string }[] = [];

  for (const m of prose.matchAll(LINK_RE)) {
    const href = m[1];
    const parts = href.match(HREF_PARTS_RE);
    if (!parts) continue;
    const [, linkLocale, collection, slugRaw] = parts;
    const slug = decodeURIComponent(slugRaw);

    const literalExists = slugIndex.has(`${collection}/${linkLocale}/${slug}`);
    // The file's OWN locale having the slug is the single source of truth for
    // "auto-fixable": it guarantees the repointed /<fileLocale>/ href resolves
    // to a real slug, so --fix can never localize an en-only term into a 404.
    const sameLocaleExists = slugIndex.has(
      `${collection}/${fileLocale}/${slug}`,
    );

    let severity: Severity | null = null;
    let fixedHref: string | undefined;

    if (!literalExists) {
      // The linked locale itself lacks the slug → this exact href 404s.
      if (sameLocaleExists) {
        severity = 'LOCALE_MISMATCH';
        fixedHref = href.replace(`/${linkLocale}/`, `/${fileLocale}/`);
      } else {
        // Missing in the linked locale and in ours — not auto-fixable.
        severity = 'BROKEN';
      }
    } else if (linkLocale !== fileLocale) {
      if (sameLocaleExists) {
        severity = 'LOCALE_MISMATCH';
        fixedHref = href.replace(`/${linkLocale}/`, `/${fileLocale}/`);
      } else {
        // Term only translated in the linked locale — acceptable fallback.
        severity = 'CROSS_LOCALE';
      }
    }

    if (!severity) continue;

    findings.push({
      file: rel(file),
      line: lineAt(m.index ?? 0),
      severity,
      href,
      fixedHref,
      collection,
      slug,
      fileLocale,
      linkLocale,
    });

    if (FIX && severity === 'LOCALE_MISMATCH' && fixedHref) {
      // Rewrite ONLY this href occurrence. The previous implementation did
      // `content.split(`](${href}`).join(...)`, a substring replace that also
      // rewrote any longer href sharing this one as a prefix: fixing
      // `](/en/glossary/dns` clobbered the sibling `](/en/glossary/dnssec/)`,
      // repointing an en-only fallback to a /zh/ 404 (and doing so only for
      // the no-trailing-slash form). LINK_RE puts m.index at the `]`, so the
      // href begins two chars later, at `](`.length.
      const start = (m.index ?? 0) + 2;
      edits.push({ start, end: start + href.length, replacement: fixedHref });
    }
  }

  if (FIX && edits.length > 0) {
    // Apply right-to-left so earlier offsets stay valid as we splice.
    edits.sort((a, b) => b.start - a.start);
    let mutated = raw;
    for (const e of edits) {
      mutated = mutated.slice(0, e.start) + e.replacement + mutated.slice(e.end);
    }
    // Guard: --fix must never INTRODUCE a link whose target is absent from
    // slugIndex. Pre-existing BROKEN links are allowed to remain (we don't
    // invent translations), so compare against the original rather than
    // requiring zero. If the rewrite would create a new dead link, refuse to
    // write the file and fail the run loudly instead of shipping a 404.
    const before = new Set(findAbsentTargets(raw));
    const introduced = findAbsentTargets(mutated).filter((h) => !before.has(h));
    if (introduced.length > 0) {
      console.error(
        `✗ self-check failed for ${rel(file)}: --fix would create dead ` +
          `link(s) absent from slugIndex: ${introduced.join(', ')}. ` +
          `Refusing to write this file.`,
      );
      selfCheckFailures++;
    } else {
      filesToRewrite.set(file, mutated);
    }
  }
}

if (FIX) {
  for (const [file, content] of filesToRewrite) writeFileSync(file, content);
}

// --- report ----------------------------------------------------------------
if (JSON_OUT) {
  console.log(JSON.stringify({ findings, fixedFiles: [...filesToRewrite.keys()].map(rel) }, null, 2));
} else {
  const tty = process.stdout.isTTY;
  const c = (code: string, s: string) => (tty ? `[${code}m${s}[0m` : s);
  const tag: Record<Severity, string> = {
    BROKEN: c('31', '✗ BROKEN'),
    LOCALE_MISMATCH: c('33', '⚠ LOCALE'),
    CROSS_LOCALE: c('2', '· x-locale'),
  };
  const byFile = new Map<string, Finding[]>();
  for (const f of findings) {
    if (!byFile.has(f.file)) byFile.set(f.file, []);
    byFile.get(f.file)!.push(f);
  }
  for (const [file, list] of [...byFile.entries()].sort()) {
    console.log(c('1', file));
    for (const f of list.sort((a, b) => a.line - b.line)) {
      const fixNote =
        f.severity === 'LOCALE_MISMATCH'
          ? `  ${FIX ? 'fixed→' : '→'} ${f.fixedHref}`
          : '';
      console.log(`  ${tag[f.severity]}  L${f.line}  ${f.href}${fixNote}`);
    }
  }
  const broken = findings.filter((f) => f.severity === 'BROKEN').length;
  const mismatch = findings.filter((f) => f.severity === 'LOCALE_MISMATCH').length;
  const xloc = findings.filter((f) => f.severity === 'CROSS_LOCALE').length;
  console.log('');
  console.log(
    `Audited ${auditFiles.length} file(s): ` +
      `${c('31', `${broken} broken`)}, ` +
      `${c('33', `${mismatch} locale-mismatch`)}${FIX ? ` (${filesToRewrite.size} file(s) rewritten)` : ''}, ` +
      `${c('2', `${xloc} cross-locale fallback`)}.`,
  );
  if (!FIX && mismatch > 0) {
    console.log('Re-run with --fix to repoint locale-mismatch links automatically.');
  }
  if (selfCheckFailures > 0) {
    console.log(
      c('31', `${selfCheckFailures} file(s) skipped: --fix self-check failed.`),
    );
  }
}

process.exitCode =
  selfCheckFailures > 0 || findings.some((f) => f.severity === 'BROKEN') ? 1 : 0;
