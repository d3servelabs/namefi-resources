#!/usr/bin/env bun
/**
 * translate-glossary.ts — glossary translator (translate-blog.ts is blog-only).
 *
 * Differences from translate-blog.ts that make it usable for the termbase
 * build-out:
 *   • Scans content/glossary/en (not content/blog/en).
 *   • PATH/BATCH mode — translate a specific subset by slug or path, not just
 *     "scan everything":  bun scripts/translate-glossary.ts registry registrant
 *   • --locales=zh,ar to restrict target locales; --force to overwrite.
 *   • TERMBASE-AWARE prompt — injects the already-locked canonical titles from
 *     content/termbase.json so any cross-linked glossary term renders with its
 *     standard per-locale translation (keeps the corpus internally consistent).
 *   • Fills only MISSING locale files by default (like translate-blog), so it is
 *     safe to re-run after adding new EN entries.
 *
 * The per-locale glossary `title` it produces IS the canonical term for that
 * concept — review it (zh signed off, ar Egyptian register) before locking the
 * termbase with build-termbase.ts.
 *
 * Usage (from repo root, GEMINI_API_KEY in env — same secret as translate:blog):
 *   bun scripts/translate-glossary.ts                       # fill all missing locales
 *   bun scripts/translate-glossary.ts registry registrant   # only these slugs
 *   bun scripts/translate-glossary.ts content/glossary/en/registry.md
 *   bun scripts/translate-glossary.ts --locales=zh,ar registry
 *   bun scripts/translate-glossary.ts --force registry      # overwrite existing
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import pLimit from 'p-limit';
import matter from 'gray-matter';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY environment variable is required.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.1-pro-preview';
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

const ALL_TARGETS = ['zh', 'ar', 'fr', 'hi', 'de', 'es'] as const;
const SOURCE_LOCALE = 'en';
const GLOSSARY_DIR = path.join(process.cwd(), 'content', 'glossary');
const TERMBASE_PATH = path.join(process.cwd(), 'content', 'termbase.json');

// --- args ------------------------------------------------------------------
const argv = process.argv.slice(2);
const FORCE = argv.includes('--force');
const localesArg = argv.find((a) => a.startsWith('--locales='))?.slice(10);
function resolveTargetLocales(): string[] {
  if (localesArg === undefined) return [...ALL_TARGETS];
  const requested = localesArg.split(',').map((s) => s.trim()).filter(Boolean);
  const valid = requested.filter((l) => (ALL_TARGETS as readonly string[]).includes(l));
  const unknown = requested.filter((l) => !(ALL_TARGETS as readonly string[]).includes(l));
  if (unknown.length) console.warn(`⚠️ Ignoring unknown locale(s): ${unknown.join(', ')}`);
  if (valid.length === 0) {
    // A typo must not look like a completed run that wrote nothing.
    console.error(`Error: --locales=${localesArg} matched no valid locales (allowed: ${ALL_TARGETS.join(', ')}).`);
    process.exit(1);
  }
  return valid;
}
const TARGET_LOCALES = resolveTargetLocales();
const slugArgs = argv
  .filter((a) => !a.startsWith('--'))
  .map((a) => a.replace(/\.mdx?$/, '').replace(/.*\//, ''));

// --- rate limiter ----------------------------------------------------------
const CONCURRENCY = 5;
const REQUESTS_PER_MINUTE = 15;
const MIN_INTERVAL_MS = (60 * 1000) / REQUESTS_PER_MINUTE;
let lastRequestTime = 0;

// Serialise the spacing decision. With pLimit(CONCURRENCY) several workers run
// at once; if each independently read `lastRequestTime` and slept, they could
// all clear the check together and burst past the per-minute cap. Chaining each
// reservation onto the previous one makes the read-update atomic, so requests
// are guaranteed at least MIN_INTERVAL_MS apart.
let throttleGate: Promise<void> = Promise.resolve();
function reserveSlot(): Promise<void> {
  const wait = throttleGate.then(async () => {
    const delta = lastRequestTime + MIN_INTERVAL_MS - Date.now();
    if (delta > 0) await new Promise((r) => setTimeout(r, delta));
    lastRequestTime = Date.now();
  });
  throttleGate = wait.catch(() => {});
  return wait;
}

// Files that could not be written (rate-limit exhaustion or a hard error) —
// reported at the end so a partial run never masquerades as complete.
const failures: string[] = [];

// --- termbase: locked canonical titles to keep translations consistent -----
type Termbase = Record<string, { en: string; titles: Record<string, string> }>;
function loadTermbase(): Termbase {
  try {
    return JSON.parse(readFileSync(TERMBASE_PATH, 'utf8'));
  } catch {
    return {};
  }
}
function termbaseHint(locale: string, tb: Termbase): string {
  const pairs: string[] = [];
  for (const entry of Object.values(tb)) {
    const target = entry.titles?.[locale];
    if (entry.en && target) pairs.push(`  - "${entry.en}" → "${target}"`);
  }
  if (!pairs.length) return '';
  return `\n\n**Canonical termbase (use these EXACT ${locale} translations when the concept appears):**\n${pairs.join('\n')}`;
}

async function callGeminiThrottled(prompt: string, locale: string, filename: string) {
  await reserveSlot();

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.trim()
      .replace(/^```[a-zA-Z]*\s*\n/, '')
      .replace(/\n```\s*$/, '')
      .replace(/^<content>\s*\n/, '')
      .replace(/\n?<\/content>\s*$/, '')
      .trim();
    // A blank or whitespace-only response (e.g. a safety block) must NOT be saved
    // as a `---\n` stub that looks like a successful translation — reject it so
    // translateFile records a failure instead of writing an invalid file.
    if (!text) throw new Error('EMPTY_OUTPUT');
    if (!text.startsWith('---')) text = '---\n' + text;
    return text;
  } catch (error) {
    if (String(error).includes('429')) throw new Error('RATE_LIMIT');
    console.error(`Failed to translate ${filename} to ${locale}:`, error);
    throw error;
  }
}

async function translateFile(filename: string, targetLocale: string, tb: Termbase) {
  const sourcePath = path.join(GLOSSARY_DIR, SOURCE_LOCALE, filename);
  const targetDir = path.join(GLOSSARY_DIR, targetLocale);
  const targetPath = path.join(targetDir, filename);
  await fs.mkdir(targetDir, { recursive: true });

  if (!FORCE && existsSync(targetPath)) return; // fill-missing by default

  console.log(`Translating glossary/${filename} → ${targetLocale}...`);
  let fileContent: string;
  try {
    fileContent = await fs.readFile(sourcePath, 'utf-8');
  } catch (e) {
    // One unreadable source must not abort the whole batch or vanish silently.
    console.error(`✗ Could not read source ${filename}:`, e);
    failures.push(`${targetLocale}/${filename}`);
    return;
  }

  const dialectNote = targetLocale === 'ar'
    ? '\n    -   **Arabic dialect**: write in modern Egyptian Arabic (اللهجة المصرية المعاصرة) — the natural register an Egyptian reader expects for a tech/business blog — NOT formal MSA, while keeping technical terms clear.'
    : '';

  const prompt = `
You are a professional translator and technical content writer for Namefi, a domain name company.
Translate the following Markdown GLOSSARY entry from English to ${targetLocale}.

**Instructions:**
1.  **Frontmatter**:
    -   Preserve the YAML frontmatter structure exactly.
    -   Translate the 'title', 'description', and 'keywords' values. The translated 'title' is the CANONICAL term for this concept in ${targetLocale} — choose it deliberately and idiomatically; it will be reused site-wide.
    -   Keep 'date', 'tags', 'authors', 'draft', 'level', 'sources', 'aliasesByLocale' EXACTLY as in the source (do not translate or alter them).
    -   Ensure 'language' is '${targetLocale}'.
    -   **YAML quoting**: properly quote strings containing colons/special characters. If a single-quoted YAML string must contain an apostrophe, escape it by DOUBLING it ('') — NEVER with a backslash.

2.  **Content**:
    -   Translate the body to ${targetLocale} with natural, fluent, idiomatic phrasing and a confident, concrete tone (not stiff machine translation).${dialectNote}
    -   Use consistent, standard domain-industry terminology throughout.
    -   Preserve all Markdown formatting (headers, bold, lists, code blocks, links, image syntax).
    -   Keep ALL links EXACTLY as-is, BUT swap the locale prefix on internal links from /en/ to /${targetLocale}/ (e.g. /en/glossary/registry/ → /${targetLocale}/glossary/registry/). Never change the slug after the locale. Keep citation URLs and any #:~:text= fragments verbatim.
    -   Keep image references and asset paths (../../assets/...) exactly as is.
    -   Do not translate domain names, brand names, code, or figures (e.g. GoDaddy, Verisign, ICANN, .com, $30 million) — keep them verbatim.${termbaseHint(targetLocale, tb)}

3.  **Output**:
    -   Return ONLY the complete translated markdown file (frontmatter + body).
    -   Do not include \`\`\`markdown fences.

**Original English Content:**
\`\`\`markdown
${fileContent}
\`\`\`
`;

  let attempts = 0;
  const maxAttempts = 3;
  let delay = 5000;
  while (attempts < maxAttempts) {
    try {
      const translated = await callGeminiThrottled(prompt, targetLocale, filename);
      if (translated) {
        await fs.writeFile(targetPath, translated, 'utf-8');
        console.log(`✓ Created: ${targetLocale}/${filename}`);
        return;
      }
    } catch (e: any) {
      if (e.message === 'RATE_LIMIT') {
        attempts++;
        console.log(`⚠️ Rate limit ${filename} (${targetLocale}). Retry in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
      } else {
        console.error(`✗ Error translating ${filename} → ${targetLocale}:`, e);
        failures.push(`${targetLocale}/${filename}`);
        return;
      }
    }
  }
  // Fell out of the retry loop without writing — record it so the run is not
  // reported as complete with this locale silently missing.
  console.error(`✗ Gave up on ${targetLocale}/${filename} after ${maxAttempts} rate-limit retries.`);
  failures.push(`${targetLocale}/${filename}`);
}

async function main() {
  const enDir = path.join(GLOSSARY_DIR, SOURCE_LOCALE);
  let files: string[];
  try {
    files = (await fs.readdir(enDir)).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  } catch {
    console.error(`Could not read source directory: ${enDir}`);
    process.exit(1);
  }

  if (slugArgs.length) {
    const wanted = new Set(slugArgs);
    files = files.filter((f) => wanted.has(f.replace(/\.mdx?$/, '')));
    const found = new Set(files.map((f) => f.replace(/\.mdx?$/, '')));
    for (const s of slugArgs) if (!found.has(s)) console.warn(`⚠️ no en glossary entry for "${s}"`);
    // Explicit slugs that match nothing must fail, not look like a clean run.
    if (files.length === 0) {
      console.error(`Error: none of the requested slug(s) matched an en glossary entry: ${slugArgs.join(', ')}`);
      process.exit(1);
    }
  }

  console.log(`Translating ${files.length} glossary entr${files.length === 1 ? 'y' : 'ies'} → [${TARGET_LOCALES.join(', ')}]${FORCE ? ' (force overwrite)' : ' (fill missing)'}.`);

  const tb = loadTermbase();
  const limit = pLimit(CONCURRENCY);
  const tasks = [];
  for (const file of files) {
    for (const locale of TARGET_LOCALES) {
      tasks.push(limit(() => translateFile(file, locale, tb)));
    }
  }
  await Promise.all(tasks);

  if (failures.length) {
    console.error(`\n❌ ${failures.length} file(s) were NOT translated: ${failures.join(', ')}`);
    console.error('Re-run translate-glossary.ts to fill the gaps before building the termbase.');
    process.exitCode = 1;
    return;
  }
  console.log('Glossary translation complete. Re-run build-termbase.ts to lock the new titles.');
}

main().catch((e) => {
  // A rejected run must surface a non-zero exit, never a false success.
  console.error(e);
  process.exit(1);
});
