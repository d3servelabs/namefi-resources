import fs from 'node:fs';
import path from 'node:path';
import { LanguageSwitcher } from '@/components/blog/LanguageSwitcher';
import matter from 'gray-matter';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

const BLOG_DIR = path.join(process.cwd(), 'content/blog');

function getAllSlugs(lang: string): string[] {
  const langDir = path.join(BLOG_DIR, lang);
  if (!fs.existsSync(langDir)) return [];
  return fs
    .readdirSync(langDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));
}

function getAvailableLanguages(slug: string): string[] {
  return fs.readdirSync(BLOG_DIR).filter((lang) => {
    const filePath = path.join(BLOG_DIR, lang, `${slug}.md`);
    return fs.existsSync(filePath);
  });
}

function getBlogMarkdown(slug: string, lang: string) {
  const filePath = path.join(BLOG_DIR, lang, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  return { meta: data, content };
}

export async function generateStaticParams() {
  const languages = ['en', 'zh'];
  const params: { lang: string; slug: string }[] = [];
  for (const lang of languages) {
    const slugs = getAllSlugs(lang);
    for (const slug of slugs) {
      params.push({ lang, slug });
    }
  }
  return params;
}

export async function generateMetadata(props: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const { lang, slug } = params;
  const post = getBlogMarkdown(slug, lang);
  if (!post) return {};
  return {
    title: post.meta.seo?.title || post.meta.title,
    description: post.meta.seo?.description || post.meta.description,
    openGraph: {
      title: post.meta.seo?.title || post.meta.title,
      description: post.meta.seo?.description || post.meta.description,
      images: post.meta.seo?.ogImage ? [post.meta.seo.ogImage] : [],
    },
  };
}

export default async function BlogPostPage(props: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const params = await props.params;
  const { lang, slug } = params;
  const post = getBlogMarkdown(slug, lang);
  if (!post) notFound();
  const { meta, content } = post;
  let dateString = '';
  if (typeof meta.date === 'string') {
    const d = new Date(meta.date);
    if (Number.isNaN(d.getTime())) {
      dateString = meta.date;
    } else {
      dateString = d.toISOString().slice(0, 10);
    }
  }
  return (
    <article className="container mx-auto px-4 py-8">
      <LanguageSwitcher
        currentLanguage={lang}
        availableLanguages={getAvailableLanguages(slug)}
        slug={slug}
      />
      <h1 className="text-4xl font-bold mb-4">{meta.title}</h1>
      <p className="text-gray-500 mb-2">{dateString}</p>
      <div className="markdown-body">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </article>
  );
}
