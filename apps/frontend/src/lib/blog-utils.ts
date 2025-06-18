import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export function getAllSlugs(lang: string, blogDir: string): string[] {
  const langDir = path.join(blogDir, lang);
  // TODO(P3): Consider caching the resulting slug list between requests to avoid repeated I/O.
  if (!fs.existsSync(langDir)) return [];
  return fs
    .readdirSync(langDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));
}

export function getAllBlogPosts(langs: string[], blogDir: string) {
  const posts: { lang: string; slug: string; lastmod: string }[] = [];
  for (const lang of langs) {
    const slugs = getAllSlugs(lang, blogDir);
    for (const slug of slugs) {
      const filePath = path.join(blogDir, lang, `${slug}.md`);
      let lastmod = '';
      if (fs.existsSync(filePath)) {
        // TODO(P3): Consider caching the resulting lastmod between requests to avoid repeated I/O.
        const raw = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(raw);
        if (typeof data.date === 'string') {
          const d = new Date(data.date);
          lastmod = Number.isNaN(d.getTime())
            ? data.date
            : d.toISOString().slice(0, 10);
        }
      }
      posts.push({ lang, slug, lastmod });
    }
  }
  return posts;
}
