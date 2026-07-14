#!/usr/bin/env bun
/**
 * Deterministic internal-link auditor for namefi-resources.
 *
 * Locale invariant: content stored under content/<collection>/<locale>/ must
 * keep every recognized locale-prefixed route in that same locale. A missing
 * translation does not relax the rule: /<locale>/... is preserved so the
 * resources runtime can apply its default-locale fallback.
 *
 * The focused locale check scans Markdown/MDX links plus the related-content
 * frontmatter fields already understood by scripts/validate-data.ts. For
 * translated content, relatedArticles and relatedGlossary must also preserve
 * the English source's ordered relationship slugs while using the file locale:
 *
 *   bun links:locale
 *   bun links:locale --fix
 *
 * The full audit additionally checks supported content routes for broken and
 * missing-locale links:
 *
 *   bun links:audit
 *   bun links:audit --fix
 *
 * Both modes accept path scopes and --json. Locale/relationship mismatches,
 * broken targets, and missing locale prefixes are blocking in the full audit.
 * The focused locale mode intentionally ignores external URLs, anchors, and
 * internal paths that do not begin with a recognized locale prefix.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

// Mirrors i18n.defaultLocale in apps/resources. A same-locale route whose
// translation is absent is still resolvable when this locale has the slug.
const DEFAULT_LOCALE = 'en';
const LINK_COLLECTIONS = ['blog', 'glossary', 'tld', 'partners'] as const;
const LOCALE_SOURCE_COLLECTIONS = [
  ...LINK_COLLECTIONS,
  'authors',
] as const;
const RELATED_PATH_FIELDS = [
  'relatedArticles',
  'relatedTopics',
  'relatedSeries',
  'relatedGlossary',
] as const;
const SOURCE_RELATION_FIELDS = [
  'relatedArticles',
  'relatedGlossary',
] as const;
const MD_EXT = new Set(['.md', '.mdx']);

type Severity =
  | 'BROKEN'
  | 'MISSING_LOCALE'
  | 'LOCALE_MISMATCH'
  | 'RELATIONSHIP_MISMATCH'
  | 'MISSING_TRANSLATION';
type RelatedPathField = (typeof RELATED_PATH_FIELDS)[number];
type SourceRelationField = (typeof SOURCE_RELATION_FIELDS)[number];
type Finding = {
  file: string;
  line: number;
  severity: Severity;
  href: string;
  fixedHref?: string;
  collection?: string;
  slug?: string;
  fileLocale: string;
  linkLocale: string;
  source: 'markdown' | 'frontmatter';
  field?: RelatedPathField;
  fixable?: boolean;
};
type RouteOccurrence = {
  href: string;
  start: number;
};
type RelatedFrontmatter = {
  values: Record<RelatedPathField, string[]>;
  occurrences: Array<
    RouteOccurrence & { field: RelatedPathField; valueIndex: number }
  >;
  fieldStarts: Partial<Record<RelatedPathField, number>>;
};

// --- arg parsing -----------------------------------------------------------
const argv = process.argv.slice(2);
const FIX = argv.includes('--fix');
const JSON_OUT = argv.includes('--json');
const LOCALE_ONLY = argv.includes('--locale-only');
const pathArgs = argv.filter((arg) => !arg.startsWith('--'));

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

function listDirectories(dir: string): string[] {
  try {
    return readdirSync(dir).filter((entry) =>
      statSync(path.join(dir, entry)).isDirectory(),
    );
  } catch {
    return [];
  }
}

/**
 * The repository's locale folders are the content model. Discovering their
 * union prevents a new locale from being silently omitted by a hand-maintained
 * checker list. `_shared` and non-locale utility directories are excluded by
 * the locale-shaped folder convention.
 */
function discoverContentLocales(): string[] {
  const localePattern = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/;
  const locales = new Set<string>();

  for (const collection of LOCALE_SOURCE_COLLECTIONS) {
    for (const entry of listDirectories(path.join(CONTENT_ROOT, collection))) {
      if (localePattern.test(entry)) locales.add(entry);
    }
  }

  if (!locales.has(DEFAULT_LOCALE)) {
    console.error(
      `Could not discover the default content locale (${DEFAULT_LOCALE}) under content/.`,
    );
    process.exit(2);
  }

  return [...locales].sort((a, b) => a.localeCompare(b));
}

const LOCALES = discoverContentLocales();

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

