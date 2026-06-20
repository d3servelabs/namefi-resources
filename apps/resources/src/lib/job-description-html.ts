// Minimal Markdown -> HTML converter for the JobPosting `description` field.
//
// Google requires `description` to be the *complete* job description in HTML
// (it recognizes <p>, <ul>, <li>, <br>, headings) and to match the text that is
// visible on the rendered page. The career body markdown is intentionally
// simple (headings, bullet/numbered lists, paragraphs, inline bold + links), so
// we convert that subset directly rather than pull in a full Markdown pipeline
// or server-render React to a string. Anything unrecognized degrades to a
// paragraph, which is safe for a description.

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>]/g, (char) => HTML_ESCAPES[char]);
}

// Renders inline markup on already-escaped text: [label](href) -> anchor,
// **bold** -> <strong>. Order matters so link labels can themselves be bold.
function renderInline(text: string): string {
  return escapeHtml(text)
    .replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      (_match, label, href) => `<a href="${href}">${label}</a>`,
    )
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

/**
 * Converts the limited Markdown used in career posts into HTML suitable for a
 * schema.org JobPosting `description`.
 */
export function markdownToJobDescriptionHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let listTag: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (listTag) {
      html.push(`</${listTag}>`);
      listTag = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      closeList();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      closeList();
      // Clamp to h2..h4 so the JobPosting body never competes with the page h1.
      const level = Math.min(Math.max(heading[1].length, 2), 4);
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      closeList();
      continue;
    }

    const unordered = line.match(/^[-*]\s+(.*)$/);
    if (unordered) {
      if (listTag !== 'ul') {
        closeList();
        html.push('<ul>');
        listTag = 'ul';
      }
      html.push(`<li>${renderInline(unordered[1])}</li>`);
      continue;
    }

    const ordered = line.match(/^\d+\.\s+(.*)$/);
    if (ordered) {
      if (listTag !== 'ol') {
        closeList();
        html.push('<ol>');
        listTag = 'ol';
      }
      html.push(`<li>${renderInline(ordered[1])}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${renderInline(line)}</p>`);
  }

  closeList();
  return html.join('');
}
