import type { Metadata } from 'next';
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
import {
  getResourceIndexGridClass,
  ResourceIndexCard,
  ResourceIndexEmptyState,
  ResourceIndexViewSwitcher,
  resolveResourceIndexViewMode,
} from '@/components/resource-index-card';
import { JsonLd } from '@/components/json-ld';
import { CLUSTER_SLUGS, CLUSTERS, localizeText } from '@/lib/taxonomy';
import { getBlogPostPreviewImageSrc } from '@/lib/resource-index-preview';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = i18n.locales.includes(lang as Locale)
    ? (lang as Locale)
    : i18n.defaultLocale;
  const dictionary = await getDictionary(locale);

  const baseUrl = resolveBaseUrl();
  const selfUrl = `${baseUrl}/r/${locale}/topics`;
  // Self-canonical per locale so each language ranks on its own; hreflang
  // alternates + x-default map the cluster (same approach as the blog index).
  const languageAlternates: Partial<Record<Locale | 'x-default', string>> = {};
  for (const localeOption of i18n.locales) {
    languageAlternates[localeOption] = `${baseUrl}/r/${localeOption}/topics`;
  }
  languageAlternates['x-default'] = `${baseUrl}/r/en/topics`;

  const title = dictionary.topics.indexTitle;
  const description = dictionary.topics.indexDescription;

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

export default async function TopicsIndex({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams?: Promise<{ view?: string | string[] }>;
}) {
  const { lang } = await params;
  const { view: viewParam } = (await searchParams) ?? {};
  if (!i18n.locales.includes(lang as Locale)) {
    notFound();
  }
  const locale = lang as Locale;
  const view = resolveResourceIndexViewMode(viewParam);
  const dictionary = await getDictionary(locale);
  const baseUrl = resolveBaseUrl();
  const selfUrl = `${baseUrl}/r/${locale}/topics`;

  const clusters = CLUSTER_SLUGS.map((slug) => ({
    slug,
    meta: CLUSTERS[slug],
    count: getPostsInCluster(locale, slug).length,
  })).filter((cluster) => cluster.count > 0);

  // Brand-POV ("Our thesis") posts intentionally carry no cluster, so they never
  // appear in a pillar hub — surface them here as a Perspectives rail.
  const BrandPovSlugs = [
    'the-manifesto-of-digital-trust',
    'building-for-people-not-wallets',
  ];
  const perspectives = BrandPovSlugs.map((slug) =>
    getPost(locale, slug),
  ).filter((post): post is NonNullable<typeof post> => post !== undefined);

  const collectionJsonLd = buildCollectionJsonLd({
    name: dictionary.topics.indexTitle,
    description: dictionary.topics.indexDescription,
    canonicalUrl: selfUrl,
    baseUrl,
    locale,
    items: clusters.map((cluster) => ({
      name: localizeText(cluster.meta.title, locale),
      url: `${baseUrl}/r/${locale}/topics/${cluster.slug}`,
    })),
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: dictionary.nav.resources, url: `${baseUrl}/r/${locale}` },
    { name: dictionary.topics.indexTitle, url: selfUrl },
  ]);

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12 md:px-10 lg:px-12">
      <JsonLd data={collectionJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {dictionary.topics.indexTitle}
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {dictionary.topics.indexDescription}
        </p>
      </header>

      {clusters.length === 0 ? (
        <ResourceIndexEmptyState>
          {dictionary.topics.indexEmpty}
        </ResourceIndexEmptyState>
      ) : (
        <>
          <div className="flex justify-end">
            <ResourceIndexViewSwitcher
              view={view}
              href={`/${locale}/topics`}
              labels={dictionary.view}
            />
          </div>
          <div className={getResourceIndexGridClass(view)}>
            {clusters.map((cluster) => (
              <ResourceIndexCard
                key={cluster.slug}
                title={localizeText(cluster.meta.title, locale)}
                href={`/${locale}/topics/${cluster.slug}`}
                summary={localizeText(cluster.meta.description, locale)}
                tags={[
                  `${cluster.count} ${dictionary.topics.guidesCountLabel}`,
                ]}
                metaItems={[]}
                view={view}
              />
            ))}
          </div>
        </>
      )}

      {perspectives.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-primary">
            {dictionary.topics.perspectivesTitle}
          </h2>
          <div className={getResourceIndexGridClass(view)}>
            {perspectives.map((post) => (
              <ResourceIndexCard
                key={post.slug}
                title={post.frontmatter.title}
                href={`/${locale}/blog/${post.slug}`}
                summary={post.frontmatter.summary}
                tags={[]}
                metaItems={[]}
                imageSrc={getBlogPostPreviewImageSrc(locale, post.slug)}
                imageAlt={post.frontmatter.title}
                view={view}
              />
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