const slugIndex = new Set<string>(); // `${collection}/${locale}/${slug}`
for (const collection of LINK_COLLECTIONS) {
  for (const locale of LOCALES) {
    for (const file of listMarkdown(path.join(CONTENT_ROOT, collection, locale))) {
      const slug = path.basename(file).replace(/\.mdx?$/, '');
      slugIndex.add(`${collection}/${locale}/${slug}`);
    }
  }
}

// Audit every localized Markdown/MDX collection, not only the four route
// collections used by the broken-target classifier.
const allFiles: string[] = [];
for (const collection of listDirectories(CONTENT_ROOT)) {
  for (const locale of LOCALES) {
    allFiles.push(
      ...listMarkdown(path.join(CONTENT_ROOT, collection, locale)),
    );
  }
}

// Which files to audit (the full slug index is always built for lookups).
const absPathArgs = pathArgs.map((arg) => path.resolve(process.cwd(), arg));
function inScope(file: string) {
  if (absPathArgs.length === 0) return true;
  return absPathArgs.some(
    (scope) => file === scope || file.startsWith(scope + path.sep),
  );
}
const auditFiles = allFiles.filter(inScope);

// --- route extraction ------------------------------------------------------
function stripNonProse(raw: string): string {
  let body = raw;
  // Blank leading YAML frontmatter while preserving byte offsets and lines.
  body = body.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, (match) =>
    match.replace(/[^\n]/g, ' '),
  );
  // Blank fenced code blocks (``` or ~~~), preserving byte offsets and lines.
  body = body.replace(
    /^([ \t]*)(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n\1\2[^\n]*$/gm,
    (match) => match.replace(/[^\n]/g, ' '),
  );
  // Blank inline code spans.
  body = body.replace(/`[^`\n]*`/g, (match) => match.replace(/[^\n]/g, ' '));
  return body;
}

function routeOccurrences(prose: string): RouteOccurrence[] {
  const occurrences: RouteOccurrence[] = [];
  const patterns = [
    // Inline Markdown links and images: [label](/route) / ![alt](/route).
    /\]\(\s*<?(\/[^)\s<>"']+)>?/g,
    // Reference definitions: [label]: /route or [label]: </route>.
    /^[ \t]{0,3}\[[^\]\n]+\]:[ \t]*<?(\/[^\s<>]+)>?/gm,
    // HTML and MDX href attributes, including href={"/route"}.
    /\bhref\s*=\s*(?:\{\s*)?["'](\/[^"']+)["'](?:\s*\})?/g,
  ];

  for (const pattern of patterns) {
    for (const match of prose.matchAll(pattern)) {
      const href = match[1];
      const matchStart = match.index ?? 0;
      occurrences.push({
        href,
        start: matchStart + match[0].indexOf(href),
      });
    }
  }

  const unique = new Map<string, RouteOccurrence>();
  for (const occurrence of occurrences) {
    unique.set(`${occurrence.start}:${occurrence.href}`, occurrence);
  }
  return [...unique.values()].sort((a, b) => a.start - b.start);
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function relatedFrontmatter(raw: string): RelatedFrontmatter {
  const emptyValues = (): Record<RelatedPathField, string[]> => ({
    relatedArticles: [],
    relatedTopics: [],
    relatedSeries: [],
    relatedGlossary: [],
  });
  const frontmatterMatch = raw.match(
    /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/,
  );
  if (!frontmatterMatch) {
    return { values: emptyValues(), occurrences: [], fieldStarts: {} };
  }

  let data: Record<string, unknown>;
  try {
    data = matter(raw).data as Record<string, unknown>;
  } catch {
    // scripts/validate-data.ts owns YAML parse diagnostics.
    return { values: emptyValues(), occurrences: [], fieldStarts: {} };
  }

  const frontmatter = frontmatterMatch[0];
  const values = emptyValues();
  const occurrences: RelatedFrontmatter['occurrences'] = [];
  const fieldStarts: RelatedFrontmatter['fieldStarts'] = {};
  const topLevelKeys = [...frontmatter.matchAll(/^([A-Za-z_][\w-]*)\s*:/gm)];

  for (const field of RELATED_PATH_FIELDS) {
    values[field] = asStringArray(data[field]);
    const keyIndex = topLevelKeys.findIndex((match) => match[1] === field);
    if (keyIndex === -1) continue;

    const fieldStart = topLevelKeys[keyIndex].index ?? 0;
    const fieldEnd = topLevelKeys[keyIndex + 1]?.index ?? frontmatter.length;
    fieldStarts[field] = fieldStart;
    let searchFrom = fieldStart;

    for (const [valueIndex, href] of values[field].entries()) {
      const start = frontmatter.indexOf(href, searchFrom);
      if (start === -1 || start >= fieldEnd) continue;
      occurrences.push({ href, start, field, valueIndex });
      searchFrom = start + href.length;
    }
  }

  return {
    values,
    occurrences: occurrences.sort((a, b) => a.start - b.start),
    fieldStarts,
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Longest first prevents a shorter locale from claiming a compound prefix.
const LOCALE_RE = [...LOCALES]
  .sort((a, b) => b.length - a.length)
  .map(escapeRegExp)
  .join('|');
const COLLECTION_RE = LINK_COLLECTIONS.map(escapeRegExp).join('|');
const LOCALIZED_PREFIX_RE = new RegExp(String.raw`^\/(${LOCALE_RE})\/`);
const HREF_PARTS_RE = new RegExp(
  String.raw`^\/(${LOCALE_RE})\/(${COLLECTION_RE})\/([^\/#?]+)\/?(?:[#?].*)?$`,
);
const BARE_HREF_PARTS_RE = new RegExp(
  String.raw`^\/(${COLLECTION_RE})\/([^\/#?]+)\/?(?:[#?].*)?$`,
);

function localeOfFile(file: string): string | null {
  const match = rel(file).match(/^content\/[^/]+\/([^/]+)\//);
  return match ? match[1] : null;
}

function replaceLocalePrefix(href: string, locale: string) {
  return href.replace(/^\/[^/]+(?=\/)/, `/${locale}`);
}

function englishCounterpart(file: string): string | null {
  const match = rel(file).match(/^content\/([^/]+)\/([^/]+)\/(.+)$/);
  if (!match || match[2] === DEFAULT_LOCALE) return null;

  const [, collection, , relativeFile] = match;
  const direct = path.join(CONTENT_ROOT, collection, DEFAULT_LOCALE, relativeFile);
  if (statSync(direct, { throwIfNoEntry: false })?.isFile()) return direct;

  const extension = path.extname(direct);
  for (const candidateExtension of MD_EXT) {
    if (candidateExtension === extension) continue;
    const candidate = direct.slice(0, -extension.length) + candidateExtension;
    if (statSync(candidate, { throwIfNoEntry: false })?.isFile()) return candidate;
  }
  return null;
}

function sourceRelationshipRoutes(
  file: string,
): Partial<Record<SourceRelationField, string[]>> | null {
  const sourceFile = englishCounterpart(file);
  if (!sourceFile) return null;

  let data: Record<string, unknown>;
  try {
    data = matter(readFileSync(sourceFile, 'utf8')).data as Record<string, unknown>;
  } catch {
    // scripts/validate-data.ts owns YAML parse diagnostics.
    return null;
  }

  const routes: Partial<Record<SourceRelationField, string[]>> = {};
  for (const field of SOURCE_RELATION_FIELDS) {
    routes[field] = asStringArray(data[field]);
  }
  return routes;
}

function localizedSourceRoute(
  href: string,
  field: SourceRelationField,
  locale: string,
): string | null {
  const parts = href.match(HREF_PARTS_RE);
  const expectedCollection =
    field === 'relatedArticles' ? 'blog' : 'glossary';
  if (!parts || parts[1] !== DEFAULT_LOCALE || parts[2] !== expectedCollection) {
    return null;
  }
  return replaceLocalePrefix(href, locale);
}

function decodeSlug(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

function unresolvableTargetCounts(content: string): Map<string, number> {
  const counts = new Map<string, number>();
  const occurrences = [
    ...routeOccurrences(stripNonProse(content)),
    ...relatedFrontmatter(content).occurrences,
  ];
  for (const occurrence of occurrences) {
    const parts = occurrence.href.match(HREF_PARTS_RE);
    if (!parts) continue;
    const [, linkLocale, collection, slugRaw] = parts;
    const slug = decodeSlug(slugRaw);
    const literalExists = slugIndex.has(`${collection}/${linkLocale}/${slug}`);
    const defaultExists = slugIndex.has(
      `${collection}/${DEFAULT_LOCALE}/${slug}`,
    );
    if (literalExists || defaultExists) continue;
    // Prefix-only repair can change `/fr/.../slug/` into `/ar/.../slug/`.
    // Compare target identity rather than its rendered href so an already-dead
    // slug is not mistaken for a newly introduced 404 after that repair.
    const targetKey = `${collection}/${slug}`;
    counts.set(targetKey, (counts.get(targetKey) ?? 0) + 1);
  }
  return counts;
}

// --- audit -----------------------------------------------------------------
const findings: Finding[] = [];
const filesToRewrite = new Map<string, string>();
let selfCheckFailures = 0;

for (const file of auditFiles) {
  const fileLocale = localeOfFile(file);
  if (!fileLocale || !LOCALES.includes(fileLocale)) continue;

  const raw = readFileSync(file, 'utf8');
  const prose = stripNonProse(raw);
  const frontmatter = relatedFrontmatter(raw);
  const lineStarts: number[] = [0];
  for (let index = 0; index < raw.length; index++) {
    if (raw[index] === '\n') lineStarts.push(index + 1);
  }
  const lineAt = (index: number) => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= index) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };

  // Exact byte-span edits make prefix-only repairs deterministic and preserve
  // slugs, query strings, fragments, prose, and formatting verbatim.
  const edits: { start: number; end: number; replacement: string }[] = [];

  const recordLocaleMismatch = ({
    href,
    start,
    source,
    field,
  }: RouteOccurrence & {
    source: Finding['source'];
    field?: RelatedPathField;
  }) => {
    const prefix = href.match(LOCALIZED_PREFIX_RE);
    if (!prefix || prefix[1] === fileLocale) return false;

    const linkLocale = prefix[1];
    const fixedHref = replaceLocalePrefix(href, fileLocale);
    const parts = href.match(HREF_PARTS_RE);
    findings.push({
      file: rel(file),
      line: lineAt(start),
      severity: 'LOCALE_MISMATCH',
      href,
      fixedHref,
      collection: parts?.[2],
      slug: parts ? decodeSlug(parts[3]) : undefined,
      fileLocale,
      linkLocale,
      source,
      field,
    });
    if (FIX) {
      edits.push({
        start,
        end: start + href.length,
        replacement: fixedHref,
      });
    }
    return true;
  };

  const sourceRelationships = sourceRelationshipRoutes(file);
  const parityFields = new Set<SourceRelationField>();
  if (sourceRelationships) {
    for (const field of SOURCE_RELATION_FIELDS) {
      const sourceValues = sourceRelationships[field] ?? [];
      const expectedValues = sourceValues.map((href) =>
        localizedSourceRoute(href, field, fileLocale),
      );
      if (expectedValues.length === 0) continue;

      parityFields.add(field);
      const actualValues = frontmatter.values[field];
      const occurrencesByIndex = new Map(
        frontmatter.occurrences
          .filter((occurrence) => occurrence.field === field)
          .map((occurrence) => [occurrence.valueIndex, occurrence]),
      );
      const comparisonLength = Math.max(
        actualValues.length,
        expectedValues.length,
      );

      for (let valueIndex = 0; valueIndex < comparisonLength; valueIndex++) {
        const actualHref = actualValues[valueIndex];
        const expectedHref = expectedValues[valueIndex];
        // Ignore only the malformed/external English source item. A bad source
        // value must not disable parity checking for every other relationship
        // in this field.
        if (expectedHref === null) continue;
        if (actualHref === expectedHref) continue;

        const occurrence = occurrencesByIndex.get(valueIndex);
        if (
          actualHref &&
          expectedHref &&
          replaceLocalePrefix(actualHref, fileLocale) === expectedHref &&
          actualHref.match(LOCALIZED_PREFIX_RE)
        ) {
          recordLocaleMismatch({
            href: actualHref,
            start:
              occurrence?.start ?? frontmatter.fieldStarts[field] ?? 0,
            source: 'frontmatter',
            field,
          });
          continue;
        }

        const expectedDisplay = expectedHref ?? '<no relationship>';
        const fixable = Boolean(
          occurrence && expectedHref && actualHref?.match(HREF_PARTS_RE),
        );
        findings.push({
          file: rel(file),
          line: lineAt(
            occurrence?.start ?? frontmatter.fieldStarts[field] ?? 0,
          ),
          severity: 'RELATIONSHIP_MISMATCH',
          href: actualHref ?? '<missing>',
          fixedHref: expectedDisplay,
          fileLocale,
          linkLocale: actualHref?.match(LOCALIZED_PREFIX_RE)?.[1] ?? '',
          source: 'frontmatter',
          field,
          fixable,
        });
        if (FIX && fixable && occurrence && expectedHref) {
          edits.push({
            start: occurrence.start,
            end: occurrence.start + occurrence.href.length,
            replacement: expectedHref,
          });
        }
      }
    }
  }

  for (const occurrence of frontmatter.occurrences) {
    if (
      SOURCE_RELATION_FIELDS.includes(occurrence.field as SourceRelationField) &&
      parityFields.has(occurrence.field as SourceRelationField)
    ) {
      continue;
    }
    recordLocaleMismatch({ ...occurrence, source: 'frontmatter' });
  }

  for (const occurrence of routeOccurrences(prose)) {
    const localeMismatch = recordLocaleMismatch({
      ...occurrence,
      source: 'markdown',
    });
    // The focused command intentionally reports only the locale invariant. The
    // full audit must also classify an underlying dead route, even when its
    // locale prefix is wrong, so a mismatch cannot hide a genuine 404.
    if (LOCALE_ONLY && localeMismatch) continue;
    if (LOCALE_ONLY) continue;

    const localizedParts = occurrence.href.match(HREF_PARTS_RE);
    if (localizedParts) {
      const [, linkLocale, collection, slugRaw] = localizedParts;
      const slug = decodeSlug(slugRaw);
      const literalExists = slugIndex.has(
        `${collection}/${linkLocale}/${slug}`,
      );
      const defaultExists = slugIndex.has(
        `${collection}/${DEFAULT_LOCALE}/${slug}`,
      );

      if (!literalExists) {
        findings.push({
          file: rel(file),
          line: lineAt(occurrence.start),
          severity: defaultExists ? 'MISSING_TRANSLATION' : 'BROKEN',
          href: occurrence.href,
          collection,
          slug,
          fileLocale,
          linkLocale,
          source: 'markdown',
        });
      }
      continue;
    }

    // The full audit retains its separate missing-locale rule. The focused
    // locale invariant deliberately ignores these unprefixed paths.
    const bareParts = occurrence.href.match(BARE_HREF_PARTS_RE);
    if (!bareParts) continue;
    const [, collection, slugRaw] = bareParts;
    const slug = decodeSlug(slugRaw);
    const sameLocaleExists = slugIndex.has(
      `${collection}/${fileLocale}/${slug}`,
    );
    const defaultExists = slugIndex.has(
      `${collection}/${DEFAULT_LOCALE}/${slug}`,
    );
    // If the runtime can resolve the route, always add the file locale. Using
    // /en/ here would immediately violate the locale invariant.
    const fixedHref =
      sameLocaleExists || defaultExists
        ? `/${fileLocale}${occurrence.href}`
        : undefined;

    findings.push({
      file: rel(file),
      line: lineAt(occurrence.start),
      severity: 'MISSING_LOCALE',
      href: occurrence.href,
      fixedHref,
      collection,
      slug,
      fileLocale,
      linkLocale: '',
      source: 'markdown',
    });
    if (FIX && fixedHref) {
      edits.push({
        start: occurrence.start,
        end: occurrence.start + occurrence.href.length,
        replacement: fixedHref,
      });
    }
  }

  if (FIX && edits.length > 0) {
    edits.sort((a, b) => b.start - a.start);
    let mutated = raw;
    for (const edit of edits) {
      mutated =
        mutated.slice(0, edit.start) +
        edit.replacement +
        mutated.slice(edit.end);
    }

    // A same-locale translation may be absent, so the safety oracle is runtime
    // resolvability (literal target OR default-locale fallback), not literal
    // target existence. Refuse only newly introduced genuine 404s.
    const before = unresolvableTargetCounts(raw);
    const after = unresolvableTargetCounts(mutated);
    const introduced = [...after.entries()]
      .filter(([href, count]) => count > (before.get(href) ?? 0))
      .map(([href]) => href);

    if (introduced.length > 0) {
      console.error(
        `self-check failed for ${rel(file)}: --fix would create ` +
          `unresolvable link(s): ${introduced.join(', ')}. Refusing to write this file.`,
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
  console.log(
    JSON.stringify(
      {
        mode: LOCALE_ONLY ? 'locale' : 'full',
        locales: LOCALES,
        findings,
        fixedFiles: [...filesToRewrite.keys()].map(rel),
      },
      null,
      2,
    ),
  );
} else {
  const tty = process.stdout.isTTY;
  const color = (code: string, value: string) =>
    tty ? `\u001b[${code}m${value}\u001b[0m` : value;
  const tag: Record<Severity, string> = {
    BROKEN: color('31', 'BROKEN'),
    MISSING_LOCALE: color('31', 'NO-LOCALE'),
    LOCALE_MISMATCH: color('31', 'LOCALE'),
    RELATIONSHIP_MISMATCH: color('31', 'RELATION'),
    MISSING_TRANSLATION: color('33', 'MISSING-TR'),
  };
  const byFile = new Map<string, Finding[]>();
  for (const finding of findings) {
    if (!byFile.has(finding.file)) byFile.set(finding.file, []);
    byFile.get(finding.file)!.push(finding);
  }

  for (const [file, list] of [...byFile.entries()].sort()) {
    console.log(color('1', file));
    for (const finding of list.sort((a, b) => a.line - b.line)) {
      const field = finding.field ? ` field=${finding.field}` : '';
      const expected = finding.fixedHref
        ? ` expected=${finding.fixedHref}${FIX ? ' (fixed)' : ''}`
        : '';
      console.log(
        `  ${tag[finding.severity]} L${finding.line}${field} ` +
          `actual=${finding.href}${expected}`,
      );
    }
  }

  const broken = findings.filter((f) => f.severity === 'BROKEN').length;
  const missingLocale = findings.filter(
    (f) => f.severity === 'MISSING_LOCALE',
  ).length;
  const mismatch = findings.filter(
    (f) => f.severity === 'LOCALE_MISMATCH',
  ).length;
  const relationshipMismatch = findings.filter(
    (f) => f.severity === 'RELATIONSHIP_MISMATCH',
  ).length;
  const missingTranslation = findings.filter(
    (f) => f.severity === 'MISSING_TRANSLATION',
  ).length;

  console.log('');
  if (LOCALE_ONLY) {
    console.log(
      `Checked ${auditFiles.length} file(s): ${mismatch} locale-mismatch` +
        `, ${relationshipMismatch} relationship-mismatch` +
        `${FIX ? ` (${filesToRewrite.size} file(s) rewritten)` : ''}.`,
    );
  } else {
    console.log(
      `Audited ${auditFiles.length} file(s): ${broken} broken, ` +
        `${missingLocale} missing-locale, ${mismatch} locale-mismatch, ` +
        `${relationshipMismatch} relationship-mismatch` +
        `${FIX ? ` (${filesToRewrite.size} file(s) rewritten)` : ''}, ` +
        `${missingTranslation} missing-translation fallback.`,
    );
  }
  if (!FIX && (mismatch > 0 || relationshipMismatch > 0)) {
    console.log(
      'Re-run with --fix to restore file-locale prefixes and English-source relationship routes.',
    );
  }
  if (!FIX && !LOCALE_ONLY && missingLocale > 0) {
    console.log('Re-run the full audit with --fix to add file-locale prefixes.');
  }
  if (selfCheckFailures > 0) {
    console.log(`${selfCheckFailures} file(s) skipped: --fix self-check failed.`);
  }
}

const rewrittenRelPaths = new Set(
  [...filesToRewrite.keys()].map((file) => rel(file)),
);
const mismatchUnresolved = findings.some(
  (finding) =>
    finding.severity === 'LOCALE_MISMATCH' &&
    !(FIX && finding.fixedHref && rewrittenRelPaths.has(finding.file)),
);
const relationshipMismatchUnresolved = findings.some(
  (finding) =>
    finding.severity === 'RELATIONSHIP_MISMATCH' &&
    !(
      FIX &&
      finding.fixable &&
      finding.fixedHref &&
      rewrittenRelPaths.has(finding.file)
    ),
);
const missingLocaleUnresolved = findings.some(
  (finding) =>
    finding.severity === 'MISSING_LOCALE' &&
    !(FIX && finding.fixedHref && rewrittenRelPaths.has(finding.file)),
);
const brokenExists = findings.some((finding) => finding.severity === 'BROKEN');

process.exitCode =
  selfCheckFailures > 0 ||
  mismatchUnresolved ||
  relationshipMismatchUnresolved ||
  (!LOCALE_ONLY && (brokenExists || missingLocaleUnresolved))
    ? 1
    : 0;
