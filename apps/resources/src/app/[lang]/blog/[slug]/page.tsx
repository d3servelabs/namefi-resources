import type { ReactNode } from 'react';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote-client/rsc';
import { notFound } from 'next/navigation';
import type { Locale } from '@/i18n-config';
import { i18n, localeLabels, localeDateLocales } from '@/i18n-config';
import { getDictionary } from '@/get-dictionary';
import {
  getAuthor,
  getPostCached,
  getPostParams,
  type AuthorEntry,
  getAuthorNames,
} from '@/lib/content';
import { resolveTitle } from '@/lib/site-metadata';
import { useMDXComponents } from '@/mdx-components';
import type { Metadata } from 'next';

export const dynamic = 'error';
export const dynamicParams = false;

export async function generateStaticParams() {
  return getPostParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale = lang as Locale;
  const entry = getPostCached(locale, slug);

  if (!entry) return {};

  const rawBaseUrl =
    process.env.NEXT_PUBLIC_VERCEL_URL ?? 'http://localhost:3000';
  const normalisedBaseUrl = rawBaseUrl.startsWith('http')
    ? rawBaseUrl
    : `https://${rawBaseUrl}`;
  const baseUrl = normalisedBaseUrl.replace(/\/$/, '');
  const canonicalPath = `/${locale}/blog/${slug}`;
  const url = `${baseUrl}${canonicalPath}`;
  const ogImagePath = `${canonicalPath}/opengraph-image`;
  const ogImageUrl = `${baseUrl}${ogImagePath}`;
  const authorNames = getAuthorNames(locale, entry.frontmatter.authors);
  const siteName = resolveTitle(locale);
  const publishedTime = entry.publishedAt.toISOString();
  const twitterHandle = '@namefi_io';

  const languageAlternates: Partial<Record<Locale, string>> = {};
  for (const localeOption of i18n.locales) {
    if (getPostCached(localeOption, slug)) {
      languageAlternates[localeOption] = `/${localeOption}/blog/${slug}`;
    }
  }

  return {
    alternates: {
      canonical: canonicalPath,
      languages: languageAlternates,
    },
    title: entry.frontmatter.title,
    description: entry.frontmatter.summary,
    openGraph: {
      title: entry.frontmatter.title,
      description: entry.frontmatter.summary,
      url,
      locale,
      type: 'article',
      tags: entry.frontmatter.tags,
      siteName,
      publishedTime,
      authors: authorNames,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: entry.frontmatter.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: entry.frontmatter.title,
      description: entry.frontmatter.summary,
      images: [ogImageUrl],
      site: twitterHandle,
      creator: twitterHandle,
    },
    other: {
      'article:published_time': publishedTime,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const locale = lang as Locale;
  const dictionary = await getDictionary(locale);
  const entry = getPostCached(locale, slug);

  if (!entry) {
    notFound();
  }

  const components = useMDXComponents();
  const postComponents = {
    ...components,
    wrapper: ({ children }: { children: ReactNode }) => (
      <article className="prose prose-invert md:prose-lg max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-strong:text-foreground prose-em:text-foreground prose-a:font-semibold prose-a:no-underline prose-hr:border-border/60 prose-table:border-border/60 prose-table:text-foreground prose-img:rounded-3xl prose-pre:rounded-2xl prose-pre:border prose-pre:border-border/60 prose-pre:text-sm prose-code:text-foreground/90">
        {children}
      </article>
    ),
  };
  const authorComponents = {
    ...components,
    wrapper: ({ children }: { children: ReactNode }) => (
      <div className="prose prose-invert prose-sm text-muted-foreground">
        {children}
      </div>
    ),
  };
  const dateLocale = localeDateLocales[locale] ?? localeDateLocales.en;
  const dateFormatter = new Intl.DateTimeFormat(dateLocale, {
    dateStyle: 'long',
  });
  const authorEntries = entry.frontmatter.authors
    .map((authorSlug) => getAuthor(locale, authorSlug))
    .filter((author): author is AuthorEntry => Boolean(author));

  const authorNames = authorEntries.map((author) => author.frontmatter.name);
  const formattedDate = dateFormatter.format(entry.publishedAt);
  const showSourceLanguage = entry.requestedLanguage !== entry.sourceLanguage;
  const postSource = entry.content;

  return (
    <article className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12 text-left md:px-10 lg:px-12">
      <Link
        href={`/${locale}/blog`}
        className="inline-flex w-fit items-center rounded-full border border-border/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground transition hover:border-brand-primary/60 hover:text-foreground"
      >
        {dictionary.blog.detailBack}
      </Link>

      <header className="space-y-5">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {entry.frontmatter.title}
          </h1>
          {entry.frontmatter.summary && (
            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
              {entry.frontmatter.summary}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>
            {dictionary.blog.detailPublishedOn} {formattedDate}
          </span>
          {authorNames.length > 0 && (
            <span>
              {dictionary.blog.detailBy} {authorNames.join(', ')}
            </span>
          )}
        </div>
        {entry.frontmatter.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            {entry.frontmatter.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-border/60 px-3 py-1"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
        {showSourceLanguage && (
          <p className="text-xs text-muted-foreground">
            {dictionary.blog.detailSourceLanguage}:{' '}
            {localeLabels[entry.sourceLanguage] ??
              entry.sourceLanguage.toUpperCase()}
          </p>
        )}
      </header>

      <MDXRemote source={postSource} components={postComponents} />

      {authorEntries.length > 0 && (
        <section className="surface-card space-y-6">
          <h2 className="text-xl font-semibold">
            {dictionary.blog.detailAuthorsHeading}
          </h2>
          <div className="space-y-6">
            {authorEntries.map((author) => (
              <div
                key={`${author.slug}-${author.sourceLanguage}`}
                className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-6 shadow-lg shadow-black/5"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-base font-semibold text-foreground">
                    {author.frontmatter.name}
                  </span>
                  <div className="text-xs text-muted-foreground">
                    {[author.frontmatter.occupation, author.frontmatter.company]
                      .filter(Boolean)
                      .join(' • ')}
                  </div>
                </div>
                {author.frontmatter.twitter || author.frontmatter.linkedin ? (
                  <div className="flex flex-wrap gap-3 text-sm">
                    {author.frontmatter.twitter && (
                      <a
                        href={author.frontmatter.twitter}
                        className="text-brand-primary underline-offset-4 transition hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Twitter
                      </a>
                    )}
                    {author.frontmatter.linkedin && (
                      <a
                        href={author.frontmatter.linkedin}
                        className="text-brand-primary underline-offset-4 transition hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        LinkedIn
                      </a>
                    )}
                  </div>
                ) : null}
                <MDXRemote
                  source={author.content}
                  components={authorComponents}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
