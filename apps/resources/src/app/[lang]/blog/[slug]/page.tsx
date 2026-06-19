import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Locale } from '@/i18n-config';
import { i18n, localeLabels, localeDateLocales } from '@/i18n-config';
import { getDictionary, type Dictionary } from '@/get-dictionary';
import {
  getAuthor,
  getPostCached,
  getPostOgAsset,
  getPostParams,
  getRelatedPosts,
  type AuthorEntry,
  getAuthorNames,
} from '@/lib/content';
import { loadMdxModule } from '@/lib/load-mdx-module';
import { resolveTitle } from '@/lib/site-metadata';
import { resolveBaseUrl } from '@/lib/site-url';
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  type ArticleAuthor,
} from '@/lib/structured-data';
import { JsonLd } from '@/components/json-ld';
import { BreadcrumbNav } from '@/components/breadcrumb-nav';
import { RelatedGuides } from '@/components/related-guides';
import { useMDXComponents } from '@/mdx-components';

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

  const baseUrl = resolveBaseUrl();
  const selfPath = `/r/${locale}/blog/${slug}`;
  const selfUrl = `${baseUrl}${selfPath}`;
  // SEO: each locale is self-canonical so it can rank in its own language;
  // the hreflang `languages` map + `x-default` (below) tell crawlers these are
  // alternate-language versions of one another. See [lang]/tld/[slug] too.
  const canonicalUrl = selfUrl;
  // Prefer the hand-made asset when one is committed under
  // data/content/assets — the sync-blog-assets prebuild step copies it into
  // public/blog-assets so Vercel's CDN serves it directly with no Function
  // involvement. Falls back to the dynamically-generated opengraph-image
  // route for posts that don't have a custom asset.
  const ogAsset = getPostOgAsset(slug);
  const ogImageUrl = ogAsset
    ? `${baseUrl}/r/blog-assets/${slug}-og${ogAsset.extension}`
    : `${baseUrl}${selfPath}/opengraph-image`;
  const ogImageType = ogAsset?.contentType ?? 'image/png';
  const authorNames = getAuthorNames(locale, entry.frontmatter.authors);
  const siteName = resolveTitle(locale);
  const publishedTime = entry.publishedAt.toISOString();
  const twitterHandle = '@namefi_io';

  const languageAlternates: Partial<Record<Locale | 'x-default', string>> = {};
  for (const localeOption of i18n.locales) {
    if (getPostCached(localeOption, slug)) {
      languageAlternates[localeOption] =
        `${baseUrl}/r/${localeOption}/blog/${slug}`;
    }
  }
  // x-default points crawlers to the English version when it exists, else self.
  languageAlternates['x-default'] = languageAlternates.en ?? selfUrl;

  return {
    alternates: {
      canonical: canonicalUrl,
      languages: languageAlternates,
    },
    title: entry.frontmatter.title,
    description: entry.frontmatter.summary,
    openGraph: {
      title: entry.frontmatter.title,
      description: entry.frontmatter.summary,
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
          type: ogImageType,
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

type PostEntry = NonNullable<ReturnType<typeof getPostCached>>;

// Builds the BlogPosting + BreadcrumbList structured data for a post. Kept as a
// pure module-level helper so the page component stays readable and the
// canonical/OG resolution stays in sync with generateMetadata above. The output
// is rendered as inert <script type="application/ld+json"> tags — no client JS,
// no impact on the LCP / above-the-fold path.
function buildBlogPostStructuredData(args: {
  entry: PostEntry;
  locale: Locale;
  slug: string;
  dictionary: Dictionary;
  authorEntries: readonly AuthorEntry[];
  updatedAt: Date | undefined;
}) {
  const { entry, locale, slug, dictionary, authorEntries, updatedAt } = args;
  const baseUrl = resolveBaseUrl();
  const selfPath = `/r/${locale}/blog/${slug}`;
  const selfUrl = `${baseUrl}${selfPath}`;
  const canonicalUrl =
    locale === 'en' || !getPostCached('en', slug)
      ? selfUrl
      : `${baseUrl}/r/en/blog/${slug}`;
  const ogAsset = getPostOgAsset(slug);
  const ogImageUrl = ogAsset
    ? `${baseUrl}/r/blog-assets/${slug}-og${ogAsset.extension}`
    : `${baseUrl}${selfPath}/opengraph-image`;
  const articleAuthors: ArticleAuthor[] = authorEntries.map((author) => ({
    name: author.frontmatter.name,
    url: author.frontmatter.twitter ?? author.frontmatter.linkedin,
  }));
  const dateModified =
    updatedAt && !Number.isNaN(updatedAt.getTime())
      ? updatedAt.toISOString()
      : undefined;

  return {
    articleJsonLd: buildArticleJsonLd({
      headline: entry.frontmatter.title,
      description: entry.frontmatter.summary,
      url: selfUrl,
      canonicalUrl,
      imageUrl: ogImageUrl,
      datePublished: entry.publishedAt.toISOString(),
      dateModified,
      authors: articleAuthors,
      baseUrl,
      locale,
      keywords: entry.frontmatter.tags,
    }),
    breadcrumbJsonLd: buildBreadcrumbJsonLd([
      { name: dictionary.nav.resources, url: `${baseUrl}/r/${locale}` },
      { name: dictionary.nav.blog, url: `${baseUrl}/r/${locale}/blog` },
      { name: entry.frontmatter.title, url: selfUrl },
    ]),
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
  const updatedAt = entry.frontmatter.updated
    ? new Date(entry.frontmatter.updated)
    : undefined;
  const formattedUpdated =
    updatedAt && !Number.isNaN(updatedAt.getTime())
      ? dateFormatter.format(updatedAt)
      : undefined;
  // Derive the bare host (e.g. "hackmd.io") from the original publication URL so
  // the link can read "Originally on hackmd.io".
  let originalUrlHost: string | undefined;
  if (entry.frontmatter.originalUrl) {
    try {
      originalUrlHost = new URL(entry.frontmatter.originalUrl).hostname;
    } catch {
      originalUrlHost = undefined;
    }
  }
  const showSourceLanguage = entry.requestedLanguage !== entry.sourceLanguage;
  const { default: PostContent } = await loadMdxModule(entry.relativePath);
  const authorModules = await Promise.all(
    authorEntries.map(async (author) => {
      const module = await loadMdxModule(author.relativePath);
      return { author, Module: module.default };
    }),
  );
  // When a hand-made hero asset exists for this slug, render it inline above
  // the post body. Served as a plain static file under public/blog-assets
  // (synced from the data submodule by the sync-blog-assets prebuild step),
  // so the URL is CDN-cacheable and resolves without invoking the
  // opengraph-image function.
  const heroOgAsset = getPostOgAsset(slug);
  // The /r basePath is baked into the path here; raw <img> src doesn't get
  // Next's basePath auto-prefix.
  const heroImageUrl = heroOgAsset
    ? `/r/blog-assets/${slug}-og${heroOgAsset.extension}`
    : undefined;

  // Structured data (BlogPosting + BreadcrumbList) for SEO rich results and LLM
  // crawlers. Built off-component; rendered as inert <script> tags below.
  const { articleJsonLd, breadcrumbJsonLd } = buildBlogPostStructuredData({
    entry,
    locale,
    slug,
    dictionary,
    authorEntries,
    updatedAt,
  });

  const relatedPosts = getRelatedPosts(locale, slug);

  return (
    <article className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 text-start md:px-10 lg:px-12">
      <BreadcrumbNav
        items={[
          { name: dictionary.nav.resources, href: `/${locale}` },
          { name: dictionary.nav.blog, href: `/${locale}/blog` },
          { name: entry.frontmatter.title },
        ]}
      />

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
          {formattedUpdated && (
            <span>
              {dictionary.blog.detailUpdatedOn} {formattedUpdated}
            </span>
          )}
          {authorNames.length > 0 && (
            <span>
              {dictionary.blog.detailBy} {authorNames.join(', ')}
            </span>
          )}
          {entry.frontmatter.originalUrl && originalUrlHost && (
            <span>
              {dictionary.blog.detailOriginallyOn}{' '}
              <a
                href={entry.frontmatter.originalUrl}
                className="font-semibold text-brand-primary underline-offset-4 transition hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {originalUrlHost}
              </a>
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

      {heroImageUrl && (
        // biome-ignore lint/performance/noImgElement: hero is served via a Next route handler, not the image optimizer.
        <img
          src={heroImageUrl}
          alt={entry.frontmatter.title}
          width={1200}
          height={630}
          // The LCP element is the article body text below this hero, not the
          // hero itself. Loading the hero eagerly made its ~47KB download and
          // 1200x630 decode compete with the text paint on throttled mobile.
          // Defer it (lazy + async decode) so the body text settles sooner;
          // width/height are reserved above, so deferring causes no layout shift.
          loading="lazy"
          decoding="async"
          className="h-auto w-full rounded-3xl border border-border/60 shadow-lg shadow-black/5"
        />
      )}

      <PostContent components={postComponents} />

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

      <RelatedGuides
        heading={dictionary.blog.relatedHeading}
        items={relatedPosts.map((post) => ({
          title: post.frontmatter.title,
          href: `/${locale}/blog/${post.slug}`,
          summary: post.frontmatter.summary,
        }))}
      />

      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
    </article>
  );
}
