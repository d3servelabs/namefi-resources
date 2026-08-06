// Check that TLD pages' `faqs:` frontmatter matches the body's FAQ section.
//
// The frontmatter drives FAQPage JSON-LD, and Google requires structured data to
// match visible page content (see prompts/tld-page.md). Comparison is against the
// RENDERED text of the body: inline Markdown (code spans, bold, links) is stripped
// before comparing, because the frontmatter is plain text by spec while the body
// may format the same words.
//
// Usage: bun scripts/check-tld-faq-sync.ts
// Exits non-zero if any page's frontmatter question/answer differs from the body.
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

const TLD_DIR = join(import.meta.dir, '..', 'content', 'tld');

export function stripInline(s: string): string {
  return s
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // [text](url) -> text
    .replace(/`([^`]*)`/g, '$1') // code spans
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/__([^_]+)__/g, '$1')
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,;:!?]|$)/g, '$1$2') // italics
    .replace(/\s+/g, ' ')
    .trim();
}

export interface QA {
  question: string;
  answer: string;
}

const nospace = (s: string) => s.replace(/\s+/g, '');

// Collect the body's FAQ Q&A pairs, scoped to the `##` section that best matches
// the frontmatter questions. Headings elsewhere in the page can repeat a question's
// text (e.g. a topic `###` earlier in the body), so a flat scan of every `###`
// would compare against the wrong block; the FAQ heading text also differs per
// locale, so the section is identified by its content, not its title.
export function collectBodyFaqs(body: string, fmQuestions: string[]): QA[] {
  const sections: { qas: QA[] }[] = [];
  let cur: { qas: QA[] } | null = null;
  const lines = body.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) {
      cur = { qas: [] };
      sections.push(cur);
      continue;
    }
    const m = lines[i].match(/^###\s+(.+?)\s*$/);
    if (!m) continue;
    const ans: string[] = [];
    let j = i + 1;
    while (j < lines.length && !/^#{1,3}\s/.test(lines[j])) {
      ans.push(lines[j]);
      j++;
    }
    const qa = { question: stripInline(m[1]), answer: stripInline(ans.join(' ')) };
    if (!cur) {
      cur = { qas: [] };
      sections.push(cur);
    }
    cur.qas.push(qa);
    i = j - 1;
  }

  const fmQs = fmQuestions.map(stripInline);
  let best: QA[] = [];
  let bestScore = -1;
  for (const s of sections) {
    const score = fmQs.filter((q) =>
      s.qas.some((b) => b.question === q || nospace(b.question) === nospace(q)),
    ).length;
    if (score > bestScore || (score === bestScore && s.qas.length > best.length)) {
      bestScore = score;
      best = s.qas;
    }
  }
  // No section matches any frontmatter question: return the flat list so every
  // question reports "not found" with the same granularity as before.
  if (bestScore <= 0) return sections.flatMap((s) => s.qas);
  return best;
}

// Pair a frontmatter question with a body QA. Section location above is
// whitespace-tolerant so drift is reported against the right block, but the
// gate itself stays strict: a whitespace-only question difference is still
// frontmatter/body drift (this sweep fixed several, e.g. ja/us.md) — it is
// just reported as such instead of as "not found".
export function matchQuestion(
  bodyQAs: QA[],
  strippedQuestion: string,
): { hit?: QA; whitespaceOnly: boolean } {
  const exact = bodyQAs.find((b) => b.question === strippedQuestion);
  if (exact) return { hit: exact, whitespaceOnly: false };
  const loose = bodyQAs.find((b) => nospace(b.question) === nospace(strippedQuestion));
  return { hit: loose, whitespaceOnly: Boolean(loose) };
}

if (import.meta.main) {
  let filesChecked = 0;
  let faqsChecked = 0;
  let noFaqs = 0;
  const problems: string[] = [];

  const locales = readdirSync(TLD_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const locale of locales) {
    const dir = join(TLD_DIR, locale);
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.md')).sort()) {
      const rel = `content/tld/${locale}/${f}`;
      let fm: Record<string, unknown>;
      let body: string;
      try {
        const parsed = matter(readFileSync(join(dir, f), 'utf8'));
        fm = parsed.data;
        body = parsed.content;
      } catch (e) {
        problems.push(`${rel}: frontmatter parse error: ${String((e as Error).message).slice(0, 160)}`);
        continue;
      }
      filesChecked++;
      const faqs = fm.faqs as QA[] | undefined;
      if (!Array.isArray(faqs) || faqs.length === 0) {
        noFaqs++;
        continue;
      }

      const bodyQAs = collectBodyFaqs(
        body,
        faqs.map((x) => String(x.question ?? '')),
      );

      for (const [idx, faq] of faqs.entries()) {
        faqsChecked++;
        const q = stripInline(String(faq.question ?? ''));
        const a = stripInline(String(faq.answer ?? ''));
        const { hit, whitespaceOnly } = matchQuestion(bodyQAs, q);
        if (!hit) {
          problems.push(`${rel} faq[${idx}]: question not found in body FAQ section: "${q}"`);
          continue;
        }
        if (whitespaceOnly) {
          problems.push(
            `${rel} faq[${idx}]: question differs from body by whitespace only\n    frontmatter: ${q}\n    body:        ${hit.question}`,
          );
          continue;
        }
        if (hit.answer !== a) {
          problems.push(
            `${rel} faq[${idx}]: answer differs from body under "${q}"\n    frontmatter: ${a}\n    body:        ${hit.answer}`,
          );
        }
      }
    }
  }

  console.log(
    `Checked ${faqsChecked} FAQs in ${filesChecked - noFaqs} pages (${noFaqs} pages have no faqs frontmatter) across ${locales.length} locales.`,
  );
  if (problems.length > 0) {
    console.error(`\n❌ ${problems.length} frontmatter/body FAQ mismatch(es):\n`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log('✅ All faqs frontmatter matches the body FAQ sections.');
}
