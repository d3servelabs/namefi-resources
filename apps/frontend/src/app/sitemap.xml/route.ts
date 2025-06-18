import path from 'node:path';
import { getAllBlogPosts } from '@/lib/blog-utils';
import type { NextRequest } from 'next/server';

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');
const SUPPORTED_LANGS = ['en', 'zh'];

export async function GET(request: NextRequest) {
  const host = request.headers.get('host');
  const baseUrl = host ? `https://${host}` : 'https://namefi.dev';
  const posts = getAllBlogPosts(SUPPORTED_LANGS, BLOG_DIR);

  const urls = posts
    .map(
      (post) =>
        `<url>
  <loc>${baseUrl}/${post.lang}/blog/${post.slug}</loc>
  ${post.lastmod ? `<lastmod>${post.lastmod}</lastmod>` : ''}
</url>`,
    )
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${baseUrl}/</loc>\n    <lastmod>2024-06-01</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n${urls}\n</urlset>\n`;
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
