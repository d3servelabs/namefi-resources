import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Locale } from '@/i18n-config';
import { i18n } from '@/i18n-config';
import { getDictionary } from '@/get-dictionary';
import { getPost, getPostsInCluster } from '@/lib/content';
import {
  buildBreadcrumbJsonLd,
  buildCollectionJsonLd,
} from '@/lib/structured-data';
import { resolveBaseUrl } from '@/lib/site-url';
import { ResourceIndexCard } from '@/components/resource-index-card';
import { BreadcrumbNav } from '@/components/breadcrumb-nav';
import { JsonLd } from '@/components/json-ld';
import { PillarDiagram } from '@/components/pillar-diagram';
import {
  CLUSTER_SLUGS,
  CLUSTERS,
  isClusterSlug,
  localizeText,
} from '@/lib/taxonomy';

export function generateStaticParams(): Array<{
  lang: Locale;
  cluster: string;
}> {
  return i18n.locales.flatMap((lang) =>
    CLUSTER_SLUGS.map((cluster) => ({ lang, cluster })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; cluster: string }>;
}): Promise<Metadata> {
  const { lang, cluster } = await params;
  const locale = i18n.locales.includes(lang as Locale)
    ? (lang as Locale)
    : i18n.defaultLocale;
  if (!isClusterSlug(cluster)) return {};

  const meta = CLUSTERS[cluster];
  const baseUrl = resolveBaseUrl();
  const selfUrl = `${baseUrl}/r/${locale}/topics/${cluster}`;
  const languageAlternates: Partial<Record<Locale | 'x-default', string>> = {};
  for (const localeOption of i18n.locales) {
    languageAlternates[localeOption] =
      `${baseUrl}/r/${localeOption}/topics/${cluster}`;
  }
  languageAlternates['x-default'] = `${baseUrl}/r/en/topics/${cluster}`;

  const title = localizeText(meta.title, locale);
  const description = localizeText(meta.description, locale);

  return {
    alternates: { canonical: selfUrl, languages: languageAlternates },
    title,
    description,
    openGraph: {
      title,
      description,
      url: selfUrl,
      locale,
      type: 'website',
    },
    twitter: { card: 'summary', title, description, site: '@namefi_io' },
  };
}

export default async function ClusterHub({
  params,
}: {
  params: Promise<{ lang: string; cluster: string }>;
}) {
  const { lang, cluster } = await params;
  if (!i18n.locales.includes(lang as Locale) || !isClusterSlug(cluster)) {
    notFound();
  }
  const locale = lang as Locale;
  const dictionary = await getDictionary(locale);
  const meta = CLUSTERS[cluster];
  const baseUrl = resolveBaseUrl();
  const selfUrl = `${baseUrl}/r/${locale}/topics/${cluster}`;
  const diagramSteps = (meta.diagram ?? []).map((step) =>
    localizeText(step, locale),
  );

  const posts = getPostsInCluster(locale, cluster);
  const cornerstone = getPost(locale, meta.cornerstoneSlug);
  // Cornerstone leads the page; the rest follow newest-first. Guard against the
  // cornerstone slug being missing/draft so the hub still renders its spokes.
  const cornerstoneInCluster =
    cornerstone && cornerstone.frontmatter.cluster === cluster
      ? cornerstone
      : undefined;
  const spokes = posts.filter(
    (post) => post.slug !== cornerstoneInCluster?.slug,
  );
  const ordered = cornerstoneInCluster
    ? [cornerstoneInCluster, ...spokes]
    : spokes;

  const collectionJsonLd = buildCollectionJsonLd({
    name: localizeText(meta.title, locale),
    description: localizeText(meta.description, locale),
    canonicalUrl: selfUrl,
    baseUrl,
    locale,
    items: ordered.map((post) => ({
      name: post.frontmatter.title,
      url: `${baseUrl}/r/${locale}/blog/${post.slug}`,
    })),
  });
  const breadcrumbItems = [
    { name: dictionary.nav.resources, url: `${baseUrl}/r/${locale}` },
    {
      name: dictionary.topics.indexTitle,
      url: `${baseUrl}/r/${locale}/topics`,
    },
    { name: localizeText(meta.title, locale), url: selfUrl },
  ];
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(breadcrumbItems);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 md:px-10 lg:px-12">
      <JsonLd data={collectionJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <BreadcrumbNav
        items={[
          { name: dictionary.nav.resources, href: `/${locale}` },
          { name: dictionary.topics.indexTitle, href: `/${locale}/topics` },
          { name: localizeText(meta.title, locale) },
        ]}
      />

      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {localizeText(meta.title, locale)}
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {localizeText(meta.description, locale)}
        </p>
      </header>

      {diagramSteps.length > 0 && (
        <PillarDiagram
          steps={diagramSteps}
          label={localizeText(meta.title, locale)}
        />
      )}

      {ordered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {dictionary.topics.emptyCluster}
        </p>
      ) : (
        <div className="grid gap-6">
          {ordered.map((post) => {
            const isCornerstone = post.slug === cornerstoneInCluster?.slug;
            const tags = isCornerstone
              ? [dictionary.topics.cornerstoneLabel, ...post.frontmatter.tags]
              : post.frontmatter.tags;
            return (
              <ResourceIndexCard
                key={`${post.slug}-${post.sourceLanguage}`}
                title={post.frontmatter.title}
                href={`/${locale}/blog/${post.slug}`}
                summary={post.frontmatter.summary}
                tags={tags}
                metaItems={[]}
              />
            );
          })}
        </div>
      )}

      <nav
        aria-label={dictionary.topics.moreTopics}
        className="flex flex-col gap-3"
      >
        <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          {dictionary.topics.moreTopics}
        </h2>
        <div className="flex flex-wrap gap-3">
          {CLUSTER_SLUGS.filter((slug) => slug !== cluster).map((slug) => (
            <Link
              key={slug}
              href={`/${locale}/topics/${slug}`}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70 transition hover:border-brand-primary/40 hover:text-brand-primary"
            >
              {localizeText(CLUSTERS[slug].title, locale)}
            </Link>
          ))}
        </div>
      </nav>
    </section>
  );
}
