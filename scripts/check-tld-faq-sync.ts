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

function stripInline(s: string): string {
  return s
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // [text](url) -> text
    .replace(/`([^`]*)`/g, '$1') // code spans
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/__([^_]+)__/g, '$1')
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,;:!?]|$)/g, '$1$2') // italics
    .replace(/\s+/g, ' ')
    .trim();
}

interface QA {
  question: string;
  answer: string;
}

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

    // Collect every `### question` block with its following paragraphs as the answer.
    const bodyQAs: QA[] = [];
    const lines = body.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^###\s+(.+?)\s*$/);
      if (!m) continue;
      const ans: string[] = [];
      let j = i + 1;
      while (j < lines.length && !/^#{1,3}\s/.test(lines[j])) {
        ans.push(lines[j]);
        j++;
      }
      bodyQAs.push({ question: stripInline(m[1]), answer: stripInline(ans.join(' ')) });
      i = j - 1;
    }

    for (const [idx, faq] of faqs.entries()) {
      faqsChecked++;
      const q = stripInline(String(faq.question ?? ''));
      const a = stripInline(String(faq.answer ?? ''));
      const hit = bodyQAs.find((b) => b.question === q);
      if (!hit) {
        problems.push(`${rel} faq[${idx}]: question not found in body: "${q}"`);
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
