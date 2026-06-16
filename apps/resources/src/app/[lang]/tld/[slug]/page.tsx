import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Locale } from '@/i18n-config';
import { i18n, localeLabels, localeDateLocales } from '@/i18n-config';
import { getDictionary } from '@/get-dictionary';
import {
  getAuthor,
  type AuthorEntry,
  getAuthorNames,
  getTldCached,
  getTldParams,
  getRelatedTlds,
} from '@/lib/content';
import { loadMdxModule } from '@/lib/load-mdx-module';
import { resolveTitle } from '@/lib/site-metadata';
import { resolveBaseUrl } from '@/lib/site-url';
import { useMDXComponents } from '@/mdx-components';
import { JsonLd } from '@/components/json-ld';
import { BreadcrumbNav } from '@/components/breadcrumb-nav';
import { RelatedTldChips } from '@/components/related-tld-chips';

export async function generateStaticParams() {
  return getTldParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale = lang as Locale;
  const entry = getTldCached(locale, slug);

  if (!entry) return {};

  const baseUrl = resolveBaseUrl();
  const selfPath = `/r/${locale}/tld/${slug}`;
  const selfUrl = `${baseUrl}${selfPath}`;
  // SEO: when an English version of this slug exists, declare it as the
  // canonical so ranking signals consolidate on the English page. Non-English
  // variants remain accessible and continue to ship locale-specific OG/hreflang.
  // Exception: a page flagged `selfCanonical` (a topic-relevant page authored
  // natively for its market, e.g. a Spanish .abogado page) is self-canonical so
  // it ranks in its own language instead of deferring to English.
  const canonicalUrl =
    locale === 'en' ||
    !getTldCached('en', slug) ||
    entry.frontmatter.selfCanonical
      ? selfUrl
      : `${baseUrl}/r/en/tld/${slug}`;
  const ogImagePath = `${selfPath}/opengraph-image`;
  const ogImageUrl = `${baseUrl}${ogImagePath}`;
  const authorNames = getAuthorNames(locale, entry.frontmatter.authors);
  const siteName = resolveTitle(locale);
  const publishedTime = entry.publishedAt.toISOString();
  const twitterHandle = '@namefi_io';
  const summary =
    entry.frontmatter.summary ?? entry.frontmatter.description ?? undefined;

  const languageAlternates: Partial<Record<Locale, string>> = {};
  for (const localeOption of i18n.locales) {
    if (getTldCached(localeOption, slug)) {
      languageAlternates[localeOption] =
        `${baseUrl}/r/${localeOption}/tld/${slug}`;
    }
  }

  return {
    alternates: {
      canonical: canonicalUrl,
      languages: languageAlternates,
    },
    title: entry.frontmatter.title,
    description: summary,
    keywords: entry.frontmatter.keywords,
    openGraph: {
      title: entry.frontmatter.title,
      description: summary,
      url: selfUrl,
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
      description: summary,
      images: [ogImageUrl],
      site: twitterHandle,
      creator: twitterHandle,
    },
    other: {
      'article:published_time': publishedTime,
    },
  };
}

export default async function TldDetailPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const locale = lang as Locale;
  const dictionary = await getDictionary(locale);
  const entry = getTldCached(locale, slug);

  if (!entry) {
    notFound();
  }

  const components = useMDXComponents();
  const articleComponents = {
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
  const keywords = entry.frontmatter.keywords;
  const { faqs } = entry.frontmatter;
  // BreadcrumbList structured data (Resources > TLDs > .tld). Unlike FAQ/HowTo,
  // breadcrumb rich results still render in Google search, so this is emitted on
  // every TLD page. URLs use the canonical /r/<locale> public paths.
  const baseUrl = resolveBaseUrl();
  const tldBasePath = `/r/${locale}/tld`;
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: dictionary.nav.resources,
        item: `${baseUrl}/r/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: dictionary.nav.tld,
        item: `${baseUrl}${tldBasePath}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        // Mirror the visible BreadcrumbNav leaf (".io") so the structured data
        // and on-page trail show the same final label.
        name: `.${slug}`,
        item: `${baseUrl}${tldBasePath}/${slug}`,
      },
    ],
  };
  // FAQPage structured data. Mirrors the visible "Frequently asked questions"
  // section authored in the page body, so the schema matches on-page content.
  const faqJsonLd =
    faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        }
      : null;
  const { default: ArticleContent } = await loadMdxModule(entry.relativePath);
  const authorModules = await Promise.all(
    authorEntries.map(async (author) => {
      const module = await loadMdxModule(author.relativePath);
      return { author, Module: module.default };
    }),
  );

  const relatedTlds = getRelatedTlds(locale, slug);

  return (
    <article className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 text-start md:px-10 lg:px-12">
      <JsonLd data={breadcrumbJsonLd} />
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
      <BreadcrumbNav
        items={[
          { name: dictionary.nav.resources, href: `/${locale}` },
          { name: dictionary.nav.tld, href: `/${locale}/tld` },
          { name: `.${slug}` },
        ]}
      />

      <header className="space-y-5">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {entry.frontmatter.title}
          </h1>
          {(entry.frontmatter.summary || entry.frontmatter.description) && (
            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
              {entry.frontmatter.summary ?? entry.frontmatter.description}
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

      <ArticleContent components={articleComponents} />

      {keywords.length > 0 && (
        <section className="surface-card space-y-4">
          <h2 className="text-xl font-semibold">
            {dictionary.tld.detailKeywordsHeading}
          </h2>
          <ul className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            {keywords.map((keyword) => (
              <li
                key={keyword}
                className="rounded-full border border-border/60 px-3 py-1"
              >
                {keyword}
              </li>
            ))}
          </ul>
        </section>
      )}

      {authorModules.length > 0 && (
        <section className="surface-card space-y-6">
          <h2 className="text-xl font-semibold">
            {dictionary.blog.detailAuthorsHeading}
          </h2>
          <div className="space-y-6">
            {authorModules.map(({ author, Module }) => (
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
                <Module components={authorComponents} />
              </div>
            ))}
          </div>
        </section>
      )}

      <RelatedTldChips
        heading={dictionary.tld.relatedTldsHeading}
        items={relatedTlds.map((tld) => ({
          label: `.${tld.slug}`,
          href: `/${locale}/tld/${tld.slug}`,
        }))}
      />
    </article>
  );
}
